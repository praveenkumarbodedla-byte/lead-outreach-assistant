import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function TeamPanel({ userRole, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch users and configure realtime updates
  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .order('username', { ascending: true });
        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Realtime subscription on user_roles
    const channel = supabase
      .channel('realtime-user-roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => {
            if (prev.some(u => u.username === payload.new.username)) return prev;
            return [...prev, payload.new].sort((a, b) => a.username.localeCompare(b.username));
          });
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.username === payload.new.username ? payload.new : u));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.username !== payload.old.username));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = newUser.trim();
    if (!trimmedName) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ username: trimmedName, role: newRole });

      if (error) {
        if (error.code === '23505') {
          throw new Error('User already exists.');
        }
        throw error;
      }

      setNewUser('');
      setSuccessMsg(`User "${trimmedName}" added successfully as ${newRole}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error adding user:', err);
      setErrorMsg(err.message || 'Failed to add user.');
    }
  };

  const handleRoleChange = async (username, targetRole) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (username === currentUser) {
      setErrorMsg('You cannot change your own role to avoid locking yourself out.');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: targetRole })
        .eq('username', username);

      if (error) throw error;
      setSuccessMsg(`Role of "${username}" updated to ${targetRole}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating role:', err);
      setErrorMsg('Failed to update user role.');
    }
  };

  const handleDeleteUser = async (username) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (username === currentUser) {
      setErrorMsg('You cannot delete your own account.');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('username', username);

      if (error) throw error;
      setSuccessMsg(`User "${username}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setErrorMsg('Failed to delete user.');
    }
  };

  if (userRole !== 'admin') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: 16 }} className="animate-fadeIn">
        <div style={{ fontSize: '4rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--red)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 400 }}>
          Only users with the <strong>Admin</strong> role can view or manage team member access.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>👥 Team Management</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage user roles and system access permissions.</p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: '0.85rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: '0.85rem' }}>
          ✅ {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, alignItems: 'start' }} className="hide-mobile">
        {/* User list */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Team Members</h3>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><div className="spinner" /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.username}>
                      <td style={{ fontWeight: 600 }}>
                        {u.username} {u.username === currentUser && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>(You)</span>}
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            width: 'auto',
                            color: u.role === 'admin' ? '#fbbf24' : 'var(--text-primary)',
                            background: u.role === 'admin' ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                            border: u.role === 'admin' ? '1px solid rgba(251,191,36,0.3)' : '1px solid var(--border)',
                            borderRadius: 99
                          }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.username, e.target.value)}
                          disabled={u.username === currentUser}
                        >
                          <option value="member" style={{ background: '#0a0e1a' }}>member</option>
                          <option value="admin" style={{ background: '#0a0e1a' }}>admin</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.15)', padding: '4px 10px' }}
                          disabled={u.username === currentUser}
                          onClick={() => handleDeleteUser(u.username)}
                        >
                          Delete 🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User panel */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Add Team Member</h3>
          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
              <input
                className="form-input"
                value={newUser}
                onChange={e => setNewUser(e.target.value)}
                placeholder="e.g. sathwik"
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role</label>
              <select
                className="form-input"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                <option value="member">member (Outreach Team)</option>
                <option value="admin">admin (Full Access)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: 8 }}>
              Add User 👤
            </button>
          </form>
        </div>
      </div>
      
      {/* Mobile view warning */}
      <div style={{ display: 'none' }} className="show-mobile">
        <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Team management is optimized for desktop view. Please switch to a larger display.
        </div>
      </div>
    </div>
  );
}

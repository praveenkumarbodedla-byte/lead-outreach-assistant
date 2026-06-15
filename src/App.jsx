import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';
import ImportPanel from './components/ImportPanel';
import Dashboard from './components/Dashboard';
import LeadTable from './components/LeadTable';
import FollowUpReminder from './components/FollowUpReminder';
import ExportPanel from './components/ExportPanel';
import PinScreen from './components/PinScreen';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './utils/supabaseClient';
import { computeStats } from './utils/dataUtils';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'leads', label: 'Leads', icon: '📋' },
  { id: 'import', label: 'Import', icon: '📥' },
  { id: 'followup', label: 'Follow-ups', icon: '⏰' },
  { id: 'export', label: 'Export', icon: '📤' },
];

const dbToUiLead = (db) => ({
  id: db.id,
  businessName: db.business_name,
  phone: db.phone,
  phoneDisplay: db.phone_display,
  category: db.category,
  city: db.city || '',
  status: db.status || 'New',
  notes: db.notes || '',
  followUpDate: db.follow_up_date || null,
  selectedLanguage: db.selected_language || '',
  repliedLanguage: db.replied_language || '',
  assignedTo: db.assigned_to || null,
  contactedAt: db.contacted_at || null,
  repliedAt: db.replied_at || null,
  messageHistory: db.message_history || [],
  importedAt: db.created_at,
});

const uiToDbLead = (ui) => ({
  id: ui.id,
  business_name: ui.businessName,
  phone: ui.phone,
  phone_display: ui.phoneDisplay,
  category: ui.category,
  city: ui.city || '',
  status: ui.status || 'New',
  notes: ui.notes || '',
  follow_up_date: ui.followUpDate || null,
  selected_language: ui.selectedLanguage || '',
  replied_language: ui.repliedLanguage || '',
  assigned_to: ui.assignedTo || null,
  contacted_at: ui.contactedAt || null,
  replied_at: ui.repliedAt || null,
  message_history: ui.messageHistory || [],
});

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{ fontSize: '1.1rem' }}>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function NamePromptModal({ onSave }) {
  const [nameInput, setNameInput] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onSave(nameInput.trim());
    }
  };
  return (
    <div className="modal-overlay">
      <div className="modal glass-card" style={{ maxWidth: 380, textAlign: 'center', padding: '32px 24px', zIndex: 9999 }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 12 }}>👤 Enter Your Name</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Please enter your name to start tracking actions and assigning leads.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            className="form-input"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="e.g. Praveen, Dhanush, Varshith"
            required
            autoFocus
            style={{ marginBottom: 16, textAlign: 'center' }}
          />
          <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
            Start Syncing 🚀
          </button>
        </form>
      </div>
    </div>
  );
}

function MigrationReportModal({ report, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal glass-card" style={{ maxWidth: 420, padding: '32px 28px', textAlign: 'center', zIndex: 10000 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Migration Complete
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
          Your localStorage leads have been successfully backed up to your device and uploaded to Supabase.
        </p>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 28,
          textAlign: 'left'
        }}>
          <div style={{ gridColumn: 'span 2', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Total Migrated</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-light)' }}>{report.total}</span>
          </div>

          {[
            { label: 'New Leads', val: report.newLeads, color: '#6b7280' },
            { label: 'Contacted Leads', val: report.contacted, color: '#3b82f6' },
            { label: 'Interested Leads', val: report.interested, color: '#10b981' },
            { label: 'Not Interested Leads', val: report.notInterested, color: '#ef4444' },
            { label: 'Follow-ups', val: report.followUp, color: '#f59e0b' },
            { label: 'Replied Leads', val: report.replied, color: '#8b5cf6' }
          ].map(item => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: item.color }}>{item.val}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary w-full" onClick={onClose} style={{ justifyContent: 'center' }}>
          Done & Reload 🚀
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PinScreen />} />
      <Route path="/dashboard" element={<ProtectedRoute><MainApp activeTab="dashboard" /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><MainApp activeTab="leads" /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><MainApp activeTab="import" /></ProtectedRoute>} />
      <Route path="/followup" element={<ProtectedRoute><MainApp activeTab="followup" /></ProtectedRoute>} />
      <Route path="/export" element={<ProtectedRoute><MainApp activeTab="export" /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function MainApp({ activeTab }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('auth_user_name') || '');
  const [localLeadsCount, setLocalLeadsCount] = useState(0);
  const [migrating, setMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('loa_leads_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalLeadsCount(parsed.length);
        }
      }
    } catch (e) {
      console.error('Failed to parse local leads:', e);
    }
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // Fetch initial leads from Supabase and listen for Realtime database changes
  useEffect(() => {
    if (!userName) return;

    const fetchLeads = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        setLeads((data || []).map(dbToUiLead));
      } catch (err) {
        console.error('Error fetching leads:', err);
        addToast('Failed to load leads from database.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    // Subscribe to realtime changes in leads table
    const channel = supabase
      .channel('realtime-leads-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newUiLead = dbToUiLead(payload.new);
          setLeads(prev => {
            if (prev.some(l => l.id === newUiLead.id || l.phone === newUiLead.phone)) return prev;
            return [...prev, newUiLead];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedUiLead = dbToUiLead(payload.new);
          setLeads(prev => prev.map(l => l.id === updatedUiLead.id ? updatedUiLead : l));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setLeads(prev => prev.filter(l => l.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userName, addToast]);

  const handleSaveUserName = (name) => {
    localStorage.setItem('auth_user_name', name);
    setUserName(name);
    addToast(`Welcome, ${name}! Syncing database...`, 'success');
  };

  const handleMigrateLocalLeads = async () => {
    try {
      setMigrating(true);
      const raw = localStorage.getItem('loa_leads_v1');
      if (!raw) return;

      // 1. Export JSON Backup download
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'loa_leads_v1_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const parsed = JSON.parse(raw);
      
      // Calculate status counts for reporting
      const report = {
        total: parsed.length,
        newLeads: parsed.filter(l => l.status === 'New' || l.status === 'Not Contacted').length,
        contacted: parsed.filter(l => l.status === 'Contacted').length,
        replied: parsed.filter(l => l.status === 'Replied').length,
        interested: parsed.filter(l => l.status === 'Interested').length,
        notInterested: parsed.filter(l => l.status === 'Not Interested').length,
        followUp: parsed.filter(l => l.status === 'Follow-up Needed').length,
      };

      const dbLeads = parsed.map(l => {
        const mapped = uiToDbLead(l);
        // Preserve statuses exactly
        if (l.status === 'Not Contacted') {
          mapped.status = 'New';
        } else {
          mapped.status = l.status || 'New';
        }
        mapped.contacted_at = l.contactedAt || null;
        mapped.replied_at = l.repliedAt || null;
        mapped.message_history = l.messageHistory || [];
        if (l.importedAt) {
          mapped.created_at = new Date(l.importedAt).toISOString();
        }
        return mapped;
      });

      const { error } = await supabase
        .from('leads')
        .upsert(dbLeads, { onConflict: 'phone' });

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_name: userName || 'System Migration',
        action: `Migrated ${dbLeads.length} leads from local storage to cloud database`,
      });

      localStorage.removeItem('loa_leads_v1');
      setLocalLeadsCount(0);
      setMigrationReport(report);
      addToast(`Backup exported and ${dbLeads.length} leads migrated to Supabase!`, 'success');
    } catch (err) {
      console.error('Migration error:', err);
      addToast('Failed to migrate local leads to database.', 'error');
    } finally {
      setMigrating(false);
    }
  };

  // Import handler
  const handleImport = useCallback(async (newLeads, mode) => {
    try {
      if (mode === 'replace') {
        const { error: delError } = await supabase.from('leads').delete().neq('id', '');
        if (delError) throw delError;
      }

      // Bulk upsert to DB (deduplicates on 'phone' column)
      const dbLeads = newLeads.map(uiToDbLead);
      const { error } = await supabase
        .from('leads')
        .upsert(dbLeads, { onConflict: 'phone' });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert(
        newLeads.map(l => ({
          lead_id: l.id,
          user_name: userName,
          action: `Imported lead: ${l.businessName} (${l.phone})`
        }))
      );

      addToast(
        mode === 'replace'
          ? `Cleared database and imported ${newLeads.length} leads successfully!`
          : `Imported/Merged ${newLeads.length} leads successfully (skipped duplicates).`,
        'success'
      );
    } catch (err) {
      console.error('Import error:', err);
      addToast('Failed to insert imported leads into database.', 'error');
    }
    navigate('/dashboard');
  }, [addToast, navigate, userName]);

  // Status change
  const handleStatusChange = useCallback(async (id, status) => {
    try {
      const lead = leads.find(l => l.id === id);
      const oldStatus = lead ? lead.status : 'New';

      const updates = { status, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        lead_id: id,
        user_name: userName,
        action: `Changed status from "${oldStatus}" to "${status}"`,
      });

      addToast(`Status updated to ${status}`, 'success');
    } catch (err) {
      console.error('Status update error:', err);
      addToast('Failed to save status in database.', 'error');
    }
  }, [leads, userName, addToast]);

  // Notes change
  const handleNotesChange = useCallback(async (id, notes) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        lead_id: id,
        user_name: userName,
        action: `Updated notes`,
      });

      addToast('Note saved.', 'info');
    } catch (err) {
      console.error('Notes save error:', err);
      addToast('Failed to save notes in database.', 'error');
    }
  }, [userName, addToast]);

  // Follow-up date
  const handleFollowUpDate = useCallback(async (id, date) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ follow_up_date: date ? new Date(date).toISOString() : null, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        lead_id: id,
        user_name: userName,
        action: date ? `Set follow-up date to ${date}` : 'Cleared follow-up date',
      });

      addToast('Follow-up date updated.', 'info');
    } catch (err) {
      console.error('Follow up date error:', err);
      addToast('Failed to update follow-up date in database.', 'error');
    }
  }, [userName, addToast]);

  // Update lead callback (language settings, etc.)
  const handleUpdateLead = useCallback(async (id, updates) => {
    try {
      const dbUpdates = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.followUpDate !== undefined) dbUpdates.follow_up_date = updates.followUpDate;
      if (updates.selectedLanguage !== undefined) dbUpdates.selected_language = updates.selectedLanguage;
      if (updates.repliedLanguage !== undefined) dbUpdates.replied_language = updates.repliedLanguage;
      if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
      if (updates.contactedAt !== undefined) dbUpdates.contacted_at = updates.contactedAt;
      if (updates.repliedAt !== undefined) dbUpdates.replied_at = updates.repliedAt;
      if (updates.messageHistory !== undefined) dbUpdates.message_history = updates.messageHistory;

      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('leads')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      const keys = Object.keys(updates).join(', ');
      await supabase.from('activity_logs').insert({
        lead_id: id,
        user_name: userName,
        action: `Updated lead attributes: ${keys}`,
      });
    } catch (err) {
      console.error('Update lead error:', err);
      addToast('Failed to update lead attributes in database.', 'error');
    }
  }, [userName, addToast]);

  // Clear all data
  const handleClearAll = async () => {
    if (window.confirm(`Are you sure you want to delete all ${leads.length} leads? This cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('leads')
          .delete()
          .neq('id', '');
        if (error) throw error;
        addToast('All leads cleared from database.', 'info');
      } catch (err) {
        console.error('Clear error:', err);
        addToast('Failed to clear database.', 'error');
      }
    }
  };

  const stats = computeStats(leads);
  const followUpCount = leads.filter(l => l.status === 'Follow-up Needed').length;

  return (
    <>
      {!userName && <NamePromptModal onSave={handleSaveUserName} />}

      {/* App Shell */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          background: 'rgba(10,14,26,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}>
              🚀
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>Lead Outreach</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>Assistant</div>
            </div>
          </div>

          {/* Center: quick stats */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }} className="hide-mobile">
            {[
              { label: 'Total', val: stats.total, color: 'var(--accent-light)' },
              { label: 'Interested', val: stats.interested, color: 'var(--green)' },
              { label: 'Follow-ups', val: followUpCount, color: 'var(--orange)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {leads.length > 0 && (
              <button
                className="btn btn-ghost btn-sm hide-mobile"
                onClick={handleClearAll}
                style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                🗑️ Clear All
              </button>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 99, border: '1px solid var(--border)' }}>
              {loading ? '🔄 Loading...' : `${leads.length} leads`}
            </div>

            {userName && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 99,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
                onClick={() => {
                  const newName = prompt('Enter your name:', userName);
                  if (newName && newName.trim()) {
                    localStorage.setItem('auth_user_name', newName.trim());
                    setUserName(newName.trim());
                  }
                }}
                title="Click to edit your name"
              >
                👤 {userName}
              </div>
            )}

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                localStorage.removeItem('auth_pin_success');
                localStorage.removeItem('auth_user_name');
                navigate('/login', { replace: true });
              }}
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--border)',
                background: 'rgba(239, 68, 68, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🚪 Logout
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(10,14,26,0.5)', backdropFilter: 'blur(10px)' }}>
          <div className="tab-bar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => navigate(`/${tab.id}`)}
              >
                <span>{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {tab.id === 'followup' && followUpCount > 0 && (
                  <span style={{
                    background: '#f59e0b', color: '#000', fontWeight: 700,
                    fontSize: '0.65rem', padding: '1px 6px', borderRadius: 99, lineHeight: 1.4,
                  }}>
                    {followUpCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {localLeadsCount > 0 && (
            <div style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📦 Found Local Leads Data ({localLeadsCount} leads)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  We detected leads stored locally in your browser. You can migrate them to your Supabase cloud database to preserve status, assignments, and message history.
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleMigrateLocalLeads}
                disabled={migrating}
                style={{ height: 'fit-content' }}
              >
                {migrating ? 'Migrating...' : 'Migrate LocalStorage Data to Supabase 🚀'}
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: 16 }}>
              <div className="spinner" style={{ width: 40, height: 40 }} />
              <div style={{ color: 'var(--text-secondary)' }}>Synchronizing with database...</div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard leads={leads} onUpdateLead={handleUpdateLead} />
              )}
              {activeTab === 'leads' && (
                <LeadTable
                  leads={leads}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                  onFollowUpDate={handleFollowUpDate}
                  onUpdateLead={handleUpdateLead}
                  currentUser={userName}
                />
              )}
              {activeTab === 'import' && (
                <ImportPanel onImport={handleImport} existingCount={leads.length} />
              )}
              {activeTab === 'followup' && (
                <FollowUpReminder
                  leads={leads}
                  onStatusChange={handleStatusChange}
                  onFollowUpDate={handleFollowUpDate}
                  onUpdateLead={handleUpdateLead}
                />
              )}
              {activeTab === 'export' && (
                <ExportPanel leads={leads} />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            🚀 Lead Outreach Assistant · Multi-user Database Synchronized
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </footer>
      </div>

      <Toast toasts={toasts} />
      {migrationReport && (
        <MigrationReportModal
          report={migrationReport}
          onClose={() => setMigrationReport(null)}
        />
      )}
    </>
  );
}

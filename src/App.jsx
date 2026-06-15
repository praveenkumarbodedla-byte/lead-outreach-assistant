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
import { saveLeads, loadLeads } from './utils/storage';
import { computeStats } from './utils/dataUtils';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'leads', label: 'Leads', icon: '📋' },
  { id: 'import', label: 'Import', icon: '📥' },
  { id: 'followup', label: 'Follow-ups', icon: '⏰' },
  { id: 'export', label: 'Export', icon: '📤' },
];

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
  const [leads, setLeads] = useState(() => loadLeads());
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Persist leads whenever they change
  useEffect(() => { saveLeads(leads); }, [leads]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // Import handler
  const handleImport = useCallback((newLeads, mode) => {
    setLeads(prev => {
      if (mode === 'replace') {
        addToast(`Imported ${newLeads.length} leads successfully!`, 'success');
        return newLeads;
      } else {
        // Merge: skip phone duplicates
        const existingPhones = new Set(prev.map(l => l.phone));
        const toAdd = newLeads.filter(l => !existingPhones.has(l.phone));
        addToast(`Merged ${toAdd.length} new leads (${newLeads.length - toAdd.length} duplicates skipped).`, 'success');
        return [...prev, ...toAdd];
      }
    });
    navigate('/dashboard');
  }, [addToast, navigate]);

  // Status change
  const handleStatusChange = useCallback((id, status) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updates = { status };
      if (status === 'Contacted' && !l.contactedAt) updates.contactedAt = new Date().toISOString();
      if (status === 'Replied' && !l.repliedAt) updates.repliedAt = new Date().toISOString();
      return { ...l, ...updates };
    }));
  }, []);

  // Notes change
  const handleNotesChange = useCallback((id, notes) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
    addToast('Note saved.', 'info');
  }, [addToast]);

  // Follow-up date
  const handleFollowUpDate = useCallback((id, date) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, followUpDate: date } : l));
  }, []);

  // Update lead callback
  const handleUpdateLead = useCallback((id, updates) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // Clear all data
  const handleClearAll = () => {
    if (window.confirm(`Are you sure you want to delete all ${leads.length} leads? This cannot be undone.`)) {
      setLeads([]);
      addToast('All leads cleared.', 'info');
    }
  };

  const stats = computeStats(leads);
  const followUpCount = leads.filter(l => l.status === 'Follow-up Needed').length;

  return (
    <>
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
              {leads.length} leads
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                localStorage.removeItem('auth_pin_success');
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
            🚀 Lead Outreach Assistant · Data stored locally in your browser
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </footer>
      </div>

      <Toast toasts={toasts} />
    </>
  );
}

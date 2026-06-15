import React, { useEffect, useRef, useState } from 'react';
import MessagePreview from './MessagePreview';

export default function FollowUpReminder({ leads, onStatusChange, onFollowUpDate, onUpdateLead }) {
  const [previewLead, setPreviewLead] = useState(null);
  const timersRef = useRef({});
  const [now, setNow] = useState(() => new Date());

  // Refresh "now" every minute for overdue calculations
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Set browser notifications for follow-up leads
  useEffect(() => {
    // Clear old timers
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};

    const followUpLeads = leads.filter(l => l.status === 'Follow-up Needed' && l.followUpDate);
    for (const lead of followUpLeads) {
      const dueTime = new Date(lead.followUpDate).getTime();
      const delay = dueTime - Date.now();
      if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) { // Only set if within 7 days
        timersRef.current[lead.id] = setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('⏰ Follow-up Reminder', {
              body: `Time to follow up with ${lead.businessName} (${lead.phoneDisplay})`,
              icon: '/favicon.ico',
            });
          }
        }, delay);
      }
    }
    return () => Object.values(timersRef.current).forEach(clearTimeout);
  }, [leads]);

  const followUpLeads = leads
    .filter(l => l.status === 'Follow-up Needed')
    .sort((a, b) => {
      if (!a.followUpDate && !b.followUpDate) return 0;
      if (!a.followUpDate) return 1;
      if (!b.followUpDate) return -1;
      return new Date(a.followUpDate) - new Date(b.followUpDate);
    });

  const overdue = followUpLeads.filter(l => l.followUpDate && new Date(l.followUpDate) < now);
  const upcoming = followUpLeads.filter(l => !l.followUpDate || new Date(l.followUpDate) >= now);

  const formatDue = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const diffMs = d - now;
    const diffDays = Math.ceil(diffMs / 86400000);
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const LeadCard = ({ lead, isOverdue }) => (
    <div
      className="glass-card"
      style={{
        padding: 16,
        borderColor: isOverdue ? 'rgba(239,68,68,0.4)' : lead.followUpDate ? 'rgba(245,158,11,0.3)' : 'var(--border)',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
      }}>
        {isOverdue ? '🔴' : '⏰'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{lead.businessName}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
          {lead.phoneDisplay} · {lead.category}
        </div>
        {lead.notes && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            📝 {lead.notes}
          </div>
        )}
      </div>

      {/* Due date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 180 }}>
        {lead.followUpDate && (
          <div style={{
            padding: '4px 10px',
            background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
            borderRadius: 99,
            fontSize: '0.78rem',
            fontWeight: 600,
            color: isOverdue ? '#f87171' : '#fbbf24',
          }}>
            {formatDue(lead.followUpDate)}
          </div>
        )}

        <input
          type="datetime-local"
          className="form-input"
          style={{ padding: '4px 10px', fontSize: '0.78rem', width: 190 }}
          value={lead.followUpDate ? lead.followUpDate.slice(0, 16) : ''}
          onChange={e => onFollowUpDate(lead.id, e.target.value)}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-sm btn-primary"
            style={{ fontSize: '0.75rem', padding: '5px 12px' }}
            onClick={() => setPreviewLead(lead)}
          >
            💬 Message
          </button>
          <button
            className="btn btn-sm btn-success"
            style={{ fontSize: '0.75rem', padding: '5px 12px' }}
            onClick={() => onStatusChange(lead.id, 'Contacted')}
          >
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>⏰ Follow-up Reminders</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track and manage leads that need follow-up attention.
        </p>
      </div>

      {/* Notification permission prompt */}
      {'Notification' in window && Notification.permission === 'default' && (
        <div style={{
          padding: '14px 18px', marginBottom: 20,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Enable Browser Notifications</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Get notified when follow-up dates arrive.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => Notification.requestPermission()}>
            Enable
          </button>
        </div>
      )}

      {followUpLeads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            No follow-ups pending
          </div>
          <div>Mark leads as "Follow-up Needed" in the Leads table to manage them here.</div>
        </div>
      ) : (
        <>
          {/* Overdue */}
          {overdue.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: '1.1rem' }}>🚨</span>
                <h3 style={{ fontWeight: 700, color: '#f87171' }}>Overdue ({overdue.length})</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {overdue.map(l => <LeadCard key={l.id} lead={l} isOverdue />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: '1.1rem' }}>📅</span>
                <h3 style={{ fontWeight: 700 }}>Upcoming ({upcoming.length})</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map(l => <LeadCard key={l.id} lead={l} isOverdue={false} />)}
              </div>
            </div>
          )}
        </>
      )}

      {previewLead && (
        <MessagePreview
          lead={previewLead}
          onClose={() => setPreviewLead(null)}
          onUpdateLead={(id, updates) => {
            onUpdateLead(id, updates);
            setPreviewLead(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}
    </div>
  );
}

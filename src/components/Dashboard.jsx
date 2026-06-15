import React, { useState, useEffect } from 'react';
import { computeStats, getCategories, STATUS_COLORS } from '../utils/dataUtils';
import MessagePreview from './MessagePreview';
import { supabase } from '../utils/supabaseClient';

export default function Dashboard({ leads, onUpdateLead, currentUser, userRole }) {
  const [previewLead, setPreviewLead] = useState(null);
  const [quickReplyFilter, setQuickReplyFilter] = useState('active'); // 'active' (New/Contacted/Replied) or 'all'
  const [logs, setLogs] = useState([]);

  const stats = computeStats(leads);
  const categories = getCategories(leads);

  const myAssignedCount = leads.filter(l => l.assignedTo === currentUser).length;
  const totalAssignedCount = leads.filter(l => !!l.assignedTo).length;

  const statCards = [
    { label: 'Total Leads', value: stats.total, icon: '👥', color: '#6366f1', glow: '#6366f1' },
    { label: 'New Leads', value: stats.newLeads, icon: '⏳', color: '#6b7280', glow: '#6b7280' },
    { label: 'My Assigned Leads', value: myAssignedCount, icon: '👤', color: '#f59e0b', glow: '#f59e0b' },
    { label: 'Total Assigned Leads', value: totalAssignedCount, icon: '📋', color: '#10b981', glow: '#10b981' },
    { label: 'Contacted Leads', value: stats.contacted, icon: '📞', color: '#3b82f6', glow: '#3b82f6' },
    { label: 'Replied Leads', value: stats.replied, icon: '💬', color: '#8b5cf6', glow: '#8b5cf6' },
    { label: 'Not Interested Leads', value: stats.notInterested, icon: '❌', color: '#ef4444', glow: '#ef4444' },
  ];

  // Fetch recent activity logs from Supabase with realtime updates
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*, leads(business_name)')
          .order('timestamp', { ascending: false })
          .limit(10);
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error('Error fetching logs:', err);
      }
    };

    fetchLogs();

    const channel = supabase
      .channel('dashboard-activity-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, async (payload) => {
        // Fetch the business_name for the new log
        const { data } = await supabase
          .from('leads')
          .select('business_name')
          .eq('id', payload.new.lead_id)
          .single();

        const newLog = {
          ...payload.new,
          leads: data || { business_name: 'Unknown Lead' }
        };

        setLogs(prev => [newLog, ...prev.slice(0, 9)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Category breakdown
  const catCounts = {};
  for (const lead of leads) {
    const cat = lead.category || 'General';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCat = sortedCats[0]?.[1] || 1;

  // Conversion funnel
  const funnel = [
    { label: 'Imported', value: stats.total, pct: 100 },
    { label: 'Contacted', value: stats.contacted + stats.replied + stats.interested + stats.notInterested, pct: stats.total ? Math.round(((stats.contacted + stats.replied + stats.interested + stats.notInterested) / stats.total) * 100) : 0 },
    { label: 'Replied', value: stats.replied + stats.interested + stats.notInterested, pct: stats.total ? Math.round(((stats.replied + stats.interested + stats.notInterested) / stats.total) * 100) : 0 },
    { label: 'Interested', value: stats.interested, pct: stats.total ? Math.round((stats.interested / stats.total) * 100) : 0 },
  ];

  // Filter leads for the Quick Response Panel
  const quickReplyLeads = leads
    .filter(lead => {
      if (quickReplyFilter === 'active') {
        return lead.status === 'Contacted' || lead.status === 'Replied' || lead.status === 'New';
      }
      return true;
    })
    .slice(0, 5); // Limit to top 5 recent

  const handleQuickReplyLanguage = (lead, lang) => {
    const updates = {
      repliedLanguage: lang,
      selectedLanguage: lang, // Generate next messages in this language
    };

    // Auto set status to Replied if not already at a terminal state
    if (lead.status !== 'Interested' && lead.status !== 'Not Interested' && lead.status !== 'Follow-up Needed') {
      updates.status = 'Replied';
      updates.repliedAt = new Date().toISOString();
    }

    onUpdateLead(lead.id, updates);
    setPreviewLead({ ...lead, ...updates });
  };

  if (leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>No leads yet</div>
        <div>Import an Excel file to see your dashboard analytics.</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>📊 Lead Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time overview of your outreach pipeline.</p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {statCards.map(card => (
          <div key={card.label} className="glass-card stat-card">
            <div className="stat-icon" style={{ background: `${card.color}22` }}>
              <span style={{ fontSize: '1.3rem' }}>{card.icon}</span>
            </div>
            <div className="stat-value">{card.value.toLocaleString()}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-glow" style={{ background: card.glow }} />
          </div>
        ))}
      </div>

      {/* Conversion Funnel & Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Conversion Funnel */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>🎯 Conversion Funnel</div>
          {funnel.map((stage, i) => (
            <div key={stage.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stage.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {stage.value} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({stage.pct}%)</span>
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${stage.pct}%`,
                    background: `linear-gradient(90deg, ${['#6366f1','#3b82f6','#8b5cf6','#10b981'][i]}, ${['#818cf8','#60a5fa','#a78bfa','#34d399'][i]})`,
                  }}
                />
              </div>
            </div>
          ))}

          {/* Follow-up */}
          {stats.followUp > 0 && (
            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: '1.2rem' }}>⏰</span>
              <div>
                <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: '0.9rem' }}>{stats.followUp} Follow-ups Pending</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Switch to Follow-ups tab to manage</div>
              </div>
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>📈 Status Breakdown</div>
          {[
            { label: 'Interested', value: stats.interested, color: '#10b981' },
            { label: 'Replied', value: stats.replied, color: '#8b5cf6' },
            { label: 'Contacted', value: stats.contacted, color: '#3b82f6' },
            { label: 'New', value: stats.newLeads, color: '#6b7280' },
            { label: 'Not Interested', value: stats.notInterested, color: '#ef4444' },
            { label: 'Follow-up Needed', value: stats.followUp, color: '#f59e0b' },
          ].filter(s => s.value > 0).map(s => (
            <div key={s.label} className="cat-bar">
              <div className="cat-bar-label" style={{ color: s.color, fontWeight: 600 }}>{s.label}</div>
              <div className="cat-bar-track">
                <div
                  className="cat-bar-fill"
                  style={{ width: `${(s.value / stats.total) * 100}%`, background: s.color }}
                />
              </div>
              <div className="cat-bar-count">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Logs Audit Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>🛡️ Recent Activity & Audits</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                No activities logged yet.
              </div>
            ) : logs.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{log.user_name}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{log.action}</span>
                  {log.leads?.business_name && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> (for {log.leads.business_name})</span>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Response Language Panel */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>⚡ Quick Response Language Panel</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Click a language to reply and instantly preview the message
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setQuickReplyFilter('active')}
              className={`btn btn-sm ${quickReplyFilter === 'active' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Active Leads
            </button>
            <button
              onClick={() => setQuickReplyFilter('all')}
              className={`btn btn-sm ${quickReplyFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              All Leads
            </button>
          </div>
        </div>

        {quickReplyLeads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No leads matching filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickReplyLeads.map(lead => {
              const canInteract = userRole === 'admin' || lead.assignedTo === currentUser;
              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lead.businessName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span>{lead.phoneDisplay}</span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{
                        color: STATUS_COLORS[lead.status],
                        fontWeight: 600
                      }}>{lead.status}</span>
                      {lead.repliedLanguage && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>·</span>
                          <span style={{ color: '#c084fc', fontStyle: 'italic' }}>🗣️ {lead.repliedLanguage}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Reply Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {canInteract ? (
                      <>
                        {['Telugu', 'English', 'Hindi'].map(lang => (
                          <button
                            key={lang}
                            onClick={() => handleQuickReplyLanguage(lead, lang)}
                            className="btn btn-sm btn-ghost"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              borderColor: lead.repliedLanguage === lang ? 'var(--accent)' : 'var(--border)',
                              background: lead.repliedLanguage === lang ? 'rgba(99,102,241,0.1)' : 'transparent'
                            }}
                          >
                            🗣️ {lang}
                          </button>
                        ))}
                        <button
                          onClick={() => setPreviewLead(lead)}
                          className="btn btn-sm btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          🔍 Preview
                        </button>
                      </>
                    ) : (
                      <div 
                        className="admin-only-restricted"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        🔒 Locked (Unassigned)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {sortedCats.length > 0 && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>🏷️ Top Categories</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
            {sortedCats.map(([cat, count]) => (
              <div key={cat} className="cat-bar">
                <div className="cat-bar-label">{cat}</div>
                <div className="cat-bar-track">
                  <div className="cat-bar-fill" style={{ width: `${(count / maxCat) * 100}%` }} />
                </div>
                <div className="cat-bar-count">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
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

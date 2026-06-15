import React, { useState, useMemo } from 'react';
import { STATUS_COLORS, STATUS_OPTIONS, getCategories, getCities, USERS } from '../utils/dataUtils';
import MessagePreview from './MessagePreview';

const PAGE_SIZE = 15;

export default function LeadTable({ leads, onStatusChange, onNotesChange, onFollowUpDate, onUpdateLead, currentUser, userRole }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSelectedLang, setFilterSelectedLang] = useState('');
  const [filterRepliedLang, setFilterRepliedLang] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('all'); // 'all' or 'my'
  const [page, setPage] = useState(1);
  const [previewLead, setPreviewLead] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const categories = useMemo(() => getCategories(leads), [leads]);
  const cities = useMemo(() => getCities(leads), [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      if (q && !l.businessName.toLowerCase().includes(q) && !l.phone.includes(q) && !l.category.toLowerCase().includes(q)) return false;
      if (filterCategory && l.category !== filterCategory) return false;
      if (filterCity && l.city !== filterCity) return false;
      if (filterStatus && l.status !== filterStatus) return false;
      if (filterSelectedLang && l.selectedLanguage !== filterSelectedLang) return false;
      if (filterRepliedLang && l.repliedLanguage !== filterRepliedLang) return false;
      if (filterAssignment === 'my' && l.assignedTo !== currentUser) return false;
      return true;
    });
  }, [leads, search, filterCategory, filterCity, filterStatus, filterSelectedLang, filterRepliedLang, filterAssignment, currentUser]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLeads = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterCity('');
    setFilterStatus('');
    setFilterSelectedLang('');
    setFilterRepliedLang('');
    setFilterAssignment('all');
    setPage(1);
  };

  const hasFilters = search || filterCategory || filterCity || filterStatus || filterSelectedLang || filterRepliedLang || filterAssignment !== 'all';

  const startNoteEdit = (lead) => {
    setEditingNotes(lead.id);
    setNotesDraft(lead.notes || '');
  };
  const saveNote = (id) => {
    onNotesChange(id, notesDraft);
    setEditingNotes(null);
  };

  if (leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No leads yet</div>
        <div>Import an Excel file to get started.</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📋 All Leads</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Showing {filtered.length} of {leads.length} leads
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search business name, phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Category */}
          <select
            className="form-input"
            style={{ flex: '1 1 140px', minWidth: 140 }}
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* City */}
          {cities.length > 0 && (
            <select
              className="form-input"
              style={{ flex: '1 1 120px', minWidth: 120 }}
              value={filterCity}
              onChange={e => { setFilterCity(e.target.value); setPage(1); }}
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {/* Status */}
          <select
            className="form-input"
            style={{ flex: '1 1 140px', minWidth: 140 }}
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Assignment Filter */}
          <select
            className="form-input"
            style={{ flex: '1 1 140px', minWidth: 140 }}
            value={filterAssignment}
            onChange={e => { setFilterAssignment(e.target.value); setPage(1); }}
          >
            <option value="all">👥 All Leads</option>
            <option value="my">👤 My Leads</option>
          </select>

          {/* Selected Language Filter */}
          <select
            className="form-input"
            style={{ flex: '1 1 140px', minWidth: 140 }}
            value={filterSelectedLang}
            onChange={e => { setFilterSelectedLang(e.target.value); setPage(1); }}
          >
            <option value="">All Sent Languages</option>
            <option value="Multilingual">Multilingual</option>
            <option value="Telugu">Telugu</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>

          {/* Replied Language Filter */}
          <select
            className="form-input"
            style={{ flex: '1 1 140px', minWidth: 140 }}
            value={filterRepliedLang}
            onChange={e => { setFilterRepliedLang(e.target.value); setPage(1); }}
          >
            <option value="">All Reply Languages</option>
            <option value="Telugu">Telugu</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>

          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Business Name</th>
                <th>Phone</th>
                <th className="hide-mobile">Category</th>
                <th className="hide-mobile">City</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No leads match your filters.
                  </td>
                </tr>
              ) : pageLeads.map((lead, idx) => (
                <tr key={lead.id}>
                  {/* Row number */}
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: 40 }}>
                    {(safePage - 1) * PAGE_SIZE + idx + 1}
                  </td>

                  {/* Business Name */}
                  <td style={{ maxWidth: 220 }}>
                    <div className="truncate" style={{ fontWeight: 600 }}>{lead.businessName}</div>
                    
                    {/* Language Badges */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, marginBottom: 4 }}>
                      {lead.selectedLanguage && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', background: 'rgba(99,102,241,0.12)', borderRadius: 4, color: 'var(--accent-light)' }} title="Last sent message language">
                          Sent: {lead.selectedLanguage}
                        </span>
                      )}
                      {lead.repliedLanguage && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', background: 'rgba(139,92,246,0.12)', borderRadius: 4, color: '#c084fc' }} title="Customer's chosen language">
                          Reply: {lead.repliedLanguage}
                        </span>
                      )}
                    </div>

                    {lead.notes && editingNotes !== lead.id && (
                      <div className="truncate" style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        📝 {lead.notes}
                      </div>
                    )}
                    {editingNotes === lead.id && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                        <input
                          className="form-input"
                          style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                          value={notesDraft}
                          onChange={e => setNotesDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveNote(lead.id); if (e.key === 'Escape') setEditingNotes(null); }}
                          autoFocus
                          placeholder="Add note..."
                        />
                        <button className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => saveNote(lead.id)}>✓</button>
                      </div>
                    )}
                  </td>

                  {/* Phone */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <a
                      href={`tel:+91${lead.phone}`}
                      style={{ color: 'var(--accent-light)', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    >
                      {lead.phoneDisplay}
                    </a>
                  </td>

                  {/* Category */}
                  <td className="hide-mobile">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.category}</span>
                  </td>

                  {/* City */}
                  <td className="hide-mobile">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.city || '—'}</span>
                  </td>

                  {/* Status */}
                  <td>
                    <select
                      className="form-input"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.78rem',
                        width: 'auto',
                        color: STATUS_COLORS[lead.status],
                        background: `${STATUS_COLORS[lead.status]}18`,
                        border: `1px solid ${STATUS_COLORS[lead.status]}44`,
                        borderRadius: 99,
                        minWidth: 130,
                      }}
                      value={lead.status}
                      onChange={e => onStatusChange(lead.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* Assigned To */}
                  <td>
                    {userRole === 'admin' ? (
                      <select
                        className="form-input"
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.78rem',
                          width: 'auto',
                          color: lead.assignedTo ? 'var(--accent-light)' : 'var(--text-secondary)',
                          background: lead.assignedTo ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: lead.assignedTo ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border)',
                          borderRadius: 99,
                          minWidth: 130,
                          fontWeight: lead.assignedTo ? 600 : 'normal'
                        }}
                        value={lead.assignedTo || ''}
                        onChange={e => onUpdateLead(lead.id, { assignedTo: e.target.value || null })}
                      >
                        <option value="" style={{ background: '#0a0e1a', color: 'var(--text-muted)' }}>👤 Unassigned</option>
                        {USERS.map(user => (
                          <option key={user} value={user} style={{ background: '#0a0e1a', color: 'var(--text-primary)' }}>
                            👤 {user}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div 
                        className="admin-only-restricted"
                        style={{
                          display: 'inline-flex',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          color: lead.assignedTo ? 'var(--accent-light)' : 'var(--text-muted)',
                          background: lead.assignedTo ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: 99,
                          whiteSpace: 'nowrap',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        👤 {lead.assignedTo || 'Unassigned'}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        onClick={() => setPreviewLead(lead)}
                        title="Preview message"
                      >
                        💬
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                        onClick={() => startNoteEdit(lead)}
                        title="Add note"
                      >
                        📝
                      </button>
                      {lead.status === 'Follow-up Needed' && (
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', width: 130 }}
                          value={lead.followUpDate ? lead.followUpDate.split('T')[0] : ''}
                          onChange={e => onFollowUpDate(lead.id, e.target.value)}
                          title="Set follow-up date"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <div className="pagination">
              <button className="page-btn" disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg;
                if (totalPages <= 5) pg = i + 1;
                else if (safePage <= 3) pg = i + 1;
                else if (safePage >= totalPages - 2) pg = totalPages - 4 + i;
                else pg = safePage - 2 + i;
                return (
                  <button key={pg} className={`page-btn ${safePage === pg ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                );
              })}
              <button className="page-btn" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="page-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Page {safePage} of {totalPages} · {filtered.length} leads
            </div>
          </div>
        )}
      </div>

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

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { generateMessage, STATUS_OPTIONS, getCategories } from '../utils/dataUtils';

export default function ExportPanel({ leads }) {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [includeMessage, setIncludeMessage] = useState(true);
  const [exportDone, setExportDone] = useState(false);

  const categories = getCategories(leads);

  const filtered = leads.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterCategory && l.category !== filterCategory) return false;
    return true;
  });

  const handleExport = () => {
    if (filtered.length === 0) return;

    const rows = filtered.map((l, i) => {
      const row = {
        '#': i + 1,
        'Business Name': l.businessName,
        'Phone': l.phoneDisplay,
        'Category': l.category,
        'City': l.city || '',
        'Status': l.status,
        'Notes': l.notes || '',
        'Selected Language': l.selectedLanguage || 'Multilingual',
        'Replied Language': l.repliedLanguage || 'None',
        'Follow-up Date': l.followUpDate ? new Date(l.followUpDate).toLocaleString() : '',
        'Imported At': l.importedAt ? new Date(l.importedAt).toLocaleDateString() : '',
        'Contacted At': l.contactedAt ? new Date(l.contactedAt).toLocaleString() : '',
      };
      if (includeMessage) {
        row['Personalized Message'] = generateMessage(l.businessName, l.selectedLanguage || 'Multilingual');
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 18 }, { wch: 25 }, { wch: 15 },
      { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 14 }, { wch: 20 },
      ...(includeMessage ? [{ wch: 60 }] : []),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const statsByStatus = STATUS_OPTIONS.map(s => ({
    status: s,
    count: filtered.filter(l => l.status === s).length,
  })).filter(s => s.count > 0);

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>📤 Export Results</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Download your leads as an Excel file with all statuses and notes.
        </p>
      </div>

      {leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No leads to export</div>
          <div>Import leads first before exporting.</div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>🔧 Export Options</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Filter by Status
                </label>
                <select
                  className="form-input"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Filter by Category
                </label>
                <select
                  className="form-input"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Include message toggle */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => setIncludeMessage(v => !v)}
            >
              <div style={{
                width: 44, height: 24, borderRadius: 99,
                background: includeMessage ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: includeMessage ? 23 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Include Personalized Messages</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Adds a pre-written Telugu message column for each lead</div>
              </div>
            </div>
          </div>

          {/* Preview Summary */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>📋 Export Preview</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-light), var(--green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {filtered.length}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>leads will be exported</span>
            </div>

            {statsByStatus.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {statsByStatus.map(s => (
                  <div key={s.status} style={{
                    padding: '4px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: 99,
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}>
                    {s.status}: <strong style={{ color: 'var(--text-primary)' }}>{s.count}</strong>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              📄 Columns: #, Business Name, Phone, Category, City, Status, Notes, Selected Language, Replied Language, Follow-up Date, Imported At, Contacted At{includeMessage ? ', Personalized Message' : ''}
            </div>
          </div>

          {/* Export Button */}
          <button
            className={`btn w-full ${exportDone ? 'btn-success' : 'btn-primary'}`}
            style={{ justifyContent: 'center', padding: '14px 24px', fontSize: '1rem' }}
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            {exportDone ? '✅ Downloaded!' : `⬇️ Export ${filtered.length} Leads to Excel`}
          </button>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No leads match the selected filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}

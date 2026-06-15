import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { cleanLeads } from '../utils/dataUtils';

export default function ImportPanel({ onImport, existingCount }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [mergeMode, setMergeMode] = useState('replace');

  const processFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, {
          header: 'A',
          defval: '',
          blankrows: false,
        });

        // Skip header row if first row looks like headers
        const firstRow = rawRows[0] || {};
        const isHeader =
          String(firstRow.A || '').toLowerCase().includes('business') ||
          String(firstRow.A || '').toLowerCase().includes('name') ||
          String(firstRow.I || '').toLowerCase().includes('phone') ||
          String(firstRow.J || '').toLowerCase().includes('category');

        const dataRows = isHeader ? rawRows.slice(1) : rawRows;
        const { leads, stats } = cleanLeads(dataRows);

        setResult({ leads, stats, fileName: file.name });
        setLoading(false);
      } catch (err) {
        setError('Failed to read file: ' + err.message);
        setLoading(false);
      }
    };
    reader.onerror = () => { setError('File read error.'); setLoading(false); };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleChange = (e) => processFile(e.target.files[0]);

  const handleConfirmImport = () => {
    if (!result) return;
    onImport(result.leads, mergeMode);
    setResult(null);
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
          📥 Import Leads from Excel
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Upload your Excel file with Business Name (Column A), Phone (Column I), Category (Column J).
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone glass-card ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".xlsx,.xls" onChange={handleChange} />
        <div style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
            {dragging ? 'Drop it here!' : 'Drag & Drop your Excel file'}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            or click to browse files
          </div>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--accent-light)',
          }}>
            .xlsx, .xls supported
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.875rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, color: 'var(--text-secondary)' }}>
          <div className="spinner" />
          <span>Processing file...</span>
        </div>
      )}

      {/* Result Preview */}
      {result && (
        <div className="glass-card animate-slideUp" style={{ marginTop: 24, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>
            📋 Import Preview — {result.fileName}
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20,
          }}>
            {[
              { label: 'Total Rows', value: result.stats.total, color: 'var(--blue)' },
              { label: 'Valid Leads', value: result.stats.imported, color: 'var(--green)' },
              { label: 'Blank Phones', value: result.stats.blankPhone, color: 'var(--gray)' },
              { label: 'Invalid Phones', value: result.stats.invalidPhone, color: 'var(--red)' },
              { label: 'Duplicates', value: result.stats.duplicatePhone, color: 'var(--orange)' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sample leads */}
          {result.leads.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sample (first 3)</div>
              {result.leads.slice(0, 3).map((l, i) => (
                <div key={i} style={{
                  padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)', marginBottom: 4, fontSize: '0.85rem',
                  display: 'flex', gap: 16,
                }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.businessName}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{l.phoneDisplay}</span>
                  <span style={{ color: 'var(--accent-light)' }}>{l.category}</span>
                </div>
              ))}
            </div>
          )}

          {/* Merge mode */}
          {existingCount > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Import Mode ({existingCount} existing leads)
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { value: 'replace', label: '🔄 Replace All' },
                  { value: 'merge', label: '➕ Merge (skip duplicates)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMergeMode(opt.value)}
                    className={`btn btn-sm ${mergeMode === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {result.leads.length === 0 ? (
            <div style={{ color: 'var(--red)', fontWeight: 600 }}>
              ❌ No valid leads found. Please check your file format.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={handleConfirmImport}>
                ✅ Import {result.stats.imported} Leads
              </button>
              <button className="btn btn-ghost" onClick={() => setResult(null)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Column guide */}
      <div className="glass-card" style={{ marginTop: 24, padding: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>📌 Expected Column Format</div>
        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Column', 'Field', 'Example'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { col: 'A', field: 'Business Name', ex: 'Sri Krishna Bakery' },
              { col: 'I', field: 'Phone Number', ex: '9876543210' },
              { col: 'J', field: 'Category', ex: 'Bakery, Hyderabad' },
            ].map(r => (
              <tr key={r.col}>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{r.col}</span>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{r.field}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{r.ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

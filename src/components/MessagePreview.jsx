import React, { useState } from 'react';
import { generateMessage } from '../utils/dataUtils';

// Custom contact card image (Praveen / Dhanush / Varshith)
const PROMO_IMAGE_URL = '/contact_promo_card.png';

const WA_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ── Status badge colours ──────────────────────────────────────────────────────
const BADGE = {
  done:    { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', color: '#34d399' },
  pending: { bg: 'rgba(255,255,255,0.04)', border: 'var(--border)',         color: 'var(--text-muted)' },
  active:  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#fbbf24' },
};

function StatusBadge({ label, state }) {
  const s = BADGE[state] || BADGE.pending;
  const icon = state === 'done' ? '✅' : state === 'active' ? '⏳' : '⬜';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 11px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      {icon} {label}
    </div>
  );
}

export default function MessagePreview({ lead, onClose, onUpdateLead }) {
  const [activeLang, setActiveLang]     = useState(lead.repliedLanguage || lead.selectedLanguage || 'Multilingual');
  const [copied,     setCopied]         = useState(false);
  // Outreach step tracking
  const [textSent,   setTextSent]       = useState(false);
  const [imageAttached, setImageAttached] = useState(false);
  const [imgLoaded,  setImgLoaded]      = useState(false);
  const [imgError,   setImgError]       = useState(false);

  const message    = generateMessage(lead.businessName, activeLang);
  const waLink     = `https://wa.me/91${lead.phone}?text=${encodeURIComponent(message)}`;
  const waChatLink = `https://wa.me/91${lead.phone}`;
  const outreachComplete = textSent && imageAttached;

  /* ── helpers ── */
  const copyText = async () => {
    try { await navigator.clipboard.writeText(message); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = message;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveHistory = () => {
    const last = lead.messageHistory?.[lead.messageHistory.length - 1];
    if (last?.message === message) return;
    const updates = {
      selectedLanguage: activeLang,
      messageHistory: [...(lead.messageHistory || []), {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(), message, language: activeLang,
      }],
    };
    if (lead.status === 'New') { updates.status = 'Contacted'; updates.contactedAt = new Date().toISOString(); }
    onUpdateLead(lead.id, updates);
  };

  const handleSendWhatsApp = () => { saveHistory(); setTextSent(true); };

  const handleSetRepliedLanguage = (lang) => {
    const updates = { repliedLanguage: lang, selectedLanguage: lang };
    if (!['Interested', 'Not Interested', 'Follow-up Needed'].includes(lead.status)) {
      updates.status = 'Replied'; updates.repliedAt = new Date().toISOString();
    }
    onUpdateLead(lead.id, updates); setActiveLang(lang);
  };

  // ── outreach status ──────────────────────────────────────────────────────────
  const statusState = (flag) => flag ? 'done' : 'pending';
  const completionState = outreachComplete ? 'done' : textSent ? 'active' : 'pending';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-slideUp" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              💬 Outreach Preview
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{lead.businessName}</strong>
              &nbsp;·&nbsp;{lead.phoneDisplay}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
          }}>✕</button>
        </div>

        {/* ── Outreach Status Badges ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <StatusBadge label="Text Sent"         state={statusState(textSent)} />
          <StatusBadge label="Image Attached"    state={statusState(imageAttached)} />
          <StatusBadge label="Outreach Complete" state={completionState} />
        </div>

        {/* ── Language Selector ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Language</div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            {['Multilingual', 'Telugu', 'English', 'Hindi'].map(lang => (
              <button key={lang} className="flex-1" onClick={() => setActiveLang(lang)} style={{
                padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: activeLang === lang ? 'var(--accent)' : 'transparent',
                color: activeLang === lang ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.77rem', fontWeight: activeLang === lang ? 600 : 500,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}>
                {lang === 'Multilingual' ? '🇮🇳 Multi' : lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Message Preview ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 12, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 10, right: 10, background: '#25D366',
            borderRadius: 4, padding: '2px 8px', fontSize: '0.62rem',
            fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            WhatsApp
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontFamily: 'var(--font)', fontSize: '0.84rem', lineHeight: 1.65,
            color: 'var(--text-primary)', margin: 0,
            maxHeight: 240, overflowY: 'auto', paddingTop: 18, paddingRight: 6,
          }}>
            {message}
          </pre>
        </div>

        {/* ── Step 1: Send Text ── */}
        <div style={{
          background: textSent ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${textSent ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 10,
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Step 1 · Send Outreach Text
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={copyText}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
            >
              {copied ? '✅ Copied!' : '📋 Copy Message'}
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success"
              style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
              onClick={handleSendWhatsApp}
            >
              {WA_ICON} Send on WhatsApp
            </a>
          </div>
          {textSent && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}>
              ✅ Text message sent — now attach the promotional image below.
            </div>
          )}
        </div>

        {/* ── Step 2: Attach Promo Image ── */}
        <div style={{
          background: imageAttached ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${imageAttached ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 10,
        }}>
          <div style={{ padding: '12px 14px 10px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Step 2 · Attach Promotional Image
            </div>

            {/* WhatsApp restriction notice */}
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 7, padding: '8px 12px', marginBottom: 10,
              fontSize: '0.76rem', color: '#fbbf24', lineHeight: 1.55,
            }}>
              ⚠️ <strong>WhatsApp Web does not allow automatic image upload.</strong>
              {' '}Download the image below, then manually attach it in the WhatsApp chat.
            </div>
          </div>

          {/* Promo image preview */}
          {!imgError ? (
            <img
              src={PROMO_IMAGE_URL}
              alt="Promotional image"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>
              🖼️ Promotional image unavailable
            </div>
          )}

          <div style={{ padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Download */}
            <a
              href={PROMO_IMAGE_URL}
              download="promo-image.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              ⬇️ Download Image
            </a>
            {/* Open WhatsApp chat to attach */}
            <a
              href={waChatLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-success"
              style={{ fontSize: '0.75rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {WA_ICON} Open WhatsApp Chat
            </a>
            {/* Mark image as attached */}
            <button
              onClick={() => setImageAttached(v => !v)}
              style={{
                marginLeft: 'auto', fontSize: '0.75rem', padding: '6px 14px',
                borderRadius: 7, cursor: 'pointer', fontWeight: 600,
                background: imageAttached ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${imageAttached ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                color: imageAttached ? '#34d399' : 'var(--text-secondary)',
              }}
            >
              {imageAttached ? '✅ Image Attached' : '☐ Mark as Attached'}
            </button>
          </div>
        </div>

        {/* ── Outreach Complete banner ── */}
        {outreachComplete && (
          <div style={{
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1.4rem' }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.9rem' }}>Outreach Complete!</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Text message sent + promotional image attached. This lead has been contacted.
              </div>
            </div>
          </div>
        )}

        {/* ── Mark Customer Reply Language ── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mark Customer Reply Language
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Telugu', 'English', 'Hindi'].map(lang => (
              <button key={lang} onClick={() => handleSetRepliedLanguage(lang)} className="btn btn-sm flex-1" style={{
                background: lead.repliedLanguage === lang ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${lead.repliedLanguage === lang ? '#8b5cf6' : 'var(--border)'}`,
                color: lead.repliedLanguage === lang ? '#c084fc' : 'var(--text-secondary)',
                justifyContent: 'center', fontSize: '0.78rem',
              }}>
                🗣️ {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Message History ── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            📜 Message History ({lead.messageHistory?.length || 0})
          </div>
          {!lead.messageHistory?.length ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0', fontStyle: 'italic' }}>
              No messages sent yet.
            </div>
          ) : (
            <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
              {lead.messageHistory.map((hist, idx) => (
                <div key={hist.id || idx} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ padding: '1px 6px', background: 'rgba(99,102,241,0.12)', borderRadius: 4, fontSize: '0.66rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                      {hist.language}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>
                      {new Date(hist.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.71rem', maxHeight: 30, overflow: 'hidden' }}>
                    {hist.message.substring(0, 90)}{hist.message.length > 90 ? '…' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

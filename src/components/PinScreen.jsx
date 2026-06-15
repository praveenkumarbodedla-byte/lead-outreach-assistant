import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect directly to dashboard
    if (localStorage.getItem('auth_pin_success') === 'true') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const validatePin = (value) => {
    if (value === '6412') {
      localStorage.setItem('auth_pin_success', 'true');
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid PIN');
      setPin(''); // Reset on failure
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // keep only numbers
    if (value.length <= 4) {
      setPin(value);
      setError(''); // clear error while typing

      if (value.length === 4) {
        // Automatically check when 4 digits are entered
        setTimeout(() => {
          validatePin(value);
        }, 150);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length === 4) {
      validatePin(pin);
    } else {
      setError('Please enter a 4-digit PIN');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Mesh (duplicated logic for styling robustness on full screen) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="glass-card" style={{
        maxWidth: 400,
        width: '100%',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 50px rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-xl)',
      }}>
        {/* App Logo Emblem */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 24px',
          boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
        }}>
          🚀
        </div>

        {/* Title & Message */}
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          Lead Outreach Assistant
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: 32,
        }}>
          Enter Access PIN
        </p>

        {/* PIN Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={pin}
              onChange={handleInputChange}
              placeholder="••••"
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.25)',
                border: error ? '1px solid var(--red)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '16px 20px',
                fontSize: '1.8rem',
                letterSpacing: '1.2rem',
                textAlign: 'center',
                textIndent: '0.6rem',
                outline: 'none',
                transition: 'all 0.25s ease',
                boxShadow: error ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none',
              }}
              className="pin-input"
            />
          </div>

          {/* Error message */}
          <div style={{ height: 24, marginBottom: 16 }}>
            {error && (
              <span className="animate-fadeIn" style={{
                color: 'var(--red)',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}>
                ⚠️ {error}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{
              justifyContent: 'center',
              padding: '14px 20px',
              fontSize: '0.95rem',
            }}
          >
            Unlock Assistant 🔓
          </button>
        </form>
      </div>

      {/* Styled Focus / Animation helper (CSS scoped rule injected manually if needed) */}
      <style>{`
        .pin-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.25) !important;
          background: rgba(0, 0, 0, 0.35) !important;
        }
        .pin-input::placeholder {
          color: rgba(255, 255, 255, 0.15);
          letter-spacing: 0.2rem;
          text-indent: 0px;
        }
      `}</style>
    </div>
  );
}

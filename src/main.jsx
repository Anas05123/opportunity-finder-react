import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { initSentry } from './services/sentry.js';
import './index.css';
import App from './App.jsx';

// 1. Initialize Sentry before React renders
initSentry();

// 2. Careerly Fallback UI for Sentry.ErrorBoundary
function SentryFallbackComponent({ error, resetError }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-main, #0b0f19)',
      color: 'var(--text-primary, #f8fafc)',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'var(--bg-card, #131b2e)',
        border: '1px solid var(--border, #1e293b)',
        borderRadius: '1rem',
        padding: '2.5rem',
        maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          fontSize: '1.25rem',
          fontWeight: '800'
        }}>
          !
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', color: '#38bdf8' }}>
          Careerly Platform
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          The application encountered a client rendering state issue. Click below to reload and reset session state.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => {
              if (resetError) resetError();
              localStorage.removeItem('opp_theme');
              window.location.reload();
            }}
            style={{
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease'
            }}
          >
            Reload Application
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={SentryFallbackComponent}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);

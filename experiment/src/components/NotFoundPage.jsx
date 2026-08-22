import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      background: 'radial-gradient(circle at 50% 30%, rgba(31, 228, 119, 0.06) 0%, transparent 60%), #06070a',
      textAlign: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(15, 19, 30, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(31, 228, 119, 0.12)',
          border: '1px solid rgba(31, 228, 119, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: '#1FE477'
        }}>
          <Compass size={28} />
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#1FE477',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          Error 404
        </span>

        <h2 style={{
          fontSize: '1.6rem',
          fontWeight: '800',
          color: '#ffffff',
          fontFamily: "'Space Grotesk', sans-serif",
          margin: '0.5rem 0 0.75rem',
          letterSpacing: '-0.02em'
        }}>
          Page Not Found
        </h2>

        <p style={{
          fontSize: '0.88rem',
          color: '#94a3b8',
          lineHeight: 1.6,
          marginBottom: '1.75rem'
        }}>
          The page you requested could not be located or may have been moved.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            height: '46px',
            background: 'linear-gradient(135deg, #1FE477 0%, #10B981 100%)',
            color: '#06070a',
            fontWeight: '800',
            fontSize: '0.9rem',
            borderRadius: '12px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(31, 228, 119, 0.35)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
}

import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#06070a',
        color: '#94a3b8',
        gap: '1rem'
      }}>
        <RefreshCw size={28} className="spin-slow" color="#1FE477" />
        <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Verifying permissions...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 60%), #06070a',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(15, 19, 30, 0.95)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 30px rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#f87171'
          }}>
            <ShieldAlert size={28} />
          </div>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#f87171',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            403 Forbidden
          </span>

          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: '800',
            color: '#ffffff',
            fontFamily: "'Space Grotesk', sans-serif",
            margin: '0.5rem 0 0.75rem',
            letterSpacing: '-0.02em'
          }}>
            Access Denied
          </h2>

          <p style={{
            fontSize: '0.88rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            marginBottom: '1.75rem'
          }}>
            You do not have permission to access this area. This unauthorized request has been logged for security auditing.
          </p>

          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              height: '46px',
              background: '#1FE477',
              color: '#06070a',
              fontWeight: '800',
              fontSize: '0.9rem',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(31, 228, 119, 0.35)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to User Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

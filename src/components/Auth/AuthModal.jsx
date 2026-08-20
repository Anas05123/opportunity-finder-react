import React, { useState } from 'react';
import { 
  X, Mail, Lock, User, Sparkles, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, RefreshCw, KeyRound, Globe, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', triggerToast }) {
  if (!isOpen) return null;

  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('undergrad');
  const [major, setMajor] = useState('Computer Science');
  const [targetLocation, setTargetLocation] = useState('Worldwide & Remote');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        if (triggerToast) triggerToast('✓ Welcome back to Careerly!');
        onClose();
      } else if (mode === 'signup') {
        await signup({
          email,
          password,
          full_name: fullName,
          degree_level: degreeLevel,
          major,
          target_locations: [targetLocation, 'Remote']
        });
        if (triggerToast) triggerToast('🎉 Account created! Welcome to your onboarding.');
        onClose();
      } else if (mode === 'forgot') {
        const res = await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        setSuccessMsg(data.message || 'Password reset instructions dispatched.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="modal-card modal-medium" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true"
        style={{ 
          maxWidth: '480px', 
          padding: '2.5rem 2.25rem', 
          position: 'relative',
          borderRadius: '24px',
          background: 'var(--bg-surface-elevated, var(--card))',
          border: '1px solid var(--border-default)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 35px rgba(99, 102, 241, 0.18)'
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close Modal">
          <X size={16} />
        </button>

        {/* Modal Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
            marginBottom: '0.95rem',
            padding: '5px'
          }}>
            <img src="/careerly-logo.png" alt="Careerly Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <h2 className="type-h2" style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.025em' }}>
            {mode === 'login' && 'Welcome Back to Careerly'}
            {mode === 'signup' && 'Create Your Careerly Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="type-body" style={{ fontSize: '0.86rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
            {mode === 'login' && 'Discover & match with 3,413+ verified global opportunities.'}
            {mode === 'signup' && 'Personalized 7-factor mathematical opportunity matching.'}
            {mode === 'forgot' && 'Enter your email to receive a password recovery link.'}
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-surface)',
            padding: '0.28rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            marginBottom: '1.5rem'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              style={{
                padding: '0.55rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.86rem',
                fontWeight: mode === 'login' ? '800' : '600',
                background: mode === 'login' ? 'var(--bg-surface-elevated, #ffffff)' : 'transparent',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
                border: mode === 'login' ? '1px solid var(--border-default)' : 'none',
                cursor: 'pointer',
                boxShadow: mode === 'login' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.18s'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              style={{
                padding: '0.55rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.86rem',
                fontWeight: mode === 'signup' ? '800' : '600',
                background: mode === 'signup' ? 'var(--bg-surface-elevated, #ffffff)' : 'transparent',
                color: mode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
                border: mode === 'signup' ? '1px solid var(--border-default)' : 'none',
                cursor: 'pointer',
                boxShadow: mode === 'signup' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.18s'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.7rem 0.95rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            fontWeight: '600'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.7rem 0.95rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            fontWeight: '600'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {mode === 'signup' && (
            <div>
              <label className="filter-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  className="form-input"
                  style={{ paddingLeft: '2.6rem' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="filter-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="form-input"
                style={{ paddingLeft: '2.6rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="filter-label" style={{ marginBottom: 0 }}>Password *</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '700' }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.6rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="responsive-grid-2col" style={{ gap: '0.75rem' }}>
              <div>
                <label className="filter-label">Degree Standing</label>
                <select 
                  className="form-input"
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                >
                  <option value="undergrad">Undergraduate (BSc/BA)</option>
                  <option value="masters">Master's (MSc/MBA)</option>
                  <option value="phd">Doctorate / PhD</option>
                  <option value="fresh_grad">Recent Graduate</option>
                </select>
              </div>
              <div>
                <label className="filter-label">Target Field / Major</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  className="form-input"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              height: '46px', 
              fontSize: '0.96rem', 
              fontWeight: '700', 
              marginTop: '0.4rem',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Workspace' : mode === 'signup' ? 'Create Account & Begin' : 'Send Reset Link'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.84rem', cursor: 'pointer', fontWeight: '700' }}
            >
              ← Back to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, RefreshCw, Sun, Moon, Briefcase, GraduationCap, Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../config/api.js';

export default function AuthScreen({ triggerToast, theme, toggleTheme }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('undergrad');
  const [major, setMajor] = useState('Computer Science');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        if (triggerToast) triggerToast('✓ Welcome back to Careerly!');
      } else if (mode === 'signup') {
        await signup({
          email,
          password,
          full_name: fullName,
          degree_level: degreeLevel,
          major,
          target_locations: ['Worldwide', 'Remote']
        });
        if (triggerToast) triggerToast('🎉 Account created! Welcome to your onboarding calibration.');
      } else if (mode === 'forgot') {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        setSuccessMsg(data.message || 'Password reset instructions dispatched.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      position: 'relative',
      background: 'radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), radial-gradient(circle at 85% 75%, rgba(56, 189, 248, 0.08) 0%, transparent 45%)'
    }}>

      {/* Top Floating Theme Switcher */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button 
          className="icon-button" 
          onClick={toggleTheme} 
          aria-label="Toggle theme mode"
          style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Glassmorphic Auth Container */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-surface-elevated, var(--card))',
        border: '1px solid var(--border-default)',
        borderRadius: '24px',
        padding: '2.5rem 2.25rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25), 0 0 40px rgba(99, 102, 241, 0.12)',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            marginBottom: '1rem',
            padding: '6px'
          }}>
            <img src="/careerly-logo.png" alt="Careerly Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Careerly
          </h1>
          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
            Discover. Match. Succeed.
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.65rem', lineHeight: 1.5 }}>
            {mode === 'login' && 'Sign in to access your personalized opportunity workspace.'}
            {mode === 'signup' && 'Create your account for mathematical 7-factor career matching.'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-surface)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            marginBottom: '1.75rem'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: mode === 'login' ? '800' : '600',
                background: mode === 'login' ? 'var(--bg-surface-elevated, #ffffff)' : 'transparent',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
                border: mode === 'login' ? '1px solid var(--border-default)' : 'none',
                cursor: 'pointer',
                boxShadow: mode === 'login' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: mode === 'signup' ? '800' : '600',
                background: mode === 'signup' ? 'var(--bg-surface-elevated, #ffffff)' : 'transparent',
                color: mode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
                border: mode === 'signup' ? '1px solid var(--border-default)' : 'none',
                cursor: 'pointer',
                boxShadow: mode === 'signup' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.75rem 1rem',
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
            gap: '0.6rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            fontWeight: '600'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
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
                    onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
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
                  <option value="undergrad">Undergrad (BSc/BA)</option>
                  <option value="masters">Master's (MSc/MBA)</option>
                  <option value="phd">Doctorate (PhD)</option>
                  <option value="fresh_grad">Recent Graduate</option>
                </select>
              </div>
              <div>
                <label className="filter-label">Major / Field</label>
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
            style={{ width: '100%', height: '46px', fontSize: '0.96rem', marginTop: '0.5rem' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Workspace' : mode === 'signup' ? 'Create Account & Begin' : 'Send Recovery Link'}</span>
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

      {/* Trust & Guarantee Indicators */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle2 size={15} color="#10b981" />
          <span>3,413+ Verified Opportunities</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={15} color="var(--primary)" />
          <span>Deterministic 7-Factor Matching</span>
        </div>
      </div>

    </div>
  );
}

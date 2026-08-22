import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, 
  RefreshCw, Sun, Moon, ArrowLeft, Eye, EyeOff 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '483326712949-d6d0p5rg49a32bu80i443293kk916u8p.apps.googleusercontent.com';

export default function AuthScreen({ triggerToast, theme, toggleTheme }) {
  const { login, signup, verifyEmail, resendVerification, loginWithGoogle, forgotPassword, resetPassword, isAuthenticated, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  // Derive mode from URL pathname
  const getModeFromPath = (pathname) => {
    if (pathname === '/register' || pathname === '/signup') return 'signup';
    if (pathname === '/verify-email') return 'verify';
    if (pathname === '/forgot-password') return 'forgot';
    if (pathname === '/reset-password') return 'reset';
    return 'login';
  };

  const [mode, setMode] = useState(() => getModeFromPath(location.pathname));

  useEffect(() => {
    setMode(getModeFromPath(location.pathname));
    setErrorMsg('');
    setSuccessMsg('');
  }, [location.pathname]);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(redirectTarget, { replace: true });
      }
    }
  }, [isAuthenticated, needsOnboarding, navigate, redirectTarget]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState(() => searchParams.get('email') || localStorage.getItem('careerly_pending_email') || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const otpInputRefs = useRef([]);

  // Reset Password States
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 1. Initialize Real Google Identity Services (GIS)
  useEffect(() => {
    if (mode !== 'login' && mode !== 'signup') return;

    const initGoogleGIS = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (response?.credential) {
                try {
                  setIsSubmitting(true);
                  const base64Url = response.credential.split('.')[1];
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(
                    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
                  );
                  const payload = JSON.parse(jsonPayload);

                  const authData = await loginWithGoogle({
                    email: payload.email,
                    full_name: payload.name || payload.given_name || payload.email.split('@')[0],
                    google_id: payload.sub,
                    avatar_url: payload.picture
                  });

                  if (triggerToast) triggerToast(`✓ Signed in with Google as ${payload.email}`);
                  if (authData.needsOnboarding) {
                    navigate('/onboarding', { replace: true });
                  } else {
                    navigate(redirectTarget, { replace: true });
                  }
                } catch (err) {
                  setErrorMsg(err.message || 'Google authentication failed.');
                } finally {
                  setIsSubmitting(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Render official Google button
          const btnContainer = document.getElementById('google-screen-btn');
          if (btnContainer) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'filled_black',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: mode === 'signup' ? 'signup_with' : 'signin_with',
              logo_alignment: 'left',
              width: 370
            });
          }
        } catch (e) {
          console.warn('[GIS Screen Init Note]:', e.message);
        }
      }
    };

    const timer = setTimeout(initGoogleGIS, 150);
    return () => clearTimeout(timer);
  }, [mode, navigate, redirectTarget, triggerToast, loginWithGoogle]);

  // Auto-decrement cooldown timer
  useEffect(() => {
    let timer;
    if (mode === 'verify' && cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, cooldown]);

  // Password strength calculation
  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthColor = passwordStrength <= 25 ? '#ef4444' : passwordStrength <= 50 ? '#f59e0b' : passwordStrength <= 75 ? '#38bdf8' : '#1FE477';
  const strengthLabel = passwordStrength <= 25 ? 'Weak' : passwordStrength <= 50 ? 'Fair' : passwordStrength <= 75 ? 'Good' : 'Strong';

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtpDigits(pasted.split(''));
      if (otpInputRefs.current[5]) otpInputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const data = await login(email, password);
        if (triggerToast) triggerToast('✓ Welcome back to Careerly!');
        if (data.needsOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate(redirectTarget, { replace: true });
        }
      } else if (mode === 'signup') {
        const res = await signup({ email, password, full_name: fullName });
        if (res.status === 'verification_required') {
          try { localStorage.setItem('careerly_pending_email', email); } catch (e) {}
          navigate('/verify-email', { replace: false });
          setCooldown(res.cooldownSeconds || 60);
          if (triggerToast) triggerToast(`📧 Verification code sent to ${email}`);
        }
      } else if (mode === 'verify') {
        const fullCode = otpDigits.join('');
        if (fullCode.length !== 6) {
          throw new Error('Please enter the full 6-digit verification code.');
        }
        if (!email) {
          throw new Error('Please provide your account email address.');
        }
        await verifyEmail({ email, code: fullCode });
        try { localStorage.removeItem('careerly_pending_email'); } catch (e) {}
        if (triggerToast) triggerToast('🎉 Email verified! Welcome to Careerly.');
        navigate('/onboarding', { replace: true });
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        navigate('/reset-password', { replace: false });
        setSuccessMsg(`If an account exists for ${email}, a 6-digit recovery code was dispatched.`);
      } else if (mode === 'reset') {
        await resetPassword({ email, code: resetCode, newPassword });
        setSuccessMsg('Password reset successful! You can now sign in.');
        navigate('/login', { replace: true });
        setPassword('');
        if (triggerToast) triggerToast('✓ Password updated! Please sign in.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');
    try {
      await resendVerification(email);
      setCooldown(60);
      setSuccessMsg('A fresh verification code has been dispatched.');
      if (triggerToast) triggerToast('✓ New code sent!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
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
      background: 'radial-gradient(circle at 50% 15%, rgba(31, 228, 119, 0.08) 0%, transparent 60%), #06070a'
    }}>
      {/* Home / Back to Explore Link */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
        <Link 
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '0.84rem',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '0.45rem 0.85rem',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Theme Switcher */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button 
          className="icon-button" 
          onClick={toggleTheme} 
          aria-label="Toggle theme mode"
          style={{ width: '40px', height: '40px', borderRadius: '10px' }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '2.25rem',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06070a', fontWeight: '900', fontSize: '0.85rem' }}>
                ⚡
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--foreground)', fontFamily: "'Space Grotesk', sans-serif" }}>
                Careerly
              </span>
            </div>
          </Link>

          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--foreground)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'verify' && 'Verify your email'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set new password'}
          </h2>

          <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', margin: 0 }}>
            {mode === 'login' && 'Sign in to access your calibrated opportunities.'}
            {mode === 'signup' && 'Join 14,000+ professionals using verified career matching.'}
            {mode === 'verify' && `Enter the 6-digit code sent to ${email || 'your email'}`}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            {mode === 'reset' && 'Enter the reset code and your new password.'}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '0.7rem 0.9rem',
            color: '#f87171',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '1.1rem'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(31, 228, 119, 0.12)',
            border: '1px solid rgba(31, 228, 119, 0.35)',
            borderRadius: '10px',
            padding: '0.7rem 0.9rem',
            color: '#1FE477',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.1rem'
          }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Real Google Sign-In Official GIS Container & Frosted Button */}
        {(mode === 'login' || mode === 'signup') && (
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => {
                if (window.google?.accounts?.id) {
                  window.google.accounts.id.prompt();
                } else {
                  setErrorMsg('Google Sign-In SDK is loading. Please try again in a moment or use email.');
                }
              }}
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '46px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(66, 133, 244, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.15rem', marginBottom: '0.25rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace" }}>or continue with email</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="input-field"
                  style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
                />
              </div>
            </div>
          )}

          {mode !== 'verify' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-field"
                  style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--foreground)', textTransform: 'uppercase' }}>Password</label>
                {mode === 'login' && (
                  <Link 
                    to="/forgot-password"
                    style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '600', textDecoration: 'none' }}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '38px', paddingRight: '38px', height: '42px', borderRadius: '10px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {mode === 'signup' && password.length > 0 && (
                <div style={{ marginTop: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                    <span>Security Strength</span>
                    <span style={{ color: strengthColor, fontWeight: '700' }}>{strengthLabel}</span>
                  </div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${passwordStrength}%`, height: '100%', background: strengthColor, transition: 'all 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'verify' && (
            <div>
              {!email && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Account Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="input-field"
                      style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
                    />
                  </div>
                </div>
              )}

              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--foreground)', textAlign: 'center', marginBottom: '0.75rem' }}>
                6-Digit Activation Code
              </label>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', marginBottom: '1.1rem' }} onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '44px',
                      height: '50px',
                      textAlign: 'center',
                      fontSize: '1.3rem',
                      fontWeight: '800',
                      fontFamily: 'monospace',
                      background: 'var(--bg-surface-elevated, #161b22)',
                      border: digit ? '1.5px solid var(--primary, #1FE477)' : '1px solid var(--border-default, rgba(255, 255, 255, 0.14))',
                      borderRadius: '8px',
                      color: 'var(--foreground, #ffffff)',
                      boxShadow: digit ? '0 0 12px rgba(31, 228, 119, 0.25)' : 'none',
                      outline: 'none'
                    }}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                {cooldown > 0 ? (
                  <span>Resend code in <strong style={{ color: 'var(--primary)' }}>{cooldown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isResending ? 'Sending...' : 'Resend 6-Digit Code'}
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  6-Digit Recovery Code
                </label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter code from email"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px', fontFamily: 'monospace', letterSpacing: '2px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '46px',
              background: 'linear-gradient(135deg, #1FE477 0%, #10B981 100%)',
              color: '#06070a',
              fontSize: '0.92rem',
              fontWeight: '800',
              letterSpacing: '-0.01em',
              borderRadius: '12px',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(31, 228, 119, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              marginTop: '0.5rem',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #34F588 0%, #1FE477 100%)';
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(31, 228, 119, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1FE477 0%, #10B981 100%)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(31, 228, 119, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isSubmitting ? (
              <RefreshCw size={16} className="spin-slow" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'verify' && 'Verify & Launch Onboarding'}
                  {mode === 'forgot' && 'Send Recovery Code'}
                  {mode === 'reset' && 'Update Password'}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
          {mode === 'login' && (
            <span>
              Don't have an account?{' '}
              <Link 
                to="/register"
                style={{ color: '#1FE477', fontWeight: '800', textDecoration: 'none' }}
              >
                Sign up free
              </Link>
            </span>
          )}

          {mode === 'signup' && (
            <span>
              Already registered?{' '}
              <Link 
                to="/login"
                style={{ color: '#1FE477', fontWeight: '800', textDecoration: 'none' }}
              >
                Sign in
              </Link>
            </span>
          )}

          {(mode === 'verify' || mode === 'forgot' || mode === 'reset') && (
            <Link
              to="/login"
              style={{ color: '#94a3b8', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} />
              <span>Back to sign in</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

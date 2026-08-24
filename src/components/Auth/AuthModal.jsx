import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, 
  RefreshCw, ArrowLeft, Eye, EyeOff 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '483326712949-d6d0p5rg49a32bu80i443293kk916u8p.apps.googleusercontent.com';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', triggerToast }) {
  if (!isOpen) return null;

  const { login, signup, verifyEmail, resendVerification, loginWithGoogle, forgotPassword, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'verify' | 'forgot' | 'reset'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
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

  // Google SSO Fallback States
  const [showGoogleSsoDialog, setShowGoogleSsoDialog] = useState(false);
  const [googleSsoEmail, setGoogleSsoEmail] = useState('');
  const [googleSsoName, setGoogleSsoName] = useState('');

  // 1. Initialize Real Google Identity Services (GIS)
  useEffect(() => {
    if (!isOpen || (mode !== 'login' && mode !== 'signup')) return;

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

                  await loginWithGoogle({
                    email: payload.email,
                    full_name: payload.name || payload.given_name || payload.email.split('@')[0],
                    google_id: payload.sub,
                    avatar_url: payload.picture
                  });

                  if (triggerToast) triggerToast(`✓ Signed in with Google as ${payload.email}`);
                  onClose();
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
          const btnContainer = document.getElementById('google-official-btn');
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
          console.warn('[GIS Init Note]:', e.message);
        }
      }
    };

    const timer = setTimeout(initGoogleGIS, 150);
    return () => clearTimeout(timer);
  }, [isOpen, mode]);

  // Auto-decrement cooldown timer
  useEffect(() => {
    let timer;
    if (mode === 'verify' && cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, cooldown]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
  const strengthColor = passwordStrength <= 25 ? '#ef4444' : passwordStrength <= 50 ? '#f59e0b' : passwordStrength <= 75 ? '#38bdf8' : '#10B981';
  const strengthLabel = passwordStrength <= 25 ? 'Weak' : passwordStrength <= 50 ? 'Fair' : passwordStrength <= 75 ? 'Good' : 'Strong';

  // Handle OTP digit inputs
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

  // Official Google OAuth 2.0 popup trigger
  const handleGoogleClick = () => {
    setErrorMsg('');

    // 1. Official Google OAuth 2.0 Token Client Popup
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.warn('[Google OAuth Error]:', tokenResponse.error);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setErrorMsg('Google sign-in was cancelled or encountered an error.');
              }
              return;
            }
            try {
              setIsSubmitting(true);
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await userInfoRes.json();

              await loginWithGoogle({
                email: profile.email,
                full_name: profile.name || profile.given_name || profile.email.split('@')[0],
                google_id: profile.sub,
                avatar_url: profile.picture
              });

              if (triggerToast) triggerToast(`✓ Signed in with Google as ${profile.email}`);
              onClose();
            } catch (err) {
              setErrorMsg(err.message || 'Failed to authenticate with Google.');
            } finally {
              setIsSubmitting(false);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('[OAuth 2.0 Token Client Exception]:', e.message);
      }
    }

    // 2. Try Google Identity Services One-Tap prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  // Form Submission
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
        const res = await signup({ email, password, full_name: fullName });
        if (res.status === 'verification_required') {
          setMode('verify');
          setCooldown(res.cooldownSeconds || 60);
          if (triggerToast) triggerToast(`📧 Verification code sent to ${email}`);
        }
      } else if (mode === 'verify') {
        const fullCode = otpDigits.join('');
        if (fullCode.length !== 6) {
          throw new Error('Please enter the full 6-digit verification code.');
        }
        await verifyEmail({ email, code: fullCode });
        if (triggerToast) triggerToast('🎉 Email verified! Welcome to Careerly.');
        onClose();
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setMode('reset');
        setSuccessMsg(`If an account exists for ${email}, a 6-digit recovery code was dispatched.`);
      } else if (mode === 'reset') {
        await resetPassword({ email, code: resetCode, newPassword });
        setSuccessMsg('Password reset successful! You can now sign in.');
        setMode('login');
        setPassword('');
        if (triggerToast) triggerToast('✓ Password updated! Please sign in.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred.');
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
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="modal-panel-cyber" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: '420px',
          maxWidth: '92vw',
          background: '#0d1117',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.9), 0 0 30px rgba(31, 228, 119, 0.06)',
          padding: '2.25rem',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button 
          className="icon-button" 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: '32px', height: '32px', zIndex: 10, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          aria-label="Close modal"
        >
          <X size={15} color="#94a3b8" />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
            <img 
              src="/careerly-logo.png" 
              alt="Careerly" 
              style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
            />
            <span style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif" }}>
              Careerly
            </span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'verify' && 'Verify your email'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set new password'}
          </h2>

          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
            {mode === 'login' && 'Sign in to access your calibrated opportunities.'}
            {mode === 'signup' && 'Join 14,000+ professionals using verified career matching.'}
            {mode === 'verify' && `Enter the 6-digit code sent to ${email}`}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            {mode === 'reset' && 'Enter the reset code and your new password.'}
          </p>
        </div>

        {/* Global Error & Success Alerts */}
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
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            padding: '0.7rem 0.9rem',
            color: '#10B981',
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
              onClick={handleGoogleClick}
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
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
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase' }}>Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
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
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', textAlign: 'center', marginBottom: '0.75rem' }}>
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
                      background: 'rgba(15, 19, 30, 0.95)',
                      border: digit ? '1.5px solid #2457FF' : '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      boxShadow: digit ? '0 0 12px rgba(36, 87, 255, 0.25)' : 'none',
                      outline: 'none'
                    }}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                {cooldown > 0 ? (
                  <span>Resend code in <strong style={{ color: '#2457FF' }}>{cooldown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    style={{ background: 'none', border: 'none', color: '#2457FF', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
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

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '46px',
              background: '#2457FF',
              color: '#ffffff',
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
              boxShadow: '0 4px 20px rgba(36, 87, 255, 0.35)',
              marginTop: '0.5rem',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#1d4ed8';
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(36, 87, 255, 0.55)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#2457FF';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(36, 87, 255, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isSubmitting ? (
              <RefreshCw size={16} className="animate-spin" />
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
              <button 
                type="button" 
                onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#2457FF', fontWeight: '800', cursor: 'pointer' }}
              >
                Sign up free
              </button>
            </span>
          )}

          {mode === 'signup' && (
            <span>
              Already registered?{' '}
              <button 
                type="button" 
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#2457FF', fontWeight: '800', cursor: 'pointer' }}
              >
                Sign in
              </button>
            </span>
          )}

          {(mode === 'verify' || mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} />
              <span>Back to sign in</span>
            </button>
          )}
        </div>

        {/* Google SSO Dialog */}
        {showGoogleSsoDialog && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: 'rgba(6, 7, 10, 0.94)',
            backdropFilter: 'blur(8px)',
            borderRadius: '24px',
            padding: '2rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Continue with Google</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGoogleSsoDialog(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 1.25rem' }}>
              Confirm your Google Account to connect directly to Careerly.
            </p>

            <form onSubmit={handleConfirmGoogleSso} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Google Email
                </label>
                <input 
                  type="email"
                  required
                  autoFocus
                  value={googleSsoEmail}
                  onChange={e => setGoogleSsoEmail(e.target.value)}
                  placeholder="alex.kim@gmail.com"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Display Name (Optional)
                </label>
                <input 
                  type="text"
                  value={googleSsoName}
                  onChange={e => setGoogleSsoName(e.target.value)}
                  placeholder="Alex Kim"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleSsoDialog(false)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#2457FF',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Google'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

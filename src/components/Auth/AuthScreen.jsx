import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, 
  RefreshCw, ArrowLeft, Eye, EyeOff 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '483326712949-d6d0p5rg49a32bu80i443293kk916u8p.apps.googleusercontent.com';

export default function AuthScreen({ triggerToast }) {
  const { login, signup, verifyEmail, forgotPassword, resetPassword, loginWithGoogle, isAuthenticated, needsOnboarding } = useAuth();
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
    const derived = getModeFromPath(location.pathname);
    if (derived !== mode) {
      setMode(derived);
      setErrorMsg('');
      setSuccessMsg('');
    }
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Google Sign-In init & SSO State
  const googleButtonRef = useRef(null);
  const [showGoogleSsoDialog, setShowGoogleSsoDialog] = useState(false);
  const [googleSsoEmail, setGoogleSsoEmail] = useState('');
  const [googleSsoName, setGoogleSsoName] = useState('');

  useEffect(() => {
    if (mode !== 'login' && mode !== 'signup') return;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              try {
                setIsSubmitting(true);
                setErrorMsg('');
                const authData = await loginWithGoogle({
                  credential: response.credential,
                  clientId: response.clientId
                });
                if (triggerToast) triggerToast(`Welcome back, ${authData.user?.full_name || 'Innovator'}!`);
                if (authData.needsOnboarding) {
                  navigate('/onboarding', { replace: true });
                } else {
                  navigate(redirectTarget, { replace: true });
                }
              } catch (err) {
                setErrorMsg(err.message || 'Google sign-in failed. Please try email/password.');
              } finally {
                setIsSubmitting(false);
              }
            }
          });

          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 380,
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'rectangular'
          });
        } catch (err) {
          console.warn('Google Auth render note:', err.message);
        }
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, [mode, redirectTarget, triggerToast, loginWithGoogle, navigate]);

  const handleGoogleCustomClick = () => {
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
                setErrorMsg('Google sign-in encountered an error: ' + tokenResponse.error);
              }
              return;
            }
            try {
              setIsSubmitting(true);
              let profile = null;
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (userInfoRes.ok) {
                  profile = await userInfoRes.json();
                }
              } catch (fetchErr) {
                console.warn('[Google UserInfo Client Fetch Note]:', fetchErr.message);
              }

              const authData = await loginWithGoogle({
                email: profile?.email,
                full_name: profile?.name || profile?.given_name || (profile?.email ? profile.email.split('@')[0] : null),
                google_id: profile?.sub,
                avatar_url: profile?.picture,
                access_token: tokenResponse.access_token
              });

              if (triggerToast) triggerToast(`✓ Welcome back, ${authData.user?.full_name || profile?.name || 'Innovator'}!`);
              if (authData.needsOnboarding) {
                navigate('/onboarding', { replace: true });
              } else {
                navigate(redirectTarget, { replace: true });
              }
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

  // Handle Form Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const data = await login(email, password);
        if (triggerToast) triggerToast(`Welcome back, ${data.user?.full_name || 'Innovator'}!`);
        if (data.needsOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate(redirectTarget, { replace: true });
        }
      } else if (mode === 'signup') {
        const data = await signup(email, password, fullName);
        if (triggerToast) triggerToast('Account created! Please verify your email.');
        localStorage.setItem('careerly_pending_email', email);
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
      } else if (mode === 'verify') {
        const otpCode = otpDigits.join('');
        if (otpCode.length < 6) {
          setErrorMsg('Please enter the complete 6-digit verification code.');
          setIsSubmitting(false);
          return;
        }
        await verifyEmail(email, otpCode);
        if (triggerToast) triggerToast('Email successfully verified! Welcome aboard.');
        localStorage.removeItem('careerly_pending_email');
        navigate('/onboarding', { replace: true });
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setSuccessMsg('A password reset link has been sent to your email address.');
      } else if (mode === 'reset') {
        const resetToken = searchParams.get('token');
        await resetPassword(resetToken, password);
        setSuccessMsg('Your password has been successfully reset.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication request failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Smooth switch mode without reload or route flashing
  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    window.history.replaceState(null, '', newMode === 'signup' ? '/register' : '/login');
  };

  const isAuthMode = mode === 'login' || mode === 'signup';

  return (
    <div className="min-h-screen lg:h-screen w-screen lg:max-h-screen bg-background flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* ── Left Branding Panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[460px] xl:w-[480px] flex-shrink-0 bg-primary p-9 xl:p-11 text-white h-full" style={{ background: '#2457FF' }}>
        <div>
          <div className="flex items-center gap-3 mb-10 xl:mb-12">
            <Link to="/" className="flex items-center gap-3 text-white no-underline">
              <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-md">
                <img src="/careerly-logo.png" alt="Careerly" className="w-full h-full object-contain" />
              </div>
              <span className="text-white text-[19px] font-bold tracking-tight">Careerly</span>
            </Link>
          </div>

          <h2 className="font-display text-[34px] xl:text-[38px] font-bold text-white leading-[1.12] mb-4">
            Land your next<br />
            <span className="italic text-blue-200">opportunity</span><br />
            with confidence.
          </h2>

          <p className="text-[14px] xl:text-[15px] text-white/80 leading-relaxed max-w-[340px]">
            Join 120,000+ professionals discovering dream roles through intelligent matching, AI CV studio, and STAR interview coaching.
          </p>
        </div>

        {/* Testimonial Quote */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm shadow-xs space-y-3">
          <p className="text-[13.5px] text-white/95 leading-relaxed italic">
            "Careerly helped me go from zero callbacks to four offers in six weeks. The match scoring alone saved me hours of wasted applications."
          </p>
          <div className="flex items-center gap-3 pt-2.5 border-t border-white/10">
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-white text-[12px] font-bold">
              SM
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-tight">Sarah Mitchell</p>
              <p className="text-[11px] text-white/70">Product Manager at Atlassian</p>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center justify-between pt-4 border-t border-white/15">
          {[
            ["50K+", "Opportunities"],
            ["120K+", "Users"],
            ["87%", "Success Rate"]
          ].map(([n, l]) => (
            <div key={l}>
              <p className="text-[18px] xl:text-[20px] font-bold font-mono text-white leading-none">{n}</p>
              <p className="text-[11px] text-white/70 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between px-6 py-6 sm:px-12 xl:px-16 h-full">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> Back to home
          </Link>
        </div>

        <div className="w-full max-w-[430px] mx-auto my-auto py-2">
          
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-5 lg:hidden">
            <img src="/careerly-logo.png" alt="Careerly" className="w-8 h-8 object-contain" />
            <span className="text-foreground text-[18px] font-bold">Careerly</span>
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h1 className="font-display text-[26px] sm:text-[29px] font-bold text-foreground mb-1.5 leading-tight">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'verify' && 'Verify your email'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Set new password'}
            </h1>
            <p className="text-[13.5px] text-muted-foreground leading-normal">
              {mode === 'login' && 'Sign in to access your calibrated career intelligence.'}
              {mode === 'signup' && 'Start discovering 50,000+ verified opportunities tailored for you.'}
              {mode === 'verify' && `We sent a 6-digit code to ${email}.`}
              {mode === 'forgot' && 'Enter your email address and we will send you a reset link.'}
              {mode === 'reset' && 'Enter your new password below.'}
            </p>
          </div>

          {/* Mode Switcher Pill with smooth sliding indicator */}
          {isAuthMode && (
            <div className="relative flex bg-secondary/80 rounded-xl p-1.5 mb-4 border border-border/40 select-none">
              {/* Animated active background pill */}
              <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-card rounded-lg shadow-xs transition-transform duration-300 ease-out ${
                  mode === 'signup' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
                }`} 
              />

              <button 
                type="button"
                onClick={() => switchMode('login')}
                className={`relative z-10 flex-1 py-2 rounded-lg text-[13.5px] font-semibold transition-colors duration-200 text-center ${
                  mode === 'login' 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => switchMode('signup')}
                className={`relative z-10 flex-1 py-2 rounded-lg text-[13.5px] font-semibold transition-colors duration-200 text-center ${
                  mode === 'signup' 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Google SSO Button */}
          {isAuthMode && (
            <>
              <button
                type="button"
                onClick={handleGoogleCustomClick}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-card border border-border hover:bg-secondary text-foreground font-semibold text-[13.5px] rounded-xl transition-all shadow-xs hover:shadow-sm"
              >
                <svg className="w-4.5 h-4.5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
              </button>

              <div ref={googleButtonRef} className="hidden" />

              <div className="flex items-center gap-3 my-3.5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11.5px] text-muted-foreground font-semibold uppercase tracking-wider">or with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* Form Fields with Smooth Expansions */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Full Name field (smooth accordion transition) */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              mode === 'signup' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}>
              <label className="text-[11.5px] font-bold text-foreground uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  required={mode === 'signup'}
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  placeholder="Alex Kim"
                  className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-3.5 text-[13.5px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs" 
                />
              </div>
            </div>

            {/* Email Address */}
            {(isAuthMode || mode === 'forgot') && (
              <div>
                <label className="text-[11.5px] font-bold text-foreground uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="email" 
                    required
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="alex@example.com"
                    className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-3.5 text-[13.5px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs" 
                  />
                </div>
              </div>
            )}

            {/* Password */}
            {(isAuthMode || mode === 'reset') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11.5px] font-bold text-foreground uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'login' && (
                    <Link to="/forgot-password" className="text-[11.5px] text-primary hover:underline font-semibold">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-10 text-[13.5px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password field (smooth accordion transition) */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              mode === 'signup' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}>
              <label className="text-[11.5px] font-bold text-foreground uppercase tracking-wider block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="password" 
                  required={mode === 'signup'}
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-3.5 text-[13.5px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs" 
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-[12.5px] animate-fadeIn">
                <AlertCircle size={15} className="flex-shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-[12.5px] animate-fadeIn">
                <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-primary text-white text-[14px] font-bold rounded-xl hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#2457FF' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'verify' && 'Verify & Continue'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode === 'reset' && 'Update Password'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-center text-[11.5px] text-muted-foreground mt-3 leading-tight">
              By creating an account you agree to our{' '}
              <a href="#" className="text-foreground font-semibold hover:underline">Terms</a> and{' '}
              <a href="#" className="text-foreground font-semibold hover:underline">Privacy Policy</a>.
            </p>
          )}

          {isAuthMode && (
            <p className="text-center text-[12.5px] text-muted-foreground mt-3.5">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-foreground font-bold hover:text-primary transition-colors underline ml-1"
              >
                {mode === 'login' ? 'Register now' : 'Sign In'}
              </button>
            </p>
          )}

        </div>

        <div className="text-center text-[11.5px] text-muted-foreground py-1">
          © 2024 Careerly Intelligence. All rights reserved.
        </div>
      </div>

      {/* ── Google SSO Dialog ────────────────────────────────────────── */}
      {showGoogleSsoDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-base font-bold text-foreground">Continue with Google</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGoogleSsoDialog(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Confirm the Google Account you would like to connect to Careerly.
            </p>

            <form onSubmit={handleConfirmGoogleSso} className="space-y-3.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
                  Google Email
                </label>
                <input 
                  type="email"
                  required
                  autoFocus
                  value={googleSsoEmail}
                  onChange={e => setGoogleSsoEmail(e.target.value)}
                  placeholder="alex.kim@gmail.com"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-[13px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
                  Display Name (Optional)
                </label>
                <input 
                  type="text"
                  value={googleSsoName}
                  onChange={e => setGoogleSsoName(e.target.value)}
                  placeholder="Alex Kim"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-[13px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleSsoDialog(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  style={{ background: '#2457FF' }}
                >
                  {isSubmitting ? <RefreshCw size={13} className="animate-spin" /> : 'Connect Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

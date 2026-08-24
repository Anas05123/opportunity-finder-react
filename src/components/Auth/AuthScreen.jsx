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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const otpInputRefs = useRef([]);

  // Google Sign-In init
  const googleButtonRef = useRef(null);

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
            theme: theme === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            width: 320,
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        } catch (err) {
          console.warn('Google Auth render skipped:', err.message);
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
  }, [mode, theme, redirectTarget, triggerToast, loginWithGoogle, navigate]);

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

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    navigate(newMode === 'signup' ? '/register' : '/login');
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* ── Left Branding Panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 bg-primary p-10 text-white" style={{ background: '#2457FF' }}>
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <Link to="/" className="flex items-center gap-2.5 text-white no-underline">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-[12px] font-bold">C</span>
              </div>
              <span className="text-white text-[17px] font-semibold tracking-tight">Careerly</span>
            </Link>
          </div>

          <h2 className="font-display text-[34px] font-bold text-white leading-[1.12] mb-4">
            Land your next<br />
            <span className="italic text-blue-200">opportunity</span><br />
            with confidence.
          </h2>

          <p className="text-[14px] text-white/70 leading-relaxed max-w-[320px]">
            Join 120,000+ professionals discovering their dream roles through intelligent matching, AI-tailored CVs, and STAR interview coaching.
          </p>
        </div>

        {/* Testimonial Quote */}
        <div className="bg-white/10 border border-white/15 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[13px] text-white/90 leading-relaxed italic">
            "Careerly helped me go from zero callbacks to four offers in six weeks. The match scoring alone saved me hours of wasted applications."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-white text-[11px] font-bold">
              SM
            </div>
            <div>
              <p className="text-[12px] font-semibold text-white">Sarah Mitchell</p>
              <p className="text-[10px] text-white/60">Product Manager at Atlassian</p>
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
              <p className="text-[17px] font-bold font-mono text-white leading-none">{n}</p>
              <p className="text-[10px] text-white/60 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>
          {toggleTheme && (
            <button 
              onClick={toggleTheme} 
              className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}
        </div>

        <div className="w-full max-w-[390px] mx-auto py-6">
          
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="text-foreground text-[16px] font-semibold">Careerly</span>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-[26px] sm:text-[28px] font-bold text-foreground mb-1.5">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'verify' && 'Verify your email'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Set new password'}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {mode === 'login' && 'Sign in to access your calibrated career intelligence.'}
              {mode === 'signup' && 'Start discovering 50,000+ verified opportunities tailored for you.'}
              {mode === 'verify' && `We sent a 6-digit code to ${email}.`}
              {mode === 'forgot' && 'Enter your email address and we will send you a reset link.'}
              {mode === 'reset' && 'Enter your new password below.'}
            </p>
          </div>

          {/* Mode Switcher Pill */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex bg-secondary rounded-lg p-1 mb-5">
              <button 
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-all ${
                  mode === 'login' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-all ${
                  mode === 'signup' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Google Auth Button Container */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="mb-4 flex justify-center">
                <div ref={googleButtonRef} className="w-full flex justify-center" />
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">or with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    required
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="Alex Kim"
                    className="w-full bg-card border border-border rounded-lg py-2.5 pl-9 pr-3 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div>
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="email" 
                    required
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="alex@example.com"
                    className="w-full bg-card border border-border rounded-lg py-2.5 pl-9 pr-3 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                    Password
                  </label>
                  {mode === 'login' && (
                    <Link to="/forgot-password" className="text-[11px] text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full bg-card border border-border rounded-lg py-2.5 pl-9 pr-10 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="password" 
                    required
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full bg-card border border-border rounded-lg py-2.5 pl-9 pr-3 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
                <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[12px]">
                <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-primary text-primary-foreground text-[14px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#2457FF' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'verify' && 'Verify & Continue'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode === 'reset' && 'Update Password'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-center text-[11px] text-muted-foreground mt-4">
              By creating an account you agree to our{' '}
              <a href="#" className="text-foreground hover:underline">Terms</a> and{' '}
              <a href="#" className="text-foreground hover:underline">Privacy Policy</a>.
            </p>
          )}

          <p className="text-center text-[12px] text-muted-foreground mt-6">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="text-foreground font-semibold hover:text-primary transition-colors underline ml-1"
            >
              {mode === 'login' ? 'Register now' : 'Sign In'}
            </button>
          </p>

        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          © 2024 Careerly Intelligence. All rights reserved.
        </div>
      </div>

    </div>
  );
}

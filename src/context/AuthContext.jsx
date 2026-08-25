import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';
import { supabase } from '../config/supabase.js';

const AuthContext = createContext(null);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '483326712949-d6d0p5rg49a32bu80i443293kk916u8p.apps.googleusercontent.com';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('careerly_token') || null);
  const [user, setUser] = useState(null);
  const [careerProfile, setCareerProfile] = useState(null);
  const [searchProfile, setSearchProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Initialize session on mount + handle Google OAuth redirect
  useEffect(() => {
    async function checkAuth() {
      // 1. Check for incoming Google OAuth redirect via URL Hash (from accounts.google.com)
      if (window.location.hash && (window.location.hash.includes('id_token') || window.location.hash.includes('access_token'))) {
        try {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const idToken = params.get('id_token');
          const accessToken = params.get('access_token');

          let email = null;
          let fullName = null;
          let avatarUrl = null;
          let googleId = null;

          if (idToken) {
            try {
              const base64Url = idToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
              );
              const payload = JSON.parse(jsonPayload);
              email = payload.email;
              fullName = payload.name || payload.given_name || (payload.email ? payload.email.split('@')[0] : 'Google User');
              avatarUrl = payload.picture;
              googleId = payload.sub;
            } catch (err) {
              console.warn('[AuthContext] JWT decode note:', err.message);
            }
          }

          // If idToken decode didn't yield email but we have accessToken, fetch userinfo from Google
          if (!email && accessToken) {
            try {
              const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (gRes.ok) {
                const gUser = await gRes.json();
                email = gUser.email;
                fullName = gUser.name || gUser.given_name || (gUser.email ? gUser.email.split('@')[0] : 'Google User');
                avatarUrl = gUser.picture;
                googleId = gUser.sub;
              }
            } catch (e) {
              console.warn('[AuthContext] Google userinfo fetch note:', e.message);
            }
          }

          if (email) {
            const googleRes = await fetch(`${API_BASE_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                full_name: fullName,
                google_id: googleId || `g-${Date.now()}`,
                avatar_url: avatarUrl
              })
            });

            if (googleRes.ok) {
              const data = await googleRes.json();
              localStorage.setItem('careerly_token', data.token);
              setToken(data.token);
              setUser(data.user);
              setCareerProfile(data.careerProfile);
              setSearchProfile(data.searchProfile);
              setNeedsOnboarding(data.needsOnboarding || false);
              
              // Clean up OAuth tokens from URL bar
              window.history.replaceState(null, document.title, window.location.pathname);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Google hash parse error:', err.message);
        }
      }

      // 2. Check for Supabase session
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const sUser = sessionData.session.user;
          const googleRes = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: sUser.email,
              full_name: sUser.user_metadata?.full_name || sUser.user_metadata?.name || sUser.email.split('@')[0],
              google_id: sUser.id || sUser.user_metadata?.sub,
              avatar_url: sUser.user_metadata?.avatar_url || sUser.user_metadata?.picture
            })
          });

          if (googleRes.ok) {
            const data = await googleRes.json();
            localStorage.setItem('careerly_token', data.token);
            setToken(data.token);
            setUser(data.user);
            setCareerProfile(data.careerProfile);
            setSearchProfile(data.searchProfile);
            setNeedsOnboarding(data.needsOnboarding || false);
            
            if (window.location.hash) {
              window.history.replaceState(null, document.title, window.location.pathname);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Supabase session check note:', err.message);
      }

      // 3. Standard saved session check
      const savedToken = localStorage.getItem('careerly_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setCareerProfile(data.careerProfile);
          setSearchProfile(data.searchProfile);
          setToken(savedToken);
          setNeedsOnboarding(data.needsOnboarding || false);
        } else {
          localStorage.removeItem('careerly_token');
          setToken(null);
          setUser(null);
          setCareerProfile(null);
          setSearchProfile(null);
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.warn('[AuthContext] Session fetch error:', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Direct Live Google Accounts Gateway Calling (Redirects to https://accounts.google.com)
  const signInWithGoogleGateway = () => {
    const redirectUri = window.location.origin;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token id_token',
      scope: 'openid email profile',
      nonce: Date.now().toString(),
      prompt: 'select_account'
    }).toString();

    // Redirect to real Google Accounts Gateway
    window.location.href = googleAuthUrl;
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
    }

    localStorage.setItem('careerly_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setCareerProfile(data.careerProfile);
    setSearchProfile(data.searchProfile);
    setNeedsOnboarding(data.needsOnboarding || false);

    return data;
  };

  const signup = async ({ email, password, full_name, degree_level, major, target_locations }) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, degree_level, major, target_locations })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account.');
    }

    return data;
  };

  const verifyEmail = async ({ email, code, token: linkToken }) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, token: linkToken })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify email code.');
    }

    localStorage.setItem('careerly_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setCareerProfile(data.careerProfile);
    setSearchProfile(data.searchProfile);
    setNeedsOnboarding(true);

    return data;
  };

  const resendVerification = async (email) => {
    const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification code.');
    }

    return data;
  };

  const loginWithGoogle = async (googlePayload) => {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googlePayload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in with Google.');
    }

    localStorage.setItem('careerly_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setCareerProfile(data.careerProfile);
    setSearchProfile(data.searchProfile);
    setNeedsOnboarding(data.needsOnboarding || false);

    return data;
  };

  const completeOnboarding = async (onboardingData) => {
    if (!token) throw new Error('You must be logged in to complete onboarding.');
    const res = await fetch(`${API_BASE_URL}/user/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(onboardingData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save onboarding data.');
    }

    if (data.careerProfile) setCareerProfile(data.careerProfile);
    if (data.searchProfile) setSearchProfile(data.searchProfile);
    setNeedsOnboarding(false);
    setUser(prev => prev ? { ...prev, onboarding_completed: 1 } : prev);

    return data;
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request password reset.');
    return data;
  };

  const resetPassword = async (arg1, arg2) => {
    let payload = {};
    if (typeof arg1 === 'object' && arg1 !== null) {
      payload = arg1;
    } else {
      payload = { token: arg1, code: arg1, newPassword: arg2 };
    }
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
    return data;
  };

  const logout = async () => {
    localStorage.removeItem('careerly_token');
    localStorage.removeItem('careerly_onboarding_draft');
    setToken(null);
    setUser(null);
    setCareerProfile(null);
    setSearchProfile(null);
    setNeedsOnboarding(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  };

  const updateCareerProfile = async (profileData) => {
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    if (res.ok && data.profile) {
      setCareerProfile(data.profile);
    }
    return data;
  };

  const updateSearchPreferences = async (searchPrefs) => {
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/user/search-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(searchPrefs)
    });

    const data = await res.json();
    if (res.ok && data.searchProfile) {
      setSearchProfile(data.searchProfile);
    }
    return data;
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      careerProfile,
      searchProfile,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === 'admin',
      isLoading,
      needsOnboarding,
      setNeedsOnboarding,
      login,
      signup,
      verifyEmail,
      resendVerification,
      loginWithGoogle,
      signInWithGoogleGateway,
      completeOnboarding,
      forgotPassword,
      resetPassword,
      logout,
      updateCareerProfile,
      updateSearchPreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

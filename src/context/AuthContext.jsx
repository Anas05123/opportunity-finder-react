import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/v1';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('careerly_token') || null);
  const [user, setUser] = useState(null);
  const [careerProfile, setCareerProfile] = useState(null);
  const [searchProfile, setSearchProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    async function checkAuth() {
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

          // Check if onboarding is needed (e.g. profile completion < 50%)
          if (data.careerProfile && data.careerProfile.profile_completion < 45) {
            setNeedsOnboarding(true);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('careerly_token');
          setToken(null);
          setUser(null);
          setCareerProfile(null);
          setSearchProfile(null);
        }
      } catch (err) {
        console.warn('[AuthContext] Session fetch error:', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

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

    if (data.careerProfile && data.careerProfile.profile_completion < 45) {
      setNeedsOnboarding(true);
    } else {
      setNeedsOnboarding(false);
    }

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

    localStorage.setItem('careerly_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setCareerProfile(data.careerProfile);
    setSearchProfile(data.searchProfile);
    setNeedsOnboarding(true);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('careerly_token');
    setToken(null);
    setUser(null);
    setCareerProfile(null);
    setSearchProfile(null);
    setNeedsOnboarding(false);
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
      if (data.profile.profile_completion >= 50) {
        setNeedsOnboarding(false);
      }
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

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  const value = {
    token,
    user,
    careerProfile,
    searchProfile,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user && user.role === 'admin'),
    isLoading,
    needsOnboarding,
    login,
    signup,
    logout,
    updateCareerProfile,
    updateSearchPreferences,
    completeOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;

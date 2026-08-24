import React, { useState, useEffect, useRef } from 'react';
import { 
  BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, Link 
} from 'react-router-dom';
import { 
  Compass, CheckSquare, Calendar, ShieldCheck, User, Search, 
  LayoutGrid, List, Sun, Moon, RefreshCw, Sparkles, Filter, 
  Megaphone, Zap, Mail, CheckCircle, Scale, Building2, MapPin, Clock, Coins, 
  ArrowRight, ExternalLink, Menu, X, Globe, Award, Briefcase, GraduationCap, 
  ChevronLeft, ChevronRight, FileText, Mic, Bot, LogOut, Settings, Bookmark, CheckCircle2
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import AdminRoute from './components/Auth/AdminRoute.jsx';
import PublicOnlyRoute from './components/Auth/PublicOnlyRoute.jsx';
import AuthModal from './components/Auth/AuthModal.jsx';
import AuthScreen from './components/Auth/AuthScreen.jsx';
import OnboardingWizard from './components/Onboarding/OnboardingWizard.jsx';
import PublicLandingView from './components/Landing/PublicLandingView.jsx';
import PersonalizedDashboard from './components/Dashboard/PersonalizedDashboard.jsx';
import DiscoverScreen from './components/Discovery/DiscoverScreen.jsx';
import ProfileView from './components/Profile/ProfileView.jsx';
import SettingsView from './components/Settings/SettingsView.jsx';
import NotFoundPage from './components/NotFoundPage.jsx';
import LoadingScreen from './components/Common/LoadingScreen.jsx';
import Toast from './components/Common/Toast.jsx';

import ConversationalHero from './components/SearchInterface/ConversationalHero.jsx';
import AIQuestionModal from './components/SearchInterface/AIQuestionModal.jsx';
import SearchProgressExperience from './components/SearchInterface/SearchProgressExperience.jsx';
import OpportunityCard from './components/OpportunityCard/OpportunityCard.jsx';
import OpportunityGridView from './components/OpportunityGridView.jsx';
import OpportunityListView from './components/OpportunityListView.jsx';
import OpportunityDrawer from './components/OpportunityDrawer.jsx';
import ApplicationKitDrawer from './components/ApplicationAssistant/ApplicationKitDrawer.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AutoApplyModal from './components/AutoApplyModal.jsx';
import EmailOutreachModal from './components/EmailOutreachModal.jsx';
import ComparisonModal from './components/ComparisonModal.jsx';
import CvStudio from './components/CvStudio.jsx';
import InterviewCoach from './components/InterviewCoach.jsx';
import AiCareerCopilot from './components/AiCareerCopilot.jsx';
import EvidenceInspectorModal from './components/EvidenceInspectorModal.jsx';
import Footer from './components/Footer.jsx';
import { API_BASE_URL, API_V3_URL } from './config/api.js';

function CareerlyWorkspace({ activeTab, theme, toggleTheme, triggerToast }) {
  const { 
    user, 
    careerProfile, 
    searchProfile, 
    isAuthenticated, 
    isAdmin, 
    needsOnboarding, 
    logout 
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeOpportunityId } = useParams();

  const [opportunities, setOpportunities] = useState([]);
  const [savedOppsList, setSavedOppsList] = useState([]);
  const [applicationsList, setApplicationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('all');
  
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Evidence & Search State
  const [inspectingEvidenceOp, setInspectingEvidenceOp] = useState(null);
  const [searchFunnelMetrics, setSearchFunnelMetrics] = useState(null);
  const [searchRelaxationOptions, setSearchRelaxationOptions] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [cvMatchedContext, setCvMatchedContext] = useState(null);
  const itemsPerPage = 9;
  const feedTopRef = useRef(null);

  // Modals & Slide-Over Drawers
  const [drawerOp, setDrawerOp] = useState(null);
  const [prepareAppOp, setPrepareAppOp] = useState(null);
  const [emailOutreachOp, setEmailOutreachOp] = useState(null);

  // Conversational AI Search State
  const [isSearchingPipeline, setIsSearchingPipeline] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [searchProfileContext, setSearchProfileContext] = useState(null);
  const [pendingQuery, setPendingQuery] = useState('');
  const [searchSummaryBadge, setSearchSummaryBadge] = useState('');

  // Fetch Opportunities from SQLite / API
  const fetchOpportunities = async (searchOverride = null) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const term = searchOverride !== null ? searchOverride : '';
      if (term) queryParams.append('search', term);

      const token = localStorage.getItem('careerly_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE_URL}/opportunities?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.warn('Backend fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Saved & Applications when authenticated
  const fetchUserData = async () => {
    const token = localStorage.getItem('careerly_token');
    if (!token) {
      setSavedOppsList([]);
      setApplicationsList([]);
      return;
    }

    try {
      const [savedRes, appsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/saved`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (savedRes.ok) {
        const sData = await savedRes.json();
        setSavedOppsList(sData.saved_opportunities || []);
      }
      if (appsRes.ok) {
        const aData = await appsRes.json();
        setApplicationsList(aData.applications || []);
      }
    } catch (err) {
      console.warn('User data sync error:', err.message);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  // Deep-link opportunity handling: /opportunities/:id
  useEffect(() => {
    if (routeOpportunityId && opportunities.length > 0) {
      const found = opportunities.find(o => String(o.id) === String(routeOpportunityId));
      if (found) {
        setDrawerOp(found);
      }
    }
  }, [routeOpportunityId, opportunities]);

  // Toggle Save Opportunity
  const toggleSaveApp = async (opportunityId) => {
    if (!isAuthenticated) {
      navigate('/register');
      triggerToast('Create a free account to save opportunities to your dashboard.');
      return;
    }

    const id = typeof opportunityId === 'object' && opportunityId !== null 
      ? (opportunityId.id || opportunityId.opportunity_id) 
      : opportunityId;
    if (!id) return;

    const token = localStorage.getItem('careerly_token');
    const isCurrentlySaved = savedOppsList.some(s => s.id === id || s.opportunity_id === id);

    try {
      if (isCurrentlySaved) {
        setSavedOppsList(prev => prev.filter(s => s.id !== id && s.opportunity_id !== id));
        await fetch(`${API_BASE_URL}/user/saved/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        triggerToast('Removed from saved opportunities.');
      } else {
        const opp = typeof opportunityId === 'object' && opportunityId !== null
          ? opportunityId
          : opportunities.find(o => o.id === id);
        if (opp) setSavedOppsList(prev => [opp, ...prev]);
        await fetch(`${API_BASE_URL}/user/saved/${id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        triggerToast('✓ Opportunity saved to your personal dashboard!');
      }
      fetchUserData();
    } catch (err) {
      triggerToast('Error saving opportunity.');
    }
  };

  const isOpportunitySaved = (oppId) => {
    return savedOppsList.some(s => s.id === oppId || s.opportunity_id === oppId);
  };

  // Update CRM Application Stage
  const handleUpdateAppStage = async (opportunityId, stage) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    const token = localStorage.getItem('careerly_token');
    try {
      await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ opportunity_id: opportunityId, stage })
      });
      fetchUserData();
      triggerToast(`✓ Application stage updated: ${stage}`);
    } catch (err) {
      triggerToast('Failed to update stage.');
    }
  };

  // Conversational Search Execution
  const handleStartConversationalSearch = async (rawQuery) => {
    setPendingQuery(rawQuery);
    setIsSearchingPipeline(true);

    const token = localStorage.getItem('careerly_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    try {
      const res = await fetch(`${API_V3_URL}/search/intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          raw_query: rawQuery,
          user_profile: careerProfile || {}
        })
      });

      const data = await res.json();
      if (data.status === 'ready') {
        setSearchProfileContext(data.compiled_constraints);

        if (!data.has_enough_info && data.follow_up_question) {
          setIsSearchingPipeline(false);
          setActiveQuestion(data.follow_up_question);
          return;
        }

        await executeFinalSearch(rawQuery, data.compiled_constraints);
      } else {
        await executeFinalSearch(rawQuery, null);
      }
    } catch (err) {
      await executeFinalSearch(rawQuery, null);
    }
  };

  const executeFinalSearch = async (queryText, compiledConstraints) => {
    setIsSearchingPipeline(true);
    const token = localStorage.getItem('careerly_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    try {
      const res = await fetch(`${API_V3_URL}/search/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: queryText,
          compiled_constraints: compiledConstraints,
          user_profile: careerProfile || {}
        })
      });

      const data = await res.json();
      if (data.results) {
        setOpportunities(data.results);
        setSearchFunnelMetrics(data.funnel_metrics);
        setSearchRelaxationOptions(data.relaxation_options || []);
        setSearchSummaryBadge(`Search: "${queryText}" (${data.results.length} verified results)`);
        setCurrentPage(1);
        triggerToast(`Discovered ${data.results.length} verified opportunities!`);
      }
    } catch (err) {
      triggerToast('Search error occurred.');
    } finally {
      setIsSearchingPipeline(false);
      if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnswerQuestion = async (paramKey, answerVal) => {
    setActiveQuestion(null);
    setIsSearchingPipeline(true);
    const updatedConstraints = {
      ...(searchProfileContext || {}),
      user_profile: {
        ...(careerProfile || {}),
        [paramKey]: answerVal
      }
    };
    await executeFinalSearch(pendingQuery, updatedConstraints);
  };

  const handleSkipQuestion = async () => {
    setActiveQuestion(null);
    await executeFinalSearch(pendingQuery, searchProfileContext);
  };

  const handleNavigateFromCvToDiscover = async (role, suggestedRoles = [], skills = [], cvText = '') => {
    setCvMatchedContext({ role, suggestedRoles, skills, cvText });
    setSelectedPreset('all');
    navigate('/opportunities');
    triggerToast(`🎯 Searching opportunities matched to CV: ${role}`);
    
    setIsSearchingPipeline(true);
    try {
      const res = await fetch(`${API_V3_URL}/search/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${role} ${skills.slice(0, 4).join(' ')}`,
          user_profile: {
            ...careerProfile,
            target_role: role,
            skills: skills
          }
        })
      });
      const data = await res.json();
      if (data.results) {
        setOpportunities(data.results);
        setSearchSummaryBadge(`CV Match: "${role}" (${data.results.length} opportunities)`);
        setCurrentPage(1);
      }
    } catch (e) {
      console.warn('CV Search note:', e.message);
    } finally {
      setIsSearchingPipeline(false);
    }
  };

  const handleRelaxConstraint = async (constraintKey, optVal) => {
    if (!searchProfileContext) return;
    const relaxed = { ...searchProfileContext };
    if (constraintKey === 'location') relaxed.locations = [];
    if (constraintKey === 'type') relaxed.types = [];
    if (constraintKey === 'min_salary') delete relaxed.min_salary;
    await executeFinalSearch(pendingQuery, relaxed);
    triggerToast(`Re-running search with relaxed ${constraintKey} filter...`);
  };

  // Filter & Pagination Logic
  const filteredOpportunities = opportunities.filter(op => {
    if (selectedPreset === 'all') return true;
    if (selectedPreset === 'advertising') {
      const text = `${op.title} ${op.category} ${op.role_family || ''} ${op.description}`.toLowerCase();
      return text.includes('advertis') || text.includes('market') || text.includes('brand') || text.includes('creative') || text.includes('copywrit') || text.includes('media');
    }
    if (selectedPreset === 'scholarships') return op.category === 'scholarship' || op.opportunity_type === 'scholarship';
    if (selectedPreset === 'internships') return op.category === 'internship' || op.opportunity_type === 'internship';
    if (selectedPreset === 'fellowships') return op.category === 'fellowship' || op.opportunity_type === 'fellowship';
    if (selectedPreset === 'remote') return op.location_modality === 'remote' || op.is_remote === 1;
    return true;
  });

  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const displayName = careerProfile?.full_name || user?.full_name || (user?.email ? user.email.split('@')[0] : 'Guest Member');
  const displayEmail = user?.email || 'guest@careerly.io';
  const userInitial = displayName.charAt(0).toUpperCase();

  const tabTitles = {
    landing: 'Home',
    dashboard: 'Workspace Overview',
    explore: 'Opportunity Discovery',
    saved: 'Saved Opportunities',
    tracker: 'Application CRM',
    cv_studio: 'AI CV Studio & ATS Tailor',
    interview: 'STAR Interview Coach',
    calendar: 'Deadlines Timeline',
    profile: 'Professional Profile',
    settings: 'Account & Security Settings',
    admin: 'Enterprise Security Operations'
  };

  const navCls = (tabKey) => {
    const isActive = activeTab === tabKey;
    return `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left ${
      isActive 
        ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`;
  };

  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
        <PublicLandingView 
          onOpenAuth={(mode) => navigate(mode === 'signup' ? '/register' : '/login')}
          sampleOpportunities={opportunities}
          onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
          onPrepareKit={(op) => setPrepareAppOp(op)}
          onSaveOpportunity={(opId) => toggleSaveApp(opId)}
          isSaved={isOpportunitySaved}
          triggerToast={triggerToast}
        />
        
        {/* Drawers and Modals if active */}
        {drawerOp && (
          <OpportunityDrawer 
            opportunity={drawerOp}
            onClose={() => { setDrawerOp(null); if (routeOpportunityId) navigate('/opportunities'); }}
            onToggleSave={(id) => toggleSaveApp(id)}
            isSaved={isOpportunitySaved(drawerOp.id)}
            onAutoApply={(op) => { setPrepareAppOp(op); setDrawerOp(null); }}
            onEmailOutreach={(op) => { setEmailOutreachOp(op); setDrawerOp(null); }}
            triggerToast={triggerToast}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* 1. SIDEBAR (AUTHENTICATED) */}
      {isAuthenticated && (
        <aside className="w-56 flex-shrink-0 h-screen flex flex-col border-r border-border bg-card">
          {/* Header / Brand */}
          <div className="h-14 flex items-center px-4 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2.5 no-underline">
              <img 
                src="/careerly-logo.png" 
                alt="Careerly Logo" 
                className="w-7 h-7 object-contain flex-shrink-0" 
              />
              <span className="text-[15px] font-semibold text-foreground tracking-tight">Careerly</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 overflow-y-auto space-y-1">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 py-1">Workspace</p>
              <button onClick={() => navigate('/dashboard')} className={navCls('dashboard')}>
                <LayoutGrid size={15} /> Dashboard
              </button>
              <button onClick={() => navigate('/opportunities')} className={navCls('explore')}>
                <Compass size={15} /> Discover
              </button>
              <button onClick={() => navigate('/applications')} className={navCls('tracker')}>
                <CheckSquare size={15} /> Applications
                {applicationsList.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono font-bold bg-secondary text-foreground px-1.5 py-0.5 rounded">
                    {applicationsList.length}
                  </span>
                )}
              </button>
            </div>

            <div className="pt-2.5 border-t border-border mt-2 space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 py-1">Tools</p>
              <button onClick={() => navigate('/saved')} className={navCls('saved')}>
                <Bookmark size={15} /> Saved
                {savedOppsList.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono font-bold bg-secondary text-foreground px-1.5 py-0.5 rounded">
                    {savedOppsList.length}
                  </span>
                )}
              </button>
              <button onClick={() => navigate('/cv-studio')} className={navCls('cv_studio')}>
                <FileText size={15} /> CV Studio
              </button>
              <button onClick={() => navigate('/interview')} className={navCls('interview')}>
                <Mic size={15} /> Interview Coach
              </button>
              <button onClick={() => navigate('/calendar')} className={navCls('calendar')}>
                <Calendar size={15} /> Calendar
              </button>
            </div>

            <div className="pt-2.5 border-t border-border mt-2 space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 py-1">Account</p>
              <button onClick={() => navigate('/profile')} className={navCls('profile')}>
                <User size={15} /> Profile
              </button>
              <button onClick={() => navigate('/settings')} className={navCls('settings')}>
                <Settings size={15} /> Settings
              </button>
              {isAdmin && (
                <button onClick={() => navigate('/admin/security')} className={navCls('admin')}>
                  <ShieldCheck size={15} /> Security Ops
                </button>
              )}
            </div>
          </nav>

          {/* User Profile Footer */}
          <div className="p-2.5 border-t border-border space-y-2">
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: '#2457FF' }}>
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
              </div>
            </div>

            {/* Big Prominent Sign Out Button */}
            <button 
              onClick={() => { logout(); navigate('/login'); triggerToast('Signed out of Careerly.'); }} 
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg text-[12px] font-bold transition-all shadow-xs"
              title="Sign Out of Account"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. MAIN WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card flex-shrink-0">
          <div>
            <h1 className="text-[15px] font-semibold text-foreground leading-none">{tabTitles[activeTab] || 'Workspace'}</h1>
            <p className="text-[11px] text-muted-foreground mt-1">Calibrated Career Intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'explore' && (
              <div className="relative hidden sm:block">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  placeholder="Search opportunities..." 
                  className="bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-foreground placeholder-muted-foreground outline-none focus:border-primary w-48 sm:w-64 transition-all"
                  onClick={() => {
                    if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>
            )}

            <div 
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold cursor-pointer shadow-sm"
              style={{ background: '#2457FF' }}
              onClick={() => navigate('/settings')}
              title="Account Settings"
            >
              {userInitial}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto bg-background">
          <main>

        {/* TAB: PUBLIC LANDING (UNAUTHENTICATED) */}
        {activeTab === 'landing' && (
          <PublicLandingView 
            onOpenAuth={(mode) => navigate(mode === 'signup' ? '/register' : '/login')}
            sampleOpportunities={opportunities}
            onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
            onPrepareKit={(op) => setPrepareAppOp(op)}
            onSaveOpportunity={(opId) => toggleSaveApp(opId)}
            isSaved={isOpportunitySaved}
            triggerToast={triggerToast}
          />
        )}

        {/* TAB: PERSONALIZED DASHBOARD (AUTHENTICATED) */}
        {activeTab === 'dashboard' && (
          <PersonalizedDashboard 
            onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
            onPrepareKit={(op) => setPrepareAppOp(op)}
            onSaveOpportunity={(opId) => toggleSaveApp(opId)}
            isSaved={isOpportunitySaved}
            onNavigateTab={(tab) => { 
              const routes = {
                explore: '/opportunities',
                saved: '/saved',
                tracker: '/applications',
                cv_studio: '/cv-studio',
                interview: '/interview',
                calendar: '/calendar',
                settings: '/settings',
                admin: '/admin/security'
              };
              navigate(routes[tab] || '/dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}
            triggerToast={triggerToast}
          />
        )}

        {/* TAB: DISCOVER & MATCH (EXACT FIGMA DESIGN) */}
        {activeTab === 'explore' && (
          <DiscoverScreen 
            opportunities={opportunities}
            isLoading={isLoading}
            onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
            onPrepareKit={(op) => setPrepareAppOp(op)}
            onToggleSave={(id) => toggleSaveApp(id)}
            isSaved={(id) => isOpportunitySaved(id)}
            triggerToast={triggerToast}
          />
        )}

        {/* TAB: SAVED OPPORTUNITIES (USER-OWNED) */}
        {activeTab === 'saved' && (
          <div className="w-full p-6 sm:p-8 space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
            <div>
              <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-foreground leading-tight">
                Saved Opportunities ({savedOppsList.length})
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Your private bookmarks calibrated against your career profile.
              </p>
            </div>

            {savedOppsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {savedOppsList.map(opp => (
                  <OpportunityCard 
                    key={opp.id || opp.opportunity_id}
                    opportunity={opp}
                    onSelectOp={(o) => { setDrawerOp(o); navigate(`/opportunities/${o.id}`); }}
                    onPrepareApplication={(o) => setPrepareAppOp(o)}
                    onToggleSave={(id) => toggleSaveApp(id)}
                    isSaved={true}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary mx-auto">
                  <Bookmark size={24} />
                </div>
                <h3 className="font-display text-[18px] font-bold text-foreground">No saved opportunities yet</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Explore the catalog and bookmark opportunities you'd like to track or prepare applications for.
                </p>
                <button 
                  onClick={() => navigate('/opportunities')}
                  className="px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm"
                  style={{ background: '#2457FF' }}
                >
                  Browse Opportunities Catalog
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: APPLICATION TRACKER CRM BOARD (USER-OWNED) */}
        {activeTab === 'tracker' && (
          <div className="w-full p-6 sm:p-8 space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-foreground leading-tight">
                  Application Pipeline (CRM)
                </h1>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Manage your active applications across Saved, Preparing, Applied, Interview, and Offer stages.
                </p>
              </div>
              <button 
                onClick={() => navigate('/opportunities')}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all self-start sm:self-auto shadow-sm"
                style={{ background: '#2457FF' }}
              >
                <Compass size={14} /> Add Opportunities
              </button>
            </div>

            {/* 6-Column Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-start">
              {[
                { key: 'saved', label: 'Saved', color: '#94a3b8' },
                { key: 'preparing', label: 'Preparing', color: '#F59E0B' },
                { key: 'applied', label: 'Applied', color: '#2457FF' },
                { key: 'interview', label: 'Interview', color: '#7C3AED' },
                { key: 'offer', label: 'Offer', color: '#18A66A' },
                { key: 'rejected', label: 'Archived', color: '#EF4444' }
              ].map(({ key: st, label, color }) => {
                const colApps = applicationsList.filter(a => a.stage === st || (st === 'saved' && !a.stage));
                return (
                  <div key={st} className="bg-secondary/40 border border-border rounded-xl p-3 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{label}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-card border border-border px-1.5 py-0.5 rounded text-foreground">
                        {colApps.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {colApps.map(app => (
                        <div key={app.id || app.opportunity_id} className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow space-y-2">
                          <p className="text-[12px] font-semibold text-foreground leading-snug line-clamp-2">{app.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{app.organization || app.company || 'Enterprise'}</p>
                          
                          <div className="flex items-center gap-1 pt-1.5 border-t border-border/50">
                            <button 
                              onClick={() => setPrepareAppOp(app)}
                              className="flex-1 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded hover:bg-primary hover:text-white transition-all text-center"
                            >
                              Prep Kit
                            </button>
                            <button 
                              onClick={() => { setDrawerOp(app); navigate(`/opportunities/${app.opportunity_id || app.id}`); }}
                              className="px-2 py-1 border border-border text-[10px] text-foreground font-medium rounded hover:bg-secondary transition-all"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: AI CV STUDIO & ATS ENHANCER */}
        {activeTab === 'cv_studio' && (
            <CvStudio 
              userProfile={careerProfile} 
              triggerToast={triggerToast}
              onNavigateToDiscover={handleNavigateFromCvToDiscover}
              onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
              onPrepareKit={(op) => setPrepareAppOp(op)}
              onToggleSave={(id) => toggleSaveApp(id)}
              isOpportunitySaved={(id) => isOpportunitySaved(id)}
            />
        )}

        {/* TAB: AI MOCK INTERVIEW COACH */}
        {activeTab === 'interview' && (
          <div className="tab-content-anim w-full">
            <InterviewCoach userProfile={careerProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB: DEADLINES TIMELINE */}
        {activeTab === 'calendar' && (
          <div className="w-full p-6 sm:p-8 space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
            <div>
              <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-foreground leading-tight">
                Application Deadlines Timeline
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Chronological schedule of intake cut-offs and verified submission deadlines.
              </p>
            </div>

            <div className="space-y-3">
              {opportunities.slice(0, 15).map(op => {
                const isRolling = !op.deadline_utc || op.deadline_utc.toLowerCase().includes('open') || op.deadline_utc.toLowerCase().includes('rolling');
                return (
                  <div key={op.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-primary/40 transition-all">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className={`w-2 h-2 rounded-full ${isRolling ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className={isRolling ? 'text-emerald-700' : 'text-amber-700'}>
                          {isRolling ? 'Rolling Intake / Open Submissions' : `Submission Deadline: ${op.deadline_utc}`}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-semibold text-foreground truncate">{op.title}</h3>
                      <p className="text-[11px] text-muted-foreground">{op.organization || op.company || 'Enterprise'} · {op.location_country || 'Global'}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <button 
                        onClick={() => setPrepareAppOp(op)}
                        className="px-3.5 py-1.5 bg-primary text-white text-[12px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm"
                        style={{ background: '#2457FF' }}
                      >
                        Prepare Kit
                      </button>
                      <button 
                        onClick={() => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
                        className="px-3.5 py-1.5 border border-border text-foreground text-[12px] font-medium rounded-lg hover:bg-secondary transition-all"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: PROFILE VIEW */}
        {activeTab === 'profile' && (
          <ProfileView triggerToast={triggerToast} />
        )}

        {/* TAB: SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <SettingsView triggerToast={triggerToast} />
        )}

        {/* TAB: ADMIN OPERATIONS (ADMIN ONLY) */}
        {activeTab === 'admin' && (
          <AdminDashboard triggerToast={triggerToast} />
        )}

      </main>

      </div> {/* saas-content-canvas */}
    </div> {/* saas-main */}

      {/* Slide-Over Inspection Drawer */}
      {drawerOp && (
        <OpportunityDrawer 
          opportunity={drawerOp}
          onClose={() => { setDrawerOp(null); if (routeOpportunityId) navigate('/opportunities'); }}
          onToggleSave={(id) => toggleSaveApp(id)}
          isSaved={isOpportunitySaved(drawerOp.id)}
          onAutoApply={(op) => { setPrepareAppOp(op); setDrawerOp(null); }}
          onEmailOutreach={(op) => { setEmailOutreachOp(op); setDrawerOp(null); }}
          triggerToast={triggerToast}
        />
      )}

      {/* Application Readiness Kit Drawer */}
      {prepareAppOp && (
        <ApplicationKitDrawer 
          opportunity={prepareAppOp}
          userProfile={careerProfile || {}}
          onClose={() => setPrepareAppOp(null)}
          onApplied={(opId, st) => handleUpdateAppStage(opId, st)}
          triggerToast={triggerToast}
        />
      )}

      {/* Dynamic AI Question Modal */}
      <AIQuestionModal 
        isOpen={Boolean(activeQuestion)}
        questionData={activeQuestion}
        onAnswerSelected={handleAnswerQuestion}
        onSkip={handleSkipQuestion}
      />

      {/* Transparent Search Progress Experience */}
      <SearchProgressExperience 
        isActive={isSearchingPipeline}
      />

      {/* Evidence Inspector Modal */}
      {inspectingEvidenceOp && (
        <EvidenceInspectorModal 
          opportunity={inspectingEvidenceOp}
          evidenceList={inspectingEvidenceOp.evidence_records}
          onClose={() => setInspectingEvidenceOp(null)}
        />
      )}

      {/* Email Outreach Modal */}
      {emailOutreachOp && (
        <EmailOutreachModal 
          opportunity={emailOutreachOp}
          userProfile={careerProfile || {}}
          onClose={() => setEmailOutreachOp(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* Floating 24/7 AI Career Copilot */}
      {!drawerOp && !prepareAppOp && !emailOutreachOp && !inspectingEvidenceOp && !authModalOpen && !activeQuestion && activeTab !== 'landing' && (
        <AiCareerCopilot userProfile={careerProfile || {}} triggerToast={triggerToast} />
      )}
    </div>
  );
}

function HomeRoute({ theme, toggleTheme, triggerToast }) {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  if (isLoading) {
    return <LoadingScreen message="Launching Careerly" subMessage="Calibrating your career opportunities..." />;
  }
  if (isAuthenticated) {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <CareerlyWorkspace activeTab="landing" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('opp_theme') || 'dark');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Home & Landing */}
          <Route path="/" element={
            <HomeRoute theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
          } />

          {/* Authentication Dedicated Pages */}
          <Route path="/login" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/verify-email" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/reset-password" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />

          {/* 4-Step Academic & Career Calibration Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingWizard triggerToast={triggerToast} onComplete={() => window.location.href = '/dashboard'} />
            </ProtectedRoute>
          } />

          {/* Authenticated Core Workspace Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="dashboard" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />

          {/* Public & Authenticated Opportunity Discovery */}
          <Route path="/opportunities" element={
            <CareerlyWorkspace activeTab="explore" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
          } />
          <Route path="/opportunities/:id" element={
            <CareerlyWorkspace activeTab="explore" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
          } />

          {/* Authenticated Feature Routes */}
          <Route path="/applications" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="tracker" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/saved" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="saved" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/cv-studio" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="cv_studio" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/interview" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="interview" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="calendar" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="profile" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="settings" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />

          {/* Administrative Security Operations Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <CareerlyWorkspace activeTab="admin" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </AdminRoute>
          } />
          <Route path="/admin/*" element={
            <AdminRoute>
              <CareerlyWorkspace activeTab="admin" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </AdminRoute>
          } />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global Toast Notification */}
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      </AuthProvider>
    </BrowserRouter>
  );
}

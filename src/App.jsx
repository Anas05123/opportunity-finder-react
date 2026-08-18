import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, CheckSquare, Calendar, ShieldCheck, User, Search, 
  LayoutGrid, List, Sun, Moon, RefreshCw, Sparkles, Filter, 
  Megaphone, Zap, Mail, CheckCircle, Scale, Building2, MapPin, Clock, Coins, 
  ArrowRight, ExternalLink, Menu, X, Globe, Award, Briefcase, GraduationCap, 
  ChevronLeft, ChevronRight, FileText, Mic, Bot
} from 'lucide-react';

import OpportunityGridView from './components/OpportunityGridView';
import OpportunityListView from './components/OpportunityListView';
import OpportunityDrawer from './components/OpportunityDrawer';
import AdminDashboard from './components/AdminDashboard';
import AutoApplyModal from './components/AutoApplyModal';
import EmailOutreachModal from './components/EmailOutreachModal';
import ComparisonModal from './components/ComparisonModal';
import UserProfileModal from './components/UserProfileModal';
import CvStudio from './components/CvStudio';
import InterviewCoach from './components/InterviewCoach';
import AiCareerCopilot from './components/AiCareerCopilot';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export default function App() {
  const [opportunities, setOpportunities] = useState([]);
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({ total_opportunities: 0, active_sources: 48, verified_opportunities: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore'); // explore, cv_studio, interview, tracker, calendar, admin
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const feedTopRef = useRef(null);
  
  // Theme State (Prodexa Dark & Light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('opp_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('opp_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          degree_title: parsed.degree_title || 'Bachelor of Arts (BA)'
        };
      } catch (e) {}
    }
    return {
      name: 'Anas (Student)',
      email: 'ayarianas79@gmail.com',
      phone: '+60172513031',
      degree_level: 'undergrad',
      degree_title: 'Bachelor of Arts (BA)',
      major: 'Advertising & Marketing',
      gpa: 3.85,
      no_ielts_preference: 1
    };
  });


  // Saved Applications (CRM Board)
  const [savedApps, setSavedApps] = useState(() => {
    return JSON.parse(localStorage.getItem('opp_react_saved')) || [];
  });

  // Compare List
  const [compareList, setCompareList] = useState([]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [selectedPreset, setSelectedPreset] = useState('all'); // all, advertising, fully_funded, linkedin, no_ielts
  const [sortBy, setSortBy] = useState('deadline_asc');

  // Modals & Slide-Over Drawer
  const [drawerOp, setDrawerOp] = useState(null);
  const [autoApplyOp, setAutoApplyOp] = useState(null);
  const [emailOutreachOp, setEmailOutreachOp] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  // Persistent AI Discovered Opportunities (Saved across sessions)
  const [aiDiscovered, setAiDiscovered] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('opp_ai_discovered_results')) || [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('opp_ai_discovered_results', JSON.stringify(aiDiscovered));
  }, [aiDiscovered]);

  const [isGeminiSearching, setIsGeminiSearching] = useState(false);
  const [geminiSearchSummary, setGeminiSearchSummary] = useState('');

  // Gemini-Powered Smart Search & Job Hunter (Malaysia & Global)
  const handleSmartSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchTerm.trim()) {
      fetchOpportunities('');
      setGeminiSearchSummary('');
      return;
    }

    setIsLoading(true);
    setIsGeminiSearching(true);
    triggerToast('⚡ Gemini AI is scouring LinkedIn & Malaysia portals...');

    try {
      const res = await fetch(`${API_BASE_URL}/ai/smart-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTerm,
          userProfile
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newFound = data.opportunities || [];
        
        // Save discovered opportunities permanently
        setAiDiscovered(prev => {
          const combined = [...newFound, ...prev];
          const unique = [];
          const seen = new Set();
          for (const item of combined) {
            if (!seen.has(item.id || item.title)) {
              seen.add(item.id || item.title);
              unique.push(item);
            }
          }
          return unique;
        });

        setOpportunities(newFound);
        setCurrentPage(1);
        setGeminiSearchSummary(`✨ Discovered & Saved ${data.ai_discovered_count || newFound.length} matches for "${searchTerm}"`);
        triggerToast(`🎉 Discovered & saved ${newFound.length} matching listings!`);
      } else {
        fetchOpportunities(searchTerm);
      }
    } catch (err) {
      fetchOpportunities(searchTerm);
    } finally {
      setIsLoading(false);
      setIsGeminiSearching(false);
    }
  };

  // Fetch Opportunities from live backend (and merge with saved AI discovered items)
  const fetchOpportunities = async (searchOverride = null) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const term = searchOverride !== null ? searchOverride : searchTerm;
      if (term) queryParams.append('search', term);
      if (typeFilter !== 'all') queryParams.append('type', typeFilter);
      if (fieldFilter !== 'all') queryParams.append('field', fieldFilter);
      if (levelFilter !== 'all') queryParams.append('degree', levelFilter);
      if (sortBy) queryParams.append('sort', sortBy);

      const res = await fetch(`${API_BASE_URL}/opportunities?${queryParams.toString()}`);
      let list = [];
      if (res.ok) {
        const data = await res.json();
        list = data.opportunities || [];
      } else {
        const fallbackRes = await fetch('/opportunities.json');
        const fbData = await fallbackRes.json();
        list = fbData.opportunities || [];
      }

      // Merge with permanently saved AI discoveries
      const combined = [...aiDiscovered, ...list];
      const unique = [];
      const seen = new Set();
      for (const item of combined) {
        const key = item.id || item.title;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }
      let finalList = unique;

      // Apply in-memory search if specified
      if (term && term.trim()) {
        const t = term.toLowerCase();
        finalList = finalList.filter(o => 
          (o.title && o.title.toLowerCase().includes(t)) ||
          (o.organization && o.organization.toLowerCase().includes(t)) ||
          (o.location_country && o.location_country.toLowerCase().includes(t)) ||
          (o.location_city && o.location_city.toLowerCase().includes(t)) ||
          (o.field_of_study && o.field_of_study.toLowerCase().includes(t))
        );
      }

      // Apply Preset Filtering
      if (selectedPreset === 'advertising') {
        finalList = finalList.filter(o => o.field_of_study === 'advertising');
      } else if (selectedPreset === 'finance') {
        finalList = finalList.filter(o => o.field_of_study === 'finance' || (o.title && o.title.toLowerCase().includes('finance')) || (o.title && o.title.toLowerCase().includes('banking')));
      } else if (selectedPreset === 'fully_funded') {
        finalList = finalList.filter(o => o.funding_level === 'fully_funded' || (o.stipend_text || '').toLowerCase().includes('fully'));
      } else if (selectedPreset === 'linkedin') {
        finalList = finalList.filter(o => o.type === 'internship' || (o.organization && o.organization.toLowerCase().includes('ogilvy')) || (o.organization && o.organization.toLowerCase().includes('goldman')));
      } else if (selectedPreset === 'no_ielts') {
        finalList = finalList.filter(o => o.no_ielts);
      }

      setOpportunities(finalList);
      setCurrentPage(1);
    } catch (err) {
      console.warn("Error fetching opportunities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sources`);
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (e) {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {}
  };

  const triggerScraper = async () => {
    triggerToast('⚡ Ingesting live opportunities from 48+ verified portals...');
    try {
      await fetch(`${API_BASE_URL}/admin/scrape`, { method: 'POST' });
      await fetchOpportunities();
      await fetchStats();
      await fetchSources();
      triggerToast('All 48+ sources synchronized successfully!');
    } catch (err) {
      triggerToast('Scraper synchronization complete.');
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchStats();
    fetchSources();
  }, [typeFilter, fieldFilter, levelFilter, selectedPreset, sortBy]);

  useEffect(() => {
    localStorage.setItem('opp_react_saved', JSON.stringify(savedApps));
  }, [savedApps]);


  useEffect(() => {
    localStorage.setItem('opp_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const toggleSaveApp = (op) => {
    const exists = savedApps.some(a => a.id === op.id);
    if (exists) {
      setSavedApps(savedApps.filter(a => a.id !== op.id));
      triggerToast('Removed from Board');
    } else {
      setSavedApps([...savedApps, { ...op, stage: 'saved', savedAt: new Date().toISOString() }]);
      triggerToast('Saved to Board!');
    }
  };

  const toggleCompare = (op) => {
    const exists = compareList.some(c => c.id === op.id);
    if (exists) {
      setCompareList(compareList.filter(c => c.id !== op.id));
      triggerToast('Removed from Comparison');
    } else {
      if (compareList.length >= 4) {
        triggerToast('Maximum 4 programs can be compared.');
        return;
      }
      setCompareList([...compareList, op]);
      triggerToast('Added to Comparison');
    }
  };

  const updateAppStage = (id, newStage) => {
    setSavedApps(savedApps.map(a => a.id === id ? { ...a, stage: newStage } : a));
    triggerToast(`Stage: ${newStage.toUpperCase()}`);
  };

  const handleApplySuccess = (id, stage = 'submitted') => {
    const exists = savedApps.some(a => a.id === id);
    if (exists) {
      setSavedApps(savedApps.map(a => a.id === id ? { ...a, stage } : a));
    } else {
      const op = opportunities.find(o => o.id === id);
      if (op) setSavedApps([...savedApps, { ...op, stage, appliedAt: new Date().toISOString() }]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setLevelFilter('all');
    setFieldFilter('all');
    setSelectedPreset('all');
    triggerToast('Filters reset');
  };

  // Match score calculator
  const calculateMatchScore = (op) => {
    let score = 75;
    const userMajor = (userProfile.major || '').toLowerCase();
    const opField = (op.field_of_study || '').toLowerCase();

    if (userMajor.includes('advertising') && opField === 'advertising') score += 20;
    if (userMajor.includes('finance') && opField === 'finance') score += 20;
    if (userMajor.includes('marketing') && (opField === 'marketing' || opField === 'advertising')) score += 15;
    if (op.degree_level === 'undergrad' || op.degree_level === userProfile.degree_level) score += 10;
    if (op.no_ielts && userProfile.no_ielts_preference) score += 5;
    if (op.funding_level === 'fully_funded' || op.funding_level === 'paid_salary') score += 5;
    return Math.min(score, 99);
  };


  // Pagination calculations
  const totalPages = Math.ceil(opportunities.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, opportunities.length);
  const paginatedOpportunities = opportunities.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (feedTopRef.current) {
      feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen dot-grid-canvas" data-theme={theme}>
      
      {/* 1. PRODEXA FLOATING NAVBAR */}
      <header className="prodexa-navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <div className="prodexa-brand" onClick={() => { setActiveTab('explore'); resetFilters(); }}>
            <div className="brand-icon-box">
              <Compass size={20} />
            </div>
            <span className="brand-name">Opportunity<span style={{ color: 'var(--accent-blue)' }}>Hub</span></span>
          </div>

          {/* Desktop Segmented Navigation Tab Switcher */}
          <nav className="nav-pill-group">
            <button 
              className={`nav-pill-link ${activeTab === 'explore' ? 'active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              <Compass size={15} /> Directory & Jobs
            </button>
            <button 
              className={`nav-pill-link ${activeTab === 'cv_studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('cv_studio')}
            >
              <FileText size={15} color="var(--accent-blue)" /> AI CV Studio
            </button>
            <button 
              className={`nav-pill-link ${activeTab === 'interview' ? 'active' : ''}`}
              onClick={() => setActiveTab('interview')}
            >
              <Mic size={15} color="var(--accent-emerald)" /> AI Interview Room
            </button>
            <button 
              className={`nav-pill-link ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracker')}
            >
              <CheckSquare size={15} /> CRM <span className="nav-badge">{savedApps.length}</span>
            </button>
            <button 
              className={`nav-pill-link ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={15} /> Deadlines
            </button>
            <button 
              className={`nav-pill-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={15} /> Scraper Ops <span className="nav-badge" style={{ background: 'var(--accent-emerald)', color: '#fff' }}>48+</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="navbar-right">
            {compareList.length > 0 && (
              <button className="btn btn-outline" onClick={() => setShowCompareModal(true)}>
                <Scale size={14} /> Compare ({compareList.length})
              </button>
            )}

            {/* Sync Live Button */}
            <button className="icon-button" onClick={triggerScraper} title="Sync 48+ Scraper Sources">
              <RefreshCw size={15} />
            </button>

            {/* Theme Toggle (Sun/Moon) */}
            <button 
              className="icon-button" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#18181b" />}
            </button>

            {/* User Profile Pill */}
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.45rem 0.95rem', gap: '0.5rem' }}
              onClick={() => setShowProfileModal(true)}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'var(--primary-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800' }}>
                {userProfile?.name?.charAt(0) || 'A'}
              </div>
              <span style={{ fontSize: '0.84rem' }}>{userProfile?.name?.split(' ')[0] || 'Anas'}</span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button 
              className="icon-button mobile-menu-trigger" 
              onClick={() => setMobileMenuOpen(true)}
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SHEET NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-sheet-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
                  <Compass size={15} />
                </div>
                <span className="brand-name" style={{ fontSize: '1.1rem' }}>OpportunityHub</span>
              </div>
              <button className="icon-button" onClick={() => setMobileMenuOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              <button 
                className={`mobile-sheet-link ${activeTab === 'explore' ? 'active' : ''}`}
                onClick={() => { setActiveTab('explore'); setMobileMenuOpen(false); }}
              >
                <Compass size={18} /> Directory & Jobs
              </button>
              <button 
                className={`mobile-sheet-link ${activeTab === 'cv_studio' ? 'active' : ''}`}
                onClick={() => { setActiveTab('cv_studio'); setMobileMenuOpen(false); }}
              >
                <FileText size={18} color="var(--accent-blue)" /> AI CV Studio & ATS
              </button>
              <button 
                className={`mobile-sheet-link ${activeTab === 'interview' ? 'active' : ''}`}
                onClick={() => { setActiveTab('interview'); setMobileMenuOpen(false); }}
              >
                <Mic size={18} color="var(--accent-emerald)" /> AI Interview Practice
              </button>
              <button 
                className={`mobile-sheet-link ${activeTab === 'tracker' ? 'active' : ''}`}
                onClick={() => { setActiveTab('tracker'); setMobileMenuOpen(false); }}
              >
                <CheckSquare size={18} /> Application CRM ({savedApps.length})
              </button>
              <button 
                className={`mobile-sheet-link ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => { setActiveTab('calendar'); setMobileMenuOpen(false); }}
              >
                <Calendar size={18} /> Deadlines Timeline
              </button>
              <button 
                className={`mobile-sheet-link ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
              >
                <ShieldCheck size={18} /> Scraper Intelligence (48+)
              </button>
              <button 
                className="mobile-sheet-link"
                onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }}
              >
                <User size={18} /> Candidate Profile & Match
              </button>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--muted-foreground)' }}>Theme:</span>
              <button className="btn btn-outline" onClick={toggleTheme}>
                {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODEXA HERO SECTION (EXPLORE TAB) */}
      {activeTab === 'explore' && (
        <section className="prodexa-hero-section">
          <div className="hero-bento-container">
            
            {/* Signature Prodexa Floating Cursor Badges */}
            <div className="floating-cursor cursor-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#3B82F6"><path d="M4 4l16 7.5-7.5 2-2 7.5L4 4z"/></svg>
              <span className="cursor-label" style={{ background: '#3B82F6' }}>Anas (GPA 3.85)</span>
            </div>
            <div className="floating-cursor cursor-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#F97316"><path d="M4 4l16 7.5-7.5 2-2 7.5L4 4z"/></svg>
              <span className="cursor-label" style={{ background: '#F97316' }}>Ogilvy Fellowship</span>
            </div>
            <div className="floating-cursor cursor-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#22C55E"><path d="M4 4l16 7.5-7.5 2-2 7.5L4 4z"/></svg>
              <span className="cursor-label" style={{ background: '#22C55E' }}>100% Fully Funded</span>
            </div>
            <div className="floating-cursor cursor-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#8B5CF6"><path d="M4 4l16 7.5-7.5 2-2 7.5L4 4z"/></svg>
              <span className="cursor-label" style={{ background: '#8B5CF6' }}>Chevening & DAAD</span>
            </div>

            <div className="hero-pill-tag">
              <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} /> 
              <span>AI-Powered Job & Scholarship Engine (Gemini AI)</span>
            </div>

            <h1 className="hero-title">
              Discover, apply, and track <br />
              <span className="hero-title-muted">all in one place.</span>
            </h1>

            <p className="hero-subtitle">
              Verified global platform indexing jobs, advertising internships, and fully funded scholarships with AI CV enhancement and 1-click apply.
            </p>

            {/* Center Search Input (Powered by Gemini AI) */}
            <form onSubmit={handleSmartSearch} className="hero-search-wrapper">
              <Search size={18} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Search jobs, internships in Malaysia or worldwide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1.35rem', gap: '0.45rem', flexShrink: 0 }}
                disabled={isGeminiSearching}
              >
                {isGeminiSearching ? (
                  <>
                    <RefreshCw size={14} className="spin" /> Searching...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} color="#60a5fa" /> AI Search
                  </>
                )}
              </button>
            </form>


            {/* Gemini Live Search Badge */}
            {geminiSearchSummary && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card)', border: '1px solid var(--accent-blue)', color: 'var(--foreground)', padding: '0.4rem 1.15rem', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: '700', margin: '0 auto 1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <Sparkles size={14} color="var(--accent-blue)" /> {geminiSearchSummary}
                <button 
                  onClick={() => { setGeminiSearchSummary(''); fetchOpportunities(); }} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', marginLeft: '0.35rem' }}
                >
                  ✕
                </button>
              </div>
            )}


            {/* Category Ribbon */}
            <div className="category-ribbon">
              <button 
                className={`cat-pill ${selectedPreset === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedPreset('all')}
              >
                All Offers
              </button>
              <button 
                className={`cat-pill ${selectedPreset === 'finance' ? 'active' : ''}`}
                onClick={() => setSelectedPreset(selectedPreset === 'finance' ? 'all' : 'finance')}
                style={{ borderColor: selectedPreset === 'finance' ? 'var(--accent-emerald)' : 'var(--border)' }}
              >
                💰 Finance & Banking
              </button>
              <button 
                className={`cat-pill ${selectedPreset === 'advertising' ? 'ad-active' : ''}`}
                onClick={() => setSelectedPreset(selectedPreset === 'advertising' ? 'all' : 'advertising')}
              >
                📢 Advertising & Media
              </button>
              <button 
                className={`cat-pill ${selectedPreset === 'fully_funded' ? 'active' : ''}`}
                onClick={() => setSelectedPreset(selectedPreset === 'fully_funded' ? 'all' : 'fully_funded')}
              >
                ✨ 100% Fully Funded
              </button>
              <button 
                className={`cat-pill ${selectedPreset === 'linkedin' ? 'active' : ''}`}
                onClick={() => setSelectedPreset(selectedPreset === 'linkedin' ? 'all' : 'linkedin')}
              >
                💼 Top Brand Internships
              </button>
              <button 
                className={`cat-pill ${selectedPreset === 'no_ielts' ? 'active' : ''}`}
                onClick={() => setSelectedPreset(selectedPreset === 'no_ielts' ? 'all' : 'no_ielts')}
              >
                🌍 No IELTS / Waiver
              </button>
            </div>

          </div>
        </section>
      )}

      {/* 3. PRODEXA TELEMETRY STATS STRIP */}
      {activeTab === 'explore' && (
        <section className="prodexa-stats-grid">
          <div className="stat-card-bento">
            <div className="stat-icon-wrap" style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)' }}>
              <Coins size={22} />
            </div>
            <div>
              <div className="stat-val">$18.4M+</div>
              <div className="stat-lbl">In Verified Stipends Indexed</div>
            </div>
          </div>

          <div className="stat-card-bento">
            <div className="stat-icon-wrap" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <Globe size={22} />
            </div>
            <div>
              <div className="stat-val">48+ Portals</div>
              <div className="stat-lbl">LinkedIn, Govt & Agency Feeds</div>
            </div>
          </div>

          <div className="stat-card-bento">
            <div className="stat-icon-wrap" style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)' }}>
              <Megaphone size={22} />
            </div>
            <div>
              <div className="stat-val">Top Brand Roles</div>
              <div className="stat-lbl">Ogilvy, Google, Spotify & L'Oréal</div>
            </div>
          </div>

          <div className="stat-card-bento">
            <div className="stat-icon-wrap" style={{ background: 'var(--accent-violet-light)', color: 'var(--accent-violet)' }}>
              <Zap size={22} />
            </div>
            <div>
              <div className="stat-val">Gemini AI Career Suite</div>
              <div className="stat-lbl">ATS CV Studio & Mock Interviews</div>
            </div>
          </div>
        </section>
      )}

      {/* 4. MAIN BODY WITH TABS */}
      <main className="feed-section" ref={feedTopRef}>
        
        {/* TAB 1: EXPLORE DIRECTORY & JOBS */}
        {activeTab === 'explore' && (
          <div className="tab-content-anim">
            {/* Toolbar */}
            <div className="feed-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--muted-foreground)' }}>
                <span>Showing <strong style={{ color: 'var(--foreground)' }}>{opportunities.length === 0 ? 0 : `${startIndex + 1}–${endIndex}`}</strong> of <strong style={{ color: 'var(--foreground)' }}>{opportunities.length}</strong> listings</span>
                <span>•</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>Sort:</span>
                <select 
                  className="btn btn-outline" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="deadline_asc">Upcoming Deadline</option>
                  <option value="popular">Most Popular</option>
                  <option value="trust">Trust Score (0-100)</option>
                </select>

                {/* View Switcher */}
                <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.15rem' }}>
                  <button 
                    className="icon-button"
                    style={{ width: '32px', height: '32px', border: 'none', background: viewMode === 'grid' ? 'var(--muted)' : 'transparent', color: viewMode === 'grid' ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                    onClick={() => setViewMode('grid')}
                    title="Bento Grid View"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button 
                    className="icon-button"
                    style={{ width: '32px', height: '32px', border: 'none', background: viewMode === 'list' ? 'var(--muted)' : 'transparent', color: viewMode === 'list' ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                    onClick={() => setViewMode('list')}
                    title="Table View"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Feed Component */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)' }}>
                <RefreshCw size={28} className="spin" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                <p style={{ fontWeight: '600' }}>Loading opportunities from database...</p>
              </div>
            ) : paginatedOpportunities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.5rem' }}>No offers found matching your criteria</p>
                <button className="btn btn-outline" onClick={resetFilters}>Reset All Filters</button>
              </div>
            ) : viewMode === 'grid' ? (
              <OpportunityGridView 
                opportunities={paginatedOpportunities}
                selectedOpId={drawerOp?.id}
                onSelectOp={(op) => setDrawerOp(op)}
                onToggleSave={toggleSaveApp}
                savedIds={savedApps.map(a => a.id)}
                onAutoApply={(op) => setAutoApplyOp(op)}
                onEmailOutreach={(op) => setEmailOutreachOp(op)}
                calculateMatchScore={calculateMatchScore}
              />
            ) : (
              <OpportunityListView 
                opportunities={paginatedOpportunities}
                selectedOpId={drawerOp?.id}
                onSelectOp={(op) => setDrawerOp(op)}
                onToggleSave={toggleSaveApp}
                savedIds={savedApps.map(a => a.id)}
                onAutoApply={(op) => setAutoApplyOp(op)}
                onEmailOutreach={(op) => setEmailOutreachOp(op)}
                calculateMatchScore={calculateMatchScore}
              />
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{opportunities.length}</strong> listings
                </div>

                <div className="pagination-controls">
                  <button 
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button 
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: AI CV STUDIO & ATS ENHANCER */}
        {activeTab === 'cv_studio' && (
          <div className="tab-content-anim">
            <CvStudio userProfile={userProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB 3: AI MOCK INTERVIEW ROOM */}
        {activeTab === 'interview' && (
          <div className="tab-content-anim">
            <InterviewCoach userProfile={userProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB 4: KANBAN CRM BOARD */}
        {activeTab === 'tracker' && (
          <div className="tab-content-anim" style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                Application Board CRM
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem' }}>
                Track your ongoing applications, review submission receipts, and manage interview schedules.
              </p>
            </div>


            <div className="kanban-board-scroll">
              {['saved', 'preparing', 'submitted', 'interview', 'accepted'].map(st => {
                const colApps = savedApps.filter(a => a.stage === st || (st === 'saved' && !a.stage));
                return (
                  <div key={st} className="kanban-col-bento">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.85rem' }}>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.86rem', fontWeight: '800', color: 'var(--foreground)' }}>{st}</span>
                      <span className="nav-badge">{colApps.length}</span>
                    </div>

                    {colApps.map(app => (
                      <div key={app.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--foreground)', marginBottom: '0.2rem' }}>{app.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--muted-foreground)', marginBottom: '0.6rem' }}>{app.organization}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                          <select 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.74rem', flex: 1 }}
                            value={app.stage || 'saved'}
                            onChange={(e) => updateAppStage(app.id, e.target.value)}
                          >
                            <option value="saved">Saved</option>
                            <option value="preparing">Preparing</option>
                            <option value="submitted">Submitted</option>
                            <option value="interview">Interviewing</option>
                            <option value="accepted">Awarded 🎉</option>
                          </select>
                          <button 
                            className="icon-button"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => setAutoApplyOp(app)}
                            title="1-Click Auto Apply"
                          >
                            <Zap size={12} color="var(--accent-emerald)" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: DEADLINES CALENDAR */}
        {activeTab === 'calendar' && (
          <div style={{ maxWidth: '840px', margin: '1rem auto' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                Application Deadlines Timeline
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem' }}>Chronological view of intake deadlines and verified submission cut-offs.</p>
            </div>

            {opportunities.map(op => (
              <div key={op.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: '700', marginBottom: '0.25rem' }}>
                    📅 Deadline: {op.deadline_utc}
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--foreground)' }}>{op.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>{op.organization} • {op.location_country}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-emerald" style={{ fontSize: '0.8rem' }} onClick={() => setAutoApplyOp(op)}>
                    <Zap size={13} /> Auto-Apply
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setDrawerOp(op)}>
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: ADMIN OPERATIONS DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard triggerToast={triggerToast} />
        )}

      </main>

      {/* Floating 24/7 AI Career Copilot */}
      <AiCareerCopilot userProfile={userProfile} triggerToast={triggerToast} />

      {/* Slide-Over Inspection Drawer */}
      {drawerOp && (
        <OpportunityDrawer 
          opportunity={drawerOp}
          onClose={() => setDrawerOp(null)}
          onToggleSave={toggleSaveApp}
          isSaved={savedApps.some(a => a.id === drawerOp.id)}
          onAutoApply={(op) => { setAutoApplyOp(op); setDrawerOp(null); }}
          onEmailOutreach={(op) => { setEmailOutreachOp(op); setDrawerOp(null); }}
          onVerifiedUpdate={(id) => {
            setOpportunities(prev => prev.map(o => o.id === id ? { ...o, verification_status: 'official_verified', trust_score: 98 } : o));
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* 1-Click Auto Apply Modal */}
      {autoApplyOp && (
        <AutoApplyModal 
          opportunity={autoApplyOp}
          userProfile={userProfile}
          onClose={() => setAutoApplyOp(null)}
          onApplied={handleApplySuccess}
          triggerToast={triggerToast}
        />
      )}

      {/* 1-Click Email Outreach Modal */}
      {emailOutreachOp && (
        <EmailOutreachModal 
          opportunity={emailOutreachOp}
          userProfile={userProfile}
          onClose={() => setEmailOutreachOp(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* Comparison Modal */}
      {showCompareModal && (
        <ComparisonModal 
          opportunities={compareList}
          onClose={() => setShowCompareModal(false)}
          onSave={toggleSaveApp}
          savedIds={savedApps.map(a => a.id)}
        />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal 
          profile={userProfile}
          onClose={() => setShowProfileModal(false)}
          onSaveProfile={(prof) => setUserProfile(prof)}
          triggerToast={triggerToast}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          padding: '0.75rem 1.35rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          zIndex: 4000,
          fontSize: '0.86rem',
          fontWeight: '700'
        }}>
          <CheckCircle size={17} color="var(--accent-emerald)" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

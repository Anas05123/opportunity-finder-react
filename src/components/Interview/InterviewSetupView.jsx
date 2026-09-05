import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api.js';
import { 
  Building2, Sparkles, Video, Mic, ShieldCheck, ChevronRight, ChevronLeft,
  Award, Play, ArrowRight, Target, Compass, Layers, CheckCircle2,
  RefreshCw, Camera, Briefcase, UserCheck, Shield
} from 'lucide-react';

const PRESET_COMPANIES = [
  { 
    id: 'stripe', 
    name: 'Stripe Worldwide', 
    role: 'Staff Systems & Infrastructure Engineer', 
    badge: 'Fintech Infrastructure', 
    symbol: 'S',
    brandColor: '#635BFF',
    accentBg: 'from-[#635BFF]/15 to-[#635BFF]/5'
  },
  { 
    id: 'google', 
    name: 'Google Core & Cloud', 
    role: 'Senior Product Manager / Architect', 
    badge: 'Distributed Systems', 
    symbol: 'G',
    brandColor: '#4285F4',
    accentBg: 'from-[#4285F4]/15 to-[#4285F4]/5'
  },
  { 
    id: 'amazon', 
    name: 'Amazon Web Services', 
    role: 'Principal Solutions Architect', 
    badge: 'Cloud Enterprise', 
    symbol: 'AWS',
    brandColor: '#FF9900',
    accentBg: 'from-[#FF9900]/15 to-[#FF9900]/5'
  },
  { 
    id: 'meta', 
    name: 'Meta Technologies', 
    role: 'Staff Frontend & Product Engineer', 
    badge: 'Client Platforms', 
    symbol: 'M',
    brandColor: '#0668E1',
    accentBg: 'from-[#0668E1]/15 to-[#0668E1]/5'
  },
  { 
    id: 'mckinsey', 
    name: 'McKinsey & Company', 
    role: 'Management Consultant / Digital Lead', 
    badge: 'Strategy & Advisory', 
    symbol: 'McK',
    brandColor: '#1B365D',
    accentBg: 'from-[#1B365D]/25 to-[#1B365D]/10'
  },
  { 
    id: 'openai', 
    name: 'OpenAI Research', 
    role: 'AI Applications & Research Engineer', 
    badge: 'Frontier AI & LLM', 
    symbol: 'AI',
    brandColor: '#10A37F',
    accentBg: 'from-[#10A37F]/15 to-[#10A37F]/5'
  }
];

const TRACKS = [
  { 
    id: 'behavioral', 
    label: 'Behavioral & Leadership', 
    subLabel: 'STAR Methodology',
    desc: 'Ownership, cross-functional persuasion, conflict resolution & navigating organizational ambiguity', 
    icon: Sparkles 
  },
  { 
    id: 'technical', 
    label: 'Systems Architecture & Engineering', 
    subLabel: 'Scalability & Reliability',
    desc: 'High-throughput topologies, latency budgeting, database replication & fault tolerance', 
    icon: Layers 
  },
  { 
    id: 'product', 
    label: 'Product Strategy & Vision', 
    subLabel: '0-to-1 Execution',
    desc: 'Market sizing, product metrics, ruthless prioritization & quantitative business impact', 
    icon: Compass 
  },
  { 
    id: 'case_study', 
    label: 'Strategic Problem Solving', 
    subLabel: 'Executive Advisory',
    desc: 'Hypothesis trees, MECE root-cause breakdown, operational leverage & business ROI', 
    icon: Award 
  }
];

const PERSONAS = [
  { 
    id: 'bella', 
    name: 'Elena Rostova', 
    title: 'Principal Bar Raiser', 
    division: 'Executive Talent Committee',
    tone: 'Articulate, discerning, structured executive presence', 
    initials: 'ER',
    themeColor: '#6366F1',
    voiceTag: 'Elena (Executive Female Voice)'
  },
  { 
    id: 'adam', 
    name: 'Marcus Vance', 
    title: 'VP of Systems Architecture', 
    division: 'Core Infrastructure',
    tone: 'Authoritative, technical depth, analytical probe', 
    initials: 'MV',
    themeColor: '#0EA5E9',
    voiceTag: 'Marcus (Technical Director Voice)'
  },
  { 
    id: 'antoni', 
    name: 'David Chen', 
    title: 'Lead Distributed Architect', 
    division: 'Platforms & Scalability',
    tone: 'Calm, methodical, trade-off focus', 
    initials: 'DC',
    themeColor: '#10B981',
    voiceTag: 'David (Analytical Architect Voice)'
  },
  { 
    id: 'roger', 
    name: 'Sarah Sterling', 
    title: 'Senior Engineering Director', 
    division: 'Product Engineering',
    tone: 'Fast-paced, conversational, outcome-oriented', 
    initials: 'SS',
    themeColor: '#EC4899',
    voiceTag: 'Sarah (Conversational Leader Voice)'
  },
  { 
    id: 'george', 
    name: 'Alexander Hamilton', 
    title: 'Managing Partner', 
    division: 'Executive Advisory',
    tone: 'Poised, strategic, high-conviction British presence', 
    initials: 'AH',
    themeColor: '#8B5CF6',
    voiceTag: 'Alexander (Executive British Voice)'
  }
];

export default function InterviewSetupView({ userProfile, onStartSession, isLoading }) {
  const [selectedCompany, setSelectedCompany] = useState(PRESET_COMPANIES[0]);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [targetRole, setTargetRole] = useState(userProfile?.headline || 'Senior Full-Stack Engineer');
  const [selectedTrack, setSelectedTrack] = useState(TRACKS[0].id);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [seniority, setSeniority] = useState('Senior');
  const [questionCount, setQuestionCount] = useState(3);

  // Past Saved Sessions State & Pagination
  const [pastSessions, setPastSessions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const SESSIONS_PER_PAGE = 4;

  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const token = localStorage.getItem('careerly_token');
        const res = await fetch(`${API_BASE_URL}/ai/interview/history`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.sessions)) {
            setPastSessions(data.sessions);
          }
        }
      } catch (err) {
        console.warn('[History fetch notice]:', err.message);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  // Camera & Mic Hardware Self-Test
  const [mediaStream, setMediaStream] = useState(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [hasMicAccess, setHasMicAccess] = useState(false);
  const videoPreviewRef = useRef(null);

  useEffect(() => {
    let activeStream = null;
    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        activeStream = stream;
        setMediaStream(stream);
        setHasCameraAccess(true);
        setHasMicAccess(true);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (err) {
        console.log('[Media Check Notice]: Live room will prompt for camera on join.');
      }
    }
    checkDevices();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleStart = () => {
    const company = isCustomCompany ? (customCompanyName || 'Custom Enterprise') : selectedCompany.name;
    onStartSession({
      company,
      role: targetRole,
      track: selectedTrack,
      seniority,
      persona: selectedPersona,
      questionCount
    });
  };

  // Pagination calculation
  const totalHistoryPages = Math.ceil(pastSessions.length / SESSIONS_PER_PAGE);
  const paginatedSessions = pastSessions.slice(
    (historyPage - 1) * SESSIONS_PER_PAGE,
    historyPage * SESSIONS_PER_PAGE
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold tracking-wider uppercase">
              <Shield size={12} className="text-primary" />
              <span>Executive Assessment Suite · High-Fidelity Simulation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-display">
              Company-Calibrated Mock Interview Coach
            </h1>
            <p className="text-[13px] text-muted-foreground max-w-2xl leading-relaxed">
              Conduct high-stakes technical and behavioral interviews calibrated directly against Tier-1 enterprise evaluation criteria, featuring real-time conversational AI voice synthesis and comprehensive STAR scoring.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-secondary/60 border border-border px-4 py-2.5 rounded-2xl text-[12px] font-medium text-foreground shadow-sm shrink-0">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="font-mono text-xs">End-to-End Encrypted Session</span>
          </div>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Target Company & Scope (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Target Company Selector */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Target Company & Hiring Bar
                </span>
              </div>
              <button 
                onClick={() => setIsCustomCompany(!isCustomCompany)}
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                {isCustomCompany ? 'Select Verified Presets' : '+ Custom Enterprise'}
              </button>
            </div>

            {isCustomCompany ? (
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-foreground block">Enterprise Organization Name</label>
                <input 
                  type="text"
                  placeholder="e.g. OpenAI, Palantir Technologies, Tesla, Spotify..."
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-2xl px-4 py-3 text-[13px] text-foreground outline-none focus:border-primary transition-all font-sans"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_COMPANIES.map(c => {
                  const isSel = selectedCompany.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompany(c); setTargetRole(c.role); }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[96px] relative overflow-hidden group ${
                        isSel 
                          ? 'border-primary ring-2 ring-primary/25 bg-primary/5 shadow-sm'
                          : 'border-border/80 bg-secondary/30 hover:border-border hover:bg-secondary/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shadow-sm border border-white/10"
                          style={{ backgroundColor: c.brandColor, color: '#ffffff' }}
                        >
                          {c.symbol}
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground tracking-wider uppercase">
                          {c.badge}
                        </span>
                      </div>
                      <div className="pt-2">
                        <p className="text-[13px] font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {c.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Target Role & Seniority */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Target Role & Assessment Level
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Designation Title</label>
                <input 
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Staff Systems Architect"
                  className="w-full bg-secondary/40 border border-border rounded-2xl px-4 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Level</label>
                <select 
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-2xl px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all font-sans"
                >
                  <option value="Junior">Associate (0-2 YOE)</option>
                  <option value="Mid-Level">Mid-Career (3-5 YOE)</option>
                  <option value="Senior">Senior (5-8 YOE)</option>
                  <option value="Staff / Principal">Staff / Principal (8+ YOE)</option>
                  <option value="Executive">Director / VP</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Track Focus */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Evaluation Track & Methodology
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRACKS.map(t => {
                const isSel = selectedTrack === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrack(t.id)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 group ${
                      isSel 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm'
                        : 'border-border/80 bg-secondary/30 hover:border-border hover:bg-secondary/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={15} className={isSel ? 'text-primary' : 'text-muted-foreground'} />
                        <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
                          {t.label}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider block">
                      {t.subLabel}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Persona Panel & Pre-Flight (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Executive Interviewer Persona */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Interviewer Persona
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary font-mono">Ultra-Realistic Voice</span>
            </div>
            
            <div className="space-y-2.5">
              {PERSONAS.map(p => {
                const isSel = selectedPersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p)}
                    className={`w-full p-3.5 rounded-2xl border flex items-center gap-3.5 text-left transition-all ${
                      isSel 
                        ? 'border-primary ring-2 ring-primary/25 bg-primary/5'
                        : 'border-border/80 bg-secondary/30 hover:border-border hover:bg-secondary/60'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm border border-white/10"
                      style={{ backgroundColor: p.themeColor, color: '#ffffff' }}
                    >
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-foreground">{p.name}</span>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground uppercase tracking-wider">
                          {p.division}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-sans">
                        {p.title} · {p.tone}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Pre-Flight & Live Test */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Hardware Diagnostics
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                1080p Calibrated
              </span>
            </div>

            {/* Video Box Preview */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-border/80 shadow-inner">
              {hasCameraAccess ? (
                <video 
                  ref={videoPreviewRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <Camera size={26} className="mx-auto text-slate-500" />
                  <p className="text-[12px] text-slate-400 font-medium">Camera connects automatically in live room</p>
                </div>
              )}

              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-[11px] text-white border border-white/10">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold">{userProfile?.name || 'Candidate Feed'}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-300">WebRTC Encrypted</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 border border-border/60">
                <Video size={13} className={hasCameraAccess ? 'text-emerald-500' : 'text-slate-400'} />
                <span className="font-medium">Video Stream Ready</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 border border-border/60">
                <Mic size={13} className={hasMicAccess ? 'text-emerald-500' : 'text-slate-400'} />
                <span className="font-medium">Voice Recognition Active</span>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleStart}
            disabled={isLoading || (!isCustomCompany && !selectedCompany)}
            id="start-interview-btn"
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[14px] font-bold shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Calibrating {selectedCompany?.name || 'Company'} Protocol...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Enter Live Video Interview Room</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

        </div>

      </div>

      {/* Your Saved Private Interview Sessions with Pagination */}
      {pastSessions.length > 0 && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base font-bold text-foreground font-display">
                Your Saved Private Interview Sessions
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground font-mono">
                Showing {Math.min((historyPage - 1) * SESSIONS_PER_PAGE + 1, pastSessions.length)}–{Math.min(historyPage * SESSIONS_PER_PAGE, pastSessions.length)} of {pastSessions.length} saved sessions
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Every completed interview round is permanently stored with an encrypted private URL. Access your debriefing scorecards, candidate audio recordings, and 10/10 AI Golden Answers at any time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {paginatedSessions.map((sess) => (
              <a
                key={sess.id}
                href={`/interview/session/${sess.id}`}
                className="p-5 rounded-2xl border border-border/80 bg-secondary/20 hover:bg-secondary/60 hover:border-primary/40 transition-all flex flex-col justify-between gap-3.5 group shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider truncate">
                      {sess.company_name}
                    </span>
                    <span 
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-md text-white shadow-sm"
                      style={{ backgroundColor: sess.verdict_color || '#10B981' }}
                    >
                      {sess.verdict}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {sess.role_title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Recorded {new Date(sess.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                  <span className="font-mono font-bold text-foreground">Score: {sess.overall_score}/100</span>
                  <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Private Session</span>
                    <span>→</span>
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalHistoryPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
              <button
                onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                disabled={historyPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-all font-medium"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalHistoryPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setHistoryPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                      historyPage === p
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                disabled={historyPage === totalHistoryPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-all font-medium"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api.js';
import { 
  ShieldCheck, ChevronRight, ChevronLeft, Sparkles, Layers, Compass, Award,
  Play, ArrowRight, Camera, Mic, MicOff, Video, VideoOff, RefreshCw,
  Volume2, Clock, SlidersHorizontal,
  Archive, BarChart3, Building2
} from 'lucide-react';
import { playAiVoice, stopSpeaking, attachAudioVisualizer } from '../../services/speechService.js';

const PRESET_COMPANIES = [
  { 
    id: 'stripe', 
    name: 'Stripe Worldwide', 
    role: 'Staff Systems & Infrastructure Engineer', 
    badge: 'Fintech Infrastructure', 
    hiringBar: '98.5th Percentile Rigor',
    symbol: 'S',
    brandColor: '#635BFF',
    accentBg: 'from-[#635BFF]/15 to-[#635BFF]/5'
  },
  { 
    id: 'google', 
    name: 'Google Core & Cloud', 
    role: 'Senior Product Manager / Architect', 
    badge: 'Distributed Platforms', 
    hiringBar: 'L6+ Systems Committee',
    symbol: 'G',
    brandColor: '#4285F4',
    accentBg: 'from-[#4285F4]/15 to-[#4285F4]/5'
  },
  { 
    id: 'amazon', 
    name: 'Amazon Web Services', 
    role: 'Principal Solutions Architect', 
    badge: 'Cloud Architecture', 
    hiringBar: 'Bar Raiser Caliber',
    symbol: 'AWS',
    brandColor: '#FF9900',
    accentBg: 'from-[#FF9900]/15 to-[#FF9900]/5'
  },
  { 
    id: 'meta', 
    name: 'Meta Technologies', 
    role: 'Staff Frontend & Product Engineer', 
    badge: 'Client Platforms', 
    hiringBar: 'E6 Core Engineering',
    symbol: 'M',
    brandColor: '#0668E1',
    accentBg: 'from-[#0668E1]/15 to-[#0668E1]/5'
  },
  { 
    id: 'mckinsey', 
    name: 'McKinsey & Company', 
    role: 'Management Consultant / Digital Lead', 
    badge: 'Strategy & Advisory', 
    hiringBar: 'Partner Round Evaluation',
    symbol: 'McK',
    brandColor: '#1B365D',
    accentBg: 'from-[#1B365D]/25 to-[#1B365D]/10'
  },
  { 
    id: 'openai', 
    name: 'OpenAI Research', 
    role: 'AI Applications & Research Engineer', 
    badge: 'Frontier AI & LLM', 
    hiringBar: 'Research Engineering Bar',
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
    desc: 'Executive ownership, cross-functional conflict, stakeholder alignment & organizational ambiguity', 
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
    label: 'Product Strategy & Execution', 
    subLabel: '0-to-1 Execution',
    desc: 'Market sizing, product metrics, trade-off prioritization & quantitative business impact', 
    icon: Compass 
  },
  { 
    id: 'case_study', 
    label: 'Strategic Advisory & Case Analysis', 
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
    voiceSample: 'Welcome to your executive interview. I will be evaluating your structured thinking and leadership impact.'
  },
  { 
    id: 'adam', 
    name: 'Marcus Vance', 
    title: 'VP of Systems Architecture', 
    division: 'Core Infrastructure',
    tone: 'Authoritative, technical depth, analytical probe', 
    initials: 'MV',
    themeColor: '#0EA5E9',
    voiceSample: 'Welcome. I am looking forward to exploring the architectural trade-offs and scalability limits of your previous projects.'
  },
  { 
    id: 'antoni', 
    name: 'David Chen', 
    title: 'Lead Distributed Architect', 
    division: 'Platforms & Scalability',
    tone: 'Calm, methodical, trade-off focus', 
    initials: 'DC',
    themeColor: '#10B981',
    voiceSample: 'Hello. Let us discuss how you navigate production latency, resilience, and distributed systems reliability.'
  },
  { 
    id: 'roger', 
    name: 'Sarah Sterling', 
    title: 'Senior Engineering Director', 
    division: 'Product Engineering',
    tone: 'Fast-paced, conversational, outcome-oriented', 
    initials: 'SS',
    themeColor: '#EC4899',
    voiceSample: 'Great to meet you. Today we will focus on cross-functional momentum, engineering velocity, and measurable outcomes.'
  },
  { 
    id: 'george', 
    name: 'Alexander Hamilton', 
    title: 'Managing Partner', 
    division: 'Executive Advisory',
    tone: 'Poised, strategic, high-conviction British presence', 
    initials: 'AH',
    themeColor: '#8B5CF6',
    voiceSample: 'Good day. We shall dissect high-stakes strategy, organizational leverage, and executive decision frameworks.'
  }
];

export default function InterviewSetupView({ userProfile, onStartSession, isLoading }) {
  const [activeTab, setActiveTab] = useState('calibration');
  const [selectedCompany, setSelectedCompany] = useState(PRESET_COMPANIES[0]);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [targetRole, setTargetRole] = useState(userProfile?.headline || 'Senior Full-Stack Engineer');
  const [selectedTrack, setSelectedTrack] = useState(TRACKS[0].id);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [seniority, setSeniority] = useState('Senior');
  const questionCount = 3;

  const [playingPersonaId, setPlayingPersonaId] = useState(null);

  const [pastSessions, setPastSessions] = useState([]);
  const [_isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const SESSIONS_PER_PAGE = 6;

  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const videoPreviewRef = useRef(null);
  const mediaStreamRef = useRef(null);

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
      } catch (_err) {
        console.warn("[History fetch notice]:", _err?.message);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    let activeStream = null;
    let cleanupAudio = () => {};

    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, 
          audio: true 
        });
        activeStream = stream;
        mediaStreamRef.current = stream;
        setHasCameraAccess(true);
        

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        cleanupAudio = attachAudioVisualizer(stream, (vol) => {
          setAudioLevel(vol);
        });
      } catch (_err) {
        // fallback
      }
    }
    checkDevices();

    return () => {
      cleanupAudio();
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleToggleCam = () => {
    if (mediaStreamRef.current) {
      const vTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !camEnabled;
        setCamEnabled(!camEnabled);
      }
    }
  };

  const handleToggleMic = () => {
    if (mediaStreamRef.current) {
      const aTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
        if (micEnabled) setAudioLevel(0);
      }
    }
  };

  const handlePlayVoicePreview = (persona, e) => {
    e.stopPropagation();
    if (playingPersonaId === persona.id) {
      stopSpeaking();
      setPlayingPersonaId(null);
      return;
    }

    stopSpeaking();
    setPlayingPersonaId(persona.id);
    playAiVoice({
      text: persona.voiceSample,
      voiceKey: persona.id,
      onEnd: () => setPlayingPersonaId(null)
    });
  };

  const handleStart = () => {
    stopSpeaking();
    const company = isCustomCompany ? (customCompanyName.trim() || 'Custom Enterprise') : selectedCompany.name;
    onStartSession({
      company,
      role: targetRole,
      track: selectedTrack,
      seniority,
      persona: selectedPersona,
      questionCount
    });
  };

  const totalHistoryPages = Math.max(1, Math.ceil(pastSessions.length / SESSIONS_PER_PAGE));
  const paginatedSessions = pastSessions.slice(
    (historyPage - 1) * SESSIONS_PER_PAGE,
    historyPage * SESSIONS_PER_PAGE
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      
      {/* Executive Header & Navigation Tab Bar */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold tracking-wider uppercase">
              <ShieldCheck size={13} className="text-primary" />
              <span>Apex Executive Telepresence & Calibration Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight font-display">
              Mock Interview Assessment Studio
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-sans">
              Calibrate your candidacy against verified Fortune 500 hiring rubrics. Engage with conversational AI leadership personas, test real-time systems trade-offs, and receive auditable STAR scoring packets.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1.5 bg-secondary/80 border border-border/80 rounded-2xl shadow-inner shrink-0">
            <button
              onClick={() => setActiveTab('calibration')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calibration'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Calibration Deck</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Archive size={14} />
              <span>Session Vault ({pastSessions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'calibration' ? (
        /* CALIBRATION DECK VIEW */
        <div className="space-y-8">
          
          {/* 1. Target Enterprise Showcase Cards */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step 1 · Target Enterprise Calibration
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select an enterprise rubric or calibrate against your target organization.
                </p>
              </div>

              <button 
                onClick={() => setIsCustomCompany(!isCustomCompany)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-primary/30 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-all self-start sm:self-auto cursor-pointer"
              >
                <Building2 size={13} />
                <span>{isCustomCompany ? 'View Verified Enterprise Rubrics' : '+ Custom Organization'}</span>
              </button>
            </div>

            {isCustomCompany ? (
              <div className="p-5 rounded-2xl bg-secondary/30 border border-border/80 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                  Organization / Company Designation
                </label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    placeholder="e.g. Anthropic, Snowflake, Palantir Technologies, Spotify, Figma..."
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The AI interviewer will adapt its evaluation rubrics and committee questions to reflect this enterprise's public hiring culture.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_COMPANIES.map(c => {
                  const isSel = selectedCompany.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompany(c); setTargetRole(c.role); }}
                      className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[120px] relative overflow-hidden group cursor-pointer ${
                        isSel 
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                          : 'border-border/70 bg-secondary/20 hover:border-border hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shadow-sm border border-white/10"
                          style={{ backgroundColor: c.brandColor, color: '#ffffff' }}
                        >
                          {c.symbol}
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground tracking-wider uppercase border border-border/40">
                          {c.badge}
                        </span>
                      </div>
                      <div className="pt-3 space-y-1">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <BarChart3 size={12} className="text-primary shrink-0" />
                          <span className="truncate">{c.hiringBar}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Split Horizon Stage: Left Configuration Deck / Right Studio Hardware Pre-Flight */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Role & Evaluation Track (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Role & Level */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step 2 · Target Position & Seniority Caliber
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Role Title
                    </label>
                    <input 
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Staff Systems Architect"
                      className="w-full bg-secondary/30 border border-border rounded-2xl px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Seniority Bar
                    </label>
                    <select 
                      value={seniority}
                      onChange={(e) => setSeniority(e.target.value)}
                      className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
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

              {/* Evaluation Track Focus */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step 3 · Evaluation Track & Rubric
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {TRACKS.map(t => {
                    const isSel = selectedTrack === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTrack(t.id)}
                        className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 group cursor-pointer ${
                          isSel 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                            : 'border-border/70 bg-secondary/20 hover:border-border hover:bg-secondary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={isSel ? 'text-primary' : 'text-muted-foreground'} />
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {t.label}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-primary/90 uppercase tracking-wider block">
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

            {/* Right Column: Studio Camera Mirror & Persona Cockpit (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Hardware Telepresence Mirror */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Studio Telepresence Mirror
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                    1080p Calibrated
                  </span>
                </div>

                {/* Broadcast Video Preview with Framing Crosshairs */}
                <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-border/80 shadow-inner group">
                  {hasCameraAccess && camEnabled ? (
                    <video 
                      ref={videoPreviewRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-2 text-slate-400">
                      <Camera size={28} className="mx-auto text-slate-500" />
                      <p className="text-xs font-medium">Camera stream standby</p>
                    </div>
                  )}

                  {/* Broadcast Framing Crosshairs */}
                  <div className="absolute inset-4 pointer-events-none border border-white/10 rounded-xl flex flex-col justify-between p-2">
                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                      <span>REC [STANDBY]</span>
                      <span>16:9 HD</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
                        {userProfile?.name || 'Candidate Feed'}
                      </span>
                      <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded backdrop-blur-md">
                        <Mic size={10} className={micEnabled && audioLevel > 5 ? 'text-emerald-400' : 'text-white/40'} />
                        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-400 transition-all duration-75"
                            style={{ width: micEnabled ? `${Math.min(100, audioLevel * 2)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Hardware Toggles */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <button
                    onClick={handleToggleCam}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all font-semibold cursor-pointer ${
                      camEnabled 
                        ? 'bg-secondary/40 border-border text-foreground hover:bg-secondary' 
                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}
                  >
                    {camEnabled ? <Video size={14} className="text-emerald-500" /> : <VideoOff size={14} />}
                    <span>{camEnabled ? 'Camera Active' : 'Camera Muted'}</span>
                  </button>

                  <button
                    onClick={handleToggleMic}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all font-semibold cursor-pointer ${
                      micEnabled 
                        ? 'bg-secondary/40 border-border text-foreground hover:bg-secondary' 
                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}
                  >
                    {micEnabled ? <Mic size={14} className="text-emerald-500" /> : <MicOff size={14} />}
                    <span>{micEnabled ? 'Microphone Active' : 'Mic Muted'}</span>
                  </button>
                </div>
              </div>

              {/* Persona Selection with Live Audio Sample Preview */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Interviewer Persona & Voice Caliber
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-primary font-mono">
                    Ultra-Realistic ElevenLabs
                  </span>
                </div>

                <div className="space-y-2.5">
                  {PERSONAS.map(p => {
                    const isSel = selectedPersona.id === p.id;
                    const isPlaying = playingPersonaId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPersona(p)}
                        className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                          isSel 
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-border/70 bg-secondary/20 hover:border-border hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm border border-white/10"
                            style={{ backgroundColor: p.themeColor, color: '#ffffff' }}
                          >
                            {p.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                              <span className="text-[9px] font-semibold text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-secondary">
                                {p.division}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{p.title}</p>
                          </div>
                        </div>

                        {/* Preview Voice Button */}
                        <button
                          type="button"
                          onClick={(e) => handlePlayVoicePreview(p, e)}
                          title="Listen to Voice Preview"
                          className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                            isPlaying 
                              ? 'bg-primary text-white border-primary animate-pulse' 
                              : 'bg-secondary/80 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          <Volume2 size={12} className={isPlaying ? 'animate-bounce' : ''} />
                          <span>{isPlaying ? 'Playing...' : 'Preview Voice'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* Full-Width Executive Command Action Bar */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-foreground">
                <span>{isCustomCompany ? (customCompanyName || 'Custom Enterprise') : selectedCompany.name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-primary">{targetRole}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground font-normal">Interviewer: {selectedPersona.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Initiates a private, encrypted simulation room saved to your account.
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={isLoading || (!isCustomCompany && !selectedCompany)}
              id="start-interview-btn"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary hover:bg-primary/95 text-white text-xs font-bold shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.99] shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Calibrating Executive Studio...</span>
                </>
              ) : (
                <>
                  <Play size={15} fill="currentColor" />
                  <span>Launch Executive Telepresence Studio</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* SESSION VAULT VIEW (PAGINATED & SEARCHABLE) */
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Archive size={16} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground font-display">
                  Executive Interview Session Vault
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                All completed interview sessions are saved with private encrypted links, complete with candidate audio and hiring packets.
              </p>
            </div>

            <div className="text-xs font-mono font-semibold text-muted-foreground bg-secondary/80 px-3.5 py-1.5 rounded-xl border border-border/60 self-start sm:self-auto">
              Showing {pastSessions.length > 0 ? (historyPage - 1) * SESSIONS_PER_PAGE + 1 : 0} – {Math.min(historyPage * SESSIONS_PER_PAGE, pastSessions.length)} of {pastSessions.length} sessions
            </div>
          </div>

          {pastSessions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Archive size={36} className="mx-auto text-muted-foreground/40" />
              <h3 className="text-sm font-bold text-foreground">No Saved Sessions Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Launch an interview from the Calibration Deck. Once completed, your full audio debrief and scorecard will be stored here permanently.
              </p>
              <button
                onClick={() => setActiveTab('calibration')}
                className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Go to Calibration Deck</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedSessions.map(sess => (
                  <a
                    key={sess.id}
                    href={`/interview/session/${sess.id}`}
                    className="p-5 rounded-2xl border border-border/80 bg-secondary/20 hover:bg-secondary/50 hover:border-primary/40 transition-all flex flex-col justify-between gap-4 group shadow-sm cursor-pointer"
                  >
                    <div className="space-y-2">
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
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Recorded {new Date(sess.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                      <span className="font-mono font-bold text-foreground">Score: {sess.overall_score}/100</span>
                      <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Open Session</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Vault Pagination Controls */}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                  <button
                    onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalHistoryPages }, (_, idx) => idx + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setHistoryPage(p)}
                        className={`w-8 h-8 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                          historyPage === p
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-secondary/40 border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                    disabled={historyPage === totalHistoryPages}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

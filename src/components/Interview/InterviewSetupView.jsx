import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Sparkles, Video, Mic, ShieldCheck, ChevronRight, 
  Award, Play, ArrowRight, UserCheck, Flame, Compass, Target,
  RefreshCw, CheckCircle2, AlertCircle, Camera, Volume2, Settings
} from 'lucide-react';

const PRESET_COMPANIES = [
  { id: 'stripe', name: 'Stripe Worldwide', role: 'Staff Systems & Infrastructure Engineer', badge: 'Tier 1 Fintech', color: '#635BFF', logo: '💳' },
  { id: 'google', name: 'Google Creative Lab & Core', role: 'Senior Product Manager / Architect', badge: 'Big Tech', color: '#4285F4', logo: '🔍' },
  { id: 'amazon', name: 'Amazon Web Services', role: 'Principal Solutions Architect', badge: 'Cloud Leader', color: '#FF9900', logo: '📦' },
  { id: 'meta', name: 'Meta Technologies', role: 'Staff Frontend & Product Engineer', badge: 'Social Graph', color: '#0668E1', logo: '🌐' },
  { id: 'mckinsey', name: 'McKinsey & Company', role: 'Management Consultant / Digital Lead', badge: 'Strategy', color: '#1B365D', logo: '📊' },
  { id: 'openai', name: 'OpenAI Research', role: 'AI Applications & Research Engineer', badge: 'Frontier AI', color: '#10A37F', logo: '⚡' }
];

const TRACKS = [
  { id: 'behavioral', label: 'Behavioral (STAR Method)', desc: 'Leadership, ownership, navigating ambiguity & cross-functional influence', icon: Sparkles },
  { id: 'technical', label: 'System Architecture & Technical', desc: 'Scalability, trade-offs, fault tolerance & high-throughput systems', icon: Target },
  { id: 'product', label: 'Product Sense & Strategy', desc: '0-to-1 design, user metrics, prioritization & growth engineering', icon: Compass },
  { id: 'case_study', label: 'Live Case Study & Problem Solving', desc: 'Hypothesis trees, MECE decomposition & business ROI', icon: Award }
];

const PERSONAS = [
  { id: 'bella', name: 'Elena / Bella', title: 'Principal Bar Raiser', tone: 'Articulate, confident executive female', avatar: '👩‍💼', color: '#6366F1', voiceTag: 'Bella (Ultra-Realistic Female)' },
  { id: 'adam', name: 'Marcus / Adam', title: 'Director of Engineering', tone: 'Resonant, confident technical leader male', avatar: '👨‍💼', color: '#0EA5E9', voiceTag: 'Adam (Ultra-Realistic Male)' },
  { id: 'antoni', name: 'David / Antoni', title: 'Lead Architect', tone: 'Calm, analytical systems specialist', avatar: '🧑‍💼', color: '#10B981', voiceTag: 'Antoni (Analytical Male)' },
  { id: 'roger', name: 'Roger Vance', title: 'Senior Engineering Manager', tone: 'Laid-back, conversational American male', avatar: '👨‍💻', color: '#EC4899', voiceTag: 'Roger (Conversational Male)' },
  { id: 'george', name: 'George Hamilton', title: 'Managing Director', tone: 'Warm, captivating British male', avatar: '👨‍🏫', color: '#8B5CF6', voiceTag: 'George (British Male)' }
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

  // Camera & Mic Hardware Self-Test
  const [mediaStream, setMediaStream] = useState(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [hasMicAccess, setHasMicAccess] = useState(false);
  const [isTestingHardware, setIsTestingHardware] = useState(false);
  const videoPreviewRef = useRef(null);

  useEffect(() => {
    // Attempt non-blocking camera preview check
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
    console.log("[SetupView] Start button clicked!");
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

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Live Video & Facecam AI Simulation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display tracking-tight">
              Company-Calibrated Mock Interview Coach
            </h1>
            <p className="text-[13px] text-muted-foreground max-w-2xl leading-relaxed">
              Practice high-stakes video interviews with real-time AI facecam, speech recognition, and instant STAR-framework debriefing calibrated to tier-1 global hiring bars.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl text-[12px] font-medium text-muted-foreground shadow-sm">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Encrypted WebRTC · 100% Private</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Configurator (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Target Company Selector */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">1. Select Target Company</span>
              <button 
                onClick={() => setIsCustomCompany(!isCustomCompany)}
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                {isCustomCompany ? 'Choose Presets' : '+ Custom Company'}
              </button>
            </div>

            {isCustomCompany ? (
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-foreground block">Enter Company Name</label>
                <input 
                  type="text"
                  placeholder="e.g. OpenAI, Palantir, Tesla, Spotify..."
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_COMPANIES.map(c => {
                  const isSel = selectedCompany.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompany(c); setTargetRole(c.role); }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[85px] ${
                        isSel 
                          ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                          : 'bg-card border-border hover:border-primary/40 hover:bg-secondary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{c.logo}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase">
                          {c.badge}
                        </span>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-foreground truncate mt-2">{c.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Target Role & Seniority */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">2. Target Role & Seniority</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] text-muted-foreground">Role Title</label>
                <input 
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Level</label>
                <select 
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                >
                  <option value="Junior">Junior (0-2 YOE)</option>
                  <option value="Mid-Level">Mid-Level (3-5 YOE)</option>
                  <option value="Senior">Senior (5-8 YOE)</option>
                  <option value="Staff / Principal">Staff / Principal</option>
                  <option value="Executive">Director / VP</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Track Focus & Round Length */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">3. Interview Track & Focus</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRACKS.map(t => {
                const isSel = selectedTrack === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrack(t.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all space-y-1 ${
                      isSel 
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'bg-card border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={isSel ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-[13px] font-bold text-foreground">{t.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Persona & Camera Pre-Flight (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interviewer Persona Selector */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Interviewer Persona</span>
            
            <div className="space-y-2.5">
              {PERSONAS.map(p => {
                const isSel = selectedPersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p)}
                    className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                      isSel 
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                        : 'bg-card border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-secondary">
                      {p.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-foreground">{p.name}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {p.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.tone}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Pre-Flight & Live Test */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hardware Pre-Flight</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                Live Ready
              </span>
            </div>

            {/* Video Box Preview */}
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-border">
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
                  <Camera size={28} className="mx-auto text-slate-500 animate-pulse" />
                  <p className="text-[12px] text-slate-400 font-medium">Camera connects automatically in live room</p>
                </div>
              )}

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[11px] text-white">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {userProfile?.name || 'Candidate Preview'}
                </span>
                <span className="text-[10px] text-slate-300">1080p WebRTC</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/50">
                <Video size={13} className={hasCameraAccess ? 'text-emerald-500' : 'text-slate-400'} />
                <span>Camera Stream</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/50">
                <Mic size={13} className={hasMicAccess ? 'text-emerald-500' : 'text-slate-400'} />
                <span>Voice Recognition</span>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleStart}
            disabled={isLoading || (!isCustomCompany && !selectedCompany)}
            id="start-interview-btn"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[14px] font-bold shadow-lg hover:shadow-indigo-500/25 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Calibrating {selectedCompany?.name || 'Company'} Questions...</span>
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

    </div>
  );
}

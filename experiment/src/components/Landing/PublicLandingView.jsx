import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Zap, 
  Search, Award, Briefcase, GraduationCap, Globe, Users, ExternalLink, ChevronRight, Lock,
  FileText, Check, Bot, Compass, Bookmark, Plus, Layers, Laptop
} from 'lucide-react';
import OpportunityCard from '../OpportunityCard/OpportunityCard.jsx';

const PARTNER_LOGOS = [
  { name: 'Google Jobs', icon: '✦' },
  { name: 'LinkedIn Talent', icon: '◆' },
  { name: 'Greenhouse ATS', icon: '●' },
  { name: 'Lever Direct', icon: '▲' },
  { name: 'DAAD Germany', icon: '★' },
  { name: 'Chevening UK', icon: '✦' },
  { name: 'UN Careers', icon: '🌐' }
];

export default function PublicLandingView({ 
  onOpenAuth, 
  sampleOpportunities = [], 
  onSelectOpportunity, 
  onPrepareKit, 
  onSaveOpportunity,
  isSaved, 
  triggerToast 
}) {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('match');

  // 1. Opportunity Matcher Simulator
  const [matcherQuery, setMatcherQuery] = useState('DAAD Scholarship with English waiver in Germany');
  const [isMatching, setIsMatching] = useState(false);
  const [matchedOpportunity, setMatchedOpportunity] = useState({
    title: 'DAAD Research Fellowship & Master Intake',
    organization: 'German Academic Exchange Service (DAAD)',
    location_country: 'Germany / Europe',
    match_score: 98,
    stipend: '€1,200/mo + Full Tuition Coverage',
    waiver: true,
    discipline: 'Computer Science & Engineering',
    reasons: [
      'Discipline aligns 100% with target criteria',
      'English Medium of Instruction waiver accepted',
      'Direct intake verified with official portal'
    ]
  });

  const PRESET_QUERIES = [
    { label: 'DAAD Scholarships', query: 'DAAD Scholarships with English waiver in Germany', title: 'DAAD Research Fellowship & Master Intake', org: 'DAAD Germany', score: 98, stipend: '€1,200/mo + Full Tuition', waiver: true },
    { label: 'Remote React Engineer', query: 'Remote Senior React Engineer with TypeScript', title: 'Senior Frontend Engineer (Remote)', org: 'Vercel / Ecosystem', score: 96, stipend: '$120,000 - $150,000/yr', waiver: false },
    { label: 'Grab Software Internship', query: 'Software engineering summer internship in KL', title: 'Full Stack Engineering Intern', org: 'Grab Technology', score: 94, stipend: 'RM2,500/mo', waiver: false },
    { label: 'UN Fellowships', query: 'United Nations Young Professionals Fellowship', title: 'UN ICT Specialist Fellowship', org: 'United Nations', score: 92, stipend: 'Fully Funded Stipend', waiver: true }
  ];

  const handleSelectPreset = (item) => {
    setMatcherQuery(item.query);
    setIsMatching(true);
    setTimeout(() => {
      setMatchedOpportunity({
        title: item.title,
        organization: item.org,
        location_country: item.query.includes('Germany') ? 'Germany' : item.query.includes('KL') ? 'Kuala Lumpur, Malaysia' : 'Remote / Global',
        match_score: item.score,
        stipend: item.stipend,
        waiver: item.waiver,
        discipline: 'Software & Technology'
      });
      setIsMatching(false);
    }, 600);
  };

  // 2. AI Copilot Simulator
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotHistory, setCopilotHistory] = useState([
    {
      role: 'assistant',
      text: "Hello! I am **Careerly Copilot**, your strategic Career Advisor. Ask me anything about passing technical interviews, tailoring your ATS score, or discovering European English-waiver scholarships."
    }
  ]);
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  const handleCopilotSend = (textToSend) => {
    const q = textToSend || copilotInput;
    if (!q.trim()) return;

    setCopilotHistory(prev => [...prev, { role: 'user', text: q }]);
    setCopilotInput('');
    setIsCopilotTyping(true);

    setTimeout(() => {
      let reply = "Here is your strategic career recommendation:\n\n1. **Tailor for ATS**: Highlight measurable achievements using the STAR method (e.g. *Reduced latency by 40%*).\n2. **Target High-Match Roles**: Focus on opportunities with a 90%+ match score where your skills and waiver criteria align.\n3. **Prepare Kits**: Generate 1-click tailored cover letters for direct recruiter outreach.";
      
      if (q.toLowerCase().includes('grab') || q.toLowerCase().includes('interview')) {
        reply = "For **Grab & Top Tech Interviews**:\n\n• **Core Focus**: System design, data structures, and production resilience.\n• **STAR Method**: Focus heavily on how you handled scale, edge cases, and cross-team communication.\n• **Pro Tip**: Mention metrics (e.g. *Handled 50k req/s with 99.99% uptime*).";
      } else if (q.toLowerCase().includes('daad') || q.toLowerCase().includes('scholarship') || q.toLowerCase().includes('waiver')) {
        reply = "For **DAAD & European Scholarships**:\n\n• **English Waiver**: Universities accept an official English Medium of Instruction (MOI) letter from your undergraduate institution in place of IELTS.\n• **Key Documents**: Certified degree transcript, 1-page Academic Statement of Purpose, and 2 referee letters.\n• **Match Status**: We have 14 active DAAD programs verified with direct intake portals.";
      }

      setCopilotHistory(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsCopilotTyping(false);
    }, 700);
  };

  // 3. CV ATS Analyzer Simulator
  const [isRewriting, setIsRewriting] = useState(false);
  const [starBefore] = useState('Developed website features and resolved bugs in React frontend.');
  const [starAfter, setStarAfter] = useState('Architected responsive React 19 interface with state isolation, boosting client rendering performance by 42% across 100k+ active users.');

  const handleTriggerRewrite = () => {
    setIsRewriting(true);
    setTimeout(() => {
      setStarAfter('Engineered low-latency React 19 interface with zero memory leaks, slashing TTFB by 42% and driving 99.98% crash-free session reliability.');
      setIsRewriting(false);
    }, 500);
  };

  // 4. STAR Interview Coach Simulator
  const [coachQuestion] = useState('Tell me about a high-stakes technical challenge you solved under a tight deadline.');
  const [coachAnswer, setCoachAnswer] = useState('I investigated a memory leak in our WebSocket gateway by analyzing heap snapshots under production load, identified an unclosed event subscription, and released a hotfix that reduced RAM usage by 40%.');
  const [coachFeedback, setCoachFeedback] = useState({
    overall: 94,
    situation: '9.5 / 10 • Clear context and production stakes established.',
    task: '9.0 / 10 • Concrete technical scope defined.',
    action: '10 / 10 • Exemplary diagnostic steps (heap snapshot memory profiling).',
    result: '9.5 / 10 • Quantifiable impact (-40% RAM usage).'
  });
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluateCoach = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setCoachFeedback({
        overall: 96,
        situation: '10 / 10 • Clear production context and high-stakes timeline.',
        task: '9.5 / 10 • Precise incident responsibility scope.',
        action: '10 / 10 • Strong diagnostic evidence (heap dump analysis, root cause fix).',
        result: '9.5 / 10 • Measurable outcome verified (-40% RAM, zero downtime).'
      });
      setIsEvaluating(false);
    }, 600);
  };

  return (
    <div className="brainwave-bg-canvas" style={{ paddingBottom: '5rem' }}>
      
      {/* 1. HERO SECTION WITH RADIANT LIGHT BEAM */}
      <section style={{
        textAlign: 'center',
        padding: '6.5rem 2rem 3rem',
        maxWidth: '1080px',
        margin: '0 auto',
        position: 'relative'
      }}>
        
        {/* Atmospheric Ambient Glow behind showcase */}
        <div className="brainwave-light-beam" />

        {/* Top Floating Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(31, 228, 119, 0.08)',
          border: '1px solid rgba(31, 228, 119, 0.3)',
          color: '#1FE477',
          padding: '0.4rem 1.15rem',
          borderRadius: '9999px',
          fontSize: '0.82rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: '1.75rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 20px rgba(31, 228, 119, 0.2)',
          position: 'relative',
          zIndex: 2
        }}>
          <Sparkles size={14} color="#1FE477" />
          <span>CAREERLY • PRECISION CAREER DISCOVERY</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
          lineHeight: '1.14',
          fontWeight: '800',
          letterSpacing: '-0.035em',
          fontFamily: "'Space Grotesk', sans-serif",
          color: '#ffffff',
          position: 'relative',
          zIndex: 2,
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          Explore the Possibilities of Career Discovery with{' '}
          <span style={{
            position: 'relative',
            display: 'inline-block',
            background: 'linear-gradient(135deg, #1FE477 0%, #56FF8E 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Careerly
            {/* Neoconda Cyber Mint Curved SVG Underline */}
            <svg style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '8px' }} viewBox="0 0 200 8" fill="none">
              <path d="M1 5.5C40 2 160 2 199 5.5" stroke="url(#curveGrad)" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1FE477" />
                  <stop offset="0.5" stopColor="#56FF8E" />
                  <stop offset="1" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p style={{
          fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
          maxWidth: '720px',
          margin: '1.75rem auto 2.5rem',
          color: 'rgba(203, 213, 225, 0.85)',
          lineHeight: '1.65',
          position: 'relative',
          zIndex: 2
        }}>
          Unleash the power of deterministic 7-factor matching. Calibrate your qualifications against <strong>3,413+ verified global roles</strong>, top scholarships, and direct employer portals with zero fabrication.
        </p>

        {/* Action CTAs */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <button
            onClick={() => onOpenAuth('signup')}
            className="brainwave-btn-glow"
          >
            <span>Get Started Free</span>
            <ArrowRight size={16} className="btn-arrow-icon" />
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="brainwave-btn-outline"
          >
            Sign In to Workspace
          </button>
        </div>

        {/* Value Trust Tags */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap', fontSize: '0.84rem', color: 'rgba(148, 163, 184, 0.8)', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>100% Free for Students & Scholars</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={15} color="#818cf8" />
            <span>Verified Official Ingestion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Globe size={15} color="#38bdf8" />
            <span>35+ Global Locations</span>
          </div>
        </div>

        {/* 2. BRIDGEMIND-STYLE INTERACTIVE APP SIMULATOR SHOWCASE */}
        <div className="brainwave-showcase-container">
          
          {/* Corner Crosshairs */}
          <span className="crosshair-corner crosshair-tl">+</span>
          <span className="crosshair-corner crosshair-tr">+</span>
          <span className="crosshair-corner crosshair-bl">+</span>
          <span className="crosshair-corner crosshair-br">+</span>

          {/* Window Header with Mode Navigation Pills */}
          <div className="brainwave-showcase-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: '0.5rem', fontFamily: 'monospace' }}>
                careerly.app/simulator/{activeShowcaseTab}
              </span>
            </div>

            {/* Interactive Simulator Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(10, 12, 20, 0.8)', padding: '0.25rem', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                className={`showcase-mode-tab ${activeShowcaseTab === 'match' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('match')}
              >
                <Sparkles size={13} />
                <span>Intent Matcher</span>
              </button>
              <button
                className={`showcase-mode-tab ${activeShowcaseTab === 'copilot' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('copilot')}
              >
                <Bot size={13} />
                <span>AI Copilot</span>
              </button>
              <button
                className={`showcase-mode-tab ${activeShowcaseTab === 'cv' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('cv')}
              >
                <FileText size={13} />
                <span>ATS Studio</span>
              </button>
              <button
                className={`showcase-mode-tab ${activeShowcaseTab === 'interview' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('interview')}
              >
                <Compass size={13} />
                <span>STAR Coach</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#10b981' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>Interactive Live Demo</span>
            </div>
          </div>

          {/* Inner Multi-Pane Canvas */}
          <div style={{
            background: 'radial-gradient(ellipse at top, rgba(28, 34, 58, 0.7) 0%, rgba(8, 10, 16, 0.96) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '2.25rem 2rem 3.5rem',
            position: 'relative',
            minHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>

            {/* TAB 1: INTENT MATCHER SIMULATOR */}
            {activeShowcaseTab === 'match' && (
              <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Search Bar with Presets */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    ● 7-Factor Intent Matcher — Live Demo
                  </div>

                  <div className="brainwave-interactive-search" style={{ maxWidth: '100%' }}>
                    <Search size={18} color="#818cf8" />
                    <input
                      type="text"
                      value={matcherQuery}
                      onChange={(e) => setMatcherQuery(e.target.value)}
                      placeholder="Type your dream role, country, or scholarship..."
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '0.92rem',
                        fontWeight: '500',
                        flex: 1,
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSelectPreset({ query: matcherQuery, title: 'Verified Match Result', org: 'Enterprise Employer', score: 95, stipend: 'Competitive Stipend', waiver: true });
                      }}
                    />
                    <button
                      onClick={() => handleSelectPreset({ query: matcherQuery, title: 'Verified Match Result', org: 'Enterprise Employer', score: 95, stipend: 'Competitive Stipend', waiver: true })}
                      className="brainwave-btn-glow"
                      style={{ height: '36px', padding: '0 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
                      disabled={isMatching}
                    >
                      {isMatching ? 'Matching...' : 'Match Intent'}
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginRight: '0.25rem', alignSelf: 'center' }}>Try clicking:</span>
                    {PRESET_QUERIES.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(preset)}
                        className="demo-preset-pill"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Match Result Card */}
                <div style={{
                  background: 'rgba(14, 17, 28, 0.85)',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5), 0 0 25px rgba(124, 58, 237, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#c084fc' }}>{matchedOpportunity.organization}</span>
                        <span style={{ color: '#64748b' }}>•</span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{matchedOpportunity.location_country}</span>
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
                        {matchedOpportunity.title}
                      </h4>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#10b981',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: '800'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      <span>{matchedOpportunity.match_score}% Match</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                    <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {matchedOpportunity.stipend}
                    </span>
                    {matchedOpportunity.waiver && (
                      <span style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        English Waiver Accepted
                      </span>
                    )}
                    <span style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {matchedOpportunity.discipline}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() => onOpenAuth('signup')}
                      className="brainwave-btn-glow"
                      style={{ height: '34px', padding: '0 1.25rem', fontSize: '0.82rem' }}
                    >
                      <Zap size={13} />
                      <span>Prepare 1-Click Kit</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: AI COPILOT CHAT SIMULATOR */}
            {activeShowcaseTab === 'copilot' && (
              <div style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ● 24/7 AI Career Copilot — Live Interactive Chat
                  </div>
                </div>

                {/* Chat Messages Log */}
                <div style={{
                  background: 'rgba(10, 12, 20, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  minHeight: '220px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  {copilotHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem' }}>
                          <Bot size={15} />
                        </div>
                      )}
                      <div style={{
                        background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#f8fafc',
                        padding: '0.65rem 0.95rem',
                        borderRadius: '12px',
                        fontSize: '0.84rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isCopilotTyping && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      <Bot size={14} className="spin" />
                      <span>Copilot is analyzing career strategy...</span>
                    </div>
                  )}
                </div>

                {/* Quick Question Chips */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleCopilotSend('What are the top technical interview questions at Grab?')} className="demo-preset-pill">
                    🎯 Grab Interview Tips
                  </button>
                  <button onClick={() => handleCopilotSend('How does English waiver work for European scholarships?')} className="demo-preset-pill">
                    🎓 English Waiver Guide
                  </button>
                  <button onClick={() => handleCopilotSend('How to tailor my CV for React roles?')} className="demo-preset-pill">
                    📄 ATS Resume Optimization
                  </button>
                </div>

                {/* Input box */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    placeholder="Ask Careerly Copilot a question..."
                    style={{
                      flex: 1,
                      background: 'rgba(14, 17, 28, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      color: '#f8fafc',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCopilotSend(); }}
                  />
                  <button
                    onClick={() => handleCopilotSend()}
                    className="brainwave-btn-glow"
                    style={{ height: '40px', padding: '0 1.25rem', fontSize: '0.84rem' }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ATS CV STUDIO SIMULATOR */}
            {activeShowcaseTab === 'cv' && (
              <div style={{ width: '100%', maxWidth: '740px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ● AI ATS CV Studio & Keyword Audit
                  </div>
                </div>

                <div style={{
                  background: 'rgba(10, 12, 20, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem'
                }}>
                  {/* Left: ATS Score Meter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#94a3b8' }}>ATS Match Score:</span>
                      <strong style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: '900' }}>88 / 100</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '88%', height: '100%', background: 'linear-gradient(90deg, #10b981, #38bdf8)' }} />
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ color: '#10b981' }}>✓ Action Verbs: Strong (STAR structure)</div>
                      <div style={{ color: '#10b981' }}>✓ Hard Skills: React 19, TypeScript, Node.js</div>
                      <div style={{ color: '#f59e0b' }}>⚠ Missing Keyword: SSRF Defense, CI/CD Pipeline</div>
                    </div>
                  </div>

                  {/* Right: 1-Click STAR Bullet Rewriter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#c084fc' }}>STAR Bullet Optimization:</span>
                      <button
                        onClick={handleTriggerRewrite}
                        className="demo-preset-pill"
                        style={{ fontSize: '0.72rem' }}
                        disabled={isRewriting}
                      >
                        {isRewriting ? 'Rewriting...' : '✦ Re-generate STAR'}
                      </button>
                    </div>

                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.76rem', color: '#fca5a5' }}>
                      <strong>Before:</strong> {starBefore}
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#6ee7b7' }}>
                      <strong>STAR Tailored:</strong> {starAfter}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => onOpenAuth('signup')} className="brainwave-btn-glow" style={{ height: '38px', padding: '0 1.5rem', fontSize: '0.85rem' }}>
                    Upload & Audit Your Full CV Now
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: STAR MOCK INTERVIEW COACH SIMULATOR */}
            {activeShowcaseTab === 'interview' && (
              <div style={{ width: '100%', maxWidth: '740px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ● AI Mock Interview Coach (STAR Simulation)
                  </div>
                </div>

                <div style={{
                  background: 'rgba(10, 12, 20, 0.85)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {/* Interview Question */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.25)', padding: '0.65rem 1rem', borderRadius: '10px' }}>
                    <Bot size={16} color="#c084fc" />
                    <span style={{ fontSize: '0.86rem', fontWeight: '700', color: '#f8fafc' }}>
                      "{coachQuestion}"
                    </span>
                  </div>

                  {/* Answer Text Area */}
                  <div>
                    <textarea
                      value={coachAnswer}
                      onChange={(e) => setCoachAnswer(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'rgba(14, 17, 28, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '0.84rem',
                        lineHeight: '1.5',
                        outline: 'none',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {/* Feedback Breakdown */}
                  {coachFeedback && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}><strong style={{ color: '#c084fc' }}>Situation:</strong> {coachFeedback.situation}</div>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}><strong style={{ color: '#38bdf8' }}>Task:</strong> {coachFeedback.task}</div>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}><strong style={{ color: '#10b981' }}>Action:</strong> {coachFeedback.action}</div>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}><strong style={{ color: '#f59e0b' }}>Result:</strong> {coachFeedback.result}</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981' }}>
                      STAR Readiness: {coachFeedback?.overall || 94} / 100
                    </span>
                    <button
                      onClick={handleEvaluateCoach}
                      className="brainwave-btn-glow"
                      style={{ height: '36px', padding: '0 1.25rem', fontSize: '0.82rem' }}
                      disabled={isEvaluating}
                    >
                      {isEvaluating ? 'Evaluating...' : '✦ Re-evaluate STAR'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Bottom Left Controls (Interactive Switchers) */}
            <div className="brainwave-floating-controls">
              <button
                className={`brainwave-control-btn ${activeShowcaseTab === 'match' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('match')}
                title="7-Factor Matcher"
              >
                <Compass size={17} />
              </button>
              <button
                className={`brainwave-control-btn ${activeShowcaseTab === 'copilot' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('copilot')}
                title="AI Career Copilot"
              >
                <Bot size={17} />
              </button>
              <button
                className={`brainwave-control-btn ${activeShowcaseTab === 'cv' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('cv')}
                title="AI CV Studio"
              >
                <FileText size={17} />
              </button>
              <button
                className={`brainwave-control-btn ${activeShowcaseTab === 'interview' ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab('interview')}
                title="STAR Interview Coach"
              >
                <Bookmark size={17} />
              </button>
            </div>

          </div>

          {/* Social Proof Brand Logo Strip */}
          <div className="brainwave-logo-strip">
            {PARTNER_LOGOS.map((partner, idx) => (
              <div key={idx} className="brainwave-logo-item">
                <span style={{ color: '#a855f7' }}>{partner.icon}</span>
                <span>{partner.name}</span>
              </div>
            ))}
          </div>

        </div>

      </section>

      {/* 3. BRAINWAVE 3-COLUMN FEATURE MATRIX */}
      <section id="features-section" style={{ maxWidth: '1200px', margin: '4rem auto 0', padding: '0 1.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a855f7' }}>
            ● Engineered for Serious Candidates
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800', color: '#f8fafc', marginTop: '0.5rem' }}>
            Everything You Need to Land Your Next Role
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          
          {/* Card 1: 7-Factor Matching */}
          <div className="brainwave-feature-card">
            <span className="crosshair-corner crosshair-tl">+</span>
            <span className="crosshair-corner crosshair-tr">+</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(124, 58, 237, 0.4)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                Deterministic 7-Factor Engine
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.6' }}>
              Mathematical ranking based on your exact GPA, academic discipline, English waiver eligibility, and location preferences.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon"><Check size={12} /></div>
                <span>Zero synthetic or hallucinated vacancies</span>
              </div>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon"><Check size={12} /></div>
                <span>Automated English waiver compatibility verification</span>
              </div>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon"><Check size={12} /></div>
                <span>Transparent scoring weights and qualification breakdowns</span>
              </div>
            </div>
          </div>

          {/* Card 2: AI Application Kit */}
          <div className="brainwave-feature-card">
            <span className="crosshair-corner crosshair-tl">+</span>
            <span className="crosshair-corner crosshair-tr">+</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                AI Application Prep Kits
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.6' }}>
              Prepare custom STAR-tailored cover letters, keyword audits, and recruiter outreach emails calibrated to each verified vacancy.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}><Check size={12} /></div>
                <span>1-Click custom ATS cover letters & elevator pitches</span>
              </div>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}><Check size={12} /></div>
                <span>Instant PDF CV parsing & keyword gap analysis</span>
              </div>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}><Check size={12} /></div>
                <span>STAR method behavioral mock interview simulations</span>
              </div>
            </div>
          </div>

          {/* Card 3: Continuous Ingestion */}
          <div className="brainwave-feature-card">
            <span className="crosshair-corner crosshair-tl">+</span>
            <span className="crosshair-corner crosshair-tr">+</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                48+ Continuous Scraper Feeds
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.6' }}>
              Direct ingestion from enterprise Greenhouse & Lever ATS boards, Google Jobs, DAAD scholarships, and government portals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}><Check size={12} /></div>
                <span>3,413+ actively verified global opportunities</span>
              </div>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}><Check size={12} /></div>
                <span>Automatic dead-link purging & live verification</span>
              </div>
              <div className="brainwave-check-bullet">
                <div className="brainwave-check-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}><Check size={12} /></div>
                <span>Real-time stipend, salary, and deadline tracking</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 4. LIVE VERIFIED OPPORTUNITIES INDEX */}
      <section style={{ maxWidth: '1280px', margin: '5rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a855f7' }}>
              ● Live Platform Index
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#f8fafc', marginTop: '0.35rem' }}>
              Recently Indexed Global Opportunities
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Real opportunities directly from Greenhouse, Lever, UN Careers, DAAD, and Google Jobs.
            </p>
          </div>

          <button
            onClick={() => onOpenAuth('signup')}
            className="brainwave-btn-glow"
            style={{ fontSize: '0.88rem', padding: '0.65rem 1.35rem' }}
          >
            <span>Unlock Full Catalog (3,413+)</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {sampleOpportunities && sampleOpportunities.length > 0 ? (
          <div className="responsive-grid-3col">
            {sampleOpportunities.slice(0, 6).map((opp, idx) => (
              <OpportunityCard
                key={opp.id || idx}
                opportunity={opp}
                index={idx}
                onSelectOp={(o) => onSelectOpportunity(o)}
                onPrepareApplication={(o) => onPrepareKit(o)}
                onToggleSave={(id) => onSaveOpportunity(id)}
                isSaved={isSaved ? isSaved(opp.id) : false}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(18, 21, 34, 0.8)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Sparkles size={32} color="#a855f7" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Loading verified opportunities pool...</h3>
          </div>
        )}
      </section>

      {/* 5. BOTTOM FUTURISTIC VALUE CTA */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto 0', padding: '0 1.5rem' }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(24, 28, 48, 0.9) 0%, rgba(10, 12, 22, 0.95) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.35)',
          borderRadius: '28px',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(124, 58, 237, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <span className="crosshair-corner crosshair-tl">+</span>
          <span className="crosshair-corner crosshair-tr">+</span>
          <span className="crosshair-corner crosshair-bl">+</span>
          <span className="crosshair-corner crosshair-br">+</span>

          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Ready to Discover Your Next Career Move?
          </h2>
          <p style={{ maxWidth: '640px', margin: '0 auto 2.25rem', color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Join thousands of scholars and engineers finding verified roles, internships, and scholarships worldwide with deterministic precision.
          </p>

          <button
            onClick={() => onOpenAuth('signup')}
            className="brainwave-btn-glow"
            style={{ fontSize: '1.05rem', padding: '0.95rem 2.5rem' }}
          >
            <span>Create Your Free Account Now</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

    </div>
  );
}

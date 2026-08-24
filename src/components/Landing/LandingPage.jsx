import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Target, 
  FileText, 
  Send, 
  MessageSquare, 
  Trophy, 
  Search, 
  Bookmark, 
  Calendar, 
  User, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Layers, 
  Cpu 
} from 'lucide-react';
import MatchRing from '../ui/MatchRing';

// --- Static Data Definitions for Interactive Showcases ---
const ECO_TOOLS = [
  { id: 'discovery', label: 'Discovery', icon: Compass, badge: '50K+ Active' },
  { id: 'saved', label: 'Saved', icon: Bookmark, badge: '4 Items' },
  { id: 'pipeline', label: 'Pipeline', icon: Layers, badge: 'Active CRM' },
  { id: 'cv-studio', label: 'CV Studio', icon: FileText, badge: 'ATS 94%' },
  { id: 'coach', label: 'AI Coach', icon: MessageSquare, badge: 'Live Prep' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, badge: 'Deadlines' },
  { id: 'profile', label: 'Profile', icon: User, badge: 'Calibrated' }
];

const SAMPLE_OPPS = [
  { id: 1, title: 'Product Designer', company: 'Stripe', initial: 'S', color: '#635BFF', match: 94, location: 'San Francisco, CA', mode: 'Hybrid', salary: '$140K – $180K', type: 'Job', tags: ['Figma', 'Design Systems', 'Prototyping'] },
  { id: 2, title: 'Senior Frontend Engineer', company: 'Linear', initial: 'L', color: '#5E6AD2', match: 89, location: 'Remote', mode: 'Remote', salary: '$160K – $220K', type: 'Job', tags: ['TypeScript', 'React', 'GraphQL'] },
  { id: 3, title: 'UX Research Intern', company: 'Google', initial: 'G', color: '#4285F4', match: 84, location: 'New York, NY', mode: 'Hybrid', salary: '$8,500/mo', type: 'Internship', tags: ['User Research', 'Usability Testing'] },
  { id: 4, title: 'Chevening Scholarship', company: 'UK Government', initial: 'C', color: '#003087', match: 78, location: 'London, UK', mode: 'Full-time', salary: 'Fully Funded', type: 'Scholarship', tags: ['Leadership', 'Academic Merit'] },
  { id: 5, title: 'AI Safety Research Fellow', company: 'DeepMind', initial: 'D', color: '#4A4FE4', match: 91, location: 'London, UK', mode: 'Onsite', salary: '£75,000/yr', type: 'Fellowship', tags: ['LLMs', 'Alignment', 'Python'] }
];

const JOURNEY_STEPS = [
  { id: 'discover', title: '1. Discover', label: 'Discover Opportunities', icon: Compass, color: '#2457FF', stat: '50K+ Roles', desc: 'Continuous multi-source intelligence scans 50,000+ verified corporate, scholarship, and government portals worldwide.' },
  { id: 'match', title: '2. Match', label: 'Semantic Fit Scoring', icon: Target, color: '#4F7CFF', stat: '94% Accuracy', desc: 'Precision algorithms evaluate qualification criteria, missing skills, and GPA thresholds to give you instant match confidence.' },
  { id: 'prepare', title: '3. Prepare CV', label: 'ATS Resume Tailoring', icon: FileText, color: '#7C3AED', stat: '3x Callbacks', desc: 'Section-by-section AI keyword alignment rewrites qualifications to match applicant tracking parser metrics perfectly.' },
  { id: 'apply', title: '4. Apply', label: 'Multi-Stage Pipeline', icon: Send, color: '#0891B2', stat: 'One-Click Tracking', desc: 'Unified CRM organizes submissions, application cutoffs, and required supplemental documents across all platforms.' },
  { id: 'interview', title: '5. Interview', label: 'Simulated Coaching', icon: MessageSquare, color: '#7C3AED', stat: '9/10 Confidence', desc: 'Interactive AI simulation asks targeted domain questions and delivers real-time constructive delivery feedback.' },
  { id: 'offer', title: '6. Offer', label: 'Accept & Negotiate', icon: Trophy, color: '#18A66A', stat: '2.4x Higher Value', desc: 'Structured compensation comparison tools and deadline reminders help you evaluate and finalize your optimal decision.' }
];

const COACH_CONVERSATION = [
  { sender: 'coach', text: 'Tell me about a time you led a cross-functional project under a tight deadline.' },
  { sender: 'candidate', text: 'At my previous role, I led 4 engineers and 2 designers to ship a checkout redesign in 3 weeks. We reduced abandonment by 23%.' },
  { sender: 'coach', text: 'Strong structured STAR response. You quantified the specific business outcome clearly. Rating: 9/10.' }
];

export default function LandingPage({ onExplorePlatform, onOpenAuth }) {
  const [activeEcoTool, setActiveEcoTool] = useState('discovery');
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pipelineStage, setPipelineStage] = useState(1); // 0=Saved, 1=Preparing, 2=Applied, 3=Interview, 4=Offer
  const [savedOpps, setSavedOpps] = useState([1, 2, 4]);

  const toggleSave = (id) => {
    setSavedOpps(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // Filtered opportunities for discovery simulation
  const filteredOpps = SAMPLE_OPPS.filter(o => {
    const matchesCat = selectedCategory === 'all' || o.type.toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery = !discoveryQuery.trim() || 
      o.title.toLowerCase().includes(discoveryQuery.toLowerCase()) || 
      o.company.toLowerCase().includes(discoveryQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper-bg)', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ====================================================================
          1. HEADER / NAVIGATION
          ==================================================================== */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        background: 'rgba(248, 247, 243, 0.92)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid var(--color-paper-border)',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo Mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'var(--color-primary)', 
              color: '#FFFFFF', 
              fontWeight: '700', 
              fontSize: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontFamily: 'var(--careerly-font-display)'
            }}>
              C
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--careerly-font-display)', fontWeight: '700', fontSize: '18px', lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                Careerly
              </span>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--careerly-font-mono)', color: 'var(--color-primary)', fontWeight: '600', letterSpacing: '0.04em' }}>
                INDEX v4.2
              </span>
            </div>
          </div>

          {/* Center Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="no-scrollbar">
            <a href="#ecosystem" style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color var(--transition-fast)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              Ecosystem
            </a>
            <a href="#discovery" style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color var(--transition-fast)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              Discovery
            </a>
            <a href="#pipeline" style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color var(--transition-fast)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              Pipeline
            </a>
            <a href="#cv-coach" style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color var(--transition-fast)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              CV & Coach
            </a>
            <a href="#journey" style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color var(--transition-fast)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              Journey
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={onOpenAuth}
              className="btn-secondary-white" 
              style={{ padding: '7px 14px', fontSize: '13px' }}
            >
              Sign In
            </button>
            <button 
              onClick={onExplorePlatform}
              className="btn-primary-blue" 
              style={{ padding: '7px 16px', fontSize: '13px' }}
            >
              <span>Explore Platform</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </header>

      {/* ====================================================================
          2. HERO SECTION (Dark Editorial Command Center Atmosphere)
          ==================================================================== */}
      <section style={{ 
        background: 'linear-gradient(180deg, var(--color-primary-midnight) 0%, var(--color-primary-deep) 100%)', 
        color: '#FFFFFF', 
        padding: '72px 24px 84px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Ambient Radial Lighting */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(circle, rgba(36, 87, 255, 0.18) 0%, rgba(6, 17, 38, 0) 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10, textAlign: 'center' }}>
          
          {/* Tag Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(36, 87, 255, 0.15)', border: '1px solid rgba(79, 124, 255, 0.35)', color: '#8EB4FF', fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '24px' }}>
            <Sparkles size={13} color="#8EB4FF" />
            <span>Intelligent Career Operating System</span>
          </div>

          {/* Main Editorial Headline */}
          <h1 style={{ 
            fontFamily: 'var(--careerly-font-display)', 
            fontSize: 'clamp(2.4rem, 5.2vw, 4.2rem)', 
            fontWeight: '700', 
            lineHeight: 1.12, 
            letterSpacing: '-0.03em', 
            maxWidth: '960px', 
            margin: '0 auto 20px',
            color: '#FFFFFF'
          }}>
            Your entire career journey, <span style={{ color: '#6898FF', fontStyle: 'italic' }}>intelligently managed.</span>
          </h1>

          {/* Subtitle */}
          <p style={{ 
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', 
            lineHeight: 1.6, 
            color: 'var(--color-text-muted-light)', 
            maxWidth: '740px', 
            margin: '0 auto 36px' 
          }}>
            Discover 50,000+ verified opportunities, match against exact requirements with precision AI scoring, tailor ATS resumes, practice with an AI interview coach, and navigate smoothly to the offer.
          </p>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button 
              onClick={onExplorePlatform}
              className="btn-primary-blue btn-pill" 
              style={{ padding: '13px 28px', fontSize: '15px' }}
            >
              <span>Launch Careerly Command Center</span>
              <ArrowRight size={16} />
            </button>
            <a 
              href="#discovery"
              className="btn-secondary-white btn-pill" 
              style={{ padding: '13px 24px', fontSize: '15px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <span>Search 50K+ Opportunities</span>
            </a>
          </div>

          {/* Progression Strip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 33, 61, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', fontFamily: 'var(--careerly-font-mono)', color: 'var(--color-text-muted-light)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontWeight: '600' }}>DISCOVER</span>
            <span>→</span>
            <span style={{ color: '#8EB4FF', fontWeight: '600' }}>MATCH</span>
            <span>→</span>
            <span style={{ color: '#FFFFFF', fontWeight: '600' }}>PREPARE</span>
            <span>→</span>
            <span style={{ color: '#8EB4FF', fontWeight: '600' }}>APPLY</span>
            <span>→</span>
            <span style={{ color: '#FFFFFF', fontWeight: '600' }}>INTERVIEW</span>
            <span>→</span>
            <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>OFFER</span>
          </div>

        </div>
      </section>

      {/* ====================================================================
          3. INTERACTIVE 7-TOOL ECOSYSTEM SHOWCASE
          ==================================================================== */}
      <section id="ecosystem" style={{ padding: '80px 24px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="tag-badge tag-badge-blue" style={{ marginBottom: '10px' }}>
            Unified Ecosystem
          </div>
          <h2 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: '2.4rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
            Seven Connected Tools. One Seamless Platform.
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '8px auto 0' }}>
            Click any module below to explore how Careerly coordinates your entire job search workflow.
          </p>
        </div>

        {/* Ecosystem Nav Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', justifyContent: 'center' }} className="no-scrollbar">
          {ECO_TOOLS.map(tool => {
            const Icon = tool.icon;
            const isActive = activeEcoTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveEcoTool(tool.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-paper-surface)',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-main)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-paper-border)',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isActive ? '0 4px 12px rgba(36, 87, 255, 0.25)' : 'var(--shadow-sm)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                <span>{tool.label}</span>
                <span style={{
                  fontSize: '10.5px',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-primary-ice)',
                  color: isActive ? '#FFFFFF' : 'var(--color-primary)',
                  fontWeight: '700'
                }}>
                  {tool.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Morphing Product Preview Window */}
        <div className="card-editorial" style={{ minHeight: '420px', padding: '28px', background: 'var(--color-paper-surface)' }}>
          {activeEcoTool === 'discovery' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {SAMPLE_OPPS.slice(0, 3).map(opp => (
                <div key={opp.id} style={{ border: '1px solid var(--color-paper-border)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--color-paper-bg)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: opp.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                        {opp.initial}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-text-main)' }}>{opp.company}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{opp.location}</div>
                      </div>
                    </div>
                    <MatchRing score={opp.match} size={38} />
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-text-main)' }}>{opp.title}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="tag-badge tag-badge-blue">{opp.type}</span>
                    <span className="tag-badge tag-badge-amber">{opp.salary}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeEcoTool === 'saved' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-paper-border)', paddingBottom: '12px' }}>
                <span style={{ fontWeight: '700', fontSize: '14px' }}>Saved Career Opportunities (4)</span>
                <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>Batch Export to CRM →</span>
              </div>
              {SAMPLE_OPPS.slice(0, 3).map(opp => (
                <div key={opp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--color-paper-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bookmark size={16} fill="var(--color-primary)" color="var(--color-primary)" />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>{opp.title} — {opp.company}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>{opp.location} • {opp.salary}</div>
                    </div>
                  </div>
                  <MatchRing score={opp.match} size={36} />
                </div>
              ))}
            </div>
          )}

          {activeEcoTool === 'pipeline' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', overflowX: 'auto' }}>
              {['Saved', 'Preparing', 'Applied', 'Interview', 'Offer'].map((col, idx) => (
                <div key={col} style={{ background: 'var(--color-paper-bg)', border: '1px solid var(--color-paper-border)', borderRadius: 'var(--radius-sm)', padding: '12px', minWidth: '150px' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {col}
                  </div>
                  {idx === 1 && (
                    <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-primary-soft)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>Stripe</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Product Designer</div>
                      <div className="tag-badge tag-badge-blue" style={{ marginTop: '6px', fontSize: '10px' }}>94% Match</div>
                    </div>
                  )}
                  {idx === 3 && (
                    <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-paper-border)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>Linear</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Frontend Engineer</div>
                      <div className="tag-badge tag-badge-amber" style={{ marginTop: '6px', fontSize: '10px' }}>Round 2 Due</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeEcoTool === 'cv-studio' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--color-paper-bg)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Target Opportunity: Stripe Product Designer</div>
                <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--color-text-main)' }}>
                  <strong>Key Alignment:</strong> Led cross-functional design system initiative reducing component redundancy by 35%. Implemented strict accessibility tokens across web & mobile.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'var(--careerly-font-mono)', color: 'var(--color-primary)' }}>
                    87 → 94%
                  </div>
                  <span className="tag-badge tag-badge-emerald">ATS Optimised</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  +4 keywords added matching Stripe's job spec: "Design Systems", "Prototyping", "User Research", and "Interaction Design".
                </p>
              </div>
            </div>
          )}

          {activeEcoTool === 'coach' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {COACH_CONVERSATION.map((msg, i) => (
                <div 
                  key={i} 
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: 'var(--radius-md)', 
                    background: msg.sender === 'coach' ? 'var(--color-primary-ice)' : '#FFFFFF',
                    border: msg.sender === 'coach' ? '1px solid var(--color-primary-soft)' : '1px solid var(--color-paper-border)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    maxWidth: '85%',
                    alignSelf: msg.sender === 'coach' ? 'flex-start' : 'flex-end'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '11px', color: msg.sender === 'coach' ? 'var(--color-primary)' : 'var(--color-text-secondary)', marginBottom: '3px' }}>
                    {msg.sender === 'coach' ? 'AI Career Coach' : 'Candidate Response'}
                  </strong>
                  {msg.text}
                </div>
              ))}
            </div>
          )}

          {activeEcoTool === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Upcoming Verified Cutoff Deadlines</div>
              {[
                { title: 'Chevening UK Scholarship Application Deadline', date: 'Nov 5, 2026', type: 'Scholarship', tag: 'High Priority' },
                { title: 'Google Summer UX Research Internship', date: 'Dec 15, 2026', type: 'Internship', tag: 'Rolling' },
                { title: 'Linear Senior Frontend Technical Interview', date: 'Dec 20, 2026', type: 'Interview', tag: 'Confirmed' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-paper-bg)', border: '1px solid var(--color-paper-border)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13.5px' }}>{item.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Category: {item.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="tag-badge tag-badge-amber">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeEcoTool === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--color-paper-bg)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Academic Calibration</div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>Bachelor of Arts (BA)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Major: Advertising & Marketing • GPA: 3.85</div>
              </div>
              <div style={{ background: 'var(--color-paper-bg)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Language Waiver Status</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-success)', marginTop: '4px' }}>No IELTS Preferred (MOI Active)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Automatically filters non-IELTS criteria</div>
              </div>
              <div style={{ background: 'var(--color-paper-bg)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Target Geographic Scope</div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>Global, Europe, US, UK</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>50,000+ indexed opportunities matched</div>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* ====================================================================
          4. INTERACTIVE DISCOVERY SHOWCASE
          ==================================================================== */}
      <section id="discovery" style={{ padding: '80px 24px', background: 'var(--color-paper-surface)', borderTop: '1px solid var(--color-paper-border)', borderBottom: '1px solid var(--color-paper-border)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div className="tag-badge tag-badge-blue" style={{ marginBottom: '10px' }}>
              Intelligence Registry
            </div>
            <h2 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: '2.4rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Real-Time Opportunity Discovery Engine
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '8px auto 0' }}>
              Live verified student opportunities categorized and scored against your exact qualifications.
            </p>
          </div>

          {/* Interactive Search & Filter Toolbar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '460px' }}>
              <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-editorial"
                value={discoveryQuery}
                onChange={(e) => setDiscoveryQuery(e.target.value)}
                placeholder="Search by title, organization, or domain..."
                style={{ paddingLeft: '38px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'job', 'internship', 'scholarship', 'fellowship'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-paper-bg)',
                    color: selectedCategory === cat ? '#FFFFFF' : 'var(--color-text-main)',
                    border: selectedCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-paper-border)',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat === 'all' ? 'All Types' : `${cat}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Dynamic Opportunity Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {filteredOpps.map(opp => {
              const isSaved = savedOpps.includes(opp.id);
              return (
                <div 
                  key={opp.id} 
                  className="card-editorial" 
                  style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer', position: 'relative' }}
                  onClick={onExplorePlatform}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: opp.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px' }}>
                        {opp.initial}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--color-text-main)' }}>{opp.company}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={11} />
                          <span>{opp.location} • {opp.mode}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave(opp.id); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: isSaved ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
                    >
                      <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-main)', lineHeight: 1.3 }}>
                    {opp.title}
                  </h3>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="tag-badge tag-badge-blue">{opp.type}</span>
                    <span className="tag-badge tag-badge-amber">{opp.salary}</span>
                    {opp.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="tag-badge tag-badge-paper">{t}</span>
                    ))}
                  </div>

                  {/* Card Footer with Match Ring */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--color-paper-border)', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-success)', fontWeight: '600' }}>
                      <CheckCircle2 size={14} />
                      <span>Verified Portal</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Fit:</span>
                      <MatchRing score={opp.match} size={36} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ====================================================================
          5. INTERACTIVE PIPELINE KANBAN SECTION
          ==================================================================== */}
      <section id="pipeline" style={{ padding: '80px 24px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="tag-badge tag-badge-blue" style={{ marginBottom: '10px' }}>
            Application CRM
          </div>
          <h2 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: '2.4rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
            Track Every Stage from Preparation to Offer
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '620px', margin: '8px auto 0' }}>
            Interactive stage progression with automated deadline alerts and interview scheduling.
          </p>
        </div>

        {/* Dynamic Progression Demonstration */}
        <div className="card-editorial" style={{ padding: '24px', background: 'var(--color-paper-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-main)' }}>Featured Application: Stripe Product Designer</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Use controls on the right to advance through the recruitment funnel.</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPipelineStage(prev => Math.max(0, prev - 1))}
                disabled={pipelineStage === 0}
                className="btn-secondary-white"
                style={{ padding: '6px 12px', fontSize: '12px', opacity: pipelineStage === 0 ? 0.4 : 1 }}
              >
                <ChevronLeft size={14} />
                <span>Previous Stage</span>
              </button>
              <button
                onClick={() => setPipelineStage(prev => Math.min(4, prev + 1))}
                disabled={pipelineStage === 4}
                className="btn-primary-blue"
                style={{ padding: '6px 14px', fontSize: '12px', opacity: pipelineStage === 4 ? 0.4 : 1 }}
              >
                <span>Advance Stage</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Kanban Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gap: '12px', overflowX: 'auto' }}>
            {['Saved', 'Preparing', 'Applied', 'Interview', 'Offer'].map((colName, idx) => {
              const isCurrent = pipelineStage === idx;
              return (
                <div 
                  key={colName}
                  style={{
                    background: isCurrent ? 'var(--color-primary-ice)' : 'var(--color-paper-bg)',
                    border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-paper-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    minHeight: '220px',
                    transition: 'all var(--transition-base)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                      {colName}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: 'var(--radius-xs)', background: isCurrent ? 'var(--color-primary)' : 'var(--color-paper-border)', color: isCurrent ? '#fff' : 'var(--color-text-secondary)' }}>
                      {isCurrent ? '1 Active' : '0'}
                    </span>
                  </div>

                  {isCurrent && (
                    <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)', boxShadow: 'var(--shadow-md)' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>Stripe</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Product Designer</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px' }}>
                        <span className="tag-badge tag-badge-blue">94% Fit</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{colName === 'Offer' ? 'Accepted!' : 'On Track'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. SPLIT CV STUDIO & INTERVIEW COACH SECTION
          ==================================================================== */}
      <section id="cv-coach" style={{ padding: '80px 24px', background: 'var(--color-paper-surface)', borderTop: '1px solid var(--color-paper-border)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="tag-badge tag-badge-blue" style={{ marginBottom: '10px' }}>
              Preparation Suite
            </div>
            <h2 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: '2.4rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Tailored Resume Studio & AI Mock Interview Coach
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '8px auto 0' }}>
              Two connected intelligence tools that guarantee you pass ATS scanners and ace technical interviews.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
            
            {/* Left: CV Studio */}
            <div className="card-editorial" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: '700', fontSize: '16px' }}>CV Studio ATS Optimizer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Score:</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-success)', fontFamily: 'var(--careerly-font-mono)' }}>94 / 100</span>
                </div>
              </div>

              <div style={{ background: 'var(--color-paper-bg)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)', fontSize: '13px', lineHeight: 1.6 }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                  Selected Section: Professional Experience
                </div>
                <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-xs)', borderLeft: '3px solid var(--color-primary)', marginTop: '6px' }}>
                  "Engineered responsive UI components in React and coordinated end-to-end design token synchronization with engineering stakeholders across 4 time zones."
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary-ice)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary-soft)', fontSize: '12.5px', color: 'var(--color-primary)' }}>
                <CheckCircle2 size={16} />
                <span>+4 ATS Keywords Added: "Design Systems", "Prototyping", "Figma Tokens", "Micro-Interactions".</span>
              </div>
            </div>

            {/* Right: AI Coach */}
            <div className="card-editorial" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: '700', fontSize: '16px' }}>AI Mock Interview Coach</span>
                </div>
                <span className="tag-badge tag-badge-emerald">Live Simulation</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--color-paper-bg)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-border)' }}>
                <div style={{ background: 'var(--color-primary-ice)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', border: '1px solid var(--color-primary-soft)' }}>
                  <strong style={{ display: 'block', fontSize: '11px', color: 'var(--color-primary)' }}>Interviewer Question:</strong>
                  How do you evaluate trade-offs between speed of execution and design consistency?
                </div>

                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', border: '1px solid var(--color-paper-border)', alignSelf: 'flex-end', maxWidth: '90%' }}>
                  <strong style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Your Answer:</strong>
                  I establish foundational design tokens early to accelerate rapid prototyping while maintaining strict semantic hierarchy.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-success)', fontWeight: '600', marginTop: '4px' }}>
                  <span>AI Feedback: Clarity & Technical Depth</span>
                  <span>Confidence Rating: 9.2 / 10</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ====================================================================
          7. INTERACTIVE 6-STAGE JOURNEY TIMELINE
          ==================================================================== */}
      <section id="journey" style={{ padding: '80px 24px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="tag-badge tag-badge-blue" style={{ marginBottom: '10px' }}>
            Structured Progression
          </div>
          <h2 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: '2.4rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
            The 6-Step Career Execution Journey
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '620px', margin: '8px auto 0' }}>
            Click any step to inspect the underlying intelligence pipeline.
          </p>
        </div>

        {/* Step Selector Ribbon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', marginBottom: '24px' }}>
          {JOURNEY_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeJourneyStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveJourneyStep(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-paper-surface)',
                  color: isSelected ? '#FFFFFF' : 'var(--color-text-main)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-paper-border)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={16} />
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Step Detail Panel */}
        <div className="card-editorial" style={{ padding: '32px', background: 'var(--color-paper-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ maxWidth: '640px' }}>
            <span className="tag-badge tag-badge-blue" style={{ marginBottom: '8px' }}>
              {JOURNEY_STEPS[activeJourneyStep].stat}
            </span>
            <h3 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-text-main)', margin: '4px 0 10px' }}>
              {JOURNEY_STEPS[activeJourneyStep].label}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {JOURNEY_STEPS[activeJourneyStep].desc}
            </p>
          </div>

          <button 
            onClick={onExplorePlatform}
            className="btn-primary-blue btn-pill" 
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            <span>Experience Step in App</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ====================================================================
          8. TESTIMONIALS & OUTCOME BADGES
          ==================================================================== */}
      <section style={{ padding: '80px 24px', background: 'var(--color-paper-surface)', borderTop: '1px solid var(--color-paper-border)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="tag-badge tag-badge-emerald" style={{ marginBottom: '10px' }}>
              Proven Outcomes
            </div>
            <h2 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: '2.4rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Real Candidates. Verified Career Results.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {[
              { quote: "Careerly's match scoring diagnosed exactly why my resume wasn't passing applicant tracking filters. After tailoring with CV Studio, I secured 4 interviews in 3 weeks.", name: "Sarah Mitchell", role: "Product Manager @ Atlassian", outcome: "4 Offers in 5 Weeks", initial: "SM" },
              { quote: "The Mock Coach simulated the exact system architecture questions asked in my Linear interview. I walked into the final loop feeling completely prepared.", name: "James Adeyemi", role: "Senior Frontend Engineer", outcome: "Dream Job in 8 Weeks", initial: "JA" },
              { quote: "Discovered the Chevening UK Scholarship through the international directory. Today I am studying in London on a full government fellowship.", name: "Priya Nair", role: "LSE Postgraduate Fellow", outcome: "Full Scholarship Secured", initial: "PN" }
            ].map((test, i) => (
              <div key={i} className="card-editorial" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--color-paper-bg)' }}>
                <span className="tag-badge tag-badge-emerald" style={{ width: 'fit-content' }}>
                  {test.outcome}
                </span>
                <p style={{ fontSize: '13.5px', color: 'var(--color-text-main)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{test.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--color-paper-border)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                    {test.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)' }}>{test.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>{test.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ====================================================================
          9. STRIKING DARK MIDNIGHT CTA BANNER
          ==================================================================== */}
      <section style={{ 
        background: 'linear-gradient(180deg, var(--color-primary-deep) 0%, var(--color-primary-midnight) 100%)', 
        color: '#FFFFFF', 
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontFamily: 'var(--careerly-font-display)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Your career, intelligently managed.
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted-light)', maxWidth: '600px', margin: '0 auto 36px', lineHeight: 1.6 }}>
            Join ambitious candidates discovering scholarships, global fellowships, and industry internships worldwide.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button 
              onClick={onExplorePlatform}
              className="btn-primary-blue btn-pill" 
              style={{ padding: '14px 32px', fontSize: '15px' }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={onExplorePlatform}
              className="btn-secondary-white btn-pill" 
              style={{ padding: '14px 28px', fontSize: '15px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              Browse Opportunities
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. FOOTER
          ==================================================================== */}
      <footer style={{ background: 'var(--color-primary-midnight)', color: 'var(--color-text-muted-light)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px 24px', fontSize: '12.5px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-xs)', background: 'var(--color-primary)', color: '#fff', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              C
            </div>
            <span style={{ fontWeight: '600', color: '#FFFFFF' }}>Careerly Intelligence Platform</span>
            <span>•</span>
            <span>© 2026 All Rights Reserved</span>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#discovery" style={{ color: 'var(--color-text-muted-light)', textDecoration: 'none' }}>Registry</a>
            <a href="#pipeline" style={{ color: 'var(--color-text-muted-light)', textDecoration: 'none' }}>Pipeline CRM</a>
            <a href="#cv-coach" style={{ color: 'var(--color-text-muted-light)', textDecoration: 'none' }}>ATS Studio</a>
            <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>Security Verified (100/100)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

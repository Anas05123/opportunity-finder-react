import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, Bookmark, TrendingUp, Target, ArrowRight, 
  ChevronRight, CheckCircle, CircleDot, Lightbulb, CheckCircle2,
  Calendar, Zap, MapPin, Sparkles, FileText, Mic, Clock, ShieldCheck,
  Search, Award, Briefcase, RefreshCw, Layers, ExternalLink, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../config/api.js';

export default function PersonalizedDashboard({
  onSelectOpportunity,
  onPrepareKit,
  onSaveOpportunity,
  isSaved,
  onNavigateTab,
  triggerToast
}) {
  const { user, careerProfile } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [savedList, setSavedList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('careerly_token');

  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) return;
      setIsLoading(true);
      try {
        const [recRes, savedRes, appRes] = await Promise.all([
          fetch(`${API_BASE_URL}/user/dashboard-recommendations`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null),
          fetch(`${API_BASE_URL}/user/saved`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null),
          fetch(`${API_BASE_URL}/applications`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
        ]);

        if (recRes && recRes.ok) {
          const rData = await recRes.json();
          setRecommendations(rData.top_matches || []);
        }

        if (savedRes && savedRes.ok) {
          const sData = await savedRes.json();
          setSavedList(sData.saved_opportunities || []);
        }

        if (appRes && appRes.ok) {
          const aData = await appRes.json();
          setApplications(aData.applications || []);
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [token]);

  const activeAppsCount = applications.filter(a => a.stage !== 'rejected' && a.stage !== 'offer').length || 12;
  const savedCount = savedList.length || 28;
  const userName = careerProfile?.full_name || user?.full_name || 'Alex';
  const targetRole = careerProfile?.target_role || 'Senior Product Designer & Engineer';

  // Default calibrated opportunities
  const defaultOpps = [
    {
      id: 1, type: "job", title: "Product Designer", company: "Stripe",
      initial: "S", color: "#635BFF", location: "San Francisco, CA", mode: "hybrid",
      salary: "$140K – $180K", match: 94, verified: true, deadline: "Dec 15, 2024",
      skills: ["Figma", "Design Systems", "Prototyping", "React"],
      desc: "Lead core checkout and global payment experiences used by millions of developers."
    },
    {
      id: 2, type: "job", title: "Senior Frontend Engineer", company: "Linear",
      initial: "L", color: "#5E6AD2", location: "Remote", mode: "remote",
      salary: "$160K – $220K", match: 87, verified: true, deadline: "Dec 20, 2024",
      skills: ["TypeScript", "React", "GraphQL", "Performance"],
      desc: "Craft high-performance desktop-grade web application interfaces."
    },
    {
      id: 3, type: "internship", title: "UX Research Intern", company: "Google",
      initial: "G", color: "#4285F4", location: "New York, NY", mode: "hybrid",
      salary: "$8,500/mo", match: 82, verified: true, deadline: "Jan 5, 2025",
      skills: ["User Research", "Usability Testing", "Interviews"],
      desc: "Join Google's UX Research team for a 12-week high-impact summer internship."
    },
    {
      id: 4, type: "scholarship", title: "Chevening Scholarship", company: "UK Government",
      initial: "C", color: "#2457FF", location: "London, UK", mode: "onsite",
      salary: "Fully Funded", match: 78, verified: true, deadline: "Nov 5, 2025",
      skills: ["Leadership", "Academic Excellence", "Global Policy"],
      desc: "Full UK government master's funding covering tuition, living stipend, and travel."
    },
    {
      id: 5, type: "fellowship", title: "Presidential Innovation Fellow", company: "US Federal Gov.",
      initial: "P", color: "#B91C1C", location: "Washington, DC", mode: "hybrid",
      salary: "$120K/yr", match: 71, verified: true, deadline: "Feb 1, 2025",
      skills: ["Civic Tech", "Product Strategy", "Public Service"],
      desc: "Solve critical national challenges at the intersection of technology and public policy."
    },
    {
      id: 6, type: "job", title: "Staff Product Manager", company: "Figma",
      initial: "F", color: "#F24E1E", location: "Remote", mode: "remote",
      salary: "$200K–$260K", match: 89, verified: true, deadline: "Jan 25, 2025",
      skills: ["Product Strategy", "Design Tools", "Growth"],
      desc: "Drive next-generation collaborative multiplayer canvas workflows."
    }
  ];

  const displayOpps = recommendations.length > 0 ? recommendations : defaultOpps;

  const typePillClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'internship': return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      case 'scholarship': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'fellowship': return 'text-purple-700 bg-purple-50 border-purple-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const matchBadgeClass = (score) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  return (
    <div className="w-full p-5 sm:p-8 space-y-7" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* ── 1. Header & Greeting Banner ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            LIVE WORKSPACE ACTIVE
          </div>
          <h2 className="font-display text-[26px] sm:text-[32px] font-bold text-foreground leading-tight tracking-tight">
            Good morning, {userName} 👋
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Calibrated for <span className="font-semibold text-foreground">{targetRole}</span> · 2 deadlines this week · 3 new high-affinity matches.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => navigate('/opportunities')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm"
            style={{ background: '#2457FF' }}
          >
            <Search size={14} /> Discover Roles
          </button>
          <button 
            onClick={() => navigate('/cv-studio')}
            className="flex items-center gap-1.5 px-4 py-2 border border-border text-foreground text-[13px] font-medium rounded-lg hover:bg-secondary transition-all"
          >
            <FileText size={14} /> Tailor CV
          </button>
        </div>
      </div>

      {/* ── 2. Top 4 KPI Metrics ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: "Active Applications", value: String(activeAppsCount), delta: "+3 this week", icon: FolderKanban, accent: "text-blue-600", bg: "bg-blue-50/60" },
          { label: "Saved Opportunities", value: String(savedCount), delta: "+5 this week", icon: Bookmark, accent: "text-amber-600", bg: "bg-amber-50/60" },
          { label: "Profile Strength", value: "72%", delta: "28% to complete", icon: TrendingUp, accent: "text-emerald-600", bg: "bg-emerald-50/60" },
          { label: "Avg Match Score", value: "84%", delta: "Top 15% of users", icon: Target, accent: "text-purple-600", bg: "bg-purple-50/60" },
        ].map(({ label, value, delta, icon: Icon, accent, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon size={15} className={accent} />
              </div>
            </div>
            <p className="text-[26px] font-bold font-mono text-foreground leading-none mb-1">{value}</p>
            <p className="text-[11px] text-muted-foreground">{delta}</p>
          </div>
        ))}
      </div>

      {/* ── 3. Quick Action Launchers ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "AI Search Pipeline", desc: "Serper + Google Jobs live scrape", icon: Sparkles, route: "/opportunities", color: "#2457FF" },
          { label: "ATS Resume Studio", desc: "Score & rewrite CV bullets", icon: FileText, route: "/cv-studio", color: "#7C3AED" },
          { label: "STAR Interview Coach", desc: "Live behavioral simulator", icon: Mic, route: "/interview", color: "#0891B2" },
          { label: "Application CRM", desc: "Track offers and interview stages", icon: Layers, route: "/applications", color: "#18A66A" },
        ].map(({ label, desc, icon: Icon, route, color }) => (
          <button 
            key={label}
            onClick={() => navigate(route)}
            className="flex items-start gap-3 p-3.5 bg-card border border-border rounded-xl text-left hover:border-primary/40 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: color }}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">{label}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── 4. Main 2-Column Section ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        
        {/* Left Column: Recommendations & CRM Pipeline */}
        <div className="space-y-6">
          
          {/* Recommended for You */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Recommended for You</h3>
                <p className="text-[11px] text-muted-foreground">Calibrated against your skills, GPA, and location preferences</p>
              </div>
              <button 
                onClick={() => navigate('/opportunities')} 
                className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all ({displayOpps.length}) <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {displayOpps.slice(0, 5).map(opp => {
                const initial = opp.initial || (opp.company ? opp.company.charAt(0).toUpperCase() : 'C');
                const color = opp.color || '#2457FF';
                const matchScore = opp.match || opp.overall_score || 85;

                return (
                  <div 
                    key={opp.id} 
                    className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold shadow-sm" 
                        style={{ backgroundColor: color }}
                      >
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 
                            onClick={() => {
                              if (onSelectOpportunity) onSelectOpportunity(opp);
                              else navigate(`/opportunities/${opp.id}`);
                            }}
                            className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                          >
                            {opp.title}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium border flex-shrink-0 ${typePillClass(opp.type)}`}>
                            {opp.type ? opp.type.toUpperCase() : 'JOB'}
                          </span>
                          {opp.verified && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle size={9} /> Verified
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">{opp.company}</span> · {opp.location || 'Remote'} · <span className="font-medium text-foreground">{opp.salary || opp.stipend || 'Competitive'}</span>
                        </p>

                        {opp.skills && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {opp.skills.slice(0, 3).map(s => (
                              <span key={s} className="px-2 py-0.5 text-[10px] bg-secondary text-muted-foreground rounded border border-border/60">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:self-center self-end flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-mono font-semibold border ${matchBadgeClass(matchScore)}`}>
                        {matchScore}% match
                      </span>
                      <button 
                        onClick={() => {
                          if (onPrepareKit) onPrepareKit(opp);
                          else navigate('/cv-studio');
                        }}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-lg hover:bg-primary hover:text-white transition-all"
                      >
                        Prepare Kit
                      </button>
                      <button 
                        onClick={() => {
                          if (onSelectOpportunity) onSelectOpportunity(opp);
                          else navigate(`/opportunities/${opp.id}`);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
                        title="View Details"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Application Pipeline Kanban Preview */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Application Pipeline (CRM)</h3>
                <p className="text-[11px] text-muted-foreground">Active funnel stages & interview tracking</p>
              </div>
              <button 
                onClick={() => navigate('/applications')} 
                className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Open Kanban CRM <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {[
                { label: "Saved", count: 4, bar: "bg-slate-400" },
                { label: "Preparing", count: 2, bar: "bg-amber-500" },
                { label: "Applied", count: 3, bar: "bg-blue-500" },
                { label: "Interview", count: 2, bar: "bg-purple-500" },
                { label: "Offer", count: 1, bar: "bg-emerald-500" },
                { label: "Rejected", count: 1, bar: "bg-red-400" },
              ].map(({ label, count, bar }) => (
                <div key={label} className="bg-secondary/40 border border-border/50 rounded-xl p-3 text-center">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">{label}</span>
                    <span className="text-[11px] font-mono font-bold text-foreground bg-card px-1.5 py-0.5 rounded border border-border">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${Math.min(100, (count / 4) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calibrated Skills & Match Analysis */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-foreground mb-1">Skills & Fit Breakdown</h3>
            <p className="text-[11px] text-muted-foreground mb-4">How your profile compares against open market opportunities</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Top Matched Skills</p>
                {["Design Systems & Tokens (96%)", "React & Component Architecture (92%)", "Figma Prototyping (94%)", "User Research & Usability (88%)"].map(skill => (
                  <div key={skill} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/50 text-[12px] text-emerald-900 font-medium">
                    <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-600" /> {skill}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Recommended Skills to Add</p>
                {["SQL & Product Analytics (+8% match)", "GraphQL & API Integration (+6% match)", "Design Leadership & Hiring (+10% match)"].map(skill => (
                  <div key={skill} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-200/50 text-[12px] text-amber-900 font-medium">
                    <span className="flex items-center gap-1.5"><Zap size={12} className="text-amber-600" /> {skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Profile Strength, Deadlines, AI Insight */}
        <div className="space-y-5">
          
          {/* Profile Strength & Verification */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-[13px] font-semibold text-foreground mb-3.5">Profile Calibration</h3>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 56 56" className="w-16 h-16 -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="22" 
                    fill="none" 
                    stroke="#2457FF" 
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 22 * 0.72} ${2 * Math.PI * 22}`} 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold font-mono text-foreground">
                  72%
                </span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Calibration Score</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Complete 2 remaining items to reach 90% accuracy.</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-border">
              {[
                { label: "Work Experience", done: true },
                { label: "Education & Degree", done: true },
                { label: "Skills & Technical Stack", done: true },
                { label: "Live Portfolio URL", done: false },
                { label: "STAR Behavioral Stories", done: false }
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center justify-between text-[11px]">
                  <span className={`flex items-center gap-2 ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {done ? (
                      <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <CircleDot size={13} className="text-border flex-shrink-0" />
                    )}
                    {label}
                  </span>
                  {!done && (
                    <button 
                      onClick={() => navigate('/settings')}
                      className="text-[10px] text-primary font-semibold hover:underline"
                    >
                      + Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[13px] font-semibold text-foreground">Upcoming Deadlines</h3>
              <button 
                onClick={() => navigate('/calendar')}
                className="text-[11px] text-primary font-semibold hover:underline"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-3">
              {[
                { role: "UX Research Intern", company: "Google", date: "Jan 5", urgent: true },
                { role: "Product Design Fellow", company: "Figma", date: "Jan 10", urgent: false },
                { role: "Senior Frontend Engineer", company: "Linear", date: "Jan 15", urgent: false },
                { role: "Chevening Scholarship", company: "UK Gov", date: "Feb 1", urgent: false },
              ].map(({ role, company, date, urgent }) => (
                <div key={role} className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/30">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgent ? "bg-red-500 animate-pulse" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{role}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{company}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex-shrink-0 ${urgent ? "bg-red-50 text-red-600 border border-red-200" : "bg-card text-muted-foreground border border-border"}`}>
                    {date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Career Strategist Insight Card */}
          <div className="bg-primary rounded-xl p-5 text-white shadow-md relative overflow-hidden" style={{ background: '#2457FF' }}>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Lightbulb size={15} className="text-blue-200" />
                <p className="text-[11px] font-bold text-white uppercase tracking-wider">AI Strategist Insight</p>
              </div>
              <p className="text-[12px] text-white/90 leading-relaxed">
                Your profile matches <strong className="text-white">Product Design & Frontend roles</strong> with 94% affinity. Tailoring your CV bullets with measurable metrics could increase callbacks by 3×.
              </p>
              <button 
                onClick={() => navigate('/cv-studio')} 
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-primary text-[11px] font-bold rounded-lg hover:bg-blue-50 transition-all shadow-sm"
                style={{ color: '#2457FF' }}
              >
                Launch CV Studio <ArrowRight size={11} />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

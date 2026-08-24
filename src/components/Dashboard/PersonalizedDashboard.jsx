import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, Bookmark, TrendingUp, Target, ArrowRight, 
  ChevronRight, CheckCircle, CircleDot, Lightbulb, CheckCircle2,
  Calendar, Zap, MapPin
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

  // Sample fallback opportunities if backend list is empty
  const defaultOpps = [
    {
      id: 1, type: "job", title: "Product Designer", company: "Stripe",
      initial: "S", color: "#635BFF", location: "San Francisco, CA", mode: "hybrid",
      salary: "$140K – $180K", match: 94, verified: true, deadline: "Dec 15, 2024",
    },
    {
      id: 2, type: "job", title: "Senior Frontend Engineer", company: "Linear",
      initial: "L", color: "#5E6AD2", location: "Remote", mode: "remote",
      salary: "$160K – $220K", match: 87, verified: true, deadline: "Dec 20, 2024",
    },
    {
      id: 3, type: "internship", title: "UX Research Intern", company: "Google",
      initial: "G", color: "#4285F4", location: "New York, NY", mode: "hybrid",
      salary: "$8,500/mo", match: 82, verified: true, deadline: "Jan 5, 2025",
    },
    {
      id: 4, type: "scholarship", title: "Chevening Scholarship", company: "UK Government",
      initial: "C", color: "#2457FF", location: "London, UK", mode: "onsite",
      salary: "Fully Funded", match: 78, verified: true, deadline: "Nov 5, 2025",
    },
  ];

  const displayOpps = recommendations.length > 0 ? recommendations : defaultOpps;

  const typePillClass = (type) => {
    switch (type) {
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
    <div className="p-5 sm:p-7 max-w-[1240px] mx-auto space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* Greeting Banner */}
      <div>
        <h2 className="font-display text-[26px] sm:text-[30px] font-bold text-foreground leading-tight">
          Good morning, {userName} 👋
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          You have 2 upcoming deadlines this week and 3 new high-affinity matches calibrated for your profile.
        </p>
      </div>

      {/* Top 4 Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: "Active Applications", value: String(activeAppsCount), delta: "+3 this week", icon: FolderKanban, accent: "text-blue-600" },
          { label: "Saved Opportunities", value: String(savedCount), delta: "+5 this week", icon: Bookmark, accent: "text-amber-600" },
          { label: "Profile Strength", value: "72%", delta: "28% to complete", icon: TrendingUp, accent: "text-emerald-600" },
          { label: "Avg Match Score", value: "84%", delta: "Top 15% of users", icon: Target, accent: "text-purple-600" },
        ].map(({ label, value, delta, icon: Icon, accent }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
              <Icon size={16} className={accent} />
            </div>
            <p className="text-[26px] font-bold font-mono text-foreground leading-none mb-1">{value}</p>
            <p className="text-[11px] text-muted-foreground">{delta}</p>
          </div>
        ))}
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-5">
        
        {/* Left Column: Recommendations & CRM Pipeline */}
        <div className="space-y-5">
          
          {/* Recommended Opportunities List */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Recommended for you</h3>
                <p className="text-[11px] text-muted-foreground">Calibrated based on your skills and preferences</p>
              </div>
              <button 
                onClick={() => navigate('/opportunities')} 
                className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-2.5">
              {displayOpps.slice(0, 4).map(opp => {
                const initial = opp.initial || (opp.company ? opp.company.charAt(0).toUpperCase() : 'C');
                const color = opp.color || '#2457FF';
                const matchScore = opp.match || opp.overall_score || 85;

                return (
                  <div 
                    key={opp.id} 
                    onClick={() => {
                      if (onSelectOpportunity) onSelectOpportunity(opp);
                      else navigate(`/opportunities/${opp.id}`);
                    }}
                    className="bg-card border border-border rounded-lg p-3.5 flex items-center gap-3.5 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold shadow-sm" 
                      style={{ backgroundColor: color }}
                    >
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {opp.title}
                        </p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border flex-shrink-0 ${typePillClass(opp.type)}`}>
                          {opp.type ? opp.type.toUpperCase() : 'JOB'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {opp.company} · {opp.location || 'Remote'} · {opp.salary || opp.stipend || 'Competitive'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${matchBadgeClass(matchScore)}`}>
                        {matchScore}% match
                      </span>
                      <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Application Pipeline Kanban Preview */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Application Pipeline</h3>
                <p className="text-[11px] text-muted-foreground">Active funnel progression</p>
              </div>
              <button 
                onClick={() => navigate('/applications')} 
                className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Open CRM <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {[
                { label: "Saved", count: 3, bar: "bg-slate-400" },
                { label: "Preparing", count: 2, bar: "bg-amber-500" },
                { label: "Applied", count: 2, bar: "bg-blue-500" },
                { label: "Interview", count: 2, bar: "bg-purple-500" },
                { label: "Offer", count: 1, bar: "bg-emerald-500" },
                { label: "Rejected", count: 1, bar: "bg-red-400" },
              ].map(({ label, count, bar }) => (
                <div key={label} className="bg-secondary/40 rounded-lg p-2 text-center">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase">{label}</span>
                    <span className="text-[10px] font-mono font-bold text-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${Math.min(100, (count / 3) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Profile Strength, Deadlines, AI Insight */}
        <div className="space-y-4">
          
          {/* Profile Strength */}
          <div className="bg-card border border-border rounded-xl p-4.5 shadow-sm">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Profile Strength</h3>
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
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
                <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold font-mono text-foreground">
                  72%
                </span>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground">Good progress</p>
                <p className="text-[11px] text-muted-foreground">Add 2 items to reach 90%</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "Work Experience", done: true },
                { label: "Education & Degree", done: true },
                { label: "Skills & Tools", done: true },
                { label: "Portfolio URL", done: false },
                { label: "Cover Letter Template", done: false }
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  {done ? (
                    <CheckCircle size={12} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <CircleDot size={12} className="text-border flex-shrink-0" />
                  )}
                  <span className={`text-[11px] ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-card border border-border rounded-xl p-4.5 shadow-sm">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Upcoming Deadlines</h3>
            <div className="space-y-2.5">
              {[
                { role: "UX Research Intern", company: "Google", date: "Jan 5", urgent: true },
                { role: "Product Design Fellow", company: "Figma", date: "Jan 10", urgent: false },
                { role: "Senior Frontend Engineer", company: "Linear", date: "Jan 15", urgent: false }
              ].map(({ role, company, date, urgent }) => (
                <div key={role} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgent ? "bg-red-500" : "bg-border"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">{role}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{company}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${urgent ? "bg-red-50 text-red-600 border border-red-200" : "bg-secondary text-muted-foreground"}`}>
                    {date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Career Insight */}
          <div className="bg-primary rounded-xl p-4.5 text-white shadow-sm" style={{ background: '#2457FF' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={14} className="text-blue-200" />
              <p className="text-[11px] font-bold text-white uppercase tracking-wider">AI Insight</p>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Your profile matches <strong className="text-white">Product & Engineering roles</strong> with 94% affinity. Polishing keywords in your CV Studio could increase your interview callback rate by 2.4×.
            </p>
            <button 
              onClick={() => navigate('/cv-studio')} 
              className="mt-3 text-[11px] font-semibold text-blue-100 hover:text-white transition-colors flex items-center gap-1"
            >
              Go to CV Studio <ArrowRight size={11} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

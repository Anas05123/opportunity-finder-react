import { useState, type FC } from "react";
import { motion } from "motion/react";
import { LandingPage } from "./Landing/HighFidelityLanding";
import {
  LayoutDashboard, Compass, FolderKanban, Bookmark, FileText,
  MessageSquare, Calendar, User, Settings, Search, Bell,
  ChevronRight, MapPin, DollarSign, Clock, Star, CheckCircle,
  ArrowRight, Briefcase, GraduationCap, Award, Target,
  TrendingUp, Filter, X, Plus, MoreHorizontal, Globe, Users,
  ChevronLeft, ExternalLink, BookOpen, Send, AlertCircle,
  CircleDot, Trophy, Lightbulb,
  Eye, EyeOff, Lock, Mail, Pencil, Download, Upload, Trash2,
  ChevronDown, Mic, Play, Pause, Shield, LogOut, Link,
  BellOff, Sliders, CalendarDays, Zap, Info, RotateCcw,
  Building2, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────
type Screen =
  | "landing" | "signin"
  | "dashboard" | "discovery" | "details" | "crm"
  | "saved" | "cv" | "coach" | "calendar" | "profile" | "settings";

type OppType = "job" | "internship" | "scholarship" | "fellowship";
type WorkMode = "remote" | "hybrid" | "onsite";

interface Opp {
  id: number; type: OppType; title: string; company: string;
  initial: string; color: string; location: string; mode: WorkMode;
  salary: string; match: number; verified: boolean; deadline: string;
  posted: string; skills: string[]; missing: string[]; industry: string;
  exp: string; desc: string; saved: boolean; size: string;
  source: string; eligibility: string;
}

// ─── Data ─────────────────────────────────────────────────────────────
const OPPS: Opp[] = [
  {
    id: 1, type: "job", title: "Product Designer", company: "Stripe",
    initial: "S", color: "#635BFF", location: "San Francisco, CA", mode: "hybrid",
    salary: "$140K – $180K", match: 94, verified: true, deadline: "Dec 15, 2024",
    posted: "2 days ago",
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Motion"],
    missing: ["SQL", "Data Analysis"], industry: "Fintech", exp: "Mid-level (3–5 yrs)",
    desc: "Join Stripe's Design team to craft the next generation of financial infrastructure products. You'll work closely with engineering and product to design experiences used by millions of developers worldwide. We value taste, systems thinking, and an obsession with craft.",
    saved: true, size: "5,000–10,000", source: "Stripe Careers", eligibility: "Open to US work authorization",
  },
  {
    id: 2, type: "job", title: "Senior Frontend Engineer", company: "Linear",
    initial: "L", color: "#5E6AD2", location: "Remote", mode: "remote",
    salary: "$160K – $220K", match: 87, verified: true, deadline: "Dec 20, 2024",
    posted: "1 day ago",
    skills: ["TypeScript", "React", "GraphQL", "Performance Optimization"],
    missing: ["Rust", "WebAssembly"], industry: "Developer Tools", exp: "Senior (5+ yrs)",
    desc: "Linear is building the future of project management. We're looking for engineers who care deeply about performance, architecture, and user experience. This role involves working on our core product used by thousands of engineering teams globally.",
    saved: true, size: "50–200", source: "Linear Jobs", eligibility: "Worldwide, no sponsorship",
  },
  {
    id: 3, type: "internship", title: "UX Research Intern", company: "Google",
    initial: "G", color: "#4285F4", location: "New York, NY", mode: "hybrid",
    salary: "$8,500/mo", match: 82, verified: true, deadline: "Jan 5, 2025",
    posted: "3 days ago",
    skills: ["User Research", "Interview Facilitation", "Usability Testing"],
    missing: ["Python", "Statistical Analysis"], industry: "Technology", exp: "Student / Entry-level",
    desc: "Join Google's UX Research team for a 12-week paid summer internship. You'll conduct studies, analyze data, and present findings to cross-functional teams. Full relocation support provided.",
    saved: true, size: "100,000+", source: "Google Careers", eligibility: "Currently enrolled in a degree program",
  },
  {
    id: 4, type: "scholarship", title: "Chevening Scholarship", company: "UK Government",
    initial: "C", color: "#003087", location: "United Kingdom", mode: "onsite",
    salary: "Fully Funded", match: 78, verified: true, deadline: "Nov 5, 2025",
    posted: "1 week ago",
    skills: ["Leadership", "Academic Excellence", "Community Impact"],
    missing: ["2+ years work experience"], industry: "Education", exp: "2+ years post-graduation",
    desc: "The Chevening Scholarship is the UK government's global scholarship programme. It funds outstanding emerging leaders to study a one-year master's at any UK university, covering tuition, living expenses, and travel.",
    saved: true, size: "Government", source: "chevening.org", eligibility: "Citizens of Chevening-eligible countries with 2+ yrs work experience",
  },
  {
    id: 5, type: "fellowship", title: "Presidential Innovation Fellow", company: "US Federal Gov.",
    initial: "P", color: "#B31942", location: "Washington, D.C.", mode: "hybrid",
    salary: "$105K – $167K", match: 71, verified: true, deadline: "Feb 28, 2025",
    posted: "5 days ago",
    skills: ["Technology Strategy", "Product Management", "Government"],
    missing: ["Security Clearance", "Federal Experience"], industry: "Government & Policy", exp: "Senior (7+ yrs)",
    desc: "Presidential Innovation Fellows are top technologists who serve tours of duty in the Federal Government. Fellows work with senior officials to solve critical challenges using technology, data, and design thinking.",
    saved: false, size: "Government", source: "pif.gov", eligibility: "US Citizens only",
  },
  {
    id: 6, type: "job", title: "Staff Software Engineer", company: "Notion",
    initial: "N", color: "#191919", location: "San Francisco, CA", mode: "hybrid",
    salary: "$230K – $300K", match: 88, verified: true, deadline: "Jan 15, 2025",
    posted: "4 days ago",
    skills: ["TypeScript", "React", "Node.js", "System Design", "Leadership"],
    missing: ["Distributed Systems", "ML Infrastructure"], industry: "Productivity", exp: "Staff (8+ yrs)",
    desc: "Notion is building the connected workspace that millions rely on daily. As a Staff Engineer, you'll tackle our hardest technical problems and set direction for major engineering initiatives.",
    saved: false, size: "200–500", source: "Notion Careers", eligibility: "US work authorization required",
  },
];

type CRMCard = {
  id: string; title: string; company: string; match: number;
  deadline: string; type: OppType; color: string; initial: string;
};

const CRM: Record<string, CRMCard[]> = {
  saved: [
    { id: "s1", title: "Software Engineer Intern", company: "Amazon", match: 88, deadline: "Due Jan 15, 2025", type: "internship", color: "#FF9900", initial: "A" },
    { id: "s2", title: "Design Intern", company: "Apple", match: 76, deadline: "Due Dec 30, 2024", type: "internship", color: "#555555", initial: "A" },
    { id: "s3", title: "Chevening Scholarship", company: "UK Government", match: 78, deadline: "Due Nov 5, 2025", type: "scholarship", color: "#003087", initial: "C" },
  ],
  preparing: [
    { id: "p1", title: "PM Fellowship", company: "Google", match: 91, deadline: "Due Jan 10, 2025", type: "fellowship", color: "#4285F4", initial: "G" },
    { id: "p2", title: "Research Engineer", company: "DeepMind", match: 84, deadline: "Due Jan 20, 2025", type: "job", color: "#4A4FE4", initial: "D" },
  ],
  applied: [
    { id: "a1", title: "Product Analyst", company: "Meta", match: 79, deadline: "Submitted Dec 2", type: "job", color: "#0866FF", initial: "M" },
    { id: "a2", title: "Backend Engineer", company: "Stripe", match: 90, deadline: "Submitted Nov 28", type: "job", color: "#635BFF", initial: "S" },
  ],
  interview: [
    { id: "i1", title: "Design Engineer", company: "Linear", match: 87, deadline: "Interview Dec 18", type: "job", color: "#5E6AD2", initial: "L" },
    { id: "i2", title: "UX Designer", company: "Figma", match: 93, deadline: "Interview Dec 20", type: "job", color: "#F24E1E", initial: "F" },
  ],
  offer: [
    { id: "o1", title: "Frontend Engineer", company: "Notion", match: 88, deadline: "Offer expires Jan 3", type: "job", color: "#191919", initial: "N" },
  ],
  rejected: [
    { id: "r1", title: "Product Designer", company: "Airbnb", match: 72, deadline: "Rejected Dec 1", type: "job", color: "#FF5A5F", initial: "A" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────
const cn = (...cls: (string | boolean | undefined | null)[]) =>
  cls.filter(Boolean).join(" ");

const TYPE_COLORS: Record<OppType, string> = {
  job: "bg-blue-50 text-blue-700 border-blue-200",
  internship: "bg-amber-50 text-amber-700 border-amber-200",
  scholarship: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fellowship: "bg-purple-50 text-purple-700 border-purple-200",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_ICONS: Record<OppType, FC<any>> = {
  job: Briefcase, internship: GraduationCap, scholarship: Award, fellowship: Star,
};

const MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote", hybrid: "Hybrid", onsite: "On-site",
};

// ─── Toggle component ─────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors flex-shrink-0",
        on ? "bg-[#2457FF]" : "bg-secondary border border-border"
      )}
    >
      <span className={cn(
        "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
        on ? "translate-x-4" : "translate-x-0.5"
      )} />
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────
const NAV_MAIN: Array<{ id: Screen; label: string; icon: FC<any> }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "discovery", label: "Discover", icon: Compass },
  { id: "crm", label: "Applications", icon: FolderKanban },
];

const NAV_AUX: Array<{ id: Screen; label: string; icon: FC<any> }> = [
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "cv", label: "CV Studio", icon: FileText },
  { id: "coach", label: "Interview Coach", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

function Sidebar({ active, nav }: { active: Screen; nav: (s: Screen) => void }) {
  const isActive = (id: Screen) => active === id;
  const navCls = (id: Screen) => cn(
    "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left",
    isActive(id) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
  );

  return (
    <aside className="w-56 flex-shrink-0 h-screen flex flex-col border-r border-border bg-card">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <button onClick={() => nav("landing")} className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground text-[11px] font-bold font-display leading-none">C</span>
          </div>
          <span className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Careerly</span>
        </button>
      </div>

      <nav className="flex-1 p-2.5 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_MAIN.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => nav(id)} className={navCls(id)}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border space-y-0.5">
          {NAV_AUX.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => nav(id)} className={navCls(id)}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border space-y-0.5">
          <button onClick={() => nav("profile")} className={navCls("profile")}>
            <User size={15} />Profile
          </button>
          <button onClick={() => nav("settings")} className={navCls("settings")}>
            <Settings size={15} />Settings
          </button>
        </div>
      </nav>

      <div className="p-2.5 border-t border-border">
        <button onClick={() => nav("profile")} className="w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-accent transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#2457FF] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">AK</div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold text-foreground truncate">Alex Kim</p>
            <p className="text-[10px] text-muted-foreground truncate">Product Designer</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────
function TopBar({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card flex-shrink-0">
      <div>
        <h1 className="text-[15px] font-semibold text-foreground leading-none">{title}</h1>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors relative">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#2457FF] rounded-full ring-2 ring-white" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#2457FF] flex items-center justify-center text-white text-[11px] font-bold cursor-pointer">AK</div>
      </div>
    </header>
  );
}

// ─── Match Badge ──────────────────────────────────────────────────────
function MatchBadge({ score }: { score: number }) {
  const cls =
    score >= 90 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 75 ? "text-blue-700 bg-blue-50 border-blue-200"
    : "text-amber-700 bg-amber-50 border-amber-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${cls}`}>
      {score}% match
    </span>
  );
}

// ─── Opportunity Card ─────────────────────────────────────────────────
function OppCard({ opp, onView }: { opp: Opp; onView: () => void }) {
  const [sv, setSv] = useState(opp.saved);
  const Icon = TYPE_ICONS[opp.type];
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm hover:border-foreground/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0" style={{ backgroundColor: opp.color }}>
            {opp.initial}
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-foreground leading-snug group-hover:text-[#2457FF] transition-colors">{opp.title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              {opp.verified && <CheckCircle size={10} className="text-[#2457FF]" />}{opp.company}
            </p>
          </div>
        </div>
        <button onClick={() => setSv(!sv)} className={cn("p-1.5 rounded-md transition-all flex-shrink-0", sv ? "text-foreground bg-accent" : "text-border hover:text-muted-foreground hover:bg-accent")}>
          <Bookmark size={13} fill={sv ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${TYPE_COLORS[opp.type]}`}>
          <Icon size={9} />{opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-border text-muted-foreground">
          <MapPin size={9} />{opp.location}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-border text-muted-foreground">
          <Globe size={9} />{MODE_LABELS[opp.mode]}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-foreground">{opp.salary}</span>
        <MatchBadge score={opp.match} />
      </div>
      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={9} />{opp.posted}</span>
        <button onClick={onView} className="text-[11px] font-medium text-foreground hover:text-[#2457FF] flex items-center gap-1 transition-colors">
          View Details <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}


// ─── Landing Screen ──────────────────────────────────────────────────────
function Landing({ nav }: { nav: (s: Screen) => void }) {
  return <LandingPage nav={nav} />;
}

// ─── Sign In / Register ───────────────────────────────────────────────
function SignIn({ nav }: { nav: (s: Screen) => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!email || !password) { setError("Please fill in all required fields."); return; }
    if (mode === "up" && password !== confirmPw) { setError("Passwords do not match."); return; }
    nav("dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-primary p-10">
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-7 h-7 bg-white/20 rounded-md flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">C</span>
            </div>
            <span className="text-white text-[15px] font-semibold">Careerly</span>
          </div>
          <h2 className="font-display text-[34px] font-bold text-white leading-[1.15] mb-4">
            Land your next<br /><span className="italic text-white/65">opportunity</span><br />with confidence.
          </h2>
          <p className="text-[14px] text-white/50 leading-relaxed max-w-[280px]">
            Join 120,000+ professionals discovering their dream roles through intelligent matching and guided preparation.
          </p>
        </div>
        <div className="bg-white/8 border border-white/12 rounded-lg p-4">
          <p className="text-[13px] text-white/75 leading-relaxed italic">
            "Careerly helped me go from zero callbacks to four offers in six weeks. The match scoring alone saved me hours of wasted applications."
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-bold">SM</div>
            <div>
              <p className="text-[12px] font-semibold text-white">Sarah Mitchell</p>
              <p className="text-[10px] text-white/50">Product Manager at Atlassian</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {[["50K+", "Opportunities"], ["120K+", "Users"], ["87%", "Success Rate"]].map(([n, l]) => (
            <div key={l}>
              <p className="text-[16px] font-bold font-mono text-white">{n}</p>
              <p className="text-[10px] text-white/40">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground text-[11px] font-bold">C</span>
            </div>
            <span className="text-foreground text-[15px] font-semibold">Careerly</span>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-[26px] font-bold text-foreground mb-1">
              {mode === "in" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {mode === "in" ? "Sign in to continue to Careerly." : "Start discovering your next opportunity."}
            </p>
          </div>

          <div className="flex bg-secondary rounded-lg p-0.5 mb-5">
            {(["in", "up"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={cn("flex-1 py-2 rounded-md text-[13px] font-semibold transition-all", mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {m === "in" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <button onClick={() => nav("dashboard")} className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-border rounded-md text-[13px] font-medium text-foreground hover:bg-accent transition-colors mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-3">
            {mode === "up" && (
              <div>
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide block mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Kim"
                    className="w-full bg-card border border-border rounded-md py-2.5 pl-9 pr-3 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
                </div>
              </div>
            )}
            <div>
              <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com"
                  className="w-full bg-card border border-border rounded-md py-2.5 pl-9 pr-3 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide">Password</label>
                {mode === "in" && <button className="text-[11px] text-[#2457FF] hover:underline">Forgot password?</button>}
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-card border border-border rounded-md py-2.5 pl-9 pr-9 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            {mode === "up" && (
              <div>
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••"
                    className="w-full bg-card border border-border rounded-md py-2.5 pl-9 pr-3 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}

          <button onClick={submit} className="w-full mt-4 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-md hover:opacity-90 transition-opacity">
            {mode === "in" ? "Sign In" : "Create Account"}
          </button>

          {mode === "up" && (
            <p className="text-center text-[11px] text-muted-foreground mt-3">
              By creating an account you agree to our{" "}
              <button className="text-foreground hover:underline">Terms</button> and{" "}
              <button className="text-foreground hover:underline">Privacy Policy</button>.
            </p>
          )}

          <p className="text-center text-[12px] text-muted-foreground mt-4">
            {mode === "in" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); }}
              className="text-foreground font-semibold hover:text-[#2457FF] transition-colors">
              {mode === "in" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────
function Dashboard({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="dashboard" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Dashboard" sub="Monday, 9 December 2024" />
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5">
            <h2 className="font-display text-[26px] font-bold text-foreground">Good morning, Alex 👋</h2>
            <p className="text-[12px] text-muted-foreground mt-1">You have 2 upcoming deadlines this week and 3 new matches since yesterday.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Active Applications", value: "12", delta: "+3 this week", icon: FolderKanban, accent: "text-blue-600" },
              { label: "Saved Opportunities", value: "28", delta: "+5 this week", icon: Bookmark, accent: "text-amber-600" },
              { label: "Profile Strength", value: "72%", delta: "28% to complete", icon: TrendingUp, accent: "text-[#2457FF]" },
              { label: "Avg Match Score", value: "84%", delta: "Top 15% of users", icon: Target, accent: "text-purple-600" },
            ].map(({ label, value, delta, icon: Icon, accent }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
                  <Icon size={13} className={accent} />
                </div>
                <p className="text-[24px] font-bold font-mono text-foreground leading-none mb-1">{value}</p>
                <p className="text-[10px] text-muted-foreground">{delta}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-[13px] font-semibold text-foreground">Recommended for you</h3>
                  <button onClick={() => nav("discovery")} className="text-[11px] text-[#2457FF] font-medium hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></button>
                </div>
                <div className="space-y-2">
                  {OPPS.slice(0, 4).map(opp => {
                    const Icon = TYPE_ICONS[opp.type];
                    return (
                      <div key={opp.id} onClick={() => nav("details")}
                        className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer group">
                        <div className="w-9 h-9 rounded-md flex-shrink-0 flex items-center justify-center text-white text-[12px] font-bold" style={{ backgroundColor: opp.color }}>{opp.initial}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-[#2457FF] transition-colors">{opp.title}</p>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border flex-shrink-0 ${TYPE_COLORS[opp.type]}`}>
                              <Icon size={8} />{opp.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{opp.company} · {opp.location} · {opp.salary}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <MatchBadge score={opp.match} />
                          <ChevronRight size={12} className="text-border" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-foreground">Application Pipeline</h3>
                  <button onClick={() => nav("crm")} className="text-[11px] text-[#2457FF] font-medium hover:underline flex items-center gap-1">Open CRM <ArrowRight size={10} /></button>
                </div>
                <div className="flex gap-2">
                  {[{ label: "Saved", count: 3, bar: "bg-muted-foreground" }, { label: "Preparing", count: 2, bar: "bg-amber-500" }, { label: "Applied", count: 2, bar: "bg-blue-500" }, { label: "Interview", count: 2, bar: "bg-purple-500" }, { label: "Offer", count: 1, bar: "bg-[#2457FF]" }, { label: "Rejected", count: 1, bar: "bg-red-400" }].map(({ label, count, bar }) => (
                    <div key={label} className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px] text-muted-foreground font-medium truncate">{label}</span>
                        <span className="text-[9px] font-mono font-bold text-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${bar} rounded-full`} style={{ width: `${(count / 3) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Profile Strength</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#ECEAE4" strokeWidth="4" />
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#2457FF" strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 22 * 0.72} ${2 * Math.PI * 22}`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold font-mono text-foreground">72%</span>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">Good progress</p>
                    <p className="text-[10px] text-muted-foreground">Add 2 items to reach 90%</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[{ label: "Work Experience", done: true }, { label: "Education", done: true }, { label: "Skills & Tools", done: true }, { label: "Portfolio Link", done: false }, { label: "Cover Letter Template", done: false }].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      {done ? <CheckCircle size={11} className="text-[#2457FF] flex-shrink-0" /> : <CircleDot size={11} className="text-border flex-shrink-0" />}
                      <span className={`text-[11px] ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Upcoming Deadlines</h3>
                <div className="space-y-2.5">
                  {[{ role: "UX Research Intern", company: "Google", date: "Jan 5", urgent: true }, { role: "PM Fellowship", company: "Google", date: "Jan 10", urgent: false }, { role: "Staff Engineer", company: "Notion", date: "Jan 15", urgent: false }].map(({ role, company, date, urgent }) => (
                    <div key={role} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgent ? "bg-red-500" : "bg-border"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground truncate">{role}</p>
                        <p className="text-[9px] text-muted-foreground">{company}</p>
                      </div>
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${urgent ? "bg-red-50 text-red-600 border border-red-200" : "bg-secondary text-muted-foreground"}`}>{date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-primary rounded-lg p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb size={12} className="text-[#93C5FD]" />
                  <p className="text-[11px] font-bold text-primary-foreground uppercase tracking-wide">AI Insight</p>
                </div>
                <p className="text-[11px] text-primary-foreground/65 leading-relaxed">
                  Your profile matches <strong className="text-primary-foreground">Product Design roles</strong> at Series B–C companies 94% of the time. Adding a portfolio link could increase your match rate by 12%.
                </p>
                <button className="mt-3 text-[10px] font-semibold text-[#93C5FD] hover:text-white transition-colors flex items-center gap-1">
                  Go to CV Studio <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discovery ────────────────────────────────────────────────────────
function Discovery({ nav, onSelect }: { nav: (s: Screen) => void; onSelect: (o: Opp) => void }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | OppType>("all");
  const [mode, setMode] = useState<"all" | WorkMode>("all");
  const [showPanel, setShowPanel] = useState(true);

  const filtered = OPPS.filter(o => {
    if (type !== "all" && o.type !== type) return false;
    if (mode !== "all" && o.mode !== mode) return false;
    if (q && !o.title.toLowerCase().includes(q.toLowerCase()) && !o.company.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="discovery" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-card border-b border-border px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search roles, companies, skills, keywords..."
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder-muted-foreground outline-none" />
              {q && <button onClick={() => setQ("")}><X size={11} className="text-muted-foreground" /></button>}
            </div>
            <button onClick={() => setShowPanel(!showPanel)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium border transition-all flex-shrink-0", showPanel ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/25")}>
              <Filter size={12} /> Filters
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Type</span>
              {(["all", "job", "internship", "scholarship", "fellowship"] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={cn("px-2.5 py-1 rounded text-[11px] font-medium border transition-all", type === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/25")}>
                  {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mode</span>
              {(["all", "remote", "hybrid", "onsite"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn("px-2.5 py-1 rounded text-[11px] font-medium border transition-all", mode === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/25")}>
                  {m === "all" ? "All" : MODE_LABELS[m]}
                </button>
              ))}
            </div>
            {(q || type !== "all" || mode !== "all") && (
              <button onClick={() => { setQ(""); setType("all"); setMode("all"); }} className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium">
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {showPanel && (
            <div className="w-52 flex-shrink-0 border-r border-border bg-card overflow-y-auto p-4">
              {[{ label: "Experience", opts: ["Entry-level", "Mid-level", "Senior", "Staff", "Executive"] }, { label: "Industry", opts: ["Technology", "Fintech", "Government", "Education", "Healthcare"] }, { label: "Salary", opts: ["$0–$60K", "$60K–$100K", "$100K–$150K", "$150K–$200K", "$200K+", "Fully Funded"] }].map(({ label, opts }) => (
                <div key={label} className="mb-5">
                  <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2">{label}</h4>
                  <div className="space-y-1.5">
                    {opts.map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary" />
                        <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {["Figma", "React", "Python", "Research", "Leadership", "TypeScript"].map(skill => (
                    <button key={skill} className="px-2 py-0.5 text-[10px] rounded border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all">{skill}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] text-muted-foreground"><span className="font-semibold text-foreground">{filtered.length}</span> opportunities found</p>
              <select className="text-[11px] text-muted-foreground bg-transparent border border-border rounded px-2 py-1 outline-none cursor-pointer">
                <option>Sort: Best match</option><option>Sort: Newest</option><option>Sort: Salary</option><option>Sort: Deadline</option>
              </select>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Search size={28} className="mb-3 opacity-20" />
                <p className="text-[14px] font-semibold">No results found</p>
                <p className="text-[12px] mt-1">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className={cn("grid gap-3", showPanel ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3")}>
                {filtered.map(opp => <OppCard key={opp.id} opp={opp} onView={() => { onSelect(opp); nav("details"); }} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Details ──────────────────────────────────────────────────────────
function Details({ opp: propOpp, nav }: { opp: Opp | null; nav: (s: Screen) => void }) {
  const opp = propOpp ?? OPPS[0];
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"overview" | "requirements" | "company">("overview");
  const TypeIcon = TYPE_ICONS[opp.type];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="discovery" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card flex-shrink-0">
          <button onClick={() => nav("discovery")} className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={14} /> Back to Discover
          </button>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors relative">
              <Bell size={14} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#2457FF] rounded-full ring-2 ring-white" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#2457FF] flex items-center justify-center text-white text-[10px] font-bold">AK</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-card border-b border-border">
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ backgroundColor: opp.color }}>{opp.initial}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="font-display text-[24px] font-bold text-foreground leading-tight">{opp.title}</h1>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-[13px] text-muted-foreground flex items-center gap-1">{opp.verified && <CheckCircle size={12} className="text-[#2457FF]" />}{opp.company}</span>
                        <span className="text-border">·</span>
                        <span className="text-[13px] text-muted-foreground flex items-center gap-1"><MapPin size={11} />{opp.location}</span>
                        <span className="text-border">·</span>
                        <span className="text-[13px] text-muted-foreground">{MODE_LABELS[opp.mode]}</span>
                      </div>
                    </div>
                    <button onClick={() => setSaved(!saved)}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all flex-shrink-0", saved ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/30")}>
                      <Bookmark size={12} fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : "Save"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${TYPE_COLORS[opp.type]}`}><TypeIcon size={10} />{opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-border text-muted-foreground"><DollarSign size={10} />{opp.salary}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-border text-muted-foreground"><Users size={10} />{opp.size}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-red-200 bg-red-50 text-red-600"><Clock size={10} />Deadline: {opp.deadline}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Target size={13} className="text-[#2457FF]" /><span className="text-[13px] font-semibold text-foreground">Match Analysis</span></div>
                  <span className="text-[22px] font-bold font-mono text-[#2457FF]">{opp.match}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[#2457FF] rounded-full" style={{ width: `${opp.match}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Why you match</p>
                    <ul className="space-y-1">
                      {["Strong design portfolio", "Figma & design systems", `${opp.exp} required`].map(r => (
                        <li key={r} className="text-[10px] text-foreground flex items-start gap-1.5"><CheckCircle size={9} className="text-[#2457FF] flex-shrink-0 mt-0.5" />{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Your skills</p>
                    <div className="flex flex-wrap gap-1">
                      {opp.skills.map(s => <span key={s} className="px-1.5 py-0.5 bg-[#2457FF]/10 text-[#2457FF] text-[9px] rounded border border-[#2457FF]/15">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-1.5">Skill gaps</p>
                    <div className="flex flex-wrap gap-1">
                      {opp.missing.map(s => <span key={s} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] rounded border border-amber-200">{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-4">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-md hover:opacity-90 transition-opacity"><Send size={12} /> Apply Now</button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2457FF] text-white text-[13px] font-semibold rounded-md hover:bg-[#0A4A32] transition-colors"><BookOpen size={12} /> Prepare Application</button>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-border text-[12px] font-medium text-muted-foreground rounded-md hover:border-foreground/30 transition-all"><ExternalLink size={12} /> {opp.source}</button>
              </div>
            </div>
            <div className="max-w-3xl mx-auto px-6 flex border-t border-border">
              {(["overview", "requirements", "company"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("px-4 py-3 text-[12px] font-semibold border-b-2 transition-all -mb-px", tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-6 py-5">
            {tab === "overview" && (
              <div className="grid grid-cols-[1fr_216px] gap-4">
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-[13px] font-semibold text-foreground mb-3">About the Role</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{opp.desc}</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wide mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5">{opp.skills.map(s => <span key={s} className="px-2.5 py-1 bg-background text-foreground text-[11px] rounded border border-border">{s}</span>)}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2.5">Details</h4>
                    <div className="space-y-2">
                      {[{ k: "Type", v: opp.type.charAt(0).toUpperCase() + opp.type.slice(1) }, { k: "Experience", v: opp.exp }, { k: "Industry", v: opp.industry }, { k: "Work Mode", v: MODE_LABELS[opp.mode] }, { k: "Team Size", v: opp.size }].map(({ k, v }) => (
                        <div key={k} className="flex justify-between gap-2"><span className="text-[10px] text-muted-foreground">{k}</span><span className="text-[10px] font-semibold text-foreground text-right">{v}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2">Eligibility</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{opp.eligibility}</p>
                  </div>
                </div>
              </div>
            )}
            {tab === "requirements" && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-[13px] font-semibold text-foreground mb-4">Requirements & Qualifications</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-[#2457FF] uppercase tracking-wide mb-2">Skills you have</p>
                    <div className="flex flex-wrap gap-1.5">{opp.skills.map(s => <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2457FF]/8 text-[#2457FF] text-[11px] rounded border border-[#2457FF]/15"><CheckCircle size={9} />{s}</span>)}</div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-2">Skills to develop</p>
                    <div className="flex flex-wrap gap-1.5">{opp.missing.map(s => <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] rounded border border-amber-200"><AlertCircle size={9} />{s}</span>)}</div>
                  </div>
                </div>
              </div>
            )}
            {tab === "company" && (
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: opp.color }}>{opp.initial}</div>
                  <div><h3 className="text-[14px] font-semibold text-foreground">{opp.company}</h3><p className="text-[11px] text-muted-foreground">{opp.industry} · {opp.size} employees</p></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[["Glassdoor", "4.2 / 5"], ["Founded", "2010"], ["Funding", "Series D"]].map(([k, v]) => (
                    <div key={k} className="bg-background rounded-lg p-3 text-center">
                      <p className="text-[14px] font-bold font-mono text-foreground">{v}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Company culture, recent news, Glassdoor reviews and funding data would be displayed here — giving you a full picture before you apply.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CRM Board ────────────────────────────────────────────────────────
const CRM_COLS = [
  { id: "saved", label: "Saved", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  { id: "preparing", label: "Preparing", dot: "bg-amber-500", text: "text-amber-600" },
  { id: "applied", label: "Applied", dot: "bg-blue-500", text: "text-blue-600" },
  { id: "interview", label: "Interview", dot: "bg-purple-500", text: "text-purple-600" },
  { id: "offer", label: "Offer", dot: "bg-[#2457FF]", text: "text-[#2457FF]" },
  { id: "rejected", label: "Rejected", dot: "bg-red-400", text: "text-red-500" },
];

function CRMBoard({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="crm" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Applications" sub="Track and manage every application in your pipeline" />
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex gap-3 h-full" style={{ minWidth: "max-content" }}>
            {CRM_COLS.map(({ id, label, dot, text }) => {
              const cards: CRMCard[] = CRM[id] ?? [];
              return (
                <div key={id} className="flex flex-col w-60 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 px-0.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${text}`}>{label}</span>
                    <span className="ml-auto text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{cards.length}</span>
                  </div>
                  <div className="flex-1 bg-secondary/60 rounded-lg p-2 space-y-2 overflow-y-auto min-h-[200px]">
                    {cards.map(card => {
                      const CardIcon = TYPE_ICONS[card.type];
                      return (
                        <div key={card.id} className="bg-card border border-border rounded-md p-3 hover:shadow-sm hover:border-foreground/20 transition-all cursor-pointer group">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: card.color }}>{card.initial}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-foreground leading-snug group-hover:text-[#2457FF] transition-colors">{card.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{card.company}</p>
                            </div>
                            <button className="text-border hover:text-muted-foreground flex-shrink-0 transition-colors"><MoreHorizontal size={12} /></button>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium border ${TYPE_COLORS[card.type]}`}><CardIcon size={7} />{card.type}</span>
                            <MatchBadge score={card.match} />
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-border flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Clock size={8} />{card.deadline}
                          </div>
                        </div>
                      );
                    })}
                    <button className="w-full py-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-card rounded-md border border-dashed border-border transition-all">
                      <Plus size={10} /> Add card
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Saved Screen ─────────────────────────────────────────────────────
function SavedScreen({ nav, onSelect }: { nav: (s: Screen) => void; onSelect: (o: Opp) => void }) {
  const [savedIds, setSavedIds] = useState<number[]>([1, 2, 3, 4]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | OppType>("all");

  const savedOpps = OPPS.filter(o =>
    savedIds.includes(o.id) &&
    (filter === "all" || o.type === filter) &&
    (!q || o.title.toLowerCase().includes(q.toLowerCase()) || o.company.toLowerCase().includes(q.toLowerCase()))
  );

  const remove = (id: number) => setSavedIds(prev => prev.filter(i => i !== id));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="saved" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Saved" sub={`${savedIds.length} saved opportunities`} />
        <div className="bg-card border-b border-border px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search saved opportunities..."
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder-muted-foreground outline-none" />
              {q && <button onClick={() => setQ("")}><X size={11} className="text-muted-foreground" /></button>}
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "job", "internship", "scholarship", "fellowship"] as const).map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  className={cn("px-2.5 py-1 rounded text-[11px] font-medium border transition-all", filter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/25")}>
                  {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {savedOpps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Bookmark size={22} className="text-muted-foreground" />
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-1">No saved opportunities</h3>
              <p className="text-[13px] text-muted-foreground mb-4 max-w-[260px]">
                {q || filter !== "all" ? "No results match your current filters." : "Browse and save opportunities to review them here."}
              </p>
              <button onClick={() => nav("discovery")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] font-medium rounded-md hover:opacity-90 transition-opacity">
                Discover Opportunities <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedOpps.map(opp => {
                const TypeIcon = TYPE_ICONS[opp.type];
                return (
                  <div key={opp.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-foreground/20 hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: opp.color }}>{opp.initial}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[14px] font-semibold text-foreground group-hover:text-[#2457FF] transition-colors">{opp.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${TYPE_COLORS[opp.type]}`}><TypeIcon size={9} />{opp.type}</span>
                        {opp.verified && <CheckCircle size={13} className="text-[#2457FF]" />}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 size={10} />{opp.company}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{opp.location}</span>
                        <span className="flex items-center gap-1"><DollarSign size={10} />{opp.salary}</span>
                        <span className="flex items-center gap-1"><Globe size={10} />{MODE_LABELS[opp.mode]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <MatchBadge score={opp.match} />
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock size={10} />{opp.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => { onSelect(opp); nav("details"); }} className="px-3 py-1.5 border border-border rounded-md text-[12px] font-medium text-foreground hover:border-foreground/30 transition-all">View</button>
                      <button onClick={() => nav("crm")} className="px-3 py-1.5 bg-[#2457FF] text-white rounded-md text-[12px] font-medium hover:bg-[#0A4A32] transition-colors">Add to Pipeline</button>
                      <button onClick={() => remove(opp.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-all"><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CV Studio ────────────────────────────────────────────────────────
function CVStudio({ nav }: { nav: (s: Screen) => void }) {
  const [activeSection, setActiveSection] = useState("experience");

  const SECTIONS = [
    { id: "personal", label: "Personal Info", done: true },
    { id: "summary", label: "Summary", done: true },
    { id: "experience", label: "Work Experience", done: true },
    { id: "education", label: "Education", done: true },
    { id: "skills", label: "Skills", done: true },
    { id: "achievements", label: "Achievements", done: false },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="cv" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card flex-shrink-0">
          <div>
            <h1 className="text-[15px] font-semibold text-foreground leading-none">CV Studio</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Alex Kim — Product Designer · Last saved 3 min ago</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-border rounded-md text-muted-foreground hover:border-foreground/30 transition-all">
              <Upload size={12} /> Import
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium bg-[#2457FF] text-white rounded-md hover:bg-[#0A4A32] transition-colors">
              <Download size={12} /> Export PDF
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors relative">
              <Bell size={15} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#2457FF] rounded-full ring-2 ring-white" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#2457FF] flex items-center justify-center text-white text-[11px] font-bold">AK</div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Section navigator */}
          <div className="w-48 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
            <div className="p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sections</p>
              <div className="space-y-0.5">
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[12px] font-medium text-left transition-colors", activeSection === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                    {s.done
                      ? <CheckCircle size={11} className={activeSection === s.id ? "text-white/70" : "text-[#2457FF]"} />
                      : <CircleDot size={11} className={activeSection === s.id ? "text-white/50" : "text-border"} />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-border">
              <div className="bg-background rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">ATS Score</p>
                  <span className="text-[15px] font-bold font-mono text-amber-600">78</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "78%" }} />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1.5">Good — add keywords to improve</p>
              </div>
              <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2">AI Suggestions</p>
              <div className="space-y-2">
                {["Add 'cross-functional' to summary", "Quantify impact in Experience section", "Add portfolio URL to Personal Info"].map(s => (
                  <div key={s} className="flex items-start gap-1.5">
                    <Zap size={9} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-1.5">Missing Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {["cross-functional", "stakeholder", "data-driven"].map(k => (
                    <span key={k} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] rounded">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeSection === "personal" && (
              <div>
                <h2 className="text-[14px] font-semibold text-foreground mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Full Name", value: "Alex Kim" }, { label: "Professional Title", value: "Senior Product Designer" }, { label: "Email", value: "alex.kim@email.com" }, { label: "Phone", value: "+1 (415) 555-0192" }, { label: "Location", value: "San Francisco, CA" }, { label: "LinkedIn", value: "linkedin.com/in/alexkim" }, { label: "Portfolio", value: "alexkim.design" }, { label: "GitHub", value: "" }].map(({ label, value }) => (
                    <div key={label}>
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wide block mb-1">{label}</label>
                      <input defaultValue={value} placeholder={`Enter ${label.toLowerCase()}...`}
                        className="w-full bg-card border border-border rounded-md px-3 py-2 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === "summary" && (
              <div>
                <h2 className="text-[14px] font-semibold text-foreground mb-4">Professional Summary</h2>
                <textarea defaultValue="Experienced product designer with 4+ years crafting digital products used by millions. Deep expertise in design systems, user research, and cross-functional collaboration. Passionate about the intersection of engineering and design." rows={5}
                  className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-foreground/40 transition-colors resize-none" />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-muted-foreground">170 characters · Aim for 200–350</p>
                  <button className="flex items-center gap-1.5 text-[11px] text-[#2457FF] font-semibold"><Zap size={11} /> Improve with AI</button>
                </div>
              </div>
            )}
            {activeSection === "experience" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-semibold text-foreground">Work Experience</h2>
                  <button className="flex items-center gap-1.5 text-[12px] font-medium text-[#2457FF]"><Plus size={13} /> Add Experience</button>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Senior Product Designer", company: "Headspace", from: "Jan 2022", to: "Present", bullets: ["Led redesign of core meditation experience, increasing daily active users by 23%", "Built and maintained a 200+ component design system used across 6 product teams", "Raised WCAG accessibility compliance from 60% to 94%"] },
                    { title: "Product Designer", company: "Intercom", from: "Mar 2020", to: "Dec 2021", bullets: ["Designed inbox and automation features serving 30,000+ enterprise customers", "Partnered with 3 engineering squads to ship 12 major features", "Reduced onboarding drop-off by 38% through guided setup redesign"] },
                  ].map((exp, i) => (
                    <div key={i} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="grid grid-cols-2 gap-3 flex-1 mr-4">
                          {[{ l: "Job Title", v: exp.title }, { l: "Company", v: exp.company }, { l: "Start Date", v: exp.from }, { l: "End Date", v: exp.to }].map(({ l, v }) => (
                            <div key={l}>
                              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">{l}</label>
                              <input defaultValue={v} className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-foreground/30" />
                            </div>
                          ))}
                        </div>
                        <button className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
                      </div>
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Key Achievements</label>
                      {exp.bullets.map((b, j) => (
                        <div key={j} className="flex items-center gap-2 mb-1.5">
                          <span className="text-muted-foreground text-xs flex-shrink-0">•</span>
                          <input defaultValue={b} className="flex-1 bg-background border border-border rounded px-2.5 py-1 text-[12px] text-foreground outline-none focus:border-foreground/30" />
                          <button className="text-border hover:text-muted-foreground flex-shrink-0"><X size={11} /></button>
                        </div>
                      ))}
                      <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[#2457FF] mt-1"><Plus size={10} /> Add bullet</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === "education" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-semibold text-foreground">Education</h2>
                  <button className="flex items-center gap-1.5 text-[12px] font-medium text-[#2457FF]"><Plus size={13} /> Add Education</button>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[{ l: "Degree", v: "Bachelor of Arts — Design" }, { l: "Institution", v: "UC Berkeley" }, { l: "Start Year", v: "2016" }, { l: "End Year", v: "2020" }].map(({ l, v }) => (
                      <div key={l}>
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">{l}</label>
                        <input defaultValue={v} className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-foreground/30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeSection === "skills" && (
              <div>
                <h2 className="text-[14px] font-semibold text-foreground mb-4">Skills</h2>
                <div className="space-y-3">
                  {[{ cat: "Design Tools", skills: ["Figma", "Sketch", "Principle", "Framer", "Zeplin"] }, { cat: "Core Skills", skills: ["Design Systems", "User Research", "Prototyping", "Accessibility", "Motion Design"] }, { cat: "Technical", skills: ["HTML/CSS", "React basics", "Git", "Storybook"] }].map(({ cat, skills }) => (
                    <div key={cat} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[12px] font-semibold text-foreground">{cat}</p>
                        <button className="text-[11px] text-[#2457FF] flex items-center gap-1"><Plus size={10} /> Add</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(s => (
                          <div key={s} className="flex items-center gap-1 px-2.5 py-1 bg-background border border-border rounded-md text-[11px] text-foreground group">
                            {s}
                            <button className="text-border hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><X size={9} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === "achievements" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-semibold text-foreground">Achievements</h2>
                  <button className="flex items-center gap-1.5 text-[12px] font-medium text-[#2457FF]"><Plus size={13} /> Add Achievement</button>
                </div>
                <div className="bg-card border border-border rounded-lg p-10 text-center">
                  <Award size={28} className="text-muted-foreground/25 mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-foreground mb-1">No achievements added yet</p>
                  <p className="text-[12px] text-muted-foreground mb-4">Awards, publications, certifications, or notable projects</p>
                  <button className="flex items-center gap-1.5 text-[12px] font-medium text-[#2457FF] mx-auto"><Plus size={12} /> Add your first achievement</button>
                </div>
              </div>
            )}
          </div>

          {/* Mini CV preview */}
          <div className="w-56 flex-shrink-0 border-l border-border overflow-y-auto">
            <div className="p-3 border-b border-border flex items-center justify-between bg-card">
              <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">Preview</p>
              <button className="text-[10px] text-[#2457FF] font-medium">Expand</button>
            </div>
            <div className="p-3 bg-background">
              <div className="bg-white border border-border rounded overflow-hidden shadow-sm">
                <div className="p-3 border-b border-border bg-card">
                  <p className="font-bold text-[10px] text-foreground tracking-wide">ALEX KIM</p>
                  <p className="text-[8px] text-muted-foreground">Senior Product Designer</p>
                  <p className="text-[7px] text-muted-foreground mt-0.5">alex.kim@email.com · San Francisco, CA</p>
                  <p className="text-[7px] text-muted-foreground">alexkim.design</p>
                </div>
                <div className="p-2.5 space-y-2">
                  <div>
                    <p className="font-bold text-[7px] text-foreground uppercase tracking-widest mb-1 border-b border-border pb-0.5">SUMMARY</p>
                    <p className="text-[7px] text-muted-foreground leading-relaxed">Experienced product designer with 4+ years crafting digital products used by millions...</p>
                  </div>
                  <div>
                    <p className="font-bold text-[7px] text-foreground uppercase tracking-widest mb-1 border-b border-border pb-0.5">EXPERIENCE</p>
                    <div className="mb-1.5">
                      <p className="font-semibold text-[7px] text-foreground">Senior Product Designer</p>
                      <p className="text-[7px] text-muted-foreground">Headspace · 2022 – Present</p>
                      <p className="text-[7px] text-muted-foreground">• +23% DAU, 200+ component system</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[7px] text-foreground">Product Designer</p>
                      <p className="text-[7px] text-muted-foreground">Intercom · 2020 – 2021</p>
                      <p className="text-[7px] text-muted-foreground">• Enterprise inbox & automation</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-[7px] text-foreground uppercase tracking-widest mb-1 border-b border-border pb-0.5">EDUCATION</p>
                    <p className="text-[7px] text-foreground">BA Design · UC Berkeley · 2020</p>
                  </div>
                  <div>
                    <p className="font-bold text-[7px] text-foreground uppercase tracking-widest mb-1 border-b border-border pb-0.5">SKILLS</p>
                    <p className="text-[7px] text-muted-foreground">Figma · Design Systems · Prototyping · User Research</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-[9px] font-bold text-foreground uppercase tracking-widest">ATS Breakdown</p>
                {[{ l: "Keywords", s: 65, c: "bg-amber-500" }, { l: "Formatting", s: 92, c: "bg-[#2457FF]" }, { l: "Content depth", s: 80, c: "bg-blue-500" }, { l: "Skills match", s: 75, c: "bg-[#2457FF]" }].map(({ l, s, c }) => (
                  <div key={l}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-muted-foreground">{l}</span>
                      <span className="text-[9px] font-mono font-bold text-foreground">{s}%</span>
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${c} rounded-full`} style={{ width: `${s}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interview Coach ──────────────────────────────────────────────────
const QUESTIONS = [
  "Walk me through a recent project where you had to balance competing priorities.",
  "How do you approach designing for both developers and end-users simultaneously?",
  "Tell me about a time you had to push back on a product decision. What was the outcome?",
  "Describe your process for validating a design before development begins.",
  "How do you handle feedback that directly contradicts your design decisions?",
  "What is your approach to performance optimisation in design-heavy interfaces?",
  "Where do you see the intersection of engineering and design evolving in five years?",
  "What makes you specifically excited about working at Linear?",
];

function InterviewCoach({ nav }: { nav: (s: Screen) => void }) {
  const [qIdx, setQIdx] = useState(2);
  const [answer, setAnswer] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [answered, setAnswered] = useState([0, 1]);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => { if (answer.trim()) { setSubmitted(true); setAnswered(prev => [...prev, qIdx]); } };
  const next = () => { setQIdx(q => Math.min(q + 1, QUESTIONS.length - 1)); setAnswer(""); setSubmitted(false); };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="coach" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Session header */}
        <div className="bg-card border-b border-border px-5 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-white text-[11px] font-bold bg-[#5E6AD2]">L</div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Design Engineer at Linear</p>
                <p className="text-[11px] text-muted-foreground">Practice Session · Question {qIdx + 1} of {QUESTIONS.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {QUESTIONS.map((_, i) => (
                  <button key={i} onClick={() => { setQIdx(i); setAnswer(""); setSubmitted(false); }}
                    className={cn("w-6 h-6 rounded-full text-[9px] font-bold border-2 transition-all", i === qIdx ? "bg-primary border-primary text-primary-foreground" : answered.includes(i) ? "bg-[#2457FF] border-[#2457FF] text-white" : "bg-card border-border text-muted-foreground hover:border-foreground/30")}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border rounded-md text-muted-foreground hover:border-red-200 hover:text-red-500 transition-all">
                End Session
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main area */}
          <div className="flex-1 flex flex-col overflow-hidden p-5">
            {/* Question */}
            <div className="bg-card border border-border rounded-lg p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Question {qIdx + 1}</span>
                <span className="px-2 py-0.5 bg-secondary rounded text-[10px] font-medium text-muted-foreground">Behavioural</span>
              </div>
              <p className="text-[16px] font-semibold text-foreground leading-relaxed font-display">{QUESTIONS[qIdx]}</p>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                <Info size={11} /> Tip: Use the STAR method — Situation, Task, Action, Result.
              </p>
            </div>

            {/* Answer area */}
            <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <p className="text-[12px] font-semibold text-foreground">Your Answer</p>
                <div className="flex items-center gap-2">
                  <button className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all", isRunning ? "bg-red-50 text-red-600 border-red-200" : "border-border text-muted-foreground hover:border-foreground/25")}
                    onClick={() => setIsRunning(!isRunning)}>
                    {isRunning ? <><Pause size={11} /> 3:41</> : <><Play size={11} /> Start Timer</>}
                  </button>
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border text-muted-foreground hover:border-foreground/25 transition-all">
                    <Mic size={11} /> Voice
                  </button>
                </div>
              </div>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here, or use Voice mode to speak. Focus on a specific example and follow the STAR structure..."
                className="flex-1 p-4 text-[13px] text-foreground placeholder-muted-foreground outline-none resize-none bg-transparent" />
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setAnswer(""); setSubmitted(false); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border rounded-md text-muted-foreground hover:border-foreground/25 transition-all">
                    <RotateCcw size={11} /> Clear
                  </button>
                  <button onClick={() => { setQIdx(q => Math.min(q + 1, QUESTIONS.length - 1)); setAnswer(""); setSubmitted(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border rounded-md text-muted-foreground hover:border-foreground/25 transition-all">
                    Skip Question
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {submitted && <span className="text-[11px] text-[#2457FF] flex items-center gap-1"><CheckCircle size={11} /> Submitted</span>}
                  <button onClick={submit} disabled={!answer.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                    Submit Answer <Send size={12} />
                  </button>
                  {submitted && qIdx < QUESTIONS.length - 1 && (
                    <button onClick={next} className="flex items-center gap-2 px-4 py-2 bg-[#2457FF] text-white text-[13px] font-semibold rounded-md hover:bg-[#0A4A32] transition-colors">
                      Next <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback panel */}
          <div className="w-72 flex-shrink-0 border-l border-border overflow-y-auto bg-card">
            <div className="p-4 border-b border-border">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-widest">AI Feedback — Q{qIdx > 0 ? qIdx : 1}</p>
            </div>

            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold text-foreground">Overall Score</p>
                <span className="text-[20px] font-bold font-mono text-[#2457FF]">8.2<span className="text-[12px] text-muted-foreground">/10</span></span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-[#2457FF] rounded-full" style={{ width: "82%" }} />
              </div>
            </div>

            <div className="p-4 border-b border-border">
              <p className="text-[10px] font-bold text-[#2457FF] uppercase tracking-widest mb-2">Strengths</p>
              <div className="space-y-1.5">
                {["Clear conflict articulation", "Strong resolution narrative", "Specific example used", "Professional tone maintained"].map(s => (
                  <div key={s} className="flex items-center gap-2 text-[11px] text-foreground">
                    <CheckCircle size={10} className="text-[#2457FF] flex-shrink-0" />{s}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-border">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Improve</p>
              <div className="space-y-1.5">
                {["Add specific metrics (e.g. '30% reduction')", "Mention stakeholder dynamics", "Strengthen conclusion with learnings"].map(s => (
                  <div key={s} className="flex items-start gap-2 text-[11px] text-foreground">
                    <AlertCircle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />{s}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Model Structure</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                "At [Company], I disagreed with the decision to [X]. I approached my manager privately to present data showing [Y]. We agreed to run a 2-week test, which resulted in [Z]. The outcome improved [metric] by [%]."
              </p>
            </div>

            <div className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Previous Sessions</p>
              {[{ role: "Product Designer @ Stripe", date: "Dec 8", score: "7.1" }, { role: "UX Designer @ Figma", date: "Dec 5", score: "8.4" }, { role: "Design Lead @ Airbnb", date: "Dec 1", score: "6.8" }].map(s => (
                <div key={s.role} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-[11px] font-medium text-foreground">{s.role}</p>
                    <p className="text-[9px] text-muted-foreground">{s.date}</p>
                  </div>
                  <span className="text-[12px] font-bold font-mono text-foreground">{s.score}<span className="text-[9px] text-muted-foreground">/10</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────
const CAL_EVENTS: Record<number, Array<{ type: string; label: string; bg: string; text: string }>> = {
  9:  [{ type: "prep", label: "Google UX Intern — Prep", bg: "bg-amber-100", text: "text-amber-700" }],
  15: [{ type: "deadline", label: "Stripe Deadline", bg: "bg-red-100", text: "text-red-600" }],
  18: [{ type: "interview", label: "Linear — Technical", bg: "bg-purple-100", text: "text-purple-700" }],
  20: [
    { type: "interview", label: "Figma — Final Round", bg: "bg-purple-100", text: "text-purple-700" },
    { type: "deadline", label: "Linear SWE Deadline", bg: "bg-red-100", text: "text-red-600" },
  ],
  30: [{ type: "deadline", label: "Apple Intern Deadline", bg: "bg-red-100", text: "text-red-600" }],
};

const UPCOMING = [
  { day: "Dec 9", type: "prep", label: "Application Review — Google UX Research Intern", dot: "bg-amber-400" },
  { day: "Dec 15", type: "deadline", label: "Application Deadline — Product Designer (Stripe)", dot: "bg-red-400" },
  { day: "Dec 18", type: "interview", label: "Technical Interview — Design Engineer (Linear)", dot: "bg-purple-500" },
  { day: "Dec 20", type: "interview", label: "Final Round Interview — UX Designer (Figma)", dot: "bg-purple-500" },
  { day: "Dec 20", type: "deadline", label: "Application Deadline — Senior Frontend (Linear)", dot: "bg-red-400" },
  { day: "Dec 30", type: "deadline", label: "Application Deadline — Design Intern (Apple)", dot: "bg-red-400" },
  { day: "Jan 3", type: "followup", label: "Offer Expires — Frontend Engineer (Notion)", dot: "bg-[#2457FF]" },
  { day: "Jan 5", type: "deadline", label: "Application Deadline — UX Research Intern (Google)", dot: "bg-red-400" },
];

function CalendarScreen({ nav }: { nav: (s: Screen) => void }) {
  const [view, setView] = useState<"month" | "list">("month");
  const DAYS_HEADER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Dec 2024: starts on Sunday (0), 31 days
  const calCells: (number | null)[] = [];
  for (let i = 1; i <= 31; i++) calCells.push(i);
  while (calCells.length % 7 !== 0) calCells.push(null);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="calendar" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Calendar" sub="December 2024" />
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar main */}
          <div className="flex-1 flex flex-col overflow-hidden p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent transition-all"><ChevronLeft size={14} /></button>
                <h2 className="font-display text-[18px] font-bold text-foreground">December 2024</h2>
                <button className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent transition-all"><ChevronRight size={14} /></button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 mr-3">
                  {[{ type: "interview", label: "Interview", dot: "bg-purple-400" }, { type: "deadline", label: "Deadline", dot: "bg-red-400" }, { type: "prep", label: "Prep task", dot: "bg-amber-400" }, { type: "followup", label: "Follow-up", dot: "bg-[#2457FF]" }].map(({ label, dot }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex bg-secondary rounded-md p-0.5">
                  {(["month", "list"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={cn("px-2.5 py-1 rounded text-[11px] font-medium transition-all", view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                      {v === "month" ? <CalendarDays size={13} /> : <ChevronDown size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {view === "month" ? (
              <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border">
                  {DAYS_HEADER.map(d => (
                    <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                {Array.from({ length: Math.ceil(calCells.length / 7) }).map((_, weekIdx) => (
                  <div key={weekIdx} className="grid grid-cols-7 border-b border-border last:border-0">
                    {calCells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                      const events = day ? (CAL_EVENTS[day] ?? []) : [];
                      const today = day === 9;
                      return (
                        <div key={dayIdx} className={cn("min-h-[80px] p-1.5 border-r border-border last:border-0 hover:bg-background/50 transition-colors", today ? "bg-background" : "")}>
                          {day && (
                            <>
                              <span className={cn("w-6 h-6 flex items-center justify-center text-[12px] font-semibold rounded-full mb-1", today ? "bg-primary text-primary-foreground" : "text-foreground")}>{day}</span>
                              <div className="space-y-0.5">
                                {events.map((ev, ei) => (
                                  <div key={ei} className={`px-1.5 py-0.5 rounded text-[9px] font-medium truncate ${ev.bg} ${ev.text}`}>{ev.label}</div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {UPCOMING.map((ev, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3.5 flex items-center gap-3 hover:border-foreground/20 transition-all">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.dot}`} />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-foreground">{ev.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{ev.type}</p>
                    </div>
                    <span className="text-[12px] font-mono font-semibold text-muted-foreground flex-shrink-0">{ev.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming events sidebar */}
          <div className="w-72 flex-shrink-0 border-l border-border overflow-y-auto bg-card">
            <div className="p-4 border-b border-border">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-widest">Upcoming</p>
            </div>
            <div className="p-3 space-y-2">
              {UPCOMING.slice(0, 6).map((ev, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border hover:border-foreground/20 transition-all cursor-pointer">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${ev.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground leading-snug">{ev.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground">{ev.day}</span>
                      <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded capitalize", ev.type === "interview" ? "bg-purple-50 text-purple-700" : ev.type === "deadline" ? "bg-red-50 text-red-600" : ev.type === "prep" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{ev.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────
function ProfileScreen({ nav }: { nav: (s: Screen) => void }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="profile" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Profile" sub="Your professional profile visible to employers" />
        <div className="flex-1 overflow-y-auto">
          {/* Profile header */}
          <div className="bg-card border-b border-border px-6 py-6">
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#2457FF] flex items-center justify-center text-white text-xl font-bold">AK</div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                  <Pencil size={10} className="text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-[24px] font-bold text-foreground leading-tight">Alex Kim</h1>
                    <p className="text-[14px] text-muted-foreground mt-0.5">Senior Product Designer</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin size={12} />San Francisco, CA</span>
                      <span className="flex items-center gap-1"><Building2 size={12} />Open to new roles</span>
                      <span className="flex items-center gap-1 text-[#2457FF]"><CheckCircle size={12} />Available now</span>
                    </div>
                  </div>
                  <button onClick={() => setEditing(!editing)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] font-medium rounded-md hover:opacity-90 transition-opacity flex-shrink-0">
                    <Pencil size={12} />{editing ? "Save Profile" : "Edit Profile"}
                  </button>
                </div>
                {/* Profile strength bar */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 max-w-[240px]">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Profile Strength</span>
                      <span className="text-[10px] font-mono font-bold text-foreground">72%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-[#2457FF] rounded-full" style={{ width: "72%" }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <AlertCircle size={11} className="text-amber-500" />
                    Add portfolio link to reach 90%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 p-5">
            {/* Left column */}
            <div className="space-y-4">
              {/* About */}
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-foreground">About</h3>
                  {editing && <button className="text-[11px] text-[#2457FF] font-medium flex items-center gap-1"><Pencil size={10} /> Edit</button>}
                </div>
                {editing ? (
                  <textarea defaultValue="Experienced product designer with 4+ years crafting digital products used by millions. I specialise in design systems, user research, and bridging the gap between engineering and product. Currently open to senior design roles at product-led companies." rows={4}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-foreground/40 resize-none transition-colors" />
                ) : (
                  <p className="text-[13px] text-muted-foreground leading-relaxed">Experienced product designer with 4+ years crafting digital products used by millions. I specialise in design systems, user research, and bridging the gap between engineering and product. Currently open to senior design roles at product-led companies.</p>
                )}
              </div>

              {/* Experience */}
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold text-foreground">Work Experience</h3>
                  {editing && <button className="text-[11px] text-[#2457FF] font-medium flex items-center gap-1"><Plus size={10} /> Add</button>}
                </div>
                <div className="space-y-4">
                  {[
                    { role: "Senior Product Designer", company: "Headspace", period: "Jan 2022 – Present", location: "Remote", color: "#FF5A5F", initial: "H", bullets: ["Led redesign of core meditation experience (+23% DAU)", "Built & maintained 200+ component design system", "WCAG compliance from 60% → 94%"] },
                    { role: "Product Designer", company: "Intercom", period: "Mar 2020 – Dec 2021", location: "San Francisco", color: "#0866FF", initial: "I", bullets: ["Designed inbox and automation for 30K+ enterprise customers", "Shipped 12 major features with 3 engineering squads"] },
                  ].map((exp, i) => (
                    <div key={i} className={cn("flex gap-3", i > 0 ? "pt-4 border-t border-border" : "")}>
                      <div className="w-9 h-9 rounded-md flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0" style={{ backgroundColor: exp.color }}>{exp.initial}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[13px] font-semibold text-foreground">{exp.role}</p>
                            <p className="text-[12px] text-muted-foreground">{exp.company} · {exp.location}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono flex-shrink-0">{exp.period}</span>
                        </div>
                        <ul className="mt-2 space-y-0.5">
                          {exp.bullets.map(b => <li key={b} className="text-[12px] text-muted-foreground flex items-start gap-1.5"><span className="text-border mt-1.5">•</span>{b}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold text-foreground">Education</h3>
                  {editing && <button className="text-[11px] text-[#2457FF] font-medium flex items-center gap-1"><Plus size={10} /> Add</button>}
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#003C8F] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">UC</div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Bachelor of Arts — Design</p>
                    <p className="text-[12px] text-muted-foreground">UC Berkeley · 2016 – 2020</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Concentration in Interaction Design · GPA 3.8</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Skills */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-foreground">Skills</h3>
                  {editing && <button className="text-[11px] text-[#2457FF] font-medium"><Plus size={10} /></button>}
                </div>
                <div className="space-y-2.5">
                  {[{ cat: "Design", skills: ["Figma", "Sketch", "Framer", "Principle"] }, { cat: "Research", skills: ["User interviews", "Usability testing", "Survey design"] }, { cat: "Systems", skills: ["Design Systems", "Accessibility", "Motion Design"] }].map(({ cat, skills }) => (
                    <div key={cat}>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{cat}</p>
                      <div className="flex flex-wrap gap-1">
                        {skills.map(s => <span key={s} className="px-2 py-0.5 bg-secondary text-foreground text-[10px] rounded border border-border">{s}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career preferences */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-foreground">Career Preferences</h3>
                  {editing && <button className="text-[11px] text-[#2457FF] font-medium flex items-center gap-1"><Pencil size={10} /> Edit</button>}
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Job Type", value: "Full-time, Contract" },
                    { label: "Salary", value: "$140K – $200K" },
                    { label: "Work Mode", value: "Remote, Hybrid" },
                    { label: "Preferred Locations", value: "SF Bay Area, NYC, Remote" },
                    { label: "Notice Period", value: "2 weeks" },
                    { label: "Status", value: "Actively looking" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-[11px] text-muted-foreground">{label}</span>
                      <span className="text-[11px] font-semibold text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-foreground">Achievements</h3>
                  {editing && <button className="text-[11px] text-[#2457FF] font-medium"><Plus size={10} /></button>}
                </div>
                <div className="space-y-2">
                  {[{ icon: "🎤", title: "Config 2023 Speaker", desc: "\"Designing at Scale\" — Figma's annual conference" }, { icon: "🏆", title: "AIGA Design Excellence Award", desc: "Awarded 2022 for contribution to digital design" }].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0">{icon}</span>
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">{title}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion nudge */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={13} className="text-amber-600" />
                  <p className="text-[12px] font-semibold text-amber-700">Complete your profile</p>
                </div>
                <div className="space-y-1.5">
                  {[{ label: "Add portfolio URL", done: false }, { label: "Upload profile photo", done: false }, { label: "Add certifications", done: false }].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2 text-[11px] text-amber-700">
                      {done ? <CheckCircle size={10} /> : <CircleDot size={10} />}{label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────
const SETTINGS_SECTIONS = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Career Preferences", icon: Sliders },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "integrations", label: "Integrations", icon: Link },
  { id: "danger", label: "Danger Zone", icon: AlertCircle },
];

function SettingsScreen({ nav }: { nav: (s: Screen) => void }) {
  const [section, setSection] = useState("notifications");
  const [notifs, setNotifs] = useState({ deadlines: true, interviews: true, matches: true, digest: false, pushAlerts: true, messages: false, statusUpdates: true });
  const [digestFreq, setDigestFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [privacy, setPrivacy] = useState({ publicProfile: true, activityVisible: false, dataSharing: true, analytics: true });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active="settings" nav={nav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Settings" sub="Manage your account and preferences" />
        <div className="flex-1 flex overflow-hidden">
          {/* Settings nav */}
          <div className="w-48 flex-shrink-0 border-r border-border bg-card overflow-y-auto p-2.5">
            <div className="space-y-0.5">
              {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setSection(id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors text-left", section === id ? (id === "danger" ? "bg-red-50 text-red-600" : "bg-primary text-primary-foreground") : id === "danger" ? "text-red-500 hover:bg-red-50" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings content */}
          <div className="flex-1 overflow-y-auto p-6">
            {section === "account" && (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground mb-1">Account</h2>
                  <p className="text-[13px] text-muted-foreground">Manage your account information and preferences.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#2457FF] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">AK</div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Alex Kim</p>
                      <p className="text-[12px] text-muted-foreground">alex.kim@email.com</p>
                    </div>
                    <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-[12px] font-medium text-muted-foreground hover:border-foreground/30 transition-all"><Upload size={11} /> Change Photo</button>
                  </div>
                  {[{ l: "Full Name", v: "Alex Kim" }, { l: "Email Address", v: "alex.kim@email.com" }, { l: "Professional Title", v: "Senior Product Designer" }, { l: "Location", v: "San Francisco, CA" }].map(({ l, v }) => (
                    <div key={l}>
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wide block mb-1">{l}</label>
                      <input defaultValue={v} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] text-foreground outline-none focus:border-foreground/40 transition-colors" />
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-primary text-primary-foreground text-[13px] font-semibold rounded-md hover:opacity-90 transition-opacity">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {section === "security" && (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground mb-1">Security</h2>
                  <p className="text-[13px] text-muted-foreground">Manage your password and account security settings.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                  <h3 className="text-[13px] font-semibold text-foreground">Change Password</h3>
                  {[{ l: "Current Password", ph: "••••••••" }, { l: "New Password", ph: "Min. 8 characters" }, { l: "Confirm New Password", ph: "••••••••" }].map(({ l, ph }) => (
                    <div key={l}>
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wide block mb-1">{l}</label>
                      <input type="password" placeholder={ph} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
                    </div>
                  ))}
                  <button className="px-4 py-2 bg-primary text-primary-foreground text-[13px] font-semibold rounded-md hover:opacity-90 transition-opacity">Update Password</button>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Two-Factor Authentication</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-3 py-1.5 border border-border rounded-md text-[12px] font-medium text-foreground hover:border-foreground/30 transition-all">Enable 2FA</button>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                  <p className="text-[13px] font-semibold text-foreground mb-3">Active Sessions</p>
                  {[{ browser: "Chrome on macOS", location: "San Francisco, CA", status: "Current" }, { browser: "Safari on iPhone", location: "San Francisco, CA", status: "2 days ago" }].map(({ browser, location, status }) => (
                    <div key={browser} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">{browser}</p>
                        <p className="text-[10px] text-muted-foreground">{location} · {status}</p>
                      </div>
                      {status !== "Current" && <button className="text-[11px] text-red-500 hover:text-red-600 font-medium">Revoke</button>}
                      {status === "Current" && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">Active</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "notifications" && (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground mb-1">Notifications</h2>
                  <p className="text-[13px] text-muted-foreground">Control how and when Careerly notifies you.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                  <p className="text-[12px] font-bold text-foreground uppercase tracking-widest mb-3">Email Notifications</p>
                  <div className="space-y-3">
                    {[
                      { key: "deadlines" as const, label: "Application deadlines", desc: "Reminders 7, 3 and 1 day before deadlines" },
                      { key: "interviews" as const, label: "Interview reminders", desc: "24h and 1h before scheduled interviews" },
                      { key: "matches" as const, label: "New opportunity matches", desc: "When new roles match your profile (daily max)" },
                      { key: "digest" as const, label: "Weekly digest", desc: "Summary of your activity and top opportunities" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Toggle on={notifs[key]} onToggle={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                  <p className="text-[12px] font-bold text-foreground uppercase tracking-widest mb-3">Push Notifications</p>
                  <div className="space-y-3">
                    {[
                      { key: "pushAlerts" as const, label: "Real-time match alerts", desc: "Instant push when a high-match role is posted" },
                      { key: "messages" as const, label: "Recruiter messages", desc: "When a recruiter contacts you through Careerly" },
                      { key: "statusUpdates" as const, label: "Application status updates", desc: "When your application status changes" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Toggle on={notifs[key]} onToggle={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                  <p className="text-[12px] font-bold text-foreground uppercase tracking-widest mb-3">Digest Frequency</p>
                  <div className="flex items-center gap-3">
                    {(["daily", "weekly", "monthly"] as const).map(f => (
                      <button key={f} onClick={() => setDigestFreq(f)}
                        className={cn("flex-1 py-2 rounded-md text-[12px] font-medium border transition-all capitalize", digestFreq === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/25")}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {section === "preferences" && (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground mb-1">Career Preferences</h2>
                  <p className="text-[13px] text-muted-foreground">Help us find you the best-matched opportunities.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                  {[{ l: "Target Role", v: "Senior Product Designer, Design Lead" }, { l: "Desired Salary", v: "$140,000 – $200,000" }, { l: "Preferred Locations", v: "San Francisco, New York, Remote" }, { l: "Notice Period", v: "2 weeks" }].map(({ l, v }) => (
                    <div key={l}>
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wide block mb-1">{l}</label>
                      <input defaultValue={v} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] text-foreground outline-none focus:border-foreground/40 transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold text-foreground uppercase tracking-wide block mb-2">Work Mode</label>
                    <div className="flex gap-2">
                      {["Remote", "Hybrid", "On-site"].map(m => (
                        <button key={m} className={cn("px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all", m !== "On-site" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/25")}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Open to Work</p>
                      <p className="text-[11px] text-muted-foreground">Show recruiters you're actively looking</p>
                    </div>
                    <Toggle on={true} onToggle={() => {}} />
                  </div>
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-primary text-primary-foreground text-[13px] font-semibold rounded-md hover:opacity-90 transition-opacity">Save Preferences</button>
                  </div>
                </div>
              </div>
            )}

            {section === "privacy" && (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground mb-1">Privacy</h2>
                  <p className="text-[13px] text-muted-foreground">Control how your information is used and who can see it.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                  {([
                    { key: "publicProfile" as const, label: "Public profile", desc: "Allow your profile to appear in employer searches" },
                    { key: "activityVisible" as const, label: "Activity visible", desc: "Let connections see when you're actively looking" },
                    { key: "dataSharing" as const, label: "Application data sharing", desc: "Share anonymised application data to improve matching" },
                    { key: "analytics" as const, label: "Analytics cookies", desc: "Help us improve Careerly with usage analytics" },
                  ]).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <Toggle on={privacy[key]} onToggle={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "integrations" && (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground mb-1">Integrations</h2>
                  <p className="text-[13px] text-muted-foreground">Connect your accounts to enrich your Careerly profile.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "LinkedIn", desc: "Import your work history, skills, and connections", connected: true, color: "#0A66C2", initial: "in" },
                    { name: "Google", desc: "Sync calendar events and enable Google Sign-In", connected: true, color: "#EA4335", initial: "G" },
                    { name: "GitHub", desc: "Showcase projects and contributions to employers", connected: false, color: "#24292E", initial: "GH" },
                    { name: "Notion", desc: "Export application notes and research documents", connected: false, color: "#191919", initial: "N" },
                  ].map(({ name, desc, connected, color, initial }) => (
                    <div key={name} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: color }}>{initial}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-foreground">{name}</p>
                        <p className="text-[11px] text-muted-foreground">{desc}</p>
                      </div>
                      {connected ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">Connected</span>
                          <button className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors">Disconnect</button>
                        </div>
                      ) : (
                        <button className="px-3 py-1.5 border border-border rounded-md text-[12px] font-medium text-foreground hover:border-foreground/30 transition-all flex-shrink-0">Connect</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "danger" && (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground mb-1">Danger Zone</h2>
                  <p className="text-[13px] text-muted-foreground">These actions are irreversible. Please proceed with caution.</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-card border border-red-200 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Export your data</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Download a copy of all your Careerly data</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-[12px] font-medium text-muted-foreground hover:border-foreground/30 transition-all">
                      <Download size={12} /> Export
                    </button>
                  </div>
                  <div className="bg-card border border-red-200 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Sign out of all devices</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Revoke all active sessions immediately</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-md text-[12px] font-medium text-red-500 hover:bg-red-50 transition-all">
                      <LogOut size={12} /> Sign Out All
                    </button>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-red-700">Delete account</p>
                      <p className="text-[12px] text-red-600/70 mt-0.5">Permanently delete your account and all data. Cannot be undone.</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-md text-[12px] font-semibold hover:bg-red-600 transition-colors">
                      <Trash2 size={12} /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [selected, setSelected] = useState<Opp | null>(null);

  if (screen === "landing")   return <Landing nav={setScreen} />;
  if (screen === "signin")    return <SignIn nav={setScreen} />;
  if (screen === "dashboard") return <Dashboard nav={setScreen} />;
  if (screen === "discovery") return <Discovery nav={setScreen} onSelect={setSelected} />;
  if (screen === "details")   return <Details opp={selected} nav={setScreen} />;
  if (screen === "crm")       return <CRMBoard nav={setScreen} />;
  if (screen === "saved")     return <SavedScreen nav={setScreen} onSelect={setSelected} />;
  if (screen === "cv")        return <CVStudio nav={setScreen} />;
  if (screen === "coach")     return <InterviewCoach nav={setScreen} />;
  if (screen === "calendar")  return <CalendarScreen nav={setScreen} />;
  if (screen === "profile")   return <ProfileScreen nav={setScreen} />;
  if (screen === "settings")  return <SettingsScreen nav={setScreen} />;
  return <Landing nav={setScreen} />;
}

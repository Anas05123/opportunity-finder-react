import React, { useState, useEffect, useRef } from "react";
import {
  motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  Search, ArrowRight, Bookmark, Send, MessageSquare, FileText, Calendar, User, Compass, FolderKanban, Trophy, Target, ChevronRight, Heart, Star, ChevronLeft, Plus, Filter, Mic, Briefcase, GraduationCap, Building2, Globe, Sparkles, CheckCircle2, MapPin, Clock, ArrowUpRight, Zap, ShieldCheck, Layers, Lock, SlidersHorizontal
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type Screen = "landing"|"signin"|"dashboard"|"discovery"|"details"|"crm"|"saved"|"cv"|"coach"|"calendar"|"profile"|"settings";
const cn = (...c: (string|boolean|undefined|null)[]) => c.filter(Boolean).join(" ");

// ─── Blue Design System ───────────────────────────────────────────
const C = {
  hero: "#08152F",        // hero / footer deep navy
  midnight: "#061126",    // deepest footer
  primary: "#2457FF",     // cobalt blue — main CTA / active
  bright: "#4F7CFF",      // hover / accent
  soft: "#DCE7FF",        // chip / light bg elements
  xlight: "#EEF4FF",      // section tint
  bg: "#F8F7F3",          // page background
  text: "#10213D",        // foreground text
  muted: "#667085",       // secondary text
  success: "#18A66A",     // green ONLY for success/positive
  border: "rgba(16,33,61,0.1)",
  heroBorder: "rgba(255,255,255,0.08)",
};

// ─── Data ─────────────────────────────────────────────────────────
const OPPS = [
  { id:1, title:"Product Designer", company:"Stripe", initial:"S", color:"#635BFF", match:94, type:"job", mode:"hybrid", location:"San Francisco, CA", salary:"$140K–$180K", skills:["Figma","Design Systems","React"], deadline:"4 days left" },
  { id:2, title:"Senior Frontend Engineer", company:"Linear", initial:"L", color:"#5E6AD2", match:87, type:"job", mode:"remote", location:"Remote Worldwide", salary:"$160K–$220K", skills:["TypeScript","React 19","GraphQL"], deadline:"Active Intake" },
  { id:3, title:"UX Research Intern", company:"Google", initial:"G", color:"#4285F4", match:82, type:"internship", mode:"hybrid", location:"New York, NY", salary:"$8,500/mo", skills:["User Research","Figma","AI UX"], deadline:"Rolling" },
  { id:4, title:"Chevening Scholarship", company:"UK Government", initial:"C", color:"#0D5C3E", match:78, type:"scholarship", mode:"onsite", location:"London, UK", salary:"Full Tuition + Stipend", skills:["Leadership","Public Policy","No IELTS"], deadline:"12 days left" },
  { id:5, title:"Presidential Innovation Fellow", company:"US Federal Gov.", initial:"P", color:"#B91C1C", match:71, type:"fellowship", mode:"hybrid", location:"Washington, DC", salary:"$120K–$150K/yr", skills:["Civic Tech","AI Strategy","Leadership"], deadline:"Intake Open" },
  { id:6, title:"Staff Product Manager", company:"Figma", initial:"F", color:"#F24E1E", match:89, type:"job", mode:"remote", location:"Remote US / EMEA", salary:"$200K–$260K", skills:["Product Strategy","Figma Tokens","Growth"], deadline:"Featured" },
];
const TYPE_LABELS: Record<string,string> = { job:"Job", internship:"Internship", scholarship:"Scholarship", fellowship:"Fellowship" };
const TYPE_COLORS: Record<string,string> = { job:C.primary, internship:"#0891B2", scholarship:C.success, fellowship:"#7C3AED" };

const PIPE_STAGES = [
  { id:"saved",     label:"Saved",     col:"#94A3B8" },
  { id:"preparing", label:"Preparing", col:"#F59E0B" },
  { id:"applied",   label:"Applied",   col:C.primary },
  { id:"interview", label:"Interview", col:"#7C3AED" },
  { id:"offer",     label:"Offer",     col:C.success },
];
const PIPE_CARDS = [
  { stage:0, id:6, title:"Staff Product Manager", company:"Figma",         initial:"F", color:"#F24E1E", match:89 },
  { stage:1, id:1, title:"Product Designer",       company:"Stripe",        initial:"S", color:"#635BFF", match:94 },
  { stage:2, id:2, title:"Frontend Engineer",      company:"Linear",        initial:"L", color:"#5E6AD2", match:87 },
  { stage:3, id:3, title:"UX Research Intern",     company:"Google",        initial:"G", color:"#4285F4", match:82 },
  { stage:4, id:5, title:"Innovation Fellow",      company:"US Gov.",       initial:"P", color:"#B91C1C", match:71 },
];

const HERO_CARDS = [
  { id:0, title:"Product Designer",        company:"Stripe",      initial:"S", color:"#635BFF", match:94, location:"San Francisco", mode:"Hybrid", salary:"$140K–$180K", type:"Job" },
  { id:1, title:"Staff Product Manager",   company:"Figma",       initial:"F", color:"#F24E1E", match:89, location:"Remote",         mode:"Remote", salary:"$200K–$260K", type:"Job" },
  { id:2, title:"Senior Frontend Engineer",company:"Linear",      initial:"L", color:"#5E6AD2", match:87, location:"Remote",         mode:"Remote", salary:"$160K–$220K", type:"Job" },
  { id:3, title:"Chevening Scholarship",   company:"UK Gov.",     initial:"C", color:"#0D5C3E", match:78, location:"London, UK",     mode:"Full-time", salary:"Full Funding", type:"Scholarship" },
];

const JOURNEY_STEPS = [
  { icon:Compass,     label:"Discover",   color:C.primary, desc:"Browse 50,000+ verified roles, scholarships and fellowships — AI-ranked for your profile.", stat:"50K+ opportunities" },
  { icon:Target,      label:"Match",      color:C.bright,  desc:"Personalised match score shows fit percentage and exact skills to develop for each role.",   stat:"94% avg accuracy" },
  { icon:FileText,    label:"Prepare CV", color:"#7C3AED", desc:"AI rewrites your CV to mirror each job description's language and ATS keywords precisely.",   stat:"3× more callbacks" },
  { icon:Send,        label:"Apply",      color:"#0891B2", desc:"Submit with confidence. Your pipeline tracks every application across all platforms.",         stat:"One-click apply" },
  { icon:MessageSquare, label:"Interview",color:"#7C3AED", desc:"Practise with an AI coach that gives specific, actionable feedback after every answer.",        stat:"9/10 avg confidence" },
  { icon:Trophy,      label:"Offer",      color:C.success, desc:"Celebrate and accept. Careerly helps you evaluate, negotiate and plan your next chapter.",     stat:"2.4× higher offers" },
];
const COACH_MSGS = [
  { from:"ai",   text:"Tell me about a time you led a cross-functional team under a tight deadline." },
  { from:"user", text:"At Acme, I led 6 engineers and 2 designers to ship a checkout redesign in 3 weeks..." },
  { from:"ai",   text:"Good context. Now sharpen the outcome — what was the specific, measurable business impact?" },
  { from:"user", text:"Cart abandonment dropped 23% and we shipped 4 days early. Revenue up $800K in Q3." },
  { from:"ai",   text:"Excellent. Quantified, specific, credible. Rating: 9/10. Let's refine your delivery pace now..." },
];
const TESTIMONIALS = [
  { quote:"Careerly's match scoring told me exactly why I wasn't getting callbacks. After fixing my CV gaps, I had 4 offers in 5 weeks.", name:"Sarah Mitchell", role:"Product Manager", company:"Atlassian", initial:"SM", color:C.primary, outcome:"4 offers in 5 weeks" },
  { quote:"The Interview Coach is unlike anything I've used. I practised the exact questions Vercel asked. Walked in completely confident.", name:"James Adeyemi", role:"Senior Frontend Engineer", company:"Vercel", initial:"JA", color:C.text, outcome:"Dream job in 8 weeks" },
  { quote:"Found Chevening through Careerly at a 78% match. I'm now in London on a full UK government scholarship I didn't know existed.", name:"Priya Nair", role:"Graduate Student", company:"London School of Economics", initial:"PN", color:"#7C3AED", outcome:"Full scholarship secured" },
];

// ─── MatchRing ────────────────────────────────────────────────────
function MatchRing({ score, size=44, dark=false }: { score:number; size?:number; dark?:boolean }) {
  const r = size/2 - 4;
  const circ = 2*Math.PI*r;
  const col = score>=85 ? C.primary : score>=70 ? C.bright : "#F59E0B";
  return (
    <div className="relative flex-shrink-0" style={{ width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col+(dark?"38":"20")} strokeWidth="3.5"/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset:circ }}
          animate={{ strokeDashoffset:circ-(score/100)*circ }}
          transition={{ duration:1.5, delay:0.4, ease:[0.16,1,0.3,1] }}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-bold" style={{ fontSize:size*0.24, color:col }}>{score}%</span>
      </div>
    </div>
  );
}

// ─── Ecosystem Product Previews ───────────────────────────────────
function EcoDiscovery({ nav }: { coachIdx?: number; nav?: (s: Screen) => void }) {
  const [selectedTag, setSelectedTag] = useState<string | null>("All");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const tags = ["All", "Remote", "Tier 1 Fintech", "Design Systems", "English Waiver"];

  const items = [
    {
      id: 1,
      title: "Staff Product Designer & Systems Lead",
      company: "Stripe Worldwide",
      initial: "S",
      color: "#635BFF",
      match: 94,
      location: "San Francisco, CA (Hybrid)",
      salary: "$140K – $180K / yr",
      tier: "Tier 1 Verified",
      skills: ["Design Systems", "Figma Tokens", "React 19"],
      verified: true
    },
    {
      id: 2,
      title: "Senior Frontend & Interaction Engineer",
      company: "Linear App",
      initial: "L",
      color: "#5E6AD2",
      match: 87,
      location: "Remote Worldwide",
      salary: "$160K – $220K / yr",
      tier: "High Growth",
      skills: ["TypeScript", "Desktop Web", "GraphQL"],
      verified: true
    },
    {
      id: 3,
      title: "UX Research & Prototyping Fellow",
      company: "Google Creative Lab",
      initial: "G",
      color: "#4285F4",
      match: 82,
      location: "New York, NY (Hybrid)",
      salary: "$8,500 / mo Stipend",
      tier: "Big Tech",
      skills: ["Interaction Design", "STAR Interview", "AI UX"],
      verified: true
    }
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-5 text-white overflow-y-auto custom-scrollbar" style={{ background: "#0B1328" }}>
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3.5">
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111C38] border border-white/10 shadow-xs">
          <Search size={13} className="text-[#38BDF8] flex-shrink-0" />
          <span className="text-[12px] font-medium text-slate-200 flex-1 truncate">
            role: "Product Designer" location: "Remote / Hybrid" min: $140K
          </span>
          <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/20 text-[#38BDF8] border border-blue-400/30">
            3 Matches
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === t
                  ? "bg-[#2457FF] text-white shadow-xs"
                  : "bg-[#111C38] text-slate-400 hover:text-white border border-white/8"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunity Cards Stream */}
      <div className="space-y-2.5 flex-1">
        {items.map((item) => {
          const isHovered = hoveredCard === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => nav && nav("signin")}
              className="p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              style={{
                background: "#101B35",
                borderColor: isHovered ? "rgba(56,189,248,0.6)" : "rgba(255,255,255,0.08)",
                boxShadow: isHovered ? "0 8px 24px rgba(36,87,255,0.2)" : "none"
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[13px] font-semibold text-white group-hover:text-[#38BDF8] transition-colors truncate">
                      {item.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                      ✓ {item.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                    <span className="font-medium text-slate-200">{item.company}</span>
                    <span>·</span>
                    <span>{item.location}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-white">{item.salary}</span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {item.skills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded text-[9.5px] bg-white/5 text-slate-300 font-medium border border-white/8">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/8">
                <span className="text-[10.5px] font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                  {item.match}% Match
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#60A5FA] group-hover:translate-x-0.5 transition-transform">
                  <span>1-Click Kit</span>
                  <ArrowRight size={11} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EcoSaved() {
  const savedItems = [
    { id: 1, title: "Staff Product Designer", company: "Stripe", salary: "$140K–$180K", deadline: "Dec 15 (3 days left)", initial: "S", color: "#635BFF", match: 94, priority: "High Target", status: "Dossier Ready" },
    { id: 2, title: "Senior Frontend Engineer", company: "Linear", salary: "$160K–$220K", deadline: "Dec 20 (8 days left)", initial: "L", color: "#5E6AD2", match: 87, priority: "Tier 1", status: "Cover Letter Tailored" },
    { id: 3, title: "Chevening Scholarship", company: "UK Government", salary: "Fully Funded (£38K)", deadline: "Nov 5, 2026", initial: "C", color: "#0D5C3E", match: 78, priority: "Scholarship", status: "English Waiver Verified" },
    { id: 4, title: "Staff Product Manager", company: "Figma", salary: "$200K–$260K", deadline: "Jan 25, 2026", initial: "F", color: "#F24E1E", match: 89, priority: "Design Tools", status: "Ready to Dispatch" },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-5 text-white overflow-y-auto custom-scrollbar" style={{ background: "#0B1328" }}>
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
        <div>
          <h3 className="text-[13px] font-bold text-white">Saved Opportunities Vault (4)</h3>
          <p className="text-[10.5px] text-slate-400">Private bookmarks calibrated with automated ATS kits</p>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-500/20 text-[#38BDF8] rounded-md border border-blue-400/30">
          Batch Dispatch Active
        </span>
      </div>

      <div className="space-y-2.5 flex-1">
        {savedItems.map((o) => (
          <div key={o.id} className="p-3 rounded-xl border border-white/10 bg-[#101B35] hover:border-blue-400/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[12px] font-bold shadow-xs" style={{ background: o.color }}>
                {o.initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[12.5px] font-semibold text-white truncate">{o.title}</p>
                  <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-slate-300 border border-white/10 uppercase">
                    {o.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span className="font-medium text-slate-200">{o.company}</span>
                  <span>·</span>
                  <span>{o.salary}</span>
                  <span>·</span>
                  <span className="text-amber-400 font-semibold">{o.deadline}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0">
              <span className="text-[9.5px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                {o.status}
              </span>
              <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-[#38BDF8] border border-blue-400/30">
                {o.match}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcoPipeline() {
  const stages = [
    { id: "saved", label: "Saved", color: "#94A3B8", cards: [
      { id: 1, title: "Chevening Global Scholar", company: "UK Foreign Office", initial: "C", color: "#0D5C3E", salary: "Fully Funded", match: 78 }
    ]},
    { id: "preparing", label: "Preparing Kit", color: "#F59E0B", cards: [
      { id: 2, title: "Staff Product Manager", company: "Figma", initial: "F", color: "#F24E1E", salary: "$200K–$260K", match: 89 }
    ]},
    { id: "applied", label: "Applied", color: "#2457FF", cards: [
      { id: 3, title: "Product Designer", company: "Stripe", initial: "S", color: "#635BFF", salary: "$140K–$180K", match: 94 },
      { id: 4, title: "UX Research Intern", company: "Google", initial: "G", color: "#4285F4", salary: "$8,500/mo", match: 82 }
    ]},
    { id: "interview", label: "STAR Interview", color: "#7C3AED", cards: [
      { id: 5, title: "Senior Frontend Engineer", company: "Linear", initial: "L", color: "#5E6AD2", salary: "$160K–$220K", match: 87, date: "Dec 18 · 2:00 PM" }
    ]},
    { id: "offer", label: "Offer", color: "#18A66A", cards: [
      { id: 6, title: "Lead Systems Architect", company: "Vercel", initial: "V", color: "#10213D", salary: "$195K Base", match: 96, congrats: true }
    ]}
  ];

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border flex-shrink-0">
        <span className="text-[12px] font-bold text-foreground">Application CRM Kanban Pipeline (6 Active)</span>
        <span className="text-[9.5px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          1 Active Offer
        </span>
      </div>

      <div className="flex gap-2.5 h-full overflow-x-auto pb-2 no-scrollbar">
        {stages.map((stage) => (
          <div key={stage.id} className="w-[160px] sm:w-[175px] flex-shrink-0 flex flex-col bg-secondary/50 border border-border rounded-xl p-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-[10.5px] font-bold text-foreground">{stage.label}</span>
              </div>
              <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-card text-muted-foreground border border-border">
                {stage.cards.length}
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
              {stage.cards.map((card) => (
                <div key={card.id} className="p-2 rounded-lg bg-card border border-border shadow-2xs hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0" style={{ backgroundColor: card.color }}>
                      {card.initial}
                    </div>
                    <p className="text-[10px] font-semibold text-foreground truncate">{card.title}</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">{card.company}</p>
                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-border/50 text-[8.5px]">
                    <span className="font-mono font-bold text-foreground">{card.salary}</span>
                    <span className="font-mono font-bold text-primary">{card.match}%</span>
                  </div>
                  {card.date && (
                    <div className="mt-1 text-[8px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1 py-0.5 rounded truncate">
                      📅 {card.date}
                    </div>
                  )}
                  {card.congrats && (
                    <div className="mt-1 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded text-center">
                      🎉 Offer Extended
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcoCVStudio({ cvSection, hideInnerHeader = false }: { cvSection:number; hideInnerHeader?:boolean }) {
  const sections = [
    { id:"summary", label:"Executive Summary", score: 96, color: C.primary },
    { id:"experience", label:"Work Experience & Impact", score: 94, color: "#7C3AED" },
    { id:"skills", label:"Design Systems Taxonomy", score: 98, color: C.success },
    { id:"education", label:"Education & GPA Equivalency", score: 92, color: "#F24E1E" },
  ];
  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3 p-3.5 sm:p-4 bg-card/50 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col justify-between space-y-2.5">
        {!hideInnerHeader && (
          <div className="flex items-center justify-between pb-2 border-b border-border flex-shrink-0">
            <div>
              <p className="text-[12px] font-bold text-foreground">ATS Resume Studio · Stripe Tailoring</p>
              <p className="text-[10px] text-muted-foreground">Calibrated against Workday, Greenhouse & Lever engines</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300">ATS Score</span>
              <span className="text-[13px] font-mono font-bold text-emerald-600 dark:text-emerald-400">94/100</span>
            </div>
          </div>
        )}
        <div className="space-y-1.5 flex-1">
          {sections.map(({ id, label, score, color }, idx) => {
            const isActive = idx === cvSection;
            return (
              <div
                key={id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? "bg-card border-primary ring-2 ring-primary/20 shadow-xs"
                    : "bg-secondary/40 border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`} />
                    <span className="text-[11px] font-bold text-foreground">{label}</span>
                  </div>
                  <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{score}% ATS</span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t border-border flex items-center gap-1 flex-wrap">
          <span className="text-[9px] font-bold uppercase text-muted-foreground">Matched Keywords:</span>
          {["Design Systems", "Cross-Functional", "React 19"].map(k => (
            <span key={k} className="px-1.5 py-0.2 rounded text-[8.5px] font-medium bg-secondary text-foreground border border-border">
              ✓ {k}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-col bg-white border border-border rounded-xl p-3 text-[#10213D] shadow-2xs text-[9.5px] leading-relaxed select-none">
        <div className="border-b border-slate-200 pb-1.5 mb-1.5">
          <h4 className="font-bold text-[12px] tracking-tight uppercase text-[#10213D]">Alex Kim</h4>
          <p className="text-[9px] font-medium text-blue-600">Staff Product Designer & Systems Lead</p>
          <p className="text-[8px] text-slate-500 mt-0.5">alex.kim@email.com · San Francisco, CA</p>
        </div>
        <div className="space-y-1.5 flex-1">
          <div>
            <p className="font-bold uppercase tracking-wider text-[7.5px] text-slate-400">Summary</p>
            <p className="text-[8.5px] text-slate-700 line-clamp-2 mt-0.5">
              Experienced product systems designer with 6+ years shipping international digital platforms.
            </p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-[7.5px] text-slate-400">Experience</p>
            <p className="font-bold text-[8.5px] text-slate-900 mt-0.5">Senior Product Designer · Headspace</p>
            <p className="text-[8px] text-slate-600 line-clamp-2">
              • Led core checkout redesign increasing conversions by +23% with WCAG 94%.
            </p>
          </div>
        </div>
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[7.5px] text-slate-400 font-mono">
          <span>ISO 9001 ATS Format</span>
          <span>1-Page Clean</span>
        </div>
      </div>
    </div>
  );
}

function EcoCoach({ coachIdx, isTyping, hideInnerHeader = false }: { coachIdx:number; isTyping:boolean; hideInnerHeader?:boolean }) {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [coachIdx, isTyping]);

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden text-white" style={{ background:"#0B1328" }}>
      {!hideInnerHeader && (
        <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-white/10 flex-shrink-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-500/20 text-[#A855F7]">
            <MessageSquare size={12} />
          </div>
          <span className="text-[11.5px] font-semibold truncate text-white">Mock STAR Interview · Stripe</span>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5, repeat:Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-300">Live</span>
          </div>
        </div>
      )}
      <div ref={chatScrollRef} className="flex-1 space-y-2.5 overflow-y-auto no-scrollbar pr-1" style={{ minHeight: 280 }}>
        <AnimatePresence mode="popLayout">
          {COACH_MSGS.slice(0, coachIdx+1).map((msg, i) => (
            <motion.div key={i} layout initial={{ opacity:0, y:8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
              transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}
              className={cn("flex", msg.from==="user" ? "justify-end" : "justify-start")}>
              <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-relaxed shadow-sm"
                style={{
                  background: msg.from === "ai" ? "#101B35" : "#2457FF",
                  color: "#FFFFFF",
                  border: msg.from === "ai" ? "1px solid rgba(255,255,255,0.1)" : "none"
                }}>
                {msg.from==="ai" && <p className="text-[9.5px] font-bold mb-1 text-[#A855F7]">Career Coach (Gemini Pro)</p>}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex">
              <div className="rounded-2xl px-3.5 py-2.5 flex gap-1 bg-[#101B35] border border-white/10 shadow-sm">
                {[0,0.2,0.4].map((d,i) => (
                  <motion.div key={i} animate={{ y:[0,-4,0] }} transition={{ duration:0.6, delay:d, repeat:Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 flex-shrink-0">
        <div className="flex-1 rounded-xl px-4 py-2.5 text-[13px] bg-[#101B35] border border-white/10 text-slate-300">
          Type your STAR response or press record...
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md bg-[#7C3AED] hover:bg-[#6D28D9] transition-all cursor-pointer">
          <Mic size={16}/>
        </div>
      </div>
    </div>
  );
}

function EcoCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i+1);
  const highlights: Record<number,string> = { 15:"#EF4444", 18:"#2457FF", 20:"#F59E0B", 23:"#10B981" };
  return (
    <div className="h-full overflow-hidden p-4 text-white" style={{ background:"#0B1328" }}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
        <span className="text-[12px] font-bold text-white">December 2026</span>
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"><ChevronLeft size={14}/></div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"><ChevronRight size={14}/></div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <div key={d} className="text-center text-[8px] font-bold py-1 text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-4">
        {[0,1,2,3,4,5].map(i => <div key={`e${i}`}/>)}
        {days.map(d => (
          <div key={d} className="text-center text-[11px] py-2 rounded-lg cursor-pointer font-medium transition-all"
            style={{
              color: highlights[d] ? "#fff" : d === 9 ? "#38BDF8" : "#CBD5E1",
              background: highlights[d] ?? (d === 9 ? "rgba(36,87,255,0.25)" : "transparent"),
              fontWeight: d === 9 || highlights[d] ? 700 : 400
            }}>
            {d}
          </div>
        ))}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-2 text-slate-400">Upcoming Calibrated Milestones</p>
      <div className="space-y-1.5">
        {[
          { date:"Dec 15", label:"Stripe Application Deadline", dot:"#EF4444" },
          { date:"Dec 18", label:"Google Interview · 2pm GMT", dot:"#2457FF" },
          { date:"Dec 20", label:"Linear Application Due", dot:"#F59E0B" },
        ].map(e => (
          <div key={e.date} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#101B35] border border-white/8">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:e.dot }}/>
            <span className="text-[9.5px] font-semibold text-white">{e.label}</span>
            <span className="text-[8.5px] font-mono ml-auto text-slate-400">{e.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcoProfile() {
  return (
    <div className="h-full overflow-hidden p-5 text-white" style={{ background:"#0B1328" }}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[14px] bg-[#2457FF] shadow-xs">AK</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white">Alex Kim</p>
          <p className="text-[11px] text-slate-400">Product Designer · 5 years exp.</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[17px] font-bold font-mono text-emerald-400">94%</p>
          <p className="text-[9px] text-slate-400">avg match</p>
        </div>
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-2 text-slate-400">Core Verified Skills</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["Figma","Design Systems","React 19","User Research","Motion Design"].map(s => (
          <span key={s} className="text-[9.5px] font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-[#38BDF8] border border-blue-400/20">{s}</span>
        ))}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-2 text-slate-400">Target Roles Calibrated</p>
      <div className="space-y-2">
        {[
          { role:"Senior Product Designer", companies:"Stripe, Figma, Linear", match:94 },
          { role:"Head of Design", companies:"Series B–C startups", match:80 },
        ].map(r => (
          <div key={r.role} className="flex items-center justify-between p-2.5 rounded-xl bg-[#101B35] border border-white/8">
            <div>
              <p className="text-[11px] font-semibold text-white">{r.role}</p>
              <p className="text-[9.5px] text-slate-400">{r.companies}</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-[#38BDF8] border border-blue-400/30">{r.match}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ECO_ITEMS = [
  { icon:Compass,      label:"Discovery",  color:C.primary,  Preview:(p:any) => <EcoDiscovery {...p}/> },
  { icon:Bookmark,     label:"Saved",      color:"#0891B2",  Preview:() => <EcoSaved/> },
  { icon:FolderKanban, label:"Pipeline",   color:"#7C3AED",  Preview:() => <EcoPipeline/> },
  { icon:FileText,     label:"CV Studio",  color:"#F24E1E",  Preview:(p:any) => <EcoCVStudio {...p}/> },
  { icon:MessageSquare,label:"Coach",      color:"#7C3AED",  Preview:(p:any) => <EcoCoach {...p}/> },
  { icon:Calendar,     label:"Calendar",   color:"#0891B2",  Preview:() => <EcoCalendar/> },
  { icon:User,         label:"Profile",    color:"#92400E",  Preview:() => <EcoProfile/> },
];

// ─── Main Component ───────────────────────────────────────────────
export function LandingPage({ nav }: { nav:(s:Screen)=>void }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness:60, damping:16 });
  const springY = useSpring(mouseY, { stiffness:60, damping:16 });
  const c0x = useTransform(springX, v=>v*14);  const c0y = useTransform(springY, v=>v*14);
  const c1x = useTransform(springX, v=>v*-18); const c1y = useTransform(springY, v=>v*-18);
  const c2x = useTransform(springX, v=>v*10);  const c2y = useTransform(springY, v=>v*10);
  const c3x = useTransform(springX, v=>v*-8);  const c3y = useTransform(springY, v=>v*-8);
  const dashX = useTransform(springX, v=>v*4);  const dashY = useTransform(springY, v=>v*4);

  const heroRef = useRef<HTMLDivElement>(null);
  function onHeroMouse(e: React.MouseEvent<HTMLDivElement>) {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set(((e.clientX-r.left)/r.width-0.5)*2);
    mouseY.set(((e.clientY-r.top)/r.height-0.5)*2);
  }

  const [hoveredHeroCard, setHoveredHeroCard] = useState<number|null>(null);
  const [typeFilter, setTypeFilter] = useState<string|null>(null);
  const [modeFilter, setModeFilter] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoverOpp, setHoverOpp] = useState<number|null>(null);
  const [savedOpps, setSavedOpps] = useState<Set<number>>(new Set([1,4]));
  const [pipePos, setPipePos] = useState(1);
  const [activeEco, setActiveEco] = useState(0);
  const [journeyStep, setJourneyStep] = useState(0);
  const [coachIdx, setCoachIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [cvSection, setCvSection] = useState(0);
  const [celebrateOffer, setCelebrateOffer] = useState(false);

  useEffect(() => {
    const t = setInterval(()=>setJourneyStep(s=>(s+1)%6), 3500);
    return ()=>clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(()=>{
      setIsTyping(true);
      setTimeout(()=>{ setIsTyping(false); setCoachIdx(i=>(i+1)%COACH_MSGS.length); }, 1200);
    }, 3800);
    return ()=>clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(()=>setCvSection(i=>(i+1)%4), 2800);
    return ()=>clearInterval(t);
  }, []);

  function advancePipe(dir: 1|-1) {
    const next = Math.max(0, Math.min(4, pipePos+dir));
    setPipePos(next);
    if (next===4) { setCelebrateOffer(true); setTimeout(()=>setCelebrateOffer(false), 2000); }
  }

  const filteredOpps = OPPS.filter(o => {
    if (typeFilter && o.type!==typeFilter) return false;
    if (modeFilter && o.mode!==modeFilter) return false;
    if (searchQuery && !o.title.toLowerCase().includes(searchQuery.toLowerCase()) && !o.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const toggleSave = (id:number) => setSavedOpps(s=>{ const ns=new Set(s); ns.has(id)?ns.delete(id):ns.add(id); return ns; });

  // Floating hero card positions
  const cardPositions = [
    { top:"6%",   left:"-2%",  floatDir:1,  floatAmp:14, floatDur:4.6 },
    { top:"56%",  right:"-3%", floatDir:-1, floatAmp:12, floatDur:5.3 },
    { top:"-4%",  right:"10%", floatDir:1,  floatAmp:9,  floatDur:3.9 },
    { top:"76%",  left:"8%",   floatDir:-1, floatAmp:10, floatDur:4.8 },
  ];
  const parallaxXArr = [c0x, c1x, c2x, c3x];
  const parallaxYArr = [c0y, c1y, c2y, c3y];

  // Scroll detection for animated fixed navbar
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background:C.bg, fontFamily:"var(--font-sans)", color:C.text }}>

      {/* ── Navigation (Fixed with smooth scroll animations) ──────── */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -60, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          height: isScrolled ? "64px" : "80px",
          backgroundColor: isScrolled ? "rgba(248,247,243,0.92)" : "rgba(248,247,243,0.98)",
          boxShadow: isScrolled 
            ? "0 8px 24px -4px rgba(16, 33, 61, 0.08), 0 2px 6px -1px rgba(16, 33, 61, 0.04)" 
            : "none",
          borderBottomColor: isScrolled ? "rgba(16,33,61,0.12)" : "rgba(16,33,61,0.06)"
        }}
        transition={{ 
          height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
          backgroundColor: { duration: 0.25 },
          boxShadow: { duration: 0.25 }
        }}
        style={{ 
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid"
        }}
      >
        <div className="w-full px-6 sm:px-10 lg:px-14 h-full flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 min-w-0">
            {/* Logo pinned all the way to the left */}
            <motion.div 
              className="flex items-center gap-3 cursor-pointer flex-shrink-0" 
              onClick={()=>nav("landing")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img src="/careerly-logo.png" alt="Careerly" className="w-8 sm:w-9 h-8 sm:h-9 object-contain flex-shrink-0" />
              <span className="text-[19px] sm:text-[20px] font-bold tracking-tight" style={{ color:C.text }}>Careerly</span>
            </motion.div>

            {/* Nav links */}
            <div className="hidden lg:flex items-center gap-6">
              {[
                { 
                  name: "Features", 
                  action: () => {
                    const el = document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } 
                },
                { 
                  name: "CV Studio", 
                  action: () => {
                    setActiveEco(3);
                    const el = document.getElementById("prepare-section") || document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } 
                },
                { 
                  name: "Interview Coach", 
                  action: () => {
                    setActiveEco(4);
                    const el = document.getElementById("prepare-section") || document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } 
                },
                { 
                  name: "Pipeline CRM", 
                  action: () => {
                    setActiveEco(2);
                    const el = document.getElementById("pipeline-section") || document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } 
                },
                { 
                  name: "How It Works", 
                  action: () => {
                    const el = document.getElementById("journey-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } 
                },
                { 
                  name: "Stories", 
                  action: () => {
                    const el = document.getElementById("stories-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } 
                }
              ].map(item => (
                <button 
                  key={item.name} 
                  onClick={item.action} 
                  className="text-[14.5px] font-medium transition-colors cursor-pointer"
                  style={{ color:C.muted }}
                  onMouseEnter={e=>(e.currentTarget.style.color=C.text)}
                  onMouseLeave={e=>(e.currentTarget.style.color=C.muted)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={()=>nav("signin")} className="hidden sm:block text-[14.5px] font-semibold px-3.5 py-2 transition-colors whitespace-nowrap cursor-pointer" style={{ color:C.muted }}
              onMouseEnter={e=>(e.currentTarget.style.color=C.text)}
              onMouseLeave={e=>(e.currentTarget.style.color=C.muted)}>Sign In</button>
            <motion.button onClick={()=>nav("signup")} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.96 }}
              className="text-[14px] font-bold px-5 py-2.5 rounded-xl text-white whitespace-nowrap shadow-md cursor-pointer"
              style={{ background:C.primary, boxShadow:`0 4px 14px ${C.primary}40` }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 6px 24px ${C.primary}60`; e.currentTarget.style.background=C.bright; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 4px 14px ${C.primary}40`; e.currentTarget.style.background=C.primary; }}>
              Get Started <ArrowRight size={14} className="inline ml-1 -mt-0.5"/>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section ref={heroRef} onMouseMove={onHeroMouse} onMouseLeave={()=>{ mouseX.set(0); mouseY.set(0); }}
        className="relative overflow-hidden w-full sm:min-h-[90vh] flex items-center justify-center pt-20" style={{ background:C.hero }}>

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage:`radial-gradient(circle,rgba(255,255,255,0.6) 1px,transparent 1px)`, backgroundSize:"28px 28px" }}/>

        {/* Blue atmospheric glows */}
        <div className="absolute pointer-events-none" style={{ top:"5%", right:"12%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${C.primary}28 0%,transparent 70%)`, filter:"blur(60px)" }}/>
        <div className="absolute pointer-events-none" style={{ bottom:"0%", left:"3%", width:380, height:380, borderRadius:"50%", background:`radial-gradient(circle,${C.bright}18 0%,transparent 70%)`, filter:"blur(55px)" }}/>
        <div className="absolute pointer-events-none" style={{ top:"35%", left:"30%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,${C.primary}10 0%,transparent 70%)`, filter:"blur(45px)" }}/>

        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 xl:px-16 py-12 sm:py-16 lg:py-20 flex items-center justify-between min-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-[490px_1fr] xl:grid-cols-[530px_1fr] gap-10 xl:gap-14 items-center w-full justify-between">

            {/* LEFT: Pushed all the way to the left */}
            <div>
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-8"
                style={{ borderColor:"rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)" }}>
                <motion.span animate={{ scale:[1,1.35,1], opacity:[1,0.5,1] }} transition={{ duration:2.2, repeat:Infinity }}
                  className="w-1.5 h-1.5 rounded-full" style={{ background:C.primary }}/>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color:"rgba(255,255,255,0.5)" }}>Career Operating System</span>
              </motion.div>

              <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.7, delay:0.08, ease:[0.16,1,0.3,1] }}
                className="font-display font-bold leading-[1.02] tracking-[-0.03em] text-white mb-6 break-words"
                style={{ fontSize:"clamp(48px,8vw,78px)" }}>
                Every career<br/>opportunity,<br/>
                <em style={{ color:`${C.bright}`, fontStyle:"italic" }}>managed.</em>
              </motion.h1>

              <motion.p initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.55, delay:0.18, ease:[0.16,1,0.3,1] }}
                className="text-[16px] leading-[1.78] mb-10 max-w-[440px]" style={{ color:"rgba(255,255,255,0.5)" }}>
                Discover jobs, internships, scholarships and fellowships. Match, prepare, apply and succeed — all in one intelligent workspace.
              </motion.p>

              <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.27, ease:[0.16,1,0.3,1] }}
                className="flex flex-wrap items-center gap-3.5 mb-8 sm:mb-14">
                <motion.button onClick={()=>nav("signup")} whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.96 }}
                  className="flex items-center gap-2 px-6 py-3.5 text-white text-[14.5px] font-bold rounded-xl cursor-pointer"
                  style={{ background:C.primary, boxShadow:`0 4px 22px ${C.primary}55` }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=C.bright; e.currentTarget.style.boxShadow=`0 8px 36px ${C.primary}70`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=C.primary; e.currentTarget.style.boxShadow=`0 4px 22px ${C.primary}55`; }}>
                  Get Started Free <ArrowRight size={14}/>
                </motion.button>
                <motion.button onClick={() => {
                  const el = document.getElementById("platform-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}
                  className="flex items-center gap-2 px-6 py-3.5 text-[14.5px] font-semibold rounded-xl transition-all cursor-pointer"
                  style={{ color:"rgba(255,255,255,0.75)", border:"1px solid rgba(255,255,255,0.15)" }}
                  onMouseEnter={e=>{ e.currentTarget.style.color="rgba(255,255,255,1)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.color="rgba(255,255,255,0.75)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"; }}>
                  Explore Platform
                </motion.button>
              </motion.div>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.6, delay:0.42 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-8 pt-6 sm:pt-8 pb-6 sm:pb-0" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                {[["50K+","Opportunities"],["15K+","Companies"],["87%","Success Rate"],["4.9★","Rating"]].map(([n,l],i) => (
                  <motion.div key={l} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.4, delay:0.48+i*0.07 }}>
                    <p className="text-[20px] sm:text-[22px] font-bold font-mono text-white leading-none">{n}</p>
                    <p className="text-[11px] mt-1" style={{ color:"rgba(255,255,255,0.4)" }}>{l}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT: Constellation & Mock Dashboard (Cards close to dashboard) */}
            <motion.div initial={{ opacity:0, x:52 }} animate={{ opacity:1, x:0 }}
              transition={{ duration:0.9, delay:0.14, ease:[0.16,1,0.3,1] }}
              className="hidden lg:flex items-center justify-center relative w-full h-[580px]">

              <div className="relative w-[640px] h-[430px]">

                {/* SVG constellation lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:15 }}>
                  {[
                    { x1:"-2%", y1:"0%", x2:"48%", y2:"48%" },
                    { x1:"98%", y1:"0%", x2:"52%", y2:"48%" },
                    { x1:"98%", y1:"98%", x2:"52%", y2:"52%" },
                    { x1:"-2%", y1:"98%", x2:"48%", y2:"52%" },
                  ].map((line, i) => (
                    <motion.line key={i} {...line} stroke={`${C.primary}`} strokeWidth="0.9" strokeOpacity="0.3"
                      strokeDasharray="5 5"
                      animate={{ strokeDashoffset:[0,-20] }}
                      transition={{ duration:2.5+i*0.4, repeat:Infinity, ease:"linear" }}/>
                  ))}
                </svg>

                {/* Central dashboard */}
                <motion.div
                  style={{ x:dashX, y:dashY, border:`1px solid rgba(255,255,255,0.12)`, boxShadow:"0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)" }}
                  animate={{ y:[0,-6,0] }} transition={{ duration:7.5, repeat:Infinity, ease:"easeInOut" }}
                  className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  <div className="h-10 flex items-center px-4 gap-2.5" style={{ background:"#1E2D3E", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex gap-1.5">
                      {[0,1,2].map(i=><div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background:"rgba(255,255,255,0.15)" }}/>)}
                    </div>
                    <div className="flex-1 mx-3 h-6 rounded flex items-center px-3 gap-2" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background:"rgba(255,255,255,0.2)" }}/>
                      <span className="text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.45)" }}>app.careerly.io/dashboard</span>
                    </div>
                  </div>
                  <div className="flex" style={{ height:"calc(100% - 40px)", background:C.bg }}>
                    <div className="flex flex-col py-4 px-3 flex-shrink-0" style={{ width:145, background:"#fff", borderRight:`1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2.5 px-2 py-1 mb-4">
                        <img src="/careerly-logo.png" alt="Careerly" className="w-6 h-6 object-contain flex-shrink-0" />
                        <span style={{ fontSize:12, fontWeight:700, color:C.text }}>Careerly</span>
                      </div>
                      {[["Dashboard",true],["Discover",false],["Applications",false],["Saved",false],["CV Studio",false],["Coach",false]].map(([l,a])=>(
                        <div key={l as string} style={{ padding:"6px 10px", borderRadius:7, fontSize:10.5, fontWeight:500, marginBottom:3, cursor:"pointer", background:a?C.primary:"transparent", color:a?"#fff":C.muted }}>
                          {l as string}
                        </div>
                      ))}
                      <div className="mt-auto pt-3 flex items-center gap-2 px-1" style={{ borderTop:`1px solid ${C.border}` }}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold" style={{ background:C.primary }}>AK</div>
                        <div className="min-w-0"><p style={{ fontSize:10, fontWeight:600, color:C.text, lineHeight:1.1 }} className="truncate">Alex Kim</p><p style={{ fontSize:8, color:C.muted }}>Open to work</p></div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden" style={{ padding:16 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom:14 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Good morning, Alex 👋</p>
                        <p style={{ fontSize:10, fontFamily:"monospace", color:C.muted }}>Dec 9, 2024</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2" style={{ marginBottom:14 }}>
                        {[["12","Active",C.primary],["4","Applied",C.bright],["2","Offers","#7C3AED"],["84%","Match",C.success]].map(([n,l,c])=>(
                          <div key={l as string} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 10px" }}>
                            <p style={{ fontSize:17, fontWeight:700, fontFamily:"monospace", color:c as string, lineHeight:1 }}>{n}</p>
                            <p style={{ fontSize:8.5, color:C.muted, marginTop:2 }}>{l}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Recommended for you</p>
                      {OPPS.slice(0,4).map(o=>(
                        <div key={o.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 8px", borderRadius:10, cursor:"pointer", marginBottom:3, transition:"background 0.15s" }}
                          onMouseEnter={e=>(e.currentTarget.style.background="#fff")}
                          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                          <div style={{ width:24, height:24, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:700, background:o.color }}>{o.initial}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:11, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.title}</p>
                            <p style={{ fontSize:8.5, color:C.muted }}>{o.company}</p>
                          </div>
                          <span style={{ fontSize:8.5, fontFamily:"monospace", fontWeight:700, padding:"2px 6px", borderRadius:5, background:C.xlight, color:C.primary, flexShrink:0 }}>{o.match}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Floating Opportunity Cards positioned at the 4 outer corner pockets */}
                {HERO_CARDS.map((card, i) => {
                  const pos = [
                    // Card 0: Product Designer (Stripe) -> Top-Left outer corner pocket
                    { top:"-45px", left:"-50px", floatDir:1, floatAmp:8, floatDur:4.6 },
                    // Card 1: Staff Product Manager (Figma) -> Bottom-Right outer corner pocket
                    { bottom:"-40px", right:"-35px", floatDir:-1, floatAmp:8, floatDur:5.3 },
                    // Card 2: Senior Frontend Engineer (Linear) -> Top-Right outer corner pocket
                    { top:"-50px", right:"-35px", floatDir:1, floatAmp:7, floatDur:3.9 },
                    // Card 3: Chevening Scholarship (UK Gov) -> Bottom-Left outer corner pocket
                    { bottom:"-40px", left:"-50px", floatDir:-1, floatAmp:8, floatDur:4.8 },
                  ][i];
                  const isHov = hoveredHeroCard===i;
                  return (
                    <motion.div key={card.id}
                      style={{ x:parallaxXArr[i], y:parallaxYArr[i], position:"absolute", top:pos.top, left:(pos as any).left, right:(pos as any).right, bottom:(pos as any).bottom, zIndex:isHov?35:25 }}>
                      <motion.div
                        animate={{ y:[0, pos.floatDir*pos.floatAmp, 0] }}
                        transition={{ duration:pos.floatDur, repeat:Infinity, ease:"easeInOut" }}>
                        <motion.div
                          onMouseEnter={()=>setHoveredHeroCard(i)}
                          onMouseLeave={()=>setHoveredHeroCard(null)}
                          whileHover={{ scale:1.05 }}
                          transition={{ duration:0.2 }}
                          style={{
                            cursor:"pointer",
                            background:"#091738",
                            border:`1px solid ${isHov ? C.primary : "rgba(255,255,255,0.14)"}`,
                            boxShadow: isHov ? `0 20px 48px ${C.primary}40, 0 0 0 1px ${C.primary}` : "0 18px 40px rgba(0,0,0,0.65)"
                          }}
                          className="rounded-2xl p-4 w-52">
                          <div className="flex items-start gap-2.5 mb-2.5">
                            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-xs" style={{ background:card.color }}>{card.initial}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-white truncate">{card.title}</p>
                              <p className="text-[10px] text-white/60 truncate">{card.company}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="text-[10px] text-white/50">{card.type} · {card.mode}</span>
                            <MatchRing score={card.match} size={36} dark/>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  );
                })}

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Ecosystem Command Center (CareerlyOS) ─────────────────── */}
      <section id="platform-section" className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}` }}>
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background:C.xlight, color:C.primary, border:`1px solid ${C.soft}` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:C.primary }}/>
                <span>CAREERLY OS v2.4</span>
              </div>
            </div>
            <h2 className="text-[24px] sm:text-[34px] font-bold leading-tight mb-2" style={{ color:C.text }}>The complete career operating system.</h2>
            <p className="text-[14px] sm:text-[15px]" style={{ color:C.muted }}>A unified desktop-grade suite of seven interconnected intelligence engines — designed to replace 10 disjointed career tools.</p>
          </motion.div>

          {/* Desktop OS Window Frame */}
          <div className="rounded-2xl sm:rounded-3xl border overflow-hidden flex flex-col shadow-[0_25px_60px_-15px_rgba(8,21,47,0.25)]"
            style={{ background:"#0B1328", borderColor:"rgba(255,255,255,0.12)" }}>
            
            {/* OS Window Chrome Titlebar */}
            <div className="h-11 px-4 flex items-center justify-between gap-3 select-none flex-shrink-0"
              style={{ background:"#070D1C", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-2xs" />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold border-l pl-3"
                  style={{ color:"#94A3B8", borderColor:"rgba(255,255,255,0.1)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background:"#10B981" }}/>
                  <span className="text-white">CareerlyOS</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-950/80 text-[#38BDF8] border border-blue-800/60">v2.4 PRO</span>
                </div>
              </div>

              {/* Dynamic OS Address / Search Pill */}
              <div className="flex-1 max-w-md mx-2 h-7 rounded-lg flex items-center justify-between px-3 text-[11px] font-mono shadow-2xs"
                style={{ background:"#111C38", border:"1px solid rgba(255,255,255,0.08)", color:"#94A3B8" }}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ECO_ITEMS[activeEco].color }} />
                  <span className="font-medium truncate text-slate-200">app.careerly.io/{ECO_ITEMS[activeEco].label.toLowerCase().replace(" ", "-")}</span>
                </div>
                <span className="hidden md:inline text-[11px] px-2.5 py-1 font-semibold rounded-md bg-white/10 border border-white/15 text-slate-300 hover:text-white">⌘K Quick Switch</span>
              </div>

              {/* Right Status Badges */}
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  ⚡ 14ms Gemini Flash
                </span>
                <span className="text-[11px] font-mono font-semibold text-white">10:42 AM</span>
              </div>
            </div>

            {/* OS Workspace Body with Side App Dock & Active View */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[460px]">
              {/* OS App Dock / Sidebar */}
              <div className="border-b lg:border-b-0 lg:border-r p-3 flex flex-row lg:flex-col justify-between gap-1.5 overflow-x-auto lg:overflow-y-auto no-scrollbar"
                style={{ background:"#070C1A", borderColor:"rgba(255,255,255,0.08)" }}>
                <div className="flex flex-row lg:flex-col gap-1.5 flex-1">
                  <p className="hidden lg:block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 text-slate-400">
                    System Engines
                  </p>
                  {ECO_ITEMS.map((item, i) => {
                    const isActive = activeEco === i;
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveEco(i)}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-left flex-shrink-0 transition-all cursor-pointer"
                        style={{
                          background: isActive ? "#2457FF" : "rgba(255,255,255,0.03)",
                          borderColor: isActive ? "#2457FF" : "rgba(255,255,255,0.06)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          boxShadow: isActive ? "0 4px 16px rgba(36,87,255,0.35)" : "none",
                          color: isActive ? "#ffffff" : "#CBD5E1"
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{
                            backgroundColor: isActive ? "rgba(255,255,255,0.2)" : `${item.color}22`,
                            color: isActive ? "#ffffff" : item.color
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold truncate leading-tight">{item.label}</p>
                          <p className="text-[9px] truncate mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.8)" : "#94A3B8" }}>
                            {item.sublabel}
                          </p>
                        </div>
                        {isActive && <ChevronRight size={13} className="ml-auto opacity-75 hidden lg:block text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* OS System Telemetry Footer (Desktop only) */}
                <div className="hidden lg:block pt-3 border-t mt-2 space-y-1.5 text-[10px]" style={{ borderColor:"rgba(255,255,255,0.08)" }}>
                  <div className="flex justify-between text-slate-400">
                    <span>ATS Scraper Pipeline</span>
                    <span className="font-mono font-bold text-emerald-400">99.8% Online</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden bg-white/10">
                    <div className="h-full rounded-full bg-emerald-500 w-[94%]" />
                  </div>
                </div>
              </div>

              {/* OS Active Canvas Viewport */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-[420px]" style={{ background:"#0B1328" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeEco}
                    initial={{ opacity: 0, scale: 0.98, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 h-full"
                  >
                    {activeEco === 0 && <EcoDiscovery coachIdx={coachIdx} nav={nav} />}
                    {activeEco === 1 && <EcoSaved />}
                    {activeEco === 2 && <EcoPipeline />}
                    {activeEco === 3 && <EcoCVStudio cvSection={cvSection} />}
                    {activeEco === 4 && <EcoCoach coachIdx={coachIdx} isTyping={isTyping} />}
                    {activeEco === 5 && <EcoCalendar />}
                    {activeEco === 6 && <EcoProfile />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>

                  {/* ── Discovery (ui-ux-pro-max enhanced) ──────────────────── */}
      <section id="discovery-section" className="py-16 sm:py-24 relative overflow-hidden" style={{ borderBottom: `1px solid ${C.border}`, background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F8FAFC 100%)" }}>
        
        {/* Soft Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[300px] bg-gradient-to-b from-[#2457FF]/6 via-[#2457FF]/2 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Section Header with Telemetry Badges */}
          <div className="mb-10 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest font-mono">Live Intelligence Radar</span>
                <span className="text-[11px] text-blue-300 font-medium">·</span>
                <span className="text-[11px] font-semibold text-blue-600">50,000+ Verified Postings</span>
              </div>

              {/* Real-Time Telemetry Ticker */}
              <div className="hidden lg:flex items-center gap-3 text-[12px] font-medium text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                <span className="flex items-center gap-1 text-slate-700 font-semibold"><Zap size={13} className="text-amber-500" /> 48 New Today</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-slate-700 font-semibold"><ShieldCheck size={13} className="text-emerald-600" /> 99.8% Link Health</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-slate-700 font-semibold"><Globe size={13} className="text-blue-600" /> 140+ Countries</span>
              </div>
            </div>

            <h2 className="text-[28px] sm:text-[38px] font-extrabold text-[#0B1528] tracking-tight leading-tight mb-2.5 font-display">
              Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2457FF] via-[#4F7CFF] to-[#7C3AED]">calibrated opportunity</span>.
            </h2>
            <p className="text-[15px] sm:text-[16px] text-slate-600 max-w-2xl">
              Real-time opportunity engine aggregating Tier 1 tech roles, full international scholarships, and prestige fellowships — calibrated directly to your skills.
            </p>
          </div>

          {/* Interactive Search & Filter Command Console */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] mb-8 space-y-4">
            
            {/* Primary Search Input Row */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3 bg-slate-50/90 hover:bg-slate-50 focus-within:bg-white border border-slate-200 focus-within:border-[#2457FF] focus-within:ring-2 focus-within:ring-[#2457FF]/10 transition-all shadow-inner">
                <Search size={18} className="text-[#2457FF] flex-shrink-0" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Search by role ("Staff Product Designer"), company ("Linear", "Stripe"), or keyword ("Chevening", "Remote")...'
                  className="flex-1 bg-transparent text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                )}
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-white border border-slate-200 shadow-2xs">
                  ⌘K
                </span>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => nav("signin")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold cursor-pointer shadow-sm transition-all flex-shrink-0"
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Advanced</span> Filters
              </motion.button>
            </div>

            {/* Filter Pills Console: Category Types & Modality */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pt-3 border-t border-slate-100">
              
              {/* Category Types */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Type</span>
                {[
                  { id: null, label: "All Types", count: OPPS.length },
                  { id: "job", label: "💼 Jobs", count: OPPS.filter(o=>o.type==="job").length },
                  { id: "internship", label: "🎓 Internships", count: OPPS.filter(o=>o.type==="internship").length },
                  { id: "scholarship", label: "🏛️ Scholarships", count: OPPS.filter(o=>o.type==="scholarship").length },
                  { id: "fellowship", label: "🌐 Fellowships", count: OPPS.filter(o=>o.type==="fellowship").length },
                ].map(t => {
                  const isActive = typeFilter === t.id;
                  return (
                    <motion.button
                      key={String(t.id)}
                      onClick={() => setTypeFilter(t.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        isActive
                          ? "bg-[#2457FF] text-white border-[#2457FF] shadow-sm shadow-[#2457FF]/30 font-bold"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span>{t.label}</span>
                      <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {t.count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Modality Segmented Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Mode</span>
                {[
                  { id: null, label: "All" },
                  { id: "remote", label: "🌍 Remote" },
                  { id: "hybrid", label: "🏢 Hybrid" },
                  { id: "onsite", label: "📍 On-site" }
                ].map(m => {
                  const isActive = modeFilter === m.id;
                  return (
                    <motion.button
                      key={String(m.id)}
                      onClick={() => setModeFilter(m.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 rounded-xl text-[12.5px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {m.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Cards Bento Grid (3 Columns) */}
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(filteredOpps.length > 0 ? filteredOpps : OPPS).map((o, i) => (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setHoverOpp(o.id)}
                  onMouseLeave={() => setHoverOpp(null)}
                  onClick={() => nav("signin")}
                  className="group bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_40px_rgba(36,87,255,0.12)] hover:border-[#2457FF]/40 transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  {/* Top Ambient Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2457FF]/4 via-transparent to-[#7C3AED]/4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div>
                    {/* Header: Company Monogram + Title + Heart */}
                    <div className="flex items-start gap-3.5 mb-3.5 relative z-10">
                      <div 
                        className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[14px] font-extrabold shadow-sm"
                        style={{ backgroundColor: o.color }}
                      >
                        {o.initial}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-bold text-slate-700 truncate">{o.company}</p>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <CheckCircle2 size={10} className="text-emerald-600" /> Verified
                          </span>
                        </div>
                        <h4 className="text-[15.5px] font-bold text-slate-900 group-hover:text-[#2457FF] transition-colors leading-snug truncate mt-0.5">
                          {o.title}
                        </h4>
                      </div>

                      <motion.button 
                        onClick={e => { e.stopPropagation(); nav("signin"); }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.85 }}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:rose-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-2xs flex-shrink-0"
                        title="Save to Vault"
                      >
                        <Heart size={14} fill="none" />
                      </motion.button>
                    </div>

                    {/* Metadata Badges: Type + Modality + Location */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3.5 relative z-10">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                        o.type === 'job' ? 'bg-blue-50 text-blue-700 border-blue-200/80' :
                        o.type === 'internship' ? 'bg-cyan-50 text-cyan-700 border-cyan-200/80' :
                        o.type === 'scholarship' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                        'bg-purple-50 text-purple-700 border-purple-200/80'
                      }`}>
                        {TYPE_LABELS[o.type] || o.type.toUpperCase()}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg capitalize">
                        <Globe size={11} className="text-slate-400" />
                        {o.mode}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg truncate max-w-[150px]">
                        <MapPin size={11} className="text-slate-400" />
                        {o.location}
                      </span>
                    </div>

                    {/* Skills Tag Pills */}
                    {o.skills && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-4 relative z-10">
                        {o.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/60 transition-colors">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Compensation + Match Score Ring Footer */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Fit & Comp</p>
                      <p className="text-[14px] font-bold font-mono text-slate-900 mt-0.5">{o.salary}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <MatchRing score={o.match} size={42} />
                    </div>
                  </div>

                  {/* Hover Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11.5px] font-bold text-[#2457FF] opacity-85 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 text-slate-400 font-normal">
                      <Clock size={12} /> {o.deadline || "Active Intake"}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      1-Click Kit <ArrowRight size={13} />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Empty Filter State */}
          {filteredOpps.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm mt-4 p-8 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2457FF] flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <h4 className="text-[16px] font-bold text-slate-900">No opportunities match the selected filters</h4>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto">Try clearing search terms or resetting category filters to view all listings.</p>
              <button 
                onClick={() => { setTypeFilter(null); setModeFilter(null); setSearchQuery(""); }}
                className="px-5 py-2.5 bg-[#2457FF] text-white text-[13px] font-bold rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Luxury Floating Signup CTA Dock */}
          <div className="mt-12 rounded-2xl p-6 sm:p-7 bg-[#070E20] border border-white/10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#2457FF]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#2457FF]/20 border border-[#2457FF]/40 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                <Lock size={22} className="text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[17px] font-bold text-white tracking-tight">Unlock Full 50,000+ Opportunity Database</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10.5px] font-bold font-mono">
                    LIVE RADAR ACTIVE
                  </span>
                </div>
                <p className="text-[13px] text-slate-300 mt-1 max-w-xl">
                  Create your free profile to access calibrated affinity match scores, 1-click tailored application dossiers, and real-time intake deadlines.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto justify-end relative z-10">
              <motion.button 
                onClick={() => nav("signin")} 
                whileHover={{ scale: 1.03 }} 
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-[#2457FF] hover:bg-[#1d48d8] text-white text-[15px] font-bold rounded-xl shadow-[0_4px_20px_rgba(36,87,255,0.45)] hover:shadow-[0_8px_25px_rgba(36,87,255,0.6)] transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Sign In to View All 50,000+</span>
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </div>

        </div>
      </section>


      {/* ── Pipeline ──────────────────────────────────────────────── */}
      <section id="pipeline-section" className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:"#fff" }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 items-start">
            <motion.div initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-px" style={{ background:C.primary }}/>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color:C.primary }}>Pipeline</p>
              </div>
              <h2 className="text-[22px] sm:text-[28px] font-bold leading-tight mb-4" style={{ color:C.text }}>Track every application from save to offer.</h2>
              <p className="text-[14px] leading-relaxed mb-8" style={{ color:C.muted }}>Five stages. Every application always visible. Move cards, set reminders, see your entire pipeline at a glance.</p>
              <div className="space-y-3 mb-8">
                {PIPE_STAGES.map(({ id, label, col }, si) => (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:col }}/>
                    <span className="text-[13px] font-medium flex-1" style={{ color:C.text }}>{label}</span>
                    <span className="text-[11px] font-mono font-bold" style={{ color:si===pipePos?col:C.muted }}>
                      {si===pipePos?"● active":PIPE_CARDS.filter(c=>c.stage===si).length+" card"+(PIPE_CARDS.filter(c=>c.stage===si).length!==1?"s":"")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <motion.button onClick={()=>advancePipe(-1)} whileTap={{ scale:0.9 }} disabled={pipePos===0}
                  className="w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer"
                  style={{ borderColor:pipePos===0?C.border:C.primary, color:pipePos===0?C.muted:C.primary }}>
                  <ChevronLeft size={15}/>
                </motion.button>
                <span className="text-[13px] flex-1 text-center" style={{ color:C.muted }}>
                  Featured: <span className="font-semibold" style={{ color:C.text }}>{PIPE_STAGES[pipePos].label}</span>
                </span>
                <motion.button onClick={()=>advancePipe(1)} whileTap={{ scale:0.9 }} disabled={pipePos===4}
                  className="w-9 h-9 rounded-full border flex items-center justify-center transition-all"
                  style={{ borderColor:pipePos===4?C.border:C.primary, color:pipePos===4?C.muted:C.primary }}>
                  <ChevronRight size={15}/>
                </motion.button>
              </div>
              <AnimatePresence>
                {celebrateOffer && (
                  <motion.div initial={{ opacity:0, scale:0.8, y:10 }} animate={{ opacity:1, scale:1, y:0 }}
                    exit={{ opacity:0, scale:0.9 }} className="mt-4 p-3 rounded-xl text-center"
                    style={{ background:`${C.success}14`, border:`1px solid ${C.success}30` }}>
                    <span className="text-[13px] font-bold" style={{ color:C.success }}>🎉 Offer stage reached!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true, amount:0.15 }} transition={{ duration:0.6 }}>
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor:C.border, boxShadow:"0 8px 32px rgba(16,33,61,0.07)" }}>
                <div className="h-8 flex items-center px-4 gap-2.5" style={{ background:"#EDE9E3", borderBottom:`1px solid ${C.border}` }}>
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full" style={{ background:"#BEB5AA" }}/>)}
                  </div>
                  <span className="text-[9px] font-mono ml-2" style={{ color:C.muted }}>app.careerly.io/applications</span>
                </div>
                <div className="overflow-x-auto p-3" style={{ background:C.bg }}>
                  <div className="flex gap-2.5" style={{ minWidth:"max-content" }}>
                    {PIPE_STAGES.map(({ id, label, col }, si) => {
                      const isFeatured = si===pipePos;
                      const featuredCard = PIPE_CARDS.find(c=>c.id===1);
                      const regularCards = PIPE_CARDS.filter(c=>c.stage===si && c.id!==1);
                      return (
                        <div key={id} className="flex-shrink-0" style={{ width:168 }}>
                          <div className="flex items-center gap-1.5 mb-2 px-0.5">
                            <div className="w-2 h-2 rounded-full" style={{ background:col }}/>
                            <span className="text-[9px] font-bold uppercase tracking-wide flex-1" style={{ color:C.text }}>{label}</span>
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ background:col+"18", color:col }}>
                              {PIPE_CARDS.filter(c=>c.stage===si).length+(isFeatured&&si!==1?1:0)}
                            </span>
                          </div>
                          <div className="rounded-xl p-2 space-y-2" style={{ background:col+"0c" }}>
                            <AnimatePresence>
                              {isFeatured && featuredCard && (
                                <motion.div key="featured" layout
                                  initial={{ opacity:0, scale:0.9, y:-10 }} animate={{ opacity:1, scale:1, y:0 }}
                                  exit={{ opacity:0, scale:0.88, y:10 }} transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
                                  className="rounded-xl p-2.5 border-2"
                                  style={{ background:"#fff", borderColor:col, boxShadow:`0 4px 16px ${col}28` }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold" style={{ background:featuredCard.color }}>{featuredCard.initial}</div>
                                    <p className="text-[9px] font-bold truncate" style={{ color:C.text }}>{featuredCard.title}</p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[8px]" style={{ color:C.muted }}>{featuredCard.company}</p>
                                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:C.xlight, color:C.primary }}>{featuredCard.match}%</span>
                                  </div>
                                  <div className="mt-2 pt-2" style={{ borderTop:`1px solid ${C.border}` }}>
                                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color:col }}>{label}</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            {regularCards.map(card=>(
                              <div key={card.id} className="rounded-xl p-2.5 border transition-colors cursor-pointer" style={{ background:"#fff", borderColor:C.border }}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold" style={{ background:card.color }}>{card.initial}</div>
                                  <p className="text-[9px] font-semibold truncate" style={{ color:C.text }}>{card.title}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-[8px]" style={{ color:C.muted }}>{card.company}</p>
                                  <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded" style={{ background:C.xlight, color:C.primary }}>{card.match}%</span>
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center justify-center py-2.5 rounded-xl border border-dashed text-[11.5px] font-semibold cursor-pointer hover:bg-white/50 transition-colors" style={{ borderColor:C.soft, color:C.muted }}>
                              <Plus size={13} className="mr-1"/>Add card
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CV Studio + Interview Coach ───────────────────────────── */}
      <section id="prepare-section" className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:C.bg }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }} className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-5 h-px" style={{ background:C.primary }}/>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color:C.primary }}>Prepare</p>
              <div className="w-5 h-px" style={{ background:C.primary }}/>
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-bold leading-tight mb-2" style={{ color:C.text }}>Prepare, practise, perform.</h2>
            <p className="text-[15px] max-w-[500px] mx-auto" style={{ color:C.muted }}>CV Studio tailors your application. Interview Coach trains your delivery. Together, they give you a decisive edge.</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }}
              className="rounded-2xl overflow-hidden border flex flex-col h-[480px] min-h-[480px] max-h-[480px]" style={{ borderColor:C.border, boxShadow:"0 8px 32px rgba(16,33,61,0.07)", background:"#fff" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor:C.border, background:"#fff" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"#F24E1E18" }}>
                    <FileText size={14} style={{ color:"#F24E1E" }}/>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color:C.text }}>CV Studio</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background:C.xlight }}>
                  <span className="text-[10px] font-bold" style={{ color:C.primary }}>ATS Score</span>
                  <motion.span key={cvSection} initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    className="text-[14px] font-bold font-mono" style={{ color:C.primary }}>
                    {[87,91,89,94][cvSection]}%
                  </motion.span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <EcoCVStudio cvSection={cvSection} hideInnerHeader={true}/>
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }}
              className="rounded-2xl overflow-hidden border flex flex-col h-[480px] min-h-[480px] max-h-[480px]" style={{ borderColor:C.border, boxShadow:"0 8px 32px rgba(16,33,61,0.07)", background:C.bg }}>
              <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor:C.border, background:"#fff" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"#7C3AED18" }}>
                    <MessageSquare size={14} style={{ color:"#7C3AED" }}/>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color:C.text }}>Interview Coach</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5, repeat:Infinity }} className="w-2 h-2 rounded-full" style={{ background:C.success }}/>
                  <span className="text-[11px] font-medium" style={{ color:C.muted }}>Live session</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <EcoCoach coachIdx={coachIdx} isTyping={isTyping} hideInnerHeader={true}/>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Career Journey ─────────────────────────────────────────── */}
      <section id="journey-section" className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:"#fff" }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }} className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-5 h-px" style={{ background:C.primary }}/>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color:C.primary }}>How it works</p>
              <div className="w-5 h-px" style={{ background:C.primary }}/>
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-bold mb-2" style={{ color:C.text }}>From discovery to offer — six stages.</h2>
            <p className="text-[15px] max-w-[460px] mx-auto" style={{ color:C.muted }}>A connected journey where each step builds on the last. Click any stage to explore.</p>
          </motion.div>
          {/* Desktop: single row with progress line */}
          <div className="relative mb-10 hidden sm:block">
            <div className="absolute left-0 right-0 h-0.5 mx-[48px]" style={{ top:22, background:C.border }}>
              <motion.div className="h-full rounded-full" style={{ background:`linear-gradient(90deg,${C.primary},${C.bright})` }}
                animate={{ width:`${(journeyStep/5)*100}%` }} transition={{ duration:0.6, ease:"easeInOut" }}/>
            </div>
            <div className="flex items-start justify-between relative">
              {JOURNEY_STEPS.map(({ icon:Icon, label }, i) => {
                const isActive = i===journeyStep;
                const isDone = i<journeyStep;
                return (
                  <motion.button key={i} onClick={()=>setJourneyStep(i)} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    className="flex flex-col items-center gap-3 relative" style={{ width:"16.666%" }}>
                    <motion.div animate={{ scale:isActive?1.22:1 }} transition={{ duration:0.3 }}
                      className="w-13 h-13 rounded-full flex items-center justify-center border-2 relative z-10 transition-all shadow-sm"
                      style={{ background:isActive?C.primary:isDone?C.xlight:"#fff", borderColor:isActive?C.primary:isDone?C.primary:C.border, boxShadow:isActive?`0 4px 20px ${C.primary}45`:"none" }}>
                      <Icon size={16} style={{ color:isActive?"#fff":isDone?C.primary:C.muted }}/>
                    </motion.div>
                    <span className="text-[13px] font-bold transition-colors" style={{ color:isActive?C.primary:C.muted }}>{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
          {/* Mobile: 3×2 grid */}
          <div className="grid grid-cols-3 gap-3 mb-8 sm:hidden">
            {JOURNEY_STEPS.map(({ icon:Icon, label }, i) => {
              const isActive = i===journeyStep;
              const isDone = i<journeyStep;
              return (
                <motion.button key={i} onClick={()=>setJourneyStep(i)} whileTap={{ scale:0.95 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all"
                  style={{ background:isActive?C.xlight:"#fff", borderColor:isActive?C.primary:C.border }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background:isActive?C.primary:isDone?C.xlight:"transparent", border:`2px solid ${isActive?C.primary:isDone?C.primary:C.border}` }}>
                    <Icon size={14} style={{ color:isActive?"#fff":isDone?C.primary:C.muted }}/>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color:isActive?C.primary:C.muted }}>{label}</span>
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={journeyStep} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }} transition={{ duration:0.35 }}
              className="rounded-2xl border p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8"
              style={{ borderColor:C.border, borderLeftWidth:3, borderLeftColor:C.primary, background:"#fff", boxShadow:"0 4px 20px rgba(16,33,61,0.06)" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background:C.xlight }}>
                {(() => { const Icon=JOURNEY_STEPS[journeyStep].icon; return <Icon size={22} style={{ color:C.primary }}/>; })()}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color:C.primary }}>Stage {journeyStep+1} of 6</p>
                <h3 className="text-[16px] sm:text-[18px] font-bold mb-1" style={{ color:C.text }}>{JOURNEY_STEPS[journeyStep].label}</h3>
                <p className="text-[13px] sm:text-[14px] leading-relaxed" style={{ color:C.muted }}>{JOURNEY_STEPS[journeyStep].desc}</p>
              </div>
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0 flex-shrink-0">
                <p className="text-[11px]" style={{ color:C.muted }}>Key metric</p>
                <p className="text-[15px] sm:text-[16px] font-bold font-mono sm:mt-1" style={{ color:C.primary }}>{JOURNEY_STEPS[journeyStep].stat}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section id="stories-section" className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:C.bg }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-px" style={{ background:C.primary }}/>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color:C.primary }}>Stories</p>
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-bold" style={{ color:C.text }}>Trusted by career-focused professionals.</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, company, initial, color, outcome }, i) => (
              <motion.div key={name} initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ duration:0.45, delay:i*0.1 }}
                whileHover={{ y:-5, boxShadow:`0 20px 48px ${C.primary}10` }}
                className="rounded-2xl p-7 flex flex-col border transition-shadow cursor-default"
                style={{ background:"#fff", borderColor:C.border }}>
                <div className="flex items-center gap-1.5 mb-5">
                  {[0,1,2,3,4].map(s=><Star key={s} size={12} fill="#F59E0B" color="#F59E0B"/>)}
                </div>
                <p className="text-[15px] leading-[1.72] mb-7 flex-1" style={{ color:C.text }}>"{quote}"</p>
                <div className="pt-5 border-t flex items-center justify-between" style={{ borderColor:C.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0" style={{ background:color }}>{initial}</div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color:C.text }}>{name}</p>
                      <p className="text-[11px]" style={{ color:C.muted }}>{role} · {company}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-right leading-tight flex-shrink-0 ml-3"
                    style={{ background:C.xlight, color:C.primary }}>{outcome}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ background:C.hero }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage:`radial-gradient(circle,rgba(255,255,255,0.6) 1px,transparent 1px)`, backgroundSize:"28px 28px" }}/>
        <div className="absolute pointer-events-none" style={{ top:"5%", right:"8%", width:480, height:480, borderRadius:"50%", background:`radial-gradient(circle,${C.primary}28 0%,transparent 70%)`, filter:"blur(55px)" }}/>
        <div className="absolute pointer-events-none" style={{ bottom:"0%", left:"5%", width:340, height:340, borderRadius:"50%", background:`radial-gradient(circle,${C.bright}18 0%,transparent 70%)`, filter:"blur(50px)" }}/>
        <div className="relative z-10 max-w-[640px] mx-auto px-6 text-center">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ duration:0.55 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-6" style={{ color:"rgba(255,255,255,0.3)" }}>Get started today</p>
            <h2 className="font-display font-bold leading-[1.06] tracking-[-0.03em] text-white mb-5" style={{ fontSize:"clamp(28px,5vw,54px)" }}>
              Your career,{" "}<em style={{ color:C.bright, fontStyle:"italic" }}>intelligently managed.</em>
            </h2>
            <p className="text-[15px] leading-relaxed mb-10 max-w-[460px] mx-auto" style={{ color:"rgba(255,255,255,0.4)" }}>
              Join 120,000+ professionals who use Careerly to discover and land their next opportunity. Free to start.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <motion.button onClick={()=>nav("signup")} whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.95 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-4 text-white text-[16px] font-bold rounded-2xl cursor-pointer shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                style={{ background:C.primary, boxShadow:`0 4px 24px ${C.primary}55` }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.bright; e.currentTarget.style.boxShadow=`0 10px 40px ${C.primary}70`; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.primary; e.currentTarget.style.boxShadow=`0 4px 24px ${C.primary}55`; }}>
                Get Started Free <ArrowRight size={15}/>
              </motion.button>
              <motion.button onClick={() => {
                const el = document.getElementById("platform-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 text-[15.5px] font-semibold rounded-2xl transition-all cursor-pointer"
                style={{ color:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e=>{ e.currentTarget.style.color="rgba(255,255,255,0.9)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.22)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.color="rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}>
                Explore Platform
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Enhanced High-Fidelity Footer ────────────────────────── */}
      <footer className="pt-16 pb-12 text-slate-300 relative overflow-hidden" style={{ background: "#050D1D", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-white/10">
            
            {/* Brand & Mission Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <img src="/careerly-logo.png" alt="Careerly Logo" className="w-8 h-8 object-contain flex-shrink-0" />
                <span className="text-[20px] font-bold text-white tracking-tight">Careerly</span>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-blue-400 border border-primary/30">
                  OS v2.4
                </span>
              </div>

              <p className="text-[13.5px] leading-relaxed text-slate-400 max-w-sm">
                The career operating system for ambitious professionals. We unify opportunity discovery, ATS dossier tailoring, and STAR behavioral coaching into a single intelligent platform.
              </p>

              {/* Live Status Pill */}
              <div className="pt-1 flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 text-[11.5px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>9 Scraper Engines Active</span>
                </div>
                <span className="text-[11.5px] text-slate-500 font-mono">99.8% Uptime</span>
              </div>

              <div className="pt-2 text-[12px] text-slate-500 flex items-center gap-2">
                <span>🌐 Multi-region Architecture (US, EU, MENA)</span>
                <span>·</span>
                <span>EN / AR Support</span>
              </div>
            </div>

            {/* Link Column 1: Intelligence Engines (2 cols) */}
            <div className="lg:col-span-2 space-y-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-widest text-slate-200">Intelligence</p>
              <ul className="space-y-2.5 text-[13px]">
                {[
                  { name: "Opportunity Discovery", action: () => {
                    const el = document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    setActiveEco(0);
                  }},
                  { name: "Saved Vault", action: () => {
                    const el = document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    setActiveEco(1);
                  }},
                  { name: "Application CRM", action: () => {
                    const el = document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    setActiveEco(2);
                  }},
                  { name: "ATS CV Studio", action: () => {
                    const el = document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    setActiveEco(3);
                  }},
                  { name: "STAR Interview Coach", action: () => {
                    const el = document.getElementById("platform-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    setActiveEco(4);
                  }},
                ].map(link => (
                  <li key={link.name}>
                    <button
                      onClick={link.action}
                      className="text-slate-300 hover:text-white transition-colors cursor-pointer text-left py-1 text-[14px] font-medium leading-normal"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Link Column 2: Opportunities (2 cols) */}
            <div className="lg:col-span-2 space-y-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-widest text-slate-200">Catalog</p>
              <ul className="space-y-2.5 text-[13px]">
                {[
                  { name: "Global Tech & Design Jobs", action: () => nav("signin") },
                  { name: "International Scholarships", action: () => nav("signin") },
                  { name: "Prestigious Fellowships", action: () => nav("signin") },
                  { name: "English Waiver Programs", action: () => nav("signin") },
                  { name: "Top-Tier Internships", action: () => nav("signin") }
                ].map(link => (
                  <li key={link.name}>
                    <button
                      onClick={link.action}
                      className="text-slate-300 hover:text-white transition-colors cursor-pointer text-left py-1 text-[14px] font-medium leading-normal"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Link Column 3: Platform & Access (3 cols) */}
            <div className="lg:col-span-3 space-y-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-widest text-slate-200">Platform Access</p>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/4 border border-white/8 space-y-2">
                  <p className="text-[12.5px] font-medium text-slate-200">Ready to accelerate your career?</p>
                  <p className="text-[11.5px] text-slate-400 leading-snug">Create your profile to unlock calibrated match scores and 1-click tailored application kits.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => nav("signup")}
                      className="flex-1 px-5 py-3 bg-primary hover:bg-blue-600 text-white text-[14px] font-bold rounded-xl transition-all text-center shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Get Started Free
                    </button>
                    <button
                      onClick={() => nav("signin")}
                      className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white text-[14px] font-semibold rounded-xl transition-all text-center border border-white/15 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright, Security & Back to Top */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-slate-500">
            <div className="flex items-center gap-3 flex-wrap text-center sm:text-left">
              <span>© 2026 Careerly Technologies Inc. All rights reserved.</span>
              <span className="hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                🔒 256-Bit Encrypted & IDOR Protected
              </span>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-4 py-2 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 text-slate-300 hover:text-white transition-all text-[13.5px] font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>Back to Top</span>
                <span>↑</span>
              </button>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}

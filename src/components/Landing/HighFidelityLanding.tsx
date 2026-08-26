import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  Search, ArrowRight, Bookmark, Send, MessageSquare, FileText,
  Calendar, User, Compass, FolderKanban, Trophy, Target,
  ChevronRight, Heart, Star,
  ChevronLeft, Plus, Filter, Mic,
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
  { id:1, title:"Product Designer", company:"Stripe", initial:"S", color:"#635BFF", match:94, type:"job", mode:"hybrid", location:"San Francisco, CA", salary:"$140K–$180K", skills:["Figma","Design Systems","React"] },
  { id:2, title:"Senior Frontend Engineer", company:"Linear", initial:"L", color:"#5E6AD2", match:87, type:"job", mode:"remote", location:"Remote", salary:"$160K–$220K", skills:["TypeScript","React","GraphQL"] },
  { id:3, title:"UX Research Intern", company:"Google", initial:"G", color:"#4285F4", match:82, type:"internship", mode:"hybrid", location:"New York, NY", salary:"$8,500/mo", skills:["User Research","Figma","Surveys"] },
  { id:4, title:"Chevening Scholarship", company:"UK Government", initial:"C", color:"#0D5C3E", match:78, type:"scholarship", mode:"onsite", location:"London, UK", salary:"Full Funding", skills:["Leadership","Academia"] },
  { id:5, title:"Presidential Innovation Fellow", company:"US Federal Gov.", initial:"P", color:"#B91C1C", match:71, type:"fellowship", mode:"hybrid", location:"Washington, DC", salary:"$120K/yr", skills:["Policy","Technology"] },
  { id:6, title:"Staff Product Manager", company:"Figma", initial:"F", color:"#F24E1E", match:89, type:"job", mode:"remote", location:"Remote", salary:"$200K–$260K", skills:["Product Strategy","Data","Design"] },
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
    <div className="h-full flex flex-col p-3.5 sm:p-5 bg-card/50 overflow-y-auto custom-scrollbar">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
        <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border">
          <Search size={13} className="text-primary flex-shrink-0" />
          <span className="text-[12px] font-medium text-foreground flex-1 truncate">
            role: "Product Designer" location: "Remote / Hybrid" min: $140K
          </span>
          <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            3 Matches
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition-all ${
                selectedTag === t
                  ? "bg-primary text-white shadow-xs"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border"
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
              className="p-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              style={{ borderColor: isHovered ? C.primary : C.border }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[12.5px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ✓ {item.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground mt-0.5 flex-wrap">
                    <span className="font-medium text-foreground">{item.company}</span>
                    <span>·</span>
                    <span>{item.location}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-foreground">{item.salary}</span>
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {item.skills.map(s => (
                      <span key={s} className="px-1.5 py-0.2 rounded text-[9px] bg-secondary text-muted-foreground font-medium border border-border/60">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5 flex-shrink-0 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-border/50">
                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {item.match}% Match
                </span>
                <span className="flex items-center gap-1 text-[10.5px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
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
    { id: 3, title: "Chevening Scholarship", company: "UK Government", salary: "Fully Funded (£38K)", deadline: "Nov 5, 2025", initial: "C", color: "#0D5C3E", match: 78, priority: "Scholarship", status: "English Waiver Verified" },
    { id: 4, title: "Staff Product Manager", company: "Figma", salary: "$200K–$260K", deadline: "Jan 25, 2025", initial: "F", color: "#F24E1E", match: 89, priority: "Design Tools", status: "Ready to Dispatch" },
  ];

  return (
    <div className="h-full flex flex-col p-3.5 sm:p-5 bg-card/50 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
        <div>
          <h3 className="text-[13px] font-bold text-foreground">Saved Opportunities Vault (4)</h3>
          <p className="text-[10.5px] text-muted-foreground">Private bookmarks calibrated with automated ATS kits</p>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">
          Batch Dispatch Active
        </span>
      </div>

      <div className="space-y-2 flex-1">
        {savedItems.map((o) => (
          <div key={o.id} className="p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-xs" style={{ background: o.color }}>
                {o.initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[12px] font-semibold text-foreground truncate">{o.title}</p>
                  <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-secondary text-muted-foreground border border-border uppercase">
                    {o.priority}
                  </span>
                </div>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="font-medium text-foreground">{o.company}</span>
                  <span>·</span>
                  <span>{o.salary}</span>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{o.deadline}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0">
              <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                {o.status}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
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
    <div className="h-full flex flex-col p-4" style={{ background:C.bg }}>
      {!hideInnerHeader && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b flex-shrink-0" style={{ borderColor:C.border }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background:"#7C3AED18" }}>
            <MessageSquare size={12} style={{ color:"#7C3AED" }}/>
          </div>
          <span className="text-[11.5px] font-semibold truncate" style={{ color:C.text }}>Mock STAR Interview · Stripe</span>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5, repeat:Infinity }}
              className="w-2 h-2 rounded-full" style={{ background:C.success }}/>
            <span className="text-[10px] font-medium" style={{ color:C.muted }}>Live</span>
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
                style={{ background:msg.from==="ai"?"#fff":C.text, color:msg.from==="ai"?C.text:"#fff", border:msg.from==="ai"?`1px solid ${C.border}`:"none" }}>
                {msg.from==="ai" && <p className="text-[9.5px] font-bold mb-1" style={{ color:"#7C3AED" }}>Career Coach</p>}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex">
              <div className="rounded-2xl px-3.5 py-2.5 flex gap-1 bg-white border shadow-sm" style={{ borderColor:C.border }}>
                {[0,0.2,0.4].map((d,i) => (
                  <motion.div key={i} animate={{ y:[0,-4,0] }} transition={{ duration:0.6, delay:d, repeat:Infinity }}
                    className="w-1.5 h-1.5 rounded-full" style={{ background:C.muted }}/>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-shrink-0" style={{ borderColor:C.border }}>
        <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background:"#fff", border:`1px solid ${C.border}`, color:C.muted }}>
          Type your answer...
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm" style={{ background:"#7C3AED" }}>
          <Mic size={13}/>
        </div>
      </div>
    </div>
  );
}

function EcoCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i+1);
  const highlights: Record<number,string> = { 15:"#EF4444", 18:C.primary, 20:"#F59E0B", 23:C.success };
  return (
    <div className="h-full overflow-hidden p-4" style={{ background:"#fff" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-bold" style={{ color:C.text }}>December 2024</span>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded flex items-center justify-center cursor-pointer" style={{ color:C.muted }}><ChevronLeft size={11}/></div>
          <div className="w-5 h-5 rounded flex items-center justify-center cursor-pointer" style={{ color:C.muted }}><ChevronRight size={11}/></div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <div key={d} className="text-center text-[8px] font-bold py-1" style={{ color:C.muted }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-4">
        {[0,1,2,3,4,5].map(i => <div key={`e${i}`}/>)}
        {days.map(d => (
          <div key={d} className="text-center text-[9px] py-1.5 rounded-md cursor-pointer font-medium transition-all"
            style={{ color:highlights[d]?"#fff":d===9?C.primary:C.text, background:highlights[d]??( d===9?C.xlight:"transparent" ), fontWeight:d===9||highlights[d]?700:400 }}>
            {d}
          </div>
        ))}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:C.muted }}>Upcoming</p>
      <div className="space-y-1.5">
        {[
          { date:"Dec 15", label:"Stripe Application Deadline", dot:"#EF4444" },
          { date:"Dec 18", label:"Google Interview · 2pm GMT", dot:C.primary },
          { date:"Dec 20", label:"Linear Application Due", dot:"#F59E0B" },
        ].map(e => (
          <div key={e.date} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background:C.bg }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:e.dot }}/>
            <span className="text-[9px] font-semibold" style={{ color:C.text }}>{e.label}</span>
            <span className="text-[8px] font-mono ml-auto" style={{ color:C.muted }}>{e.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcoProfile() {
  return (
    <div className="h-full overflow-hidden p-5" style={{ background:"#fff" }}>
      <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor:C.border }}>
        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[14px]" style={{ background:C.primary }}>AK</div>
        <div className="flex-1">
          <p className="text-[13px] font-bold" style={{ color:C.text }}>Alex Kim</p>
          <p className="text-[11px]" style={{ color:C.muted }}>Product Designer · 5 years exp.</p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-bold font-mono" style={{ color:C.primary }}>94%</p>
          <p className="text-[9px]" style={{ color:C.muted }}>avg match</p>
        </div>
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:C.muted }}>Core Skills</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["Figma","Design Systems","React","User Research","Motion Design"].map(s => (
          <span key={s} className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background:C.xlight, color:C.primary }}>{s}</span>
        ))}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color:C.muted }}>Target Roles</p>
      <div className="space-y-2">
        {[
          { role:"Senior Product Designer", companies:"Stripe, Figma, Linear", match:94 },
          { role:"Head of Design", companies:"Series B–C startups", match:80 },
        ].map(r => (
          <div key={r.role} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background:C.bg }}>
            <div>
              <p className="text-[10px] font-semibold" style={{ color:C.text }}>{r.role}</p>
              <p className="text-[9px]" style={{ color:C.muted }}>{r.companies}</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background:C.xlight, color:C.primary }}>{r.match}%</span>
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
          <div className="rounded-2xl sm:rounded-3xl border overflow-hidden flex flex-col shadow-[0_20px_50px_-15px_rgba(8,21,47,0.14)]"
            style={{ background:"#fff", borderColor:C.border }}>
            
            {/* OS Window Chrome Titlebar */}
            <div className="h-11 px-4 flex items-center justify-between gap-3 select-none flex-shrink-0"
              style={{ background:"#F1EFEA", borderBottom:`1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-2xs" />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold border-l pl-3"
                  style={{ color:C.muted, borderColor:C.border }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background:C.success }}/>
                  <span style={{ color:C.text }}>CareerlyOS</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold" style={{ background:"#fff", border:`1px solid ${C.border}`, color:C.primary }}>v2.4 PRO</span>
                </div>
              </div>

              {/* Dynamic OS Address / Search Pill */}
              <div className="flex-1 max-w-md mx-2 h-7 rounded-lg flex items-center justify-between px-3 text-[11px] font-mono shadow-2xs"
                style={{ background:"#fff", border:`1px solid ${C.border}`, color:C.muted }}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ECO_ITEMS[activeEco].color }} />
                  <span className="font-medium truncate" style={{ color:C.text }}>app.careerly.io/{ECO_ITEMS[activeEco].label.toLowerCase().replace(" ", "-")}</span>
                </div>
                <span className="hidden md:inline text-[9px] px-1.5 py-0.2 rounded" style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.muted }}>⌘K Quick Switch</span>
              </div>

              {/* Right Status Badges */}
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-[10px] font-mono px-2 py-0.5 rounded" style={{ background:"#fff", border:`1px solid ${C.border}`, color:C.muted }}>
                  ⚡ 14ms Gemini Flash
                </span>
                <span className="text-[11px] font-mono font-semibold" style={{ color:C.text }}>10:42 AM</span>
              </div>
            </div>

            {/* OS Workspace Body with Side App Dock & Active View */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[460px]">
              {/* OS App Dock / Sidebar */}
              <div className="border-b lg:border-b-0 lg:border-r p-3 flex flex-row lg:flex-col justify-between gap-1.5 overflow-x-auto lg:overflow-y-auto no-scrollbar"
                style={{ background:C.bg, borderColor:C.border }}>
                <div className="flex flex-row lg:flex-col gap-1.5 flex-1">
                  <p className="hidden lg:block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1" style={{ color:C.muted }}>
                    System Engines
                  </p>
                  {ECO_ITEMS.map((item, i) => {
                    const isActive = activeEco === i;
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveEco(i)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left flex-shrink-0 transition-all cursor-pointer"
                        style={{
                          background: isActive ? C.primary : "#fff",
                          borderColor: isActive ? C.primary : C.border,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          boxShadow: isActive ? `0 4px 14px ${C.primary}30` : "none",
                          color: isActive ? "#fff" : C.text
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{
                            backgroundColor: isActive ? "rgba(255,255,255,0.2)" : `${item.color}15`,
                            color: isActive ? "#ffffff" : item.color
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold truncate leading-tight">{item.label}</p>
                          <p className="text-[9px] truncate mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.8)" : C.muted }}>
                            {item.sublabel}
                          </p>
                        </div>
                        {isActive && <ChevronRight size={13} className="ml-auto opacity-75 hidden lg:block text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* OS System Telemetry Footer (Desktop only) */}
                <div className="hidden lg:block pt-3 border-t mt-2 space-y-1.5 text-[10px]" style={{ borderColor:C.border }}>
                  <div className="flex justify-between" style={{ color:C.muted }}>
                    <span>ATS Scraper Pipeline</span>
                    <span className="font-mono font-bold" style={{ color:C.success }}>99.8% Online</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background:"#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ background:C.success, width:"94%" }} />
                  </div>
                </div>
              </div>

              {/* OS Active Canvas Viewport */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-[420px]" style={{ background:"#fff" }}>
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

      {/* ── Discovery ─────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:`linear-gradient(180deg,${C.bg} 0%,${C.xlight}60 100%)` }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-px" style={{ background:C.primary }}/>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color:C.primary }}>Discovery</p>
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-bold leading-tight mb-2" style={{ color:C.text }}>Find your next opportunity.</h2>
            <p className="text-[15px]" style={{ color:C.muted }}>Jobs, internships, scholarships and fellowships — all in one place.</p>
          </motion.div>

          <div className="mb-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2.5 rounded-xl px-4 py-3 border" style={{ background:"#fff", borderColor:C.border, boxShadow:"0 2px 8px rgba(16,33,61,0.05)" }}>
                <Search size={15} style={{ color:C.primary, flexShrink:0 }}/>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                  placeholder="Search roles, companies, skills..."
                  className="flex-1 bg-transparent text-[14px] outline-none" style={{ color:C.text }}/>
                {searchQuery && <button onClick={()=>setSearchQuery("")} className="text-[18px] leading-none" style={{ color:C.muted }}>×</button>}
              </div>
              <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border text-[13px] font-medium"
                style={{ background:"#fff", borderColor:C.border, color:C.text }}>
                <Filter size={14}/> Filters
              </motion.button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium mr-1" style={{ color:C.muted }}>Type:</span>
              {["job","internship","scholarship","fellowship"].map(t=>(
                <motion.button key={t} onClick={()=>setTypeFilter(typeFilter===t?null:t)} whileTap={{ scale:0.93 }}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
                  style={{ background:typeFilter===t?TYPE_COLORS[t]:"#fff", borderColor:typeFilter===t?TYPE_COLORS[t]:C.border, color:typeFilter===t?"#fff":C.muted }}>
                  {TYPE_LABELS[t]}
                </motion.button>
              ))}
              <span className="text-[11px] font-medium ml-3 mr-1" style={{ color:C.muted }}>Mode:</span>
              {["remote","hybrid","onsite"].map(m=>(
                <motion.button key={m} onClick={()=>setModeFilter(modeFilter===m?null:m)} whileTap={{ scale:0.93 }}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all capitalize"
                  style={{ background:modeFilter===m?C.text:"#fff", borderColor:modeFilter===m?C.text:C.border, color:modeFilter===m?"#fff":C.muted }}>
                  {m}
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(filteredOpps.length>0?filteredOpps:OPPS).map((o,i)=>(
                <motion.div key={o.id} layout
                  initial={{ opacity:0, scale:0.95, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
                  exit={{ opacity:0, scale:0.92 }} transition={{ duration:0.3, delay:i*0.04 }}
                  onMouseEnter={()=>setHoverOpp(o.id)} onMouseLeave={()=>setHoverOpp(null)}
                  onClick={() => nav("signin")}
                  className="group rounded-2xl p-5 cursor-pointer border transition-all relative overflow-hidden"
                  style={{ background:"#fff", borderColor:hoverOpp===o.id?C.primary:C.border, boxShadow:hoverOpp===o.id?`0 12px 36px ${C.primary}15`:"0 2px 8px rgba(16,33,61,0.04)" }}>
                  <motion.div animate={{ y:hoverOpp===o.id?-2:0 }} transition={{ duration:0.2 }}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[12px] font-bold" style={{ background:o.color }}>{o.initial}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold leading-tight truncate transition-colors" style={{ color:hoverOpp===o.id?C.primary:C.text }}>{o.title}</p>
                        <p className="text-[12px]" style={{ color:C.muted }}>{o.company}</p>
                      </div>
                      <motion.button onClick={e=>{e.stopPropagation();nav("signin");}} whileHover={{ scale:1.3 }} whileTap={{ scale:0.8 }} title="Sign in to save">
                        <Heart size={16} fill="none" color="#CBD5E1"/>
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background:TYPE_COLORS[o.type]+"14", color:TYPE_COLORS[o.type] }}>{TYPE_LABELS[o.type]}</span>
                      <span className="text-[11px] capitalize" style={{ color:C.muted }}>{o.mode}</span>
                      <span className="text-[11px]" style={{ color:C.muted }}>· {o.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3.5" style={{ borderTop:`1px solid ${C.border}` }}>
                      <span className="text-[12px] font-semibold font-mono" style={{ color:C.text }}>{o.salary}</span>
                      <MatchRing score={o.match} size={40}/>
                    </div>
                    <AnimatePresence>
                      {hoverOpp===o.id && (
                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                          exit={{ opacity:0, height:0 }} transition={{ duration:0.22 }} className="overflow-hidden">
                          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop:`1px solid ${C.border}` }}>
                            <div className="flex flex-wrap gap-1.5">
                              {o.skills.slice(0,2).map(s=>(
                                <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background:C.xlight, color:C.primary }}>{s}</span>
                              ))}
                            </div>
                            <span className="text-[11px] font-bold" style={{ color:C.primary }}>Sign in to view →</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {filteredOpps.length===0 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-10 text-[14px]" style={{ color:C.muted }}>
              No results. <button style={{ color:C.primary }} className="hover:underline" onClick={()=>{setTypeFilter(null);setModeFilter(null);setSearchQuery("");}}>Clear filters</button>
            </motion.div>
          )}
          <div className="text-center mt-8">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-2 bg-white rounded-2xl border shadow-sm max-w-full" style={{ borderColor:C.border }}>
              <span className="text-[12.5px] font-medium px-3 text-center sm:text-left" style={{ color:C.muted }}>
                🔒 Sign in to unlock full database and match with your profile
              </span>
              <motion.button onClick={()=>nav("signin")} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.96 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-[13.5px] font-bold rounded-xl cursor-pointer whitespace-nowrap shadow-sm"
                style={{ background:C.primary, boxShadow:`0 4px 14px ${C.primary}35` }}>
                Sign In to View All 50,000+ Opportunities <ArrowRight size={14}/>
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
                  className="w-9 h-9 rounded-full border flex items-center justify-center transition-all"
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
                            <div className="flex items-center justify-center py-2 rounded-lg border border-dashed text-[9px] cursor-pointer" style={{ borderColor:C.soft, color:C.muted }}>
                              <Plus size={9} className="mr-0.5"/>Add card
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
                      className="w-11 h-11 rounded-full flex items-center justify-center border-2 relative z-10 transition-all"
                      style={{ background:isActive?C.primary:isDone?C.xlight:"#fff", borderColor:isActive?C.primary:isDone?C.primary:C.border, boxShadow:isActive?`0 4px 20px ${C.primary}45`:"none" }}>
                      <Icon size={16} style={{ color:isActive?"#fff":isDone?C.primary:C.muted }}/>
                    </motion.div>
                    <span className="text-[11px] font-bold transition-colors" style={{ color:isActive?C.primary:C.muted }}>{label}</span>
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-white text-[14px] font-semibold rounded-xl cursor-pointer"
                style={{ background:C.primary, boxShadow:`0 4px 24px ${C.primary}55` }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.bright; e.currentTarget.style.boxShadow=`0 10px 40px ${C.primary}70`; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.primary; e.currentTarget.style.boxShadow=`0 4px 24px ${C.primary}55`; }}>
                Get Started Free <ArrowRight size={15}/>
              </motion.button>
              <motion.button onClick={() => {
                const el = document.getElementById("platform-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-[14px] font-medium rounded-xl transition-all cursor-pointer"
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
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left leading-normal"
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
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left leading-normal"
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
                      className="flex-1 px-3 py-2 bg-primary hover:bg-blue-600 text-white text-[12px] font-bold rounded-lg transition-colors text-center shadow-xs cursor-pointer"
                    >
                      Get Started Free
                    </button>
                    <button
                      onClick={() => nav("signin")}
                      className="px-3 py-2 bg-white/6 hover:bg-white/10 text-white text-[12px] font-semibold rounded-lg transition-colors text-center border border-white/10 cursor-pointer"
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
              <span>© 2025 Careerly Technologies Inc. All rights reserved.</span>
              <span className="hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                🔒 256-Bit Encrypted & IDOR Protected
              </span>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[12px] font-semibold flex items-center gap-1"
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

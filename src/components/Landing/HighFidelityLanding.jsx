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
function EcoDiscovery(_: { coachIdx?: number }) {
  return (
    <div className="h-full overflow-hidden p-5" style={{ background:C.bg }}>
      <div className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl border" style={{ background:"#fff", borderColor:C.soft }}>
        <Search size={13} style={{ color:C.primary }} />
        <span className="text-[12px] flex-1" style={{ color:C.text }}>product designer</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background:C.xlight, color:C.primary }}>3 results</span>
      </div>
      <div className="flex gap-1.5 mb-4">
        {["Job","Remote","Design"].map(f => (
          <span key={f} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg text-white" style={{ background:C.primary }}>{f}</span>
        ))}
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg border" style={{ color:C.muted, borderColor:C.border }}>+ More</span>
      </div>
      <div className="space-y-2">
        {OPPS.slice(0,3).map(o => (
          <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all" style={{ background:"#fff", borderColor:C.border }}>
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background:o.color }}>{o.initial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color:C.text }}>{o.title}</p>
              <p className="text-[10px]" style={{ color:C.muted }}>{o.company} · {o.mode}</p>
            </div>
            <MatchRing score={o.match} size={36}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcoSaved() {
  return (
    <div className="h-full overflow-hidden p-5" style={{ background:C.bg }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold" style={{ color:C.text }}>4 saved opportunities</p>
        <span className="text-[11px] font-semibold" style={{ color:C.primary }}>Add to Pipeline →</span>
      </div>
      <div className="space-y-2">
        {OPPS.slice(0,4).map(o => (
          <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background:"#fff", borderColor:C.border }}>
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background:o.color }}>{o.initial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color:C.text }}>{o.title}</p>
              <p className="text-[10px]" style={{ color:C.muted }}>{o.company} · {o.salary}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md" style={{ background:C.xlight, color:C.primary }}>{o.match}%</span>
              <Heart size={13} fill="#E2E8F0" color="#CBD5E1"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcoPipeline() {
  return (
    <div className="h-full overflow-hidden p-3" style={{ background:C.bg }}>
      <div className="flex gap-2 h-full overflow-x-auto pb-1">
        {PIPE_STAGES.map(({ id, label, col }, si) => {
          const cards = PIPE_CARDS.filter(c => c.stage === si);
          return (
            <div key={id} className="flex-shrink-0" style={{ width:130 }}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background:col }}/>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color:C.text }}>{label}</span>
                <span className="text-[8px] font-mono ml-auto px-1 rounded" style={{ background:col+"18", color:col }}>{cards.length}</span>
              </div>
              <div className="rounded-xl p-1.5 space-y-1.5" style={{ background:col+"0d" }}>
                {cards.map(card => (
                  <div key={card.id} className="rounded-lg p-2 border" style={{ background:"#fff", borderColor:C.border }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold" style={{ background:card.color }}>{card.initial}</div>
                      <p className="text-[9px] font-semibold truncate" style={{ color:C.text }}>{card.title}</p>
                    </div>
                    <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded" style={{ background:C.xlight, color:C.primary }}>{card.match}%</span>
                  </div>
                ))}
                <div className="flex items-center justify-center py-1.5 rounded-lg border border-dashed text-[9px] cursor-pointer" style={{ borderColor:C.soft, color:C.muted }}>
                  <Plus size={8} className="mr-0.5"/>Add
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EcoCVStudio({ cvSection }: { cvSection:number }) {
  const sections = [
    { id:"summary", label:"Professional Summary", color:C.primary, lines:2 },
    { id:"experience", label:"Work Experience", color:"#7C3AED", lines:4 },
    { id:"skills", label:"Skills & Tools", color:C.success, lines:2 },
    { id:"education", label:"Education", color:"#F24E1E", lines:2 },
  ];
  return (
    <div className="h-full overflow-hidden p-4" style={{ background:"#fff" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold" style={{ color:C.text }}>CV — Product Designer · Stripe</p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background:C.xlight }}>
          <span className="text-[10px] font-bold" style={{ color:C.primary }}>ATS</span>
          <motion.span key={cvSection} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
            className="text-[14px] font-bold font-mono" style={{ color:C.primary }}>
            {[87,91,89,94][cvSection]}
          </motion.span>
        </div>
      </div>
      <div className="space-y-2">
        {sections.map(({ id, label, color, lines }, idx) => {
          const isActive = idx === cvSection;
          return (
            <motion.div key={id} animate={{ scale:isActive?1.01:1 }}
              className="rounded-xl p-3 border transition-all"
              style={{ borderColor:isActive?color:C.border, background:isActive?color+"0c":"#fff", boxShadow:isActive?`0 4px 16px ${color}18`:"none" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background:isActive?color:"#CBD5E1" }}/>
                <span className="text-[10px] font-bold" style={{ color:C.text }}>{label}</span>
                {isActive && <span className="text-[8px] font-bold ml-auto px-1.5 py-0.5 rounded text-white" style={{ background:color }}>AI Enhanced ✓</span>}
              </div>
              <div className="space-y-1.5">
                {Array.from({ length:lines }).map((_,li) => (
                  <div key={li} className="h-2 rounded-full" style={{ background:isActive?color+"22":"#E2E8F0", width:li===lines-1?"65%":"100%" }}/>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function EcoCoach({ coachIdx, isTyping }: { coachIdx:number; isTyping:boolean }) {
  return (
    <div className="h-full flex flex-col p-4" style={{ background:C.bg }}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor:C.border }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"#7C3AED18" }}>
          <MessageSquare size={13} style={{ color:"#7C3AED" }}/>
        </div>
        <span className="text-[12px] font-semibold" style={{ color:C.text }}>Interview Coach · Stripe Product Designer</span>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5, repeat:Infinity }}
            className="w-2 h-2 rounded-full" style={{ background:C.success }}/>
          <span className="text-[10px]" style={{ color:C.muted }}>Live</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {COACH_MSGS.slice(0, coachIdx+1).map((msg, i) => (
            <motion.div key={i} layout initial={{ opacity:0, y:10, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }}
              transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}
              className={cn("flex", msg.from==="user" ? "justify-end" : "justify-start")}>
              <div className="max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed"
                style={{ background:msg.from==="ai"?"#fff":C.text, color:msg.from==="ai"?C.text:"#fff", border:msg.from==="ai"?`1px solid ${C.border}`:"none" }}>
                {msg.from==="ai" && <p className="text-[9px] font-bold mb-1" style={{ color:"#7C3AED" }}>Career Coach</p>}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex">
              <div className="rounded-2xl px-3.5 py-2.5 flex gap-1" style={{ background:"#fff", border:`1px solid ${C.border}` }}>
                {[0,0.2,0.4].map((d,i) => (
                  <motion.div key={i} animate={{ y:[0,-4,0] }} transition={{ duration:0.6, delay:d, repeat:Infinity }}
                    className="w-1.5 h-1.5 rounded-full" style={{ background:C.muted }}/>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor:C.border }}>
        <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background:"#fff", border:`1px solid ${C.border}`, color:C.muted }}>
          Type your answer...
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background:"#7C3AED" }}>
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
  // Floating hero card positions
  const cardPositions = [
    { top:"6%",   left:"-2%",  floatDir:1,  floatAmp:14, floatDur:4.6 },
    { top:"56%",  right:"-3%", floatDir:-1, floatAmp:12, floatDur:5.3 },
    { top:"-4%",  right:"10%", floatDir:1,  floatAmp:9,  floatDur:3.9 },
    { top:"76%",  left:"8%",   floatDir:-1, floatAmp:10, floatDur:4.8 },
  ];
  const parallaxXArr = [c0x, c1x, c2x, c3x];
  const parallaxYArr = [c0y, c1y, c2y, c3y];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background:C.bg, fontFamily:"var(--font-sans)", color:C.text }}>

      {/* ── Navigation (Full-width edge-to-edge) ──────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md" style={{ background:"rgba(248,247,243,0.96)", borderBottom:`1px solid ${C.border}` }}>
        <div className="w-full px-6 sm:px-10 lg:px-14 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 min-w-0">
            {/* Logo pinned all the way to the left */}
            <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={()=>nav("landing")}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background:C.primary }}>
                <span className="text-white text-[15px] font-extrabold tracking-tight">C</span>
              </div>
              <span className="text-[20px] font-bold tracking-tight" style={{ color:C.text }}>Careerly</span>
            </div>

            {/* Nav links */}
            <div className="hidden lg:flex items-center gap-6">
              {[
                { name: "Opportunities", action: () => nav("discovery") },
                { name: "CV Studio", action: () => nav("cv") },
                { name: "Interview Coach", action: () => nav("coach") },
                { name: "Pipeline CRM", action: () => nav("crm") },
                { name: "Pricing", action: () => {
                  const el = document.getElementById("pricing-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }},
                { name: "About", action: () => {
                  const el = document.getElementById("journey-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
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
            <motion.button onClick={()=>nav("signin")} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.96 }}
              className="text-[14px] font-bold px-5 py-2.5 rounded-xl text-white whitespace-nowrap shadow-md cursor-pointer"
              style={{ background:C.primary, boxShadow:`0 4px 14px ${C.primary}40` }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 6px 24px ${C.primary}60`; e.currentTarget.style.background=C.bright; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 4px 14px ${C.primary}40`; e.currentTarget.style.background=C.primary; }}>
              Get Started <ArrowRight size={14} className="inline ml-1 -mt-0.5"/>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section ref={heroRef} onMouseMove={onHeroMouse} onMouseLeave={()=>{ mouseX.set(0); mouseY.set(0); }}
        className="relative overflow-hidden w-full sm:min-h-[90vh]" style={{ background:C.hero }}>

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage:`radial-gradient(circle,rgba(255,255,255,0.6) 1px,transparent 1px)`, backgroundSize:"28px 28px" }}/>

        {/* Blue atmospheric glows */}
        <div className="absolute pointer-events-none" style={{ top:"5%", right:"12%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${C.primary}28 0%,transparent 70%)`, filter:"blur(60px)" }}/>
        <div className="absolute pointer-events-none" style={{ bottom:"0%", left:"3%", width:380, height:380, borderRadius:"50%", background:`radial-gradient(circle,${C.bright}18 0%,transparent 70%)`, filter:"blur(55px)" }}/>
        <div className="absolute pointer-events-none" style={{ top:"35%", left:"30%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,${C.primary}10 0%,transparent 70%)`, filter:"blur(45px)" }}/>

        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 py-16 sm:py-20 lg:py-24 flex items-center min-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] xl:grid-cols-[540px_1fr] gap-12 xl:gap-24 items-center w-full">

            {/* LEFT */}
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
                style={{ fontSize:"clamp(48px,9vw,82px)" }}>
                Every career<br/>opportunity,<br/>
                <em style={{ color:`${C.bright}`, fontStyle:"italic" }}>managed.</em>
              </motion.h1>

              <motion.p initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.55, delay:0.18, ease:[0.16,1,0.3,1] }}
                className="text-[16px] leading-[1.78] mb-10 max-w-[430px]" style={{ color:"rgba(255,255,255,0.5)" }}>
                Discover jobs, internships, scholarships and fellowships. Match, prepare, apply and succeed — all in one intelligent workspace.
              </motion.p>

              <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.27, ease:[0.16,1,0.3,1] }}
                className="flex flex-wrap items-center gap-3.5 mb-8 sm:mb-14">
                <motion.button onClick={()=>nav("signin")} whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.96 }}
                  className="flex items-center gap-2 px-6 py-3.5 text-white text-[14.5px] font-bold rounded-xl cursor-pointer"
                  style={{ background:C.primary, boxShadow:`0 4px 22px ${C.primary}55` }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=C.bright; e.currentTarget.style.boxShadow=`0 8px 36px ${C.primary}70`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=C.primary; e.currentTarget.style.boxShadow=`0 4px 22px ${C.primary}55`; }}>
                  Get Started Free <ArrowRight size={14}/>
                </motion.button>
                <motion.button onClick={()=>nav("discovery")} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}
                  className="flex items-center gap-2 px-6 py-3.5 text-[14.5px] font-semibold rounded-xl transition-all cursor-pointer"
                  style={{ color:"rgba(255,255,255,0.75)", border:"1px solid rgba(255,255,255,0.15)" }}
                  onMouseEnter={e=>{ e.currentTarget.style.color="rgba(255,255,255,1)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.color="rgba(255,255,255,0.75)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"; }}>
                  Explore Opportunities
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

            {/* RIGHT: constellation */}
            <motion.div initial={{ opacity:0, x:52 }} animate={{ opacity:1, x:0 }}
              transition={{ duration:0.9, delay:0.14, ease:[0.16,1,0.3,1] }}
              className="hidden lg:block relative" style={{ height:560 }}>

              {/* SVG constellation lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:5 }}>
                {[
                  { x1:"15%", y1:"22%", x2:"50%", y2:"52%" },
                  { x1:"82%", y1:"65%", x2:"50%", y2:"52%" },
                  { x1:"76%", y1:"8%",  x2:"50%", y2:"52%" },
                  { x1:"18%", y1:"82%", x2:"50%", y2:"52%" },
                ].map((line, i) => (
                  <motion.line key={i} {...line} stroke={`${C.primary}`} strokeWidth="0.8" strokeOpacity="0.25"
                    strokeDasharray="5 5"
                    animate={{ strokeDashoffset:[0,-20] }}
                    transition={{ duration:2.5+i*0.4, repeat:Infinity, ease:"linear" }}/>
                ))}
              </svg>

              {/* Floating opportunity cards */}
              {HERO_CARDS.map((card, i) => {
                const pos = cardPositions[i];
                const isHov = hoveredHeroCard===i;
                return (
                  <motion.div key={card.id}
                    style={{ x:parallaxXArr[i], y:parallaxYArr[i], position:"absolute", top:pos.top, left:(pos as any).left, right:(pos as any).right, bottom:(pos as any).bottom, zIndex:isHov?30:10 }}>
                    <motion.div
                      animate={{ y:[0, pos.floatDir*pos.floatAmp, 0] }}
                      transition={{ duration:pos.floatDur, repeat:Infinity, ease:"easeInOut" }}>
                      <motion.div
                        onMouseEnter={()=>setHoveredHeroCard(i)}
                        onMouseLeave={()=>setHoveredHeroCard(null)}
                        whileHover={{ scale:1.06, rotateY:isHov?0:3, rotateX:isHov?0:-2 }}
                        transition={{ duration:0.25 }}
                        style={{ perspective:800, transformStyle:"preserve-3d", cursor:"pointer", background:"rgba(255,255,255,0.07)", border:`1px solid ${isHov?C.primary+"60":"rgba(255,255,255,0.1)"}`, backdropFilter:"blur(18px)", boxShadow:isHov?`0 16px 48px ${C.primary}35, 0 0 0 1px ${C.primary}30`:"0 12px 36px rgba(0,0,0,0.3)" }}
                        className="rounded-2xl p-4 w-52">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background:card.color }}>{card.initial}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-white truncate">{card.title}</p>
                            <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.45)" }}>{card.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between" style={{ paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                          <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.38)" }}>{card.type} · {card.mode}</span>
                          <MatchRing score={card.match} size={38} dark/>
                        </div>
                        <AnimatePresence>
                          {isHov && (
                            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                              exit={{ opacity:0, height:0 }} transition={{ duration:0.22 }}
                              className="overflow-hidden">
                              <div style={{ paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:10 }}>
                                <p className="text-[10px] text-white/50 mb-1">{card.location} · {card.salary}</p>
                                <button className="text-[11px] font-semibold flex items-center gap-1" style={{ color:C.bright }}>
                                  Why you match <ChevronRight size={10}/>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Central dashboard */}
              <motion.div style={{ x:dashX, y:dashY, position:"absolute", top:70, left:60, right:60, bottom:30 }}
                animate={{ y:[0,-6,0] }} transition={{ duration:7.5, repeat:Infinity, ease:"easeInOut" }}>
                <div className="w-full h-full rounded-2xl overflow-hidden"
                  style={{ border:`1px solid rgba(255,255,255,0.07)`, boxShadow:"0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)" }}>
                  <div className="h-9 flex items-center px-3.5 gap-2.5" style={{ background:"#1E2D3E", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex gap-1.5">
                      {[0,1,2].map(i=><div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background:"rgba(255,255,255,0.1)" }}/>)}
                    </div>
                    <div className="flex-1 mx-3 h-5 rounded flex items-center px-2.5 gap-1.5" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.2)" }}/>
                      <span className="text-[9px] font-mono" style={{ color:"rgba(255,255,255,0.25)" }}>app.careerly.io/dashboard</span>
                    </div>
                  </div>
                  <div className="flex" style={{ height:"calc(100% - 36px)", background:C.bg }}>
                    <div className="flex flex-col py-3 px-2.5 flex-shrink-0" style={{ width:140, background:"#fff", borderRight:`1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2 px-2 py-1 mb-4">
                        <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center" style={{ background:C.primary }}>
                          <span style={{ color:"#fff", fontSize:7, fontWeight:700 }}>C</span>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, color:C.text }}>Careerly</span>
                      </div>
                      {[["Dashboard",true],["Discover",false],["Applications",false],["Saved",false],["CV Studio",false],["Coach",false]].map(([l,a])=>(
                        <div key={l as string} style={{ padding:"6px 10px", borderRadius:6, fontSize:10, fontWeight:500, marginBottom:2, cursor:"pointer", background:a?C.primary:"transparent", color:a?"#fff":C.muted }}>
                          {l as string}
                        </div>
                      ))}
                      <div className="mt-auto pt-3 flex items-center gap-1.5 px-1" style={{ borderTop:`1px solid ${C.border}` }}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold" style={{ background:C.primary }}>AK</div>
                        <div><p style={{ fontSize:9, fontWeight:600, color:C.text }}>Alex Kim</p><p style={{ fontSize:8, color:C.muted }}>Open to work</p></div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden" style={{ padding:16 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom:14 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:C.text }}>Good morning, Alex 👋</p>
                        <p style={{ fontSize:10, fontFamily:"monospace", color:C.muted }}>Dec 9, 2024</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2" style={{ marginBottom:14 }}>
                        {[["12","Active",C.primary],["4","Applied",C.bright],["2","Offers","#7C3AED"],["84%","Match",C.success]].map(([n,l,c])=>(
                          <div key={l as string} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 10px" }}>
                            <p style={{ fontSize:17, fontWeight:700, fontFamily:"monospace", color:c as string, lineHeight:1 }}>{n}</p>
                            <p style={{ fontSize:8, color:C.muted, marginTop:3 }}>{l}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize:8, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>Recommended for you</p>
                      {OPPS.slice(0,5).map(o=>(
                        <div key={o.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 8px", borderRadius:10, cursor:"pointer", marginBottom:3, transition:"background 0.15s" }}
                          onMouseEnter={e=>(e.currentTarget.style.background="#fff")}
                          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                          <div style={{ width:22, height:22, borderRadius:7, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:8, fontWeight:700, background:o.color }}>{o.initial}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:10, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.title}</p>
                            <p style={{ fontSize:8, color:C.muted }}>{o.company}</p>
                          </div>
                          <span style={{ fontSize:8, fontFamily:"monospace", fontWeight:700, padding:"2px 6px", borderRadius:6, background:C.xlight, color:C.primary, flexShrink:0 }}>{o.match}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Ecosystem Command Center ──────────────────────────────── */}
      <section className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}` }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-px" style={{ background:C.primary }}/>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color:C.primary }}>Platform</p>
            </div>
            <h2 className="text-[22px] sm:text-[30px] font-bold leading-tight mb-2" style={{ color:C.text }}>The complete career operating system.</h2>
            <p className="text-[15px] max-w-[480px]" style={{ color:C.muted }}>Seven interconnected tools — explore each one below.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">
            {/* Tool tabs */}
            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {ECO_ITEMS.map((item, i) => (
                <motion.button key={i} onClick={()=>setActiveEco(i)}
                  whileHover={{ x:2 }} whileTap={{ scale:0.97 }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left flex-shrink-0 transition-all"
                  style={{
                    background:activeEco===i?C.primary:"#fff",
                    borderColor:activeEco===i?C.primary:C.border,
                    boxShadow:activeEco===i?`0 4px 16px ${C.primary}30`:"none",
                  }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:activeEco===i?"rgba(255,255,255,0.2)":item.color+"14" }}>
                    <item.icon size={15} style={{ color:activeEco===i?"#fff":item.color }}/>
                  </div>
                  <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color:activeEco===i?"#fff":C.text }}>{item.label}</span>
                  {activeEco===i && <ChevronRight size={12} className="ml-auto opacity-60 text-white"/>}
                </motion.button>
              ))}
            </div>

            {/* Product preview panel */}
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor:C.border, boxShadow:"0 8px 32px rgba(16,33,61,0.07)", minHeight:380 }}>
              {/* Browser chrome */}
              <div className="h-9 flex items-center px-3.5 gap-2.5" style={{ background:"#EDE9E3", borderBottom:`1px solid ${C.border}` }}>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i=><div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background:"#BEB5AA" }}/>)}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={activeEco} initial={{ opacity:0, x:6 }} animate={{ opacity:1, x:0 }}
                    exit={{ opacity:0, x:-6 }} transition={{ duration:0.25 }}
                    className="flex-1 mx-3 h-5 rounded flex items-center px-2.5 gap-1.5"
                    style={{ background:"rgba(255,255,255,0.6)", border:`1px solid ${C.border}` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background:ECO_ITEMS[activeEco].color }}/>
                    <span className="text-[9px] font-mono" style={{ color:C.muted }}>
                      app.careerly.io/{ECO_ITEMS[activeEco].label.toLowerCase().replace(" ","-")}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={activeEco} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.3 }}
                  style={{ height:380 }}>
                  {activeEco===0 && <EcoDiscovery coachIdx={coachIdx}/>}
                  {activeEco===1 && <EcoSaved/>}
                  {activeEco===2 && <EcoPipeline/>}
                  {activeEco===3 && <EcoCVStudio cvSection={cvSection}/>}
                  {activeEco===4 && <EcoCoach coachIdx={coachIdx} isTyping={isTyping}/>}
                  {activeEco===5 && <EcoCalendar/>}
                  {activeEco===6 && <EcoProfile/>}
                </motion.div>
              </AnimatePresence>
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
                  className="group rounded-2xl p-5 cursor-pointer border transition-all"
                  style={{ background:"#fff", borderColor:hoverOpp===o.id?C.primary:C.border, boxShadow:hoverOpp===o.id?`0 12px 36px ${C.primary}15`:"0 2px 8px rgba(16,33,61,0.04)" }}>
                  <motion.div animate={{ y:hoverOpp===o.id?-2:0 }} transition={{ duration:0.2 }}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[12px] font-bold" style={{ background:o.color }}>{o.initial}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold leading-tight truncate transition-colors" style={{ color:hoverOpp===o.id?C.primary:C.text }}>{o.title}</p>
                        <p className="text-[12px]" style={{ color:C.muted }}>{o.company}</p>
                      </div>
                      <motion.button onClick={e=>{e.stopPropagation();toggleSave(o.id);}} whileHover={{ scale:1.3 }} whileTap={{ scale:0.8 }}>
                        <Heart size={16} fill={savedOpps.has(o.id)?C.primary:"none"} color={savedOpps.has(o.id)?C.primary:"#CBD5E1"}/>
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
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop:`1px solid ${C.border}` }}>
                            {o.skills.map(s=>(
                              <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background:C.xlight, color:C.primary }}>{s}</span>
                            ))}
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
            <motion.button onClick={()=>nav("discovery")} whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.96 }}
              className="inline-flex items-center gap-2 px-6 py-3 text-white text-[14px] font-semibold rounded-xl"
              style={{ background:C.primary, boxShadow:`0 4px 16px ${C.primary}30` }}>
              Browse All 50,000+ Opportunities <ArrowRight size={14}/>
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── Pipeline ──────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:"#fff" }}>
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
      <section className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:C.bg }}>
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
              className="rounded-2xl overflow-hidden border" style={{ borderColor:C.border, boxShadow:"0 8px 32px rgba(16,33,61,0.07)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:C.border, background:"#fff" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"#F24E1E18" }}>
                    <FileText size={14} style={{ color:"#F24E1E" }}/>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color:C.text }}>CV Studio</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background:C.xlight }}>
                  <span className="text-[10px] font-bold" style={{ color:C.primary }}>ATS</span>
                  <motion.span key={cvSection} initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    className="text-[15px] font-bold font-mono" style={{ color:C.primary }}>
                    {[87,91,89,94][cvSection]}
                  </motion.span>
                </div>
              </div>
              <EcoCVStudio cvSection={cvSection}/>
            </motion.div>
            <motion.div initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true, amount:0.2 }} transition={{ duration:0.55 }}
              className="rounded-2xl overflow-hidden border" style={{ borderColor:C.border, boxShadow:"0 8px 32px rgba(16,33,61,0.07)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:C.border, background:"#fff" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"#7C3AED18" }}>
                    <MessageSquare size={14} style={{ color:"#7C3AED" }}/>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color:C.text }}>Interview Coach</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5, repeat:Infinity }} className="w-2 h-2 rounded-full" style={{ background:C.success }}/>
                  <span className="text-[11px]" style={{ color:C.muted }}>Live session</span>
                </div>
              </div>
              <EcoCoach coachIdx={coachIdx} isTyping={isTyping}/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Career Journey ─────────────────────────────────────────── */}
      <section className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:"#fff" }}>
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
      <section className="py-14 sm:py-20" style={{ borderBottom:`1px solid ${C.border}`, background:C.bg }}>
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
              <motion.button onClick={()=>nav("signin")} whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.95 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-white text-[14px] font-semibold rounded-xl"
                style={{ background:C.primary, boxShadow:`0 4px 24px ${C.primary}55` }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.bright; e.currentTarget.style.boxShadow=`0 10px 40px ${C.primary}70`; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.primary; e.currentTarget.style.boxShadow=`0 4px 24px ${C.primary}55`; }}>
                Get Started Free <ArrowRight size={15}/>
              </motion.button>
              <motion.button onClick={()=>nav("discovery")} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-[14px] font-medium rounded-xl transition-all"
                style={{ color:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e=>{ e.currentTarget.style.color="rgba(255,255,255,0.9)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.22)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.color="rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}>
                Browse Opportunities
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-14" style={{ background:C.midnight }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-10 mb-10">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:C.primary }}>
                  <span className="text-white text-[10px] font-bold">C</span>
                </div>
                <span className="text-[14px] font-semibold text-white">Careerly</span>
              </div>
              <p className="text-[12px] leading-relaxed max-w-[200px]" style={{ color:"rgba(255,255,255,0.28)" }}>The career operating system for ambitious professionals.</p>
            </div>
            <div className="grid grid-cols-3 gap-8 sm:gap-12">
              {[
                { label:"Product", items:["Dashboard","Discovery","CV Studio","Coach","Calendar"] },
                { label:"Company", items:["About","Blog","Careers","Press","Contact"] },
                { label:"Legal",   items:["Privacy","Terms","Cookies","Security"] },
              ].map(({ label, items }) => (
                <div key={label}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-3.5" style={{ color:"rgba(255,255,255,0.3)" }}>{label}</p>
                  <div className="space-y-2.5">
                    {items.map(item => (
                      <button key={item} className="block text-[11px] sm:text-[12px] transition-colors" style={{ color:"rgba(255,255,255,0.22)" }}
                        onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.55)")}
                        onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.22)")}>{item}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 pt-5" style={{ borderTop:`1px solid ${C.primary}22` }}>
            <p className="text-[11px]" style={{ color:"rgba(255,255,255,0.18)" }}>© 2024 Careerly. All rights reserved.</p>
            <p className="text-[11px]" style={{ color:"rgba(255,255,255,0.18)" }}>Designed for ambitious careers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

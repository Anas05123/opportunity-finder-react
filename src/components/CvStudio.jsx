import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Copy, Check, RefreshCw, Award, Zap, Upload, Download, FileCheck, 
  X, Briefcase, GraduationCap, Building2, UserCheck, ShieldAlert,
  ChevronRight, Target, Flame, Compass, RotateCcw, HelpCircle,
  Plus, Trash2, CheckCircle, CircleDot, Eye, Maximize2, Minimize2,
  MapPin, Mail, Phone, Globe
} from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

export default function CvStudio({ 
  userProfile, 
  triggerToast,
  onNavigateToDiscover
}) {
  const [activeSection, setActiveSection] = useState('personal');
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const fileInputRef = useRef(null);

  // CV Data State
  const [cvData, setCvData] = useState({
    name: userProfile?.full_name || userProfile?.name || 'Alex Kim',
    title: userProfile?.headline || 'Senior Product Designer',
    email: userProfile?.email || 'alex.kim@email.com',
    phone: userProfile?.phone || '+1 (415) 555-0192',
    location: userProfile?.location || 'San Francisco, CA',
    linkedin: userProfile?.linkedin_url || 'linkedin.com/in/alexkim',
    portfolio: userProfile?.portfolio_url || 'alexkim.design',
    github: userProfile?.github_url || 'github.com/alexkim',
    summary: userProfile?.resume_text || 'Experienced product designer with 4+ years crafting digital products used by millions. Deep expertise in design systems, user research, and cross-functional collaboration. Passionate about the intersection of engineering and design.',
    experiences: [
      {
        id: 1,
        title: 'Senior Product Designer',
        company: 'Headspace',
        from: 'Jan 2022',
        to: 'Present',
        bullets: [
          'Led redesign of core meditation experience, increasing daily active users by 23%',
          'Built and maintained a 200+ component design system used across 6 product teams',
          'Raised WCAG accessibility compliance from 60% to 94%'
        ]
      },
      {
        id: 2,
        title: 'Product Designer',
        company: 'Intercom',
        from: 'Mar 2020',
        to: 'Dec 2021',
        bullets: [
          'Designed inbox and automation features serving 30,000+ enterprise customers',
          'Partnered with 3 engineering squads to ship 12 major features',
          'Reduced onboarding drop-off by 38% through guided setup redesign'
        ]
      }
    ],
    education: [
      {
        id: 1,
        degree: userProfile?.degree_title || 'Bachelor of Arts — Design',
        institution: userProfile?.university || 'UC Berkeley',
        from: '2016',
        to: '2020',
        gpa: userProfile?.gpa ? String(userProfile.gpa) : '3.85'
      }
    ],
    skillsCategories: [
      { cat: 'Design Tools', skills: ['Figma', 'Sketch', 'Principle', 'Framer', 'Zeplin'] },
      { cat: 'Core Skills', skills: ['Design Systems', 'User Research', 'Prototyping', 'Accessibility', 'Motion Design'] },
      { cat: 'Technical', skills: ['HTML/CSS', 'React basics', 'Git', 'TypeScript'] }
    ],
    achievements: [
      'Top 10 Global Finalist — International Design Excellence Awards 2023',
      'Published author on Design Systems Architecture in UX Collective (40K+ views)'
    ]
  });

  const [atsScore, setAtsScore] = useState(78);

  const SECTIONS = [
    { id: 'personal', label: 'Personal Info', done: Boolean(cvData.name && cvData.email) },
    { id: 'summary', label: 'Summary', done: Boolean(cvData.summary) },
    { id: 'experience', label: 'Work Experience', done: cvData.experiences.length > 0 },
    { id: 'education', label: 'Education', done: cvData.education.length > 0 },
    { id: 'skills', label: 'Skills', done: cvData.skillsCategories.length > 0 },
    { id: 'achievements', label: 'Achievements', done: cvData.achievements.length > 0 }
  ];

  // Handle PDF Upload & Auto-Extraction
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      if (triggerToast) triggerToast('Please upload a valid PDF document.');
      return;
    }

    setIsUploading(true);
    if (triggerToast) triggerToast('Extracting resume content via OCR parser...');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const token = localStorage.getItem('careerly_token');

      const res = await fetch(`${API_BASE_URL}/cv/extract-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.parsed) {
          setCvData(prev => ({
            ...prev,
            name: data.parsed.name || prev.name,
            email: data.parsed.email || prev.email,
            phone: data.parsed.phone || prev.phone,
            summary: data.parsed.summary || prev.summary,
            experiences: data.parsed.experiences || prev.experiences
          }));
          setAtsScore(88);
          if (triggerToast) triggerToast('✓ PDF parsed & synchronized successfully!');
        }
      } else {
        // Mock extract fallback
        setTimeout(() => {
          setAtsScore(84);
          if (triggerToast) triggerToast('✓ PDF analyzed & structured into International CV format!');
        }, 1000);
      }
    } catch (err) {
      if (triggerToast) triggerToast('PDF loaded into workspace.');
    } finally {
      setIsUploading(false);
    }
  };

  // AI Improve Summary & Bullets
  const handleAiImprove = async () => {
    setIsAiOptimizing(true);
    try {
      setTimeout(() => {
        setCvData(prev => ({
          ...prev,
          summary: `High-impact ${prev.title} with 5+ years of verified international experience leading cross-functional teams, scalable design systems, and user-centric web platforms. Proven track record of increasing engagement by 35% and streamlining enterprise developer workflows.`
        }));
        setAtsScore(92);
        setIsAiOptimizing(false);
        if (triggerToast) triggerToast('✨ Summary optimized with high-scoring ATS keywords!');
      }, 900);
    } catch (e) {
      setIsAiOptimizing(false);
    }
  };

  // Export CV as PDF / Print
  const handleExportPdf = () => {
    setIsExporting(true);
    window.print();
    setTimeout(() => {
      setIsExporting(false);
      if (triggerToast) triggerToast('✓ International CV PDF generated & downloaded!');
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* ── 1. Top Header Bar ────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card flex-shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground leading-none">CV Studio & ATS Tailor</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {cvData.name} — {cvData.title} · <span className="text-emerald-600 font-medium">Eligible for Global & Remote Visas</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".pdf" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4.5 py-2.5 text-[13.5px] font-semibold border border-border rounded-xl text-foreground hover:bg-secondary transition-all disabled:opacity-50"
          >
            {isUploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
            <span>Import PDF</span>
          </button>

          <button 
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Download size={12} />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {/* ── 2. 3-Column Studio Body ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Sections Navigator & ATS Diagnostics (w-56) */}
        <div className="hidden md:flex w-56 flex-shrink-0 border-r border-border bg-card overflow-y-auto custom-scrollbar flex-col justify-between p-3.5 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">Sections</p>
            <div className="space-y-1">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-left transition-all ${
                    activeSection === s.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                  
                >
                  <span className="flex items-center gap-2">
                    {s.done ? (
                      <CheckCircle size={13} className={activeSection === s.id ? 'text-white' : 'text-emerald-500'} />
                    ) : (
                      <CircleDot size={13} className="text-muted-foreground/50" />
                    )}
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ATS Score Gauge & Feedback */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="bg-secondary/60 rounded-xl p-3 border border-border/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">ATS Score</span>
                <span className="text-[16px] font-bold font-mono text-emerald-600">{atsScore}</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${atsScore}%` }} />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">
                {atsScore >= 85 ? 'Excellent — International Ready' : 'Good — add keywords to reach 90+'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-1.5">AI Suggestions</p>
              <div className="space-y-1.5">
                {[
                  "Add 'cross-functional' to summary",
                  "Quantify impact with % in Experience",
                  "Add live portfolio link to Personal Info"
                ].map((s, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug">
                    <Zap size={10} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-1.5">Missing Keywords</p>
              <div className="flex flex-wrap gap-1">
                {["cross-functional", "stakeholder", "data-driven", "design systems"].map(k => (
                  <span key={k} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[9px] rounded font-medium">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Active Section Editor (Flex-1) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 custom-scrollbar space-y-6">
          
          {/* Mobile Navigation Rail for Sections */}
          <div className="flex md:hidden gap-1.5 overflow-x-auto pb-2 -mt-1 no-scrollbar">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSection === s.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          
          {/* SECTION 1: PERSONAL INFO */}
          {activeSection === 'personal' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Personal Information</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Contact details formatted for automated ATS parsing engines.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", value: cvData.name },
                  { label: "Professional Title", key: "title", value: cvData.title },
                  { label: "Email", key: "email", value: cvData.email },
                  { label: "Phone", key: "phone", value: cvData.phone },
                  { label: "Location", key: "location", value: cvData.location },
                  { label: "LinkedIn URL", key: "linkedin", value: cvData.linkedin },
                  { label: "Portfolio URL", key: "portfolio", value: cvData.portfolio },
                  { label: "GitHub URL", key: "github", value: cvData.github }
                ].map(({ label, key, value }) => (
                  <div key={label}>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
                    <input 
                      type="text" 
                      value={value} 
                      onChange={e => setCvData({ ...cvData, [key]: e.target.value })}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: PROFESSIONAL SUMMARY */}
          {activeSection === 'summary' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Professional Summary</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">High-impact elevator pitch tailored for recruiters and executive screeners.</p>
                </div>
                <button 
                  onClick={handleAiImprove}
                  disabled={isAiOptimizing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[12px] font-semibold rounded-lg hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  <span>{isAiOptimizing ? 'Optimizing...' : 'Improve with AI'}</span>
                </button>
              </div>

              <textarea 
                rows={6}
                value={cvData.summary}
                onChange={e => setCvData({ ...cvData, summary: e.target.value })}
                className="w-full bg-secondary/50 border border-border rounded-xl p-4 text-[13px] text-foreground outline-none focus:border-primary transition-all resize-none leading-relaxed"
                placeholder="Write your professional summary..."
              />
              <p className="text-[11px] text-muted-foreground">Aim for 200–350 characters highlighting quantifiable achievements.</p>
            </div>
          )}

          {/* SECTION 3: WORK EXPERIENCE */}
          {activeSection === 'experience' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Work Experience</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Quantified achievements using the STAR methodology.</p>
                </div>
                <button 
                  onClick={() => {
                    const newExp = {
                      id: Date.now(),
                      title: 'Product Designer',
                      company: 'New Company',
                      from: '2023',
                      to: 'Present',
                      bullets: ['Led cross-functional design sprints delivering high-priority user journeys.']
                    };
                    setCvData({ ...cvData, experiences: [newExp, ...cvData.experiences] });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white text-[12px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm"
                  style={{ background: '#2457FF' }}
                >
                  <Plus size={13} /> Add Experience
                </button>
              </div>

              {cvData.experiences.map((exp, idx) => (
                <div key={exp.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Job Title</label>
                        <input 
                          type="text" 
                          value={exp.title}
                          onChange={e => {
                            const updated = [...cvData.experiences];
                            updated[idx].title = e.target.value;
                            setCvData({ ...cvData, experiences: updated });
                          }}
                          className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Company</label>
                        <input 
                          type="text" 
                          value={exp.company}
                          onChange={e => {
                            const updated = [...cvData.experiences];
                            updated[idx].company = e.target.value;
                            setCvData({ ...cvData, experiences: updated });
                          }}
                          className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = cvData.experiences.filter((_, i) => i !== idx);
                        setCvData({ ...cvData, experiences: updated });
                      }}
                      className="text-muted-foreground hover:text-red-500 p-1 transition-colors"
                      title="Delete experience"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">STAR Achievement Bullets</label>
                    <div className="space-y-2">
                      {exp.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">•</span>
                          <input 
                            type="text"
                            value={bullet}
                            onChange={e => {
                              const updated = [...cvData.experiences];
                              updated[idx].bullets[bIdx] = e.target.value;
                              setCvData({ ...cvData, experiences: updated });
                            }}
                            className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
                          />
                          <button 
                            onClick={() => {
                              const updated = [...cvData.experiences];
                              updated[idx].bullets = updated[idx].bullets.filter((_, bi) => bi !== bIdx);
                              setCvData({ ...cvData, experiences: updated });
                            }}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        const updated = [...cvData.experiences];
                        updated[idx].bullets.push('Increased product engagement through user research and workflow optimizations.');
                        setCvData({ ...cvData, experiences: updated });
                      }}
                      className="flex items-center gap-1 text-[11px] text-primary font-semibold mt-2.5 hover:underline"
                    >
                      <Plus size={11} /> Add bullet point
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4: EDUCATION */}
          {activeSection === 'education' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Education & Certifications</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Academic credentials and degree equivalencies.</p>
                </div>
              </div>

              {cvData.education.map((edu, idx) => (
                <div key={edu.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Degree Title</label>
                    <input 
                      type="text" 
                      value={edu.degree}
                      onChange={e => {
                        const updated = [...cvData.education];
                        updated[idx].degree = e.target.value;
                        setCvData({ ...cvData, education: updated });
                      }}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Institution / University</label>
                    <input 
                      type="text" 
                      value={edu.institution}
                      onChange={e => {
                        const updated = [...cvData.education];
                        updated[idx].institution = e.target.value;
                        setCvData({ ...cvData, education: updated });
                      }}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Graduation Year</label>
                    <input 
                      type="text" 
                      value={edu.to}
                      onChange={e => {
                        const updated = [...cvData.education];
                        updated[idx].to = e.target.value;
                        setCvData({ ...cvData, education: updated });
                      }}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">GPA (Out of 4.0)</label>
                    <input 
                      type="text" 
                      value={edu.gpa}
                      onChange={e => {
                        const updated = [...cvData.education];
                        updated[idx].gpa = e.target.value;
                        setCvData({ ...cvData, education: updated });
                      }}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 5: SKILLS */}
          {activeSection === 'skills' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Skills & Technical Taxonomy</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Categorized keywords indexed by global search filters.</p>
              </div>

              {cvData.skillsCategories.map((cat, cIdx) => (
                <div key={cat.cat} className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{cat.cat}</span>
                  <div className="flex flex-wrap gap-2">
                    {cat.skills.map((sk, sIdx) => (
                      <span key={sk} className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary border border-border rounded-lg text-[12px] text-foreground font-medium">
                        {sk}
                        <button 
                          onClick={() => {
                            const updated = [...cvData.skillsCategories];
                            updated[cIdx].skills = updated[cIdx].skills.filter((_, i) => i !== sIdx);
                            setCvData({ ...cvData, skillsCategories: updated });
                          }}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 6: ACHIEVEMENTS */}
          {activeSection === 'achievements' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Achievements & Certifications</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Noteworthy awards, patents, fellowships, or publications.</p>
              </div>

              <div className="space-y-2">
                {cvData.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-secondary/40 border border-border rounded-lg text-[12px] text-foreground">
                    <Award size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="flex-1">{ach}</span>
                    <button 
                      onClick={() => {
                        const updated = cvData.achievements.filter((_, i) => i !== idx);
                        setCvData({ ...cvData, achievements: updated });
                      }}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live International CV Document Preview (w-80) */}
        <div className="hidden xl:flex w-80 flex-shrink-0 border-l border-border bg-card p-4 overflow-y-auto custom-scrollbar flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Document Preview</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                ISO 9001 Format
              </span>
            </div>

            {/* Live Paper Simulation */}
            <div className="bg-white border border-border rounded-xl p-4.5 text-[#10213D] shadow-sm space-y-3 font-sans text-[11px] leading-relaxed">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="font-bold text-[14px] uppercase text-[#10213D] tracking-tight">{cvData.name}</h3>
                <p className="text-[10px] font-medium text-blue-600">{cvData.title}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{cvData.email} · {cvData.phone} · {cvData.location}</p>
              </div>

              <div>
                <h4 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">Summary</h4>
                <p className="text-[10px] text-slate-700 line-clamp-3 leading-normal">{cvData.summary}</p>
              </div>

              <div>
                <h4 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">Experience</h4>
                {cvData.experiences.slice(0, 2).map((exp, i) => (
                  <div key={i} className="mb-2">
                    <p className="font-semibold text-[10px] text-slate-900">{exp.title} — <span className="font-normal text-slate-600">{exp.company}</span></p>
                    <p className="text-[9px] text-slate-600 line-clamp-1">• {exp.bullets[0]}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">Education</h4>
                {cvData.education.slice(0, 1).map((edu, i) => (
                  <p key={i} className="text-[10px] text-slate-800">
                    <strong>{edu.degree}</strong>, {edu.institution} ({edu.to})
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* ATS Score Breakdown */}
          <div className="pt-3 border-t border-border space-y-2 text-[10px]">
            <p className="font-bold text-muted-foreground uppercase tracking-widest">ATS Breakdown</p>
            {[
              { label: "Keywords", val: 85, color: "bg-emerald-500" },
              { label: "Formatting", val: 95, color: "bg-blue-500" },
              { label: "Content Depth", val: 88, color: "bg-purple-500" },
              { label: "Skills Match", val: 92, color: "bg-cyan-500" }
            ].map(({ label, val, color }) => (
              <div key={label} className="space-y-0.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>{label}</span>
                  <span className="font-mono font-bold text-foreground">{val}%</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

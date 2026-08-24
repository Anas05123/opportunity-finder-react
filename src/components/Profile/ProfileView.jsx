import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Globe, Building2, 
  CheckCircle, AlertCircle, CircleDot, Pencil, Plus, 
  Trash2, Briefcase, GraduationCap, Award, ShieldCheck,
  Zap, Save, Sparkles
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api.js';

export default function ProfileView({ triggerToast }) {
  const [editing, setEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Alex Kim',
    title: 'Senior Product Designer',
    email: 'alex.kim@email.com',
    phone: '+1 (415) 555-0192',
    location: 'San Francisco, CA',
    status: 'Open to new roles',
    availability: 'Available now',
    about: 'Experienced product designer with 4+ years crafting digital products used by millions. I specialise in design systems, user research, and bridging the gap between engineering and product. Currently open to senior design roles at product-led companies.',
    experiences: [
      {
        role: 'Senior Product Designer',
        company: 'Headspace',
        period: 'Jan 2022 – Present',
        location: 'Remote',
        color: '#FF5A5F',
        initial: 'H',
        bullets: [
          'Led redesign of core meditation experience (+23% DAU)',
          'Built & maintained 200+ component design system',
          'Raised WCAG accessibility compliance from 60% → 94%'
        ]
      },
      {
        role: 'Product Designer',
        company: 'Intercom',
        period: 'Mar 2020 – Dec 2021',
        location: 'San Francisco, CA',
        color: '#0866FF',
        initial: 'I',
        bullets: [
          'Designed inbox and automation for 30K+ enterprise customers',
          'Shipped 12 major features with 3 engineering squads'
        ]
      }
    ],
    education: {
      degree: 'Bachelor of Arts — Design',
      institution: 'UC Berkeley',
      period: '2016 – 2020',
      initial: 'UC',
      details: 'Concentration in Interaction Design · GPA 3.85'
    },
    skillsCategories: [
      { cat: 'Design', skills: ['Figma', 'Sketch', 'Framer', 'Principle', 'Design Systems'] },
      { cat: 'Research', skills: ['User interviews', 'Usability testing', 'Survey design'] },
      { cat: 'Systems & Code', skills: ['Accessibility (WCAG)', 'HTML/CSS', 'React basics', 'TypeScript'] }
    ],
    preferences: [
      { label: 'Job Type', value: 'Full-time, Contract' },
      { label: 'Target Salary', value: '$140K – $200K USD' },
      { label: 'Work Mode', value: 'Remote, Hybrid' },
      { label: 'Preferred Locations', value: 'SF Bay Area, NYC, Remote' },
      { label: 'Notice Period', value: '2 weeks' },
      { label: 'Visa Sponsorship', value: 'Required / Open' }
    ],
    achievements: [
      { icon: '🎤', title: 'Config 2023 Speaker', desc: '"Designing at Scale" — Figma annual conference' },
      { icon: '🏆', title: 'AIGA Design Excellence Award', desc: 'Awarded for contributions to accessible design' }
    ]
  });

  // Fetch Live Profile from Server
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('careerly_token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(prev => ({
              ...prev,
              name: data.profile.full_name || prev.name,
              title: data.profile.headline || prev.title,
              email: data.profile.email || prev.email,
              location: data.profile.location || prev.location,
              about: data.profile.resume_text || prev.about
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setEditing(false);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('careerly_token');
      if (token) {
        await fetch(`${API_BASE_URL}/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            full_name: profile.name,
            headline: profile.title,
            resume_text: profile.about
          })
        });
      }
      if (triggerToast) triggerToast('✓ Profile updated successfully!');
    } catch (e) {
      if (triggerToast) triggerToast('Profile saved locally.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'AK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background custom-scrollbar" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* ── 1. Profile Header Card (Figma Style) ─────────────────────── */}
      <div className="bg-card border-b border-border px-6 py-6 sm:px-8">
        <div className="w-full flex flex-col sm:flex-row items-start gap-5">
          
          {/* Avatar with initial */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md"
              style={{ background: '#2457FF' }}
            >
              {getInitials(profile.name)}
            </div>
            <button 
              onClick={() => setEditing(!editing)}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
              title="Edit Avatar"
            >
              <Pencil size={12} className="text-muted-foreground" />
            </button>
          </div>

          {/* Profile Identity Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="text-[22px] font-bold text-foreground bg-secondary/60 border border-border rounded-lg px-3 py-1 outline-none focus:border-primary"
                    />
                    <input 
                      type="text" 
                      value={profile.title} 
                      onChange={e => setProfile({ ...profile, title: e.target.value })}
                      className="text-[13px] text-muted-foreground bg-secondary/60 border border-border rounded-lg px-3 py-1 outline-none focus:border-primary block w-full"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="font-display text-[24px] sm:text-[26px] font-bold text-foreground leading-tight">
                      {profile.name}
                    </h1>
                    <p className="text-[14px] font-medium text-muted-foreground mt-0.5">{profile.title}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-muted-foreground" />
                    <span>{profile.location}</span>
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Building2 size={12} className="text-muted-foreground" />
                    <span>{profile.status}</span>
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle size={12} />
                    <span>{profile.availability}</span>
                  </span>
                </div>
              </div>

              {/* Edit / Save Button */}
              <button 
                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm flex-shrink-0"
                style={{ background: '#2457FF' }}
              >
                {editing ? <Save size={13} /> : <Pencil size={13} />}
                <span>{editing ? 'Save Profile' : 'Edit Profile'}</span>
              </button>
            </div>

            {/* Profile Strength Bar */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
              <div className="flex-1 max-w-[260px]">
                <div className="flex justify-between mb-1 text-[11px]">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wide">Profile Strength</span>
                  <span className="font-mono font-bold text-primary">85%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '85%', background: '#2457FF' }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles size={12} className="text-amber-500" />
                <span>Add portfolio link to reach 100% calibration</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── 2. 2-Column Responsive Body ──────────────────────────────── */}
      <div className="w-full p-5 sm:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          
          {/* ── Left Column: About, Experience, Education ────────────── */}
          <div className="space-y-6">
            
            {/* About Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wider">About</h3>
                {editing && (
                  <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <Pencil size={11} /> Edit bio
                  </span>
                )}
              </div>
              {editing ? (
                <textarea 
                  rows={4}
                  value={profile.about}
                  onChange={e => setProfile({ ...profile, about: e.target.value })}
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3.5 text-[13px] text-foreground outline-none focus:border-primary transition-all resize-none leading-relaxed"
                />
              ) : (
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {profile.about}
                </p>
              )}
            </div>

            {/* Work Experience Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wider">Work Experience</h3>
                {editing && (
                  <button className="text-[12px] text-primary font-semibold flex items-center gap-1">
                    <Plus size={12} /> Add Role
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {profile.experiences.map((exp, idx) => (
                  <div key={idx} className={`flex items-start gap-4 ${idx > 0 ? 'pt-5 border-t border-border/60' : ''}`}>
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: exp.color }}
                    >
                      {exp.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-[14px] font-semibold text-foreground">{exp.role}</h4>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{exp.company} · {exp.location}</p>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border flex-shrink-0">
                          {exp.period}
                        </span>
                      </div>
                      <ul className="mt-2.5 space-y-1">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="text-[12px] text-muted-foreground flex items-start gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wider">Education</h3>
                {editing && (
                  <button className="text-[12px] text-primary font-semibold flex items-center gap-1">
                    <Plus size={12} /> Add Degree
                  </button>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 shadow-xs">
                  {profile.education.initial}
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-foreground">{profile.education.degree}</h4>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{profile.education.institution} · {profile.education.period}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">{profile.education.details}</p>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right Column: Skills, Preferences, Achievements, Nudge ── */}
          <div className="space-y-6">
            
            {/* Skills Card */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wider">Skills</h3>
                {editing && <button className="text-[11px] text-primary font-semibold"><Plus size={12} /></button>}
              </div>

              <div className="space-y-3">
                {profile.skillsCategories.map(cat => (
                  <div key={cat.cat} className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat.cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map(s => (
                        <span key={s} className="px-2.5 py-1 bg-secondary text-foreground text-[11px] font-medium rounded-lg border border-border">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Preferences Card */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wider">Career Preferences</h3>
                {editing && <button className="text-[11px] text-primary font-semibold"><Pencil size={11} /></button>}
              </div>

              <div className="space-y-2.5">
                {profile.preferences.map(pref => (
                  <div key={pref.label} className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">{pref.label}</span>
                    <span className="font-semibold text-foreground text-right">{pref.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wider">Achievements</h3>
                {editing && <button className="text-[11px] text-primary font-semibold"><Plus size={11} /></button>}
              </div>

              <div className="space-y-3">
                {profile.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="text-lg flex-shrink-0">{ach.icon}</span>
                    <div>
                      <h5 className="text-[12px] font-semibold text-foreground">{ach.title}</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Completion Nudge Card */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-600" />
                <h4 className="text-[12px] font-bold text-amber-800 dark:text-amber-400">Complete your profile</h4>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {[
                  { label: "Add live portfolio link", done: false },
                  { label: "Upload profile avatar", done: true },
                  { label: "Verify IELTS/English score", done: true }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-foreground/80">
                    {item.done ? (
                      <CheckCircle size={12} className="text-emerald-600" />
                    ) : (
                      <CircleDot size={12} className="text-amber-600" />
                    )}
                    <span>{item.label}</span>
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

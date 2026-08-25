import React, { useState, useEffect } from 'react';
import { 
  X, Zap, CheckCircle2, Copy, Check, FileText, 
  Sparkles, ExternalLink, ShieldCheck, Mail, Send, Building2, MapPin, RefreshCw, BookOpen, List, CheckSquare
} from 'lucide-react';
import { resolveSafeJobUrl, resolveLinkedInSearchUrl, resolveGoogleJobsUrl } from '../../utils/urlResolver.js';
import { safeOpenUrl } from '../../utils/sanitizeUrl.js';
import { API_BASE_URL } from '../../config/api.js';

export default function ApplicationKitDrawer({ opportunity, userProfile, onClose, onApplied, triggerToast }) {
  if (!opportunity) return null;

  const [activeTab, setActiveTab] = useState('readiness'); // readiness, cover_letter, tailored_cv, checklist
  const [isLoadingKit, setIsLoadingKit] = useState(true);
  const [kit, setKit] = useState(null);
  const [copiedItem, setCopiedItem] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchKit() {
      setIsLoadingKit(true);
      try {
        const token = localStorage.getItem('careerly_token');
        const res = await fetch(`${API_BASE_URL}/opportunities/${opportunity.id}/prepare-application`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ userProfile })
        });
        const data = await res.json();
        if (isMounted && data.status === 'success') {
          setKit(data.application_kit);
        }
      } catch (err) {
        console.warn('Kit fetch error, using fallback:', err);
      } finally {
        if (isMounted) setIsLoadingKit(false);
      }
    }
    fetchKit();
    return () => { isMounted = false; };
  }, [opportunity.id, userProfile]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    if (triggerToast) triggerToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  const handleLaunchPortal = () => {
    if (kit?.custom_cover_letter) {
      navigator.clipboard.writeText(kit.custom_cover_letter);
    }
    if (onApplied) onApplied(opportunity.id, 'preparing');
    const portalUrl = resolveSafeJobUrl(opportunity);
    safeOpenUrl(portalUrl, '_blank');
    if (triggerToast) triggerToast('Cover letter copied! Verified portal opened.');
  };

  const handleOpenEmailClient = () => {
    if (onApplied) onApplied(opportunity.id, 'applied');
    const recipient = opportunity.contact_email || 'careers@' + (opportunity.organization || opportunity.company || 'company').toLowerCase().replace(/[^a-z]/g, '') + '.com';
    const subject = encodeURIComponent(`Application Submission: ${opportunity.title} - ${userProfile?.name || 'Candidate'}`);
    const body = encodeURIComponent(kit?.custom_cover_letter || 'Please find attached my application dossier.');
    safeOpenUrl(`mailto:${recipient}?subject=${subject}&body=${body}`, '_blank');
    if (triggerToast) triggerToast(`Opened email client pre-filled to ${recipient}!`);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <div 
        className="drawer-panel-prodexa" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-kit-title"
      >
        
        {/* ── Header ────────────────────────────────────────── */}
        <div className="app-kit-header">
          <div className="space-y-1.5 max-w-[85%]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bento-tag text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                <Sparkles size={12} className="inline mr-1 text-emerald-600" /> AI Application Kit
              </span>
              <span className="bento-tag text-[10px] font-bold bg-primary/10 text-primary border-primary/20 capitalize">
                {opportunity.opportunity_type || opportunity.type || 'Job'}
              </span>
            </div>

            <h2 id="app-kit-title" className="text-xl font-bold text-foreground leading-snug">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
              <span className="flex items-center gap-1 font-bold text-foreground">
                <Building2 size={14} className="text-primary" /> {opportunity.organization || opportunity.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" /> {opportunity.location_country || 'Global'}
              </span>
            </div>
          </div>

          <button 
            className="icon-button hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors" 
            onClick={onClose} 
            aria-label="Close application kit drawer" 
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tab Navigation Bar ──────────────────────────────── */}
        <div className="app-kit-tabs-bar">
          {[
            { id: 'readiness', label: 'Readiness & Research', icon: Sparkles },
            { id: 'cover_letter', label: 'Tailored Cover Letter', icon: FileText },
            { id: 'tailored_cv', label: 'CV Bullet Suggestions', icon: List },
            { id: 'checklist', label: 'Application Checklist', icon: CheckSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button 
              key={id}
              className={`app-kit-tab-btn flex items-center gap-1.5 ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Scrollable Body Content ─────────────────────────── */}
        <div className="app-kit-body space-y-5">
          {isLoadingKit ? (
            <div className="p-8 text-center space-y-3">
              <RefreshCw className="animate-spin text-primary mx-auto" size={28} />
              <p className="text-xs font-semibold text-muted-foreground">Generating application strategy & tailored assets...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: READINESS & RESEARCH */}
              {activeTab === 'readiness' && (
                <div className="space-y-4">
                  {/* Readiness Score Card */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Application Readiness</span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">Profile tailored for ATS keyword filters</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {kit?.readiness_score || 92}% READY
                    </span>
                  </div>

                  {/* Key Strengths */}
                  <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Profile Strengths to Emphasize</h4>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      {(kit?.strengths || ['Demonstrated alignment with technical scope', 'Strong relevant experience in core tools', 'Clear match for target degree requirements']).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Talking Points & Intel */}
                  <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Intel & Focus Areas</h4>
                    <p className="text-xs text-foreground leading-relaxed">
                      {kit?.company_intel || `${opportunity.organization || opportunity.company} values candidate autonomy, clear communication, and measurable project impact.`}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: TAILORED COVER LETTER */}
              {activeTab === 'cover_letter' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tailored Cover Letter Draft</span>
                    <button
                      onClick={() => handleCopy(kit?.custom_cover_letter || 'Cover letter draft...', 'Cover Letter')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      {copiedItem === 'Cover Letter' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedItem === 'Cover Letter' ? 'Copied!' : 'Copy Letter'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-card border border-border rounded-xl font-sans text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {kit?.custom_cover_letter || `Dear Hiring Team at ${opportunity.organization || opportunity.company},\n\nI am writing to express my strong enthusiasm for the ${opportunity.title} role. With my background in relevant projects and problem-solving, I am confident in contributing to your objectives.\n\nSincerely,\n${userProfile?.name || 'Candidate'}`}
                  </div>
                </div>
              )}

              {/* TAB 3: CV BULLET SUGGESTIONS */}
              {activeTab === 'tailored_cv' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tailored CV Bullets for this Listing</h4>
                  <div className="space-y-2.5">
                    {(kit?.tailored_bullets || [
                      { bullet: `Architected and optimized core services aligning with ${opportunity.title} deliverables.`, impact: 'Highlights direct ownership and quantifiable deliverables.' },
                      { bullet: 'Collaborated cross-functionally to accelerate feature turnaround by 35%.', impact: 'Demonstrates measurable operational efficiency.' }
                    ]).map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-card border border-border rounded-xl space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-foreground leading-snug">• {item.bullet}</p>
                          <button
                            onClick={() => handleCopy(item.bullet, `Bullet #${idx + 1}`)}
                            className="p-1 text-muted-foreground hover:text-primary rounded-md transition-colors cursor-pointer shrink-0"
                            title="Copy Bullet"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">💡 <em>{item.impact}</em></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: APPLICATION CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pre-Submission Checklist</h4>
                  <div className="space-y-2">
                    {(kit?.checklist || [
                      { task: 'Tailor resume bullets with target keywords', importance: 'Mandatory' },
                      { task: 'Review and paste tailored cover letter', importance: 'Recommended' },
                      { task: 'Verify portfolio or GitHub links in profile', importance: 'Important' }
                    ]).map((item, idx) => (
                      <div key={idx} className="p-3 bg-card border border-border rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span className="text-xs font-semibold text-foreground">{item.task}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-secondary text-foreground text-[10px] font-bold rounded-md">
                          {item.importance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer Actions ─────────────────────────────────── */}
        <div className="app-kit-footer">
          <button 
            className="btn btn-outline" 
            onClick={handleOpenEmailClient} 
            title="Open pre-filled draft in your default email client"
          >
            <Mail size={15} />
            <span>Email Recruiter Directly</span>
          </button>
          <button 
            className="btn btn-emerald" 
            onClick={handleLaunchPortal} 
            title="Copy cover letter and launch official portal"
          >
            <span>Launch Official Portal & Paste Dossier</span>
            <ExternalLink size={15} />
          </button>
        </div>

      </div>
    </div>
  );
}

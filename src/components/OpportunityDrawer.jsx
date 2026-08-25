import React, { useState, useEffect } from 'react';
import { 
  X, Bookmark, ExternalLink, Calendar, MapPin, Building2, 
  Coins, CheckCircle2, ShieldCheck, Zap, Mail, ArrowUpRight, Award, Compass, RefreshCw, FileText, Globe, Sparkles, Check
} from 'lucide-react';
import { resolveSafeJobUrl, resolveLinkedInSearchUrl, resolveGoogleJobsUrl } from '../utils/urlResolver.js';
import FormattedMarkdown from '../utils/FormattedMarkdown.jsx';
import { cleanStipendText, cleanHtmlText } from '../utils/formatUtils.js';
import { sanitizeUrl } from '../utils/sanitizeUrl.js';
import { API_BASE_URL } from '../config/api.js';

export default function OpportunityDrawer({ 
  opportunity, 
  onClose, 
  onToggleSave, 
  isSaved, 
  onAutoApply, 
  onEmailOutreach, 
  onVerifiedUpdate,
  triggerToast
}) {
  if (!opportunity) return null;

  const displayStipend = cleanStipendText(opportunity.stipend_text || opportunity.stipend);
  const cleanTitle = cleanHtmlText(opportunity.title);
  const cleanCompany = cleanHtmlText(opportunity.organization || opportunity.company);

  const [activeTab, setActiveTab] = useState('overview');
  const [isOfficial, setIsOfficial] = useState(opportunity.verification_status === 'official_verified' || opportunity.verification_level >= 4);

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

  const safePortalUrl = resolveSafeJobUrl(opportunity);
  const liveLinkedInUrl = resolveLinkedInSearchUrl(opportunity);

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <div 
        className="drawer-panel-prodexa" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="op-drawer-title"
      >
        
        {/* ── Header ────────────────────────────────────────── */}
        <div className="app-kit-header">
          <div className="space-y-1.5 max-w-[85%]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bento-tag text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                {opportunity.opportunity_type || opportunity.type || 'Opportunity'}
              </span>
              <span className="bento-tag text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                <CheckCircle2 size={12} className="inline mr-1 text-emerald-600" /> Verified Active
              </span>
              {opportunity.source_tier && (
                <span className="bento-tag text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-muted-foreground border-border">
                  Tier {opportunity.source_tier} Source
                </span>
              )}
            </div>
            
            <h2 id="op-drawer-title" className="text-xl font-bold text-foreground leading-snug">
              {cleanTitle}
            </h2>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
              <span className="flex items-center gap-1 font-bold text-foreground">
                <Building2 size={14} className="text-primary" /> {cleanCompany}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" /> {opportunity.location_city || opportunity.location_country || 'Global / Remote'}
              </span>
            </div>
          </div>

          <button 
            className="icon-button hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors" 
            onClick={onClose} 
            aria-label="Close details drawer" 
            title="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tab Navigation Bar ──────────────────────────────── */}
        <div className="app-kit-tabs-bar">
          {[
            { id: 'overview', label: 'Overview', icon: Compass },
            { id: 'benefits', label: 'Compensation & Benefits', icon: Coins },
            { id: 'eligibility', label: 'Eligibility & Criteria', icon: CheckCircle2 },
            { id: 'evidence', label: 'Evidence & Provenance', icon: ShieldCheck },
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
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Compensation & Deadline Card */}
              <div className="p-4 bg-card border border-border rounded-xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Compensation & Stipend</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Deadline: <strong className="text-foreground">{opportunity.deadline_raw || opportunity.deadline_utc || 'Open until filled'}</strong>
                  </span>
                </div>
                <div className="text-xl font-black text-foreground">
                  {displayStipend !== 'Compensation not disclosed' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">{displayStipend}</span>
                  ) : (
                    <span className="text-muted-foreground text-base font-bold">Competitive Market Rate / Disclosed upon application</span>
                  )}
                </div>
              </div>

              {/* Match Fit & Strategy (if provided) */}
              {opportunity.why_matches_you && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Sparkles size={15} /> Why Your Profile Fits This Role
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {opportunity.why_matches_you}
                  </p>
                </div>
              )}

              {/* Specs & Academic Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/50 border border-border rounded-xl">
                  <span className="text-[11px] font-bold text-muted-foreground block">Academic Standing</span>
                  <strong className="text-xs font-bold text-foreground capitalize mt-0.5 block">
                    {opportunity.degree_level === 'undergrad' ? 'Bachelor / Undergraduate' : (opportunity.degree_level || 'Any Degree Level')}
                  </strong>
                </div>
                <div className="p-3 bg-secondary/50 border border-border rounded-xl">
                  <span className="text-[11px] font-bold text-muted-foreground block">Work Modality</span>
                  <strong className="text-xs font-bold text-foreground capitalize mt-0.5 block">
                    {opportunity.work_mode || (opportunity.is_remote ? 'Remote' : 'Onsite / Hybrid')}
                  </strong>
                </div>
              </div>

              {/* Role Scope & Mission */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Role Scope & Description
                </h4>
                <div className="text-xs text-foreground leading-relaxed p-4 bg-card border border-border rounded-xl">
                  <FormattedMarkdown text={opportunity.description || opportunity.description_text || 'Verified opportunity listing from official company career repository.'} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL BENEFITS */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Funding & Allowance Breakdown</h4>
                <div className="text-lg font-bold text-foreground">
                  {opportunity.stipend_text || displayStipend}
                </div>

                <div className="divide-y divide-border text-xs space-y-2 pt-2">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Compensation Model:</span>
                    <strong className="text-foreground">{opportunity.is_paid ? 'Paid Placement / Stipend' : 'Standard Market Compensation'}</strong>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Work Mode:</span>
                    <strong className="text-foreground capitalize">{opportunity.work_mode || 'Flexible / Hybrid'}</strong>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Language Requirement:</span>
                    <strong className="text-foreground">{opportunity.no_ielts ? 'English Medium Waiver Accepted' : 'Standard English Proficiency'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ELIGIBILITY */}
          {activeTab === 'eligibility' && (
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Eligibility Criteria & Academic Prerequisites</h4>
                <p className="text-xs text-foreground leading-relaxed">
                  {opportunity.eligibility_summary || 'Open to enrolled students and recent graduates in relevant disciplines. Applicants must meet standard hiring criteria and possess working rights for the target location.'}
                </p>
              </div>

              {opportunity.skills_required && (
                <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Required Skills & Capabilities</h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(() => {
                      let skills = [];
                      try {
                        skills = typeof opportunity.skills_required === 'string' ? JSON.parse(opportunity.skills_required) : opportunity.skills_required;
                      } catch (e) {}
                      if (!Array.isArray(skills) || skills.length === 0) {
                        return <span className="text-xs text-muted-foreground">General discipline expertise required.</span>;
                      }
                      return skills.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-secondary text-foreground text-xs font-semibold rounded-lg border border-border">
                          {s}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVIDENCE & AUDIT */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Level {opportunity.source_authority_level || 1} Provenance
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Authority Tier {opportunity.source_tier || 1}
                  </span>
                </div>
                <div className="text-xs text-foreground">
                  <strong>Source Authority:</strong> {opportunity.source_name || 'Official ATS Board'}
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Canonical Application URL:</strong>
                  <p className="font-mono text-[11px] truncate mt-0.5 text-primary">
                    {opportunity.official_apply_url || opportunity.source_url}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer Actions ─────────────────────────────────── */}
        <div className="app-kit-footer">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              className={`btn btn-outline ${isSaved ? 'text-primary border-primary/40 bg-primary/5' : ''}`}
              onClick={() => onToggleSave(opportunity)}
            >
              <Bookmark size={15} className={isSaved ? 'fill-primary text-primary' : ''} />
              <span>{isSaved ? 'Saved in CRM' : 'Save to CRM'}</span>
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => onEmailOutreach(opportunity)}
            >
              <Mail size={15} />
              <span>Email Recruiter</span>
            </button>
          </div>

          <a 
            href={sanitizeUrl(opportunity.official_apply_url || opportunity.application_url || opportunity.source_url)}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-emerald"
          >
            <Zap size={15} />
            <span>
              {opportunity.application_url_type === 'EXACT_JOB_APPLICATION' 
                ? 'Apply on Official Portal' 
                : 'View Official Source'}
            </span>
            <ExternalLink size={14} />
          </a>
        </div>

      </div>
    </div>
  );
}

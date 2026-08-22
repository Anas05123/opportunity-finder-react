import React, { useState, useEffect } from 'react';
import { 
  X, Building2, MapPin, Coins, Clock, CheckCircle2, 
  ExternalLink, Bookmark, Zap, Mail, ShieldCheck, 
  Check, FileText, Globe, Sparkles
} from 'lucide-react';
import { resolveSafeJobUrl, resolveLinkedInSearchUrl, resolveGoogleJobsUrl } from '../utils/urlResolver.js';
import FormattedMarkdown from '../utils/FormattedMarkdown.jsx';
import { cleanStipendText, cleanHtmlText } from '../utils/formatUtils.js';
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
  const [isOfficial, setIsOfficial] = useState(opportunity.verification_status === 'official_verified');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const safePortalUrl = resolveSafeJobUrl(opportunity);
  const liveLinkedInUrl = resolveLinkedInSearchUrl(opportunity);

  const handleVerify = async () => {
    setIsOfficial(true);
    try {
      await fetch(`${API_BASE_URL}/admin/opportunities/${opportunity.id}/verify`, { method: 'POST' });
      if (onVerifiedUpdate) onVerifiedUpdate(opportunity.id);
      if (triggerToast) triggerToast('✓ Approved as Official Verified Source!');
    } catch (e) {}
  };

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <div 
        className="drawer-panel-prodexa" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="op-drawer-title"
      >
        
        {/* Header */}
        <div className="app-kit-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <span className="bento-tag" style={{ textTransform: 'uppercase', fontWeight: '800' }}>
                {opportunity.opportunity_type || opportunity.type || 'Opportunity'}
              </span>
              <span className="bento-tag" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: '800' }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Verified Active
              </span>
            </div>
            
            <h2 id="op-drawer-title" className="type-h2">
              {opportunity.title}
            </h2>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                <Building2 size={14} color="var(--primary)" /> {opportunity.organization || opportunity.company}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="var(--accent-emerald)" /> {opportunity.location_city || opportunity.location_country || 'Malaysia'}
              </span>
            </div>
          </div>

          <button className="icon-button" onClick={onClose} aria-label="Close details drawer" title="Close Drawer">
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="app-kit-tabs-bar">
          <button 
            className={`app-kit-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`app-kit-tab-btn ${activeTab === 'benefits' ? 'active' : ''}`}
            onClick={() => setActiveTab('benefits')}
          >
            Compensation & Benefits
          </button>
          <button 
            className={`app-kit-tab-btn ${activeTab === 'eligibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('eligibility')}
          >
            Eligibility & Criteria
          </button>
          <button 
            className={`app-kit-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            Evidence & Audit
          </button>
        </div>

        {/* Body Content */}
        <div className="app-kit-body">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Stipend Banner */}
              <div style={{ background: 'var(--accent-emerald-subtle)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.35rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: (displayStipend !== 'Compensation not disclosed') ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                  {displayStipend}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Application Deadline: <strong style={{ color: 'var(--text-primary)' }}>{opportunity.deadline_raw || opportunity.deadline_utc || 'Open until filled'}</strong>
                </div>
              </div>

              {/* Tailored CV Application Strategy Banner (If matched from CV) */}
              {opportunity.application_tips && (
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: '800', color: 'var(--primary)' }}>
                      <Sparkles size={16} /> Tailored CV Application Strategy
                    </div>
                    {opportunity.cv_match_score && (
                      <span className="bento-tag" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)', fontWeight: '800' }}>
                        {opportunity.cv_match_score}% CV Match
                      </span>
                    )}
                  </div>

                  {opportunity.application_tips.why_you_match && (
                    <div style={{ marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>
                        Why Your Profile Fits:
                      </span>
                      <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {opportunity.application_tips.why_you_match.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {opportunity.application_tips.tailored_star_bullet && (
                    <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '0.2rem' }}>
                        ✨ Recommended Resume Bullet for this Role:
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        • {opportunity.application_tips.tailored_star_bullet}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="type-h3" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Role Scope & Mission
                </h4>
                <FormattedMarkdown text={opportunity.description || opportunity.description_text || 'No additional description provided in the original listing.'} />
              </div>

              {/* Specs Grid */}
              <div className="responsive-grid-2col">
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', fontWeight: '700' }}>Academic Standing</span>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    {opportunity.degree_level === 'undergrad' ? 'Bachelor of Arts / Undergrad' : opportunity.degree_level}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', fontWeight: '700' }}>Field / Specialization</span>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    {opportunity.field_of_study || 'Advertising & Marketing / Finance'}
                  </strong>
                </div>
              </div>

              {/* Benefits Summary */}
              {opportunity.benefits_summary && (
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.15rem' }}>
                  <h4 className="type-h3" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    Key Highlights & Mentorship
                  </h4>
                  <FormattedMarkdown text={opportunity.benefits_summary} />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINANCIAL BENEFITS */}
          {activeTab === 'benefits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
                  Funding & Allowance Breakdown
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: opportunity.stipend_text ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {opportunity.stipend_text || 'Compensation not disclosed in listing'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Salary / Stipend</span>
                    <strong style={{ color: opportunity.stipend_text ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                      {opportunity.stipend_text || 'Not disclosed'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Work Mode</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {opportunity.work_mode || 'Hybrid / Onsite'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>English Requirement</span>
                    <strong style={{ color: opportunity.no_ielts ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                      {opportunity.no_ielts ? '✓ English Medium of Instruction Waiver Accepted' : 'IELTS / TOEFL Required'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ELIGIBILITY */}
          {activeTab === 'eligibility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                <h4 className="type-h3" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  Eligibility Criteria & Academic Pre-requisites
                </h4>
                <p className="type-body" style={{ color: 'var(--text-primary)', lineHeight: '1.65' }}>
                  {opportunity.eligibility_summary || 'Open to enrolled undergraduate students and recent graduates in relevant disciplines.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: EVIDENCE & AUDIT */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                    <ShieldCheck size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Level {opportunity.source_authority_level || 1} Provenance
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Verified: {new Date(opportunity.last_verified_at || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Source: {opportunity.source_name || 'Official ATS Board'}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <a
                    href={opportunity.application_url || opportunity.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-outline"
                    style={{ height: '32px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Open Direct Application Form <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(opportunity.evidence_records && opportunity.evidence_records.length > 0) ? (
                  opportunity.evidence_records.map((ev, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        <span>{ev.field_name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{ev.extraction_method}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {ev.evidence_text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    No field-level evidence records extracted from source.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="app-kit-footer">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-outline"
              onClick={() => onToggleSave(opportunity)}
            >
              <Bookmark size={14} fill={isSaved ? 'var(--primary)' : 'none'} />
              {isSaved ? 'Saved in CRM' : 'Save to CRM'}
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => onEmailOutreach(opportunity)}
            >
              <Mail size={14} /> Email Recruiter
            </button>
          </div>

          <a 
            href={opportunity.application_url || opportunity.source_url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-emerald"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Zap size={14} /> {opportunity.application_url_type === 'EXACT_JOB_APPLICATION' ? 'Apply on Official Portal' : (opportunity.application_url_type === 'OFFICIAL_CAREER_PAGE' ? 'Visit Careers Portal' : 'View Official Source')} <ExternalLink size={13} />
          </a>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, Building2, MapPin, Coins, Clock, CheckCircle2, 
  ExternalLink, Bookmark, Zap, Mail, ShieldCheck, 
  Check, FileText, Globe, Sparkles
} from 'lucide-react';
import { resolveSafeJobUrl, resolveLinkedInSearchUrl, resolveGoogleJobsUrl } from '../utils/urlResolver.js';

const API_BASE_URL = 'http://localhost:5000/api/v1';

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
        </div>

        {/* Body Content */}
        <div className="app-kit-body">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Stipend Banner */}
              <div style={{ background: 'var(--accent-emerald-subtle)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.35rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Verified Compensation & Allowance
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>
                  {opportunity.stipend_text || 'Competitive Monthly Allowance + Benefits'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Application Deadline: <strong style={{ color: 'var(--text-primary)' }}>{opportunity.deadline_raw || opportunity.deadline_utc}</strong>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="type-h3" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Role Scope & Mission
                </h4>
                <p className="type-body" style={{ color: 'var(--text-primary)', lineHeight: '1.65' }}>
                  {opportunity.description}
                </p>
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
                  <p className="type-body" style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {opportunity.benefits_summary}
                  </p>
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
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  {opportunity.stipend_text || 'Competitive Allowance & Salary'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Salary / Stipend</span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>
                      {opportunity.stipend_text || 'Competitive Monthly Allowance'}
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

          <button 
            className="btn btn-emerald"
            onClick={() => onAutoApply(opportunity)}
          >
            <Zap size={14} /> Prepare Application Kit
          </button>
        </div>

      </div>
    </div>
  );
}

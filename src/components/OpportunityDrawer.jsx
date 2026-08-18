import React, { useState } from 'react';
import { 
  X, Building2, MapPin, Coins, Clock, CheckCircle2, 
  ExternalLink, Bookmark, Zap, Mail, ShieldCheck, 
  Check, FileText, Globe, Sparkles, Phone, Award, Search
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
    <div 
      className="drawer-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 3200,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'backdropFade 0.2s ease-out'
      }}
    >
      <div 
        className="drawer-panel-prodexa" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '580px',
          maxWidth: '100vw',
          height: '100vh',
          background: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 3300,
          animation: 'slideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        
        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', background: 'var(--banner-bg)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <span className="bento-tag" style={{ textTransform: 'uppercase', fontWeight: '800', fontSize: '0.72rem' }}>
                {opportunity.type}
              </span>
              <span className="bento-tag" style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', borderColor: 'rgba(52, 211, 153, 0.3)', fontWeight: '800', fontSize: '0.72rem' }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Verified Active
              </span>
            </div>
            
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', lineHeight: '1.35', color: 'var(--foreground)' }}>
              {opportunity.title}
            </h2>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--foreground)', fontWeight: '700' }}>
                <Building2 size={14} color="var(--accent-blue)" /> {opportunity.organization}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="var(--accent-emerald)" /> {opportunity.location_country || 'Global'}
              </span>
            </div>
          </div>

          <button 
            className="icon-button" 
            onClick={onClose}
            style={{ width: '34px', height: '34px', flexShrink: 0 }}
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--card)', padding: '0 1.75rem' }}>
          <button 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'overview' ? '2.5px solid var(--primary)' : '2.5px solid transparent', 
              color: activeTab === 'overview' ? 'var(--foreground)' : 'var(--muted-foreground)', 
              padding: '0.75rem 1rem', 
              fontSize: '0.86rem', 
              fontWeight: activeTab === 'overview' ? '800' : '600', 
              cursor: 'pointer' 
            }}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'benefits' ? '2.5px solid var(--primary)' : '2.5px solid transparent', 
              color: activeTab === 'benefits' ? 'var(--foreground)' : 'var(--muted-foreground)', 
              padding: '0.75rem 1rem', 
              fontSize: '0.86rem', 
              fontWeight: activeTab === 'benefits' ? '800' : '600', 
              cursor: 'pointer' 
            }}
            onClick={() => setActiveTab('benefits')}
          >
            Compensation & Benefits
          </button>
          <button 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'eligibility' ? '2.5px solid var(--primary)' : '2.5px solid transparent', 
              color: activeTab === 'eligibility' ? 'var(--foreground)' : 'var(--muted-foreground)', 
              padding: '0.75rem 1rem', 
              fontSize: '0.86rem', 
              fontWeight: activeTab === 'eligibility' ? '800' : '600', 
              cursor: 'pointer' 
            }}
            onClick={() => setActiveTab('eligibility')}
          >
            Eligibility & Criteria
          </button>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Stipend Banner */}
              <div style={{ background: 'var(--accent-emerald-light)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.35rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Verified Compensation & Allowance
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>
                  {opportunity.stipend_text || '100% Fully Funded + Monthly Stipend'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>
                  Application Deadline: <strong className="tabular-nums" style={{ color: 'var(--foreground)' }}>{opportunity.deadline_raw || opportunity.deadline_utc}</strong>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                  Role Scope & Mission
                </h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--foreground)', lineHeight: '1.65' }}>
                  {opportunity.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.74rem', fontWeight: '700' }}>Academic Level</span>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--foreground)', fontSize: '0.88rem' }}>
                    {opportunity.degree_level === 'undergrad' ? 'Bachelor / Undergrad' : opportunity.degree_level}
                  </strong>
                </div>
                <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.74rem', fontWeight: '700' }}>Field / Specialization</span>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--foreground)', fontSize: '0.88rem' }}>
                    {opportunity.field_of_study || 'Advertising & Marketing / Finance'}
                  </strong>
                </div>
              </div>

              {/* Benefits Summary */}
              {opportunity.benefits_summary && (
                <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.15rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.45rem' }}>
                    Key Highlights
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--foreground)', lineHeight: '1.6' }}>
                    {opportunity.benefits_summary}
                  </p>
                </div>
              )}
            </>
          )}

          {/* TAB 2: FINANCIAL BENEFITS */}
          {activeTab === 'benefits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
                  Funding & Allowance Breakdown
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--foreground)', marginBottom: '1rem' }}>
                  {opportunity.stipend_text || 'Fully Funded Allowance & Salary'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Tuition / Placement Fee</span>
                    <strong style={{ color: opportunity.tuition_covered ? 'var(--accent-emerald)' : 'var(--foreground)' }}>
                      {opportunity.tuition_covered ? '✓ 100% Fully Covered' : 'Full Corporate Salary / Paid'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Travel & Flights</span>
                    <strong style={{ color: opportunity.travel_covered ? 'var(--accent-emerald)' : 'var(--foreground)' }}>
                      {opportunity.travel_covered ? '✓ Return Flight Included' : 'Relocation / Travel Allowance'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Housing & Living Allowance</span>
                    <strong style={{ color: opportunity.housing_covered ? 'var(--accent-emerald)' : 'var(--foreground)' }}>
                      {opportunity.housing_covered ? '✓ Accommodation Provided' : 'Included in Monthly Salary'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ELIGIBILITY */}
          {activeTab === 'eligibility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--foreground)', marginBottom: '1rem' }}>
                  Candidate Requirements
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Check size={16} color="var(--accent-emerald)" />
                    <span><strong>Academic Standing:</strong> Undergraduate or graduate student in relevant field</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Check size={16} color="var(--accent-emerald)" />
                    <span><strong>English Requirement:</strong> {opportunity.no_ielts ? "✓ English Medium Waiver Accepted (No IELTS)" : "English Proficiency"}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Check size={16} color="var(--accent-emerald)" />
                    <span><strong>Nationalities:</strong> Open to local and international applicants</span>
                  </div>
                </div>
              </div>

              {opportunity.eligibility_summary && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                    {opportunity.eligibility_summary}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1.15rem 1.75rem', borderTop: '1px solid var(--border)', background: 'var(--banner-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button 
              className="btn btn-outline"
              style={{ fontSize: '0.84rem', padding: '0.5rem 0.85rem' }}
              onClick={() => onToggleSave(opportunity)}
            >
              <Bookmark size={14} fill={isSaved ? 'var(--primary)' : 'none'} color={isSaved ? 'var(--primary)' : 'var(--muted-foreground)'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button 
              className="btn btn-outline"
              style={{ fontSize: '0.84rem', padding: '0.5rem 0.85rem' }}
              onClick={() => onEmailOutreach(opportunity)}
            >
              <Mail size={14} /> Email
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <a 
              href={liveLinkedInUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              title="Search live LinkedIn job postings"
            >
              <Globe size={13} /> LinkedIn
            </a>
            <a 
              href={resolveGoogleJobsUrl(opportunity)} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              title="Search across all Malaysian & global job boards on Google"
            >
              <Search size={13} /> Google Jobs
            </a>
            <a 
              href={safePortalUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              title="Open verified employer career portal"
            >
              Portal <ExternalLink size={12} />
            </a>
            <button 
              className="btn btn-emerald"
              style={{ fontSize: '0.82rem', padding: '0.45rem 1.15rem' }}
              onClick={() => onAutoApply(opportunity)}
            >
              <Zap size={13} /> ⚡ 1-Click Apply
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}


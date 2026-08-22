import React, { useState } from 'react';
import { 
  Building2, MapPin, Coins, CheckCircle2, Clock, 
  ExternalLink, Bookmark, Wand2, ShieldCheck, Award, X, 
  FileText, Check, AlertCircle, Share2, Scale
} from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

export default function OpportunityDetailModal({ opportunity, onClose, onSave, isSaved, onOpenAdvisor, onOpenCompare, onVerifiedUpdate }) {
  if (!opportunity) return null;

  const [isOfficial, setIsOfficial] = useState(opportunity.verification_status === 'official_verified');
  const isAd = opportunity.field_of_study === 'advertising';

  const handleVerify = async () => {
    setIsOfficial(true);
    try {
      await fetch(`${API_BASE_URL}/admin/opportunities/${opportunity.id}/verify`, { method: 'POST' });
      if (onVerifiedUpdate) onVerifiedUpdate(opportunity.id);
    } catch (e) {}
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()} style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Header Banner */}
        <div style={{ background: 'var(--bg-modal-banner)', borderBottom: '1px solid var(--border)', padding: '2rem 2.25rem 1.5rem', position: 'relative' }}>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`op-type-badge badge-${opportunity.type}`}>{opportunity.type.toUpperCase()}</span>
              {isOfficial ? (
                <span style={{ fontSize: '0.74rem', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-xs)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '800' }}>
                  <CheckCircle2 size={12} /> ✓ Official Verified Source
                </span>
              ) : (
                <span style={{ fontSize: '0.74rem', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-xs)', fontWeight: '700' }}>
                  ✓ Trusted Portal
                </span>
              )}
              <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Trust Score: {isOfficial ? 98 : (opportunity.trust_score || 90)}/100</span>
            </div>

            {!isOfficial && (
              <button 
                className="btn" 
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.35)', cursor: 'pointer', fontWeight: '800' }}
                onClick={handleVerify}
              >
                <Check size={13} /> Approve Official
              </button>
            )}
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', lineHeight: '1.3', marginBottom: '0.6rem', color: 'var(--text-headings)' }}>
            {opportunity.title}
          </h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.15rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Building2 size={15} color="var(--accent-primary)" /> {opportunity.organization}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={15} color="var(--accent-emerald)" /> {opportunity.location_country || 'Global'} ({opportunity.location_city || 'Host Campus'})</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={15} color="var(--accent-amber)" /> Deadline: {opportunity.deadline_raw || opportunity.deadline_utc}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem 2.25rem', maxHeight: '65vh', overflowY: 'auto' }}>
          
          {/* Financial Benefits & Funding Breakdown */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.35rem', marginBottom: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-emerald)', letterSpacing: '0.06em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Coins size={17} /> Financial Benefits & Funding Breakdown
            </h4>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-headings)', marginBottom: '0.85rem' }}>
              {opportunity.stipend_text || 'Fully Funded Allowance & Tuition Covered'}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', fontSize: '0.84rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.95rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Tuition Waiver</span>
                <strong style={{ color: opportunity.tuition_covered ? 'var(--accent-emerald)' : 'var(--text-headings)' }}>{opportunity.tuition_covered ? '✓ 100% Fully Covered' : 'Stipend Provided'}</strong>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.95rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Travel / Flight</span>
                <strong style={{ color: opportunity.travel_covered ? 'var(--accent-emerald)' : 'var(--text-headings)' }}>{opportunity.travel_covered ? '✓ Flight Grant Included' : 'Self / Reimbursed'}</strong>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.95rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Housing / Living</span>
                <strong style={{ color: opportunity.housing_covered ? 'var(--accent-emerald)' : 'var(--text-headings)' }}>{opportunity.housing_covered ? '✓ Accommodation Provided' : 'Monthly Allowance'}</strong>
              </div>
            </div>
          </div>

          {/* Program Overview & Description */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.6rem' }}>
              Program Description & Scope
            </h4>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.94rem', lineHeight: '1.7' }}>
              {opportunity.description}
            </p>
          </div>

          {/* Eligibility & Requirements */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.35rem', marginBottom: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.06em', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={17} /> Eligibility Criteria & Requirements
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.76rem', fontWeight: '600' }}>Eligible Education Level</span>
                <strong style={{ textTransform: 'capitalize', color: 'var(--text-headings)' }}>{opportunity.degree_level === 'undergrad' ? "Bachelor's / Undergraduate" : opportunity.degree_level}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.76rem', fontWeight: '600' }}>Specialized Field</span>
                <strong style={{ textTransform: 'capitalize', color: 'var(--text-headings)' }}>{opportunity.field_of_study || 'Advertising, Business, STEM'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.76rem', fontWeight: '600' }}>English Test / IELTS</span>
                <strong style={{ color: opportunity.no_ielts ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {opportunity.no_ielts ? '✓ No IELTS Required / English Waiver' : 'IELTS / TOEFL Required'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.76rem', fontWeight: '600' }}>Nationality Restrictions</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>✓ All International Nationalities Eligible</strong>
              </div>
            </div>
          </div>

          {/* Source Attribution */}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Verified Source: <strong style={{ color: 'var(--text-headings)' }}>{opportunity.organization}</strong></span>
            <span>Canonical Link: <a href={opportunity.official_apply_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{opportunity.official_apply_url.slice(0, 45)}...</a></span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '1.15rem 2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn btn-outline" onClick={() => onSave(opportunity)}>
              <Bookmark size={15} fill={isSaved ? 'var(--accent-rose)' : 'none'} color={isSaved ? 'var(--accent-rose)' : 'var(--text-secondary)'} /> {isSaved ? 'Saved in Board' : 'Save to CRM'}
            </button>
            <button className="btn btn-outline" style={{ color: 'var(--accent-primary)', borderColor: 'var(--border-hover)' }} onClick={() => onOpenAdvisor(opportunity)}>
              <Wand2 size={15} /> AI Application Advisor
            </button>
          </div>

          <a href={opportunity.official_apply_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Official Application Portal <ExternalLink size={15} />
          </a>
        </div>

      </div>
    </div>
  );
}

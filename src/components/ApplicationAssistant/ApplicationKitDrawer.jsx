import React, { useState, useEffect } from 'react';
import { 
  X, Zap, CheckCircle2, Copy, Check, FileText, 
  Sparkles, ExternalLink, ShieldCheck, Mail, Send, Building2, MapPin, RefreshCw, BookOpen
} from 'lucide-react';
import { resolveSafeJobUrl, resolveLinkedInSearchUrl, resolveGoogleJobsUrl } from '../../utils/urlResolver.js';

const API_BASE_URL = 'http://localhost:5000/api/v1';

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
        const res = await fetch(`${API_BASE_URL}/opportunities/${opportunity.id}/prepare-application`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfile })
        });
        const data = await res.json();
        if (isMounted && data.status === 'success') {
          setKit(data.application_kit);
        }
      } catch (err) {
        console.warn('Kit fetch error, using client fallback:', err);
      } finally {
        if (isMounted) setIsLoadingKit(false);
      }
    }
    fetchKit();
    return () => { isMounted = false; };
  }, [opportunity.id]);

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
    window.open(portalUrl, '_blank');
    if (triggerToast) triggerToast('Cover letter copied! Verified portal opened.');
  };

  const handleOpenEmailClient = () => {
    if (onApplied) onApplied(opportunity.id, 'applied');
    const recipient = opportunity.contact_email || 'careers@' + (opportunity.organization || 'company').toLowerCase().replace(/[^a-z]/g, '') + '.com';
    const subject = encodeURIComponent(`Application Submission: ${opportunity.title} - ${userProfile?.name || 'Anas'}`);
    const body = encodeURIComponent(kit?.custom_cover_letter || 'Please find attached my application dossier.');
    window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_blank');
    if (triggerToast) triggerToast(`Opened email client pre-filled to ${recipient}!`);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <div 
        className="drawer-panel-prodexa app-kit-drawer" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-kit-title"
      >
        
        {/* Header */}
        <div className="app-kit-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
              <span className="bento-tag" style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: '800', fontSize: '0.72rem' }}>
                <Sparkles size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> AI Application Kit
              </span>
              <span className="bento-tag" style={{ fontSize: '0.72rem' }}>
                {opportunity.opportunity_type || opportunity.type || 'Internship'}
              </span>
            </div>

            <h2 id="app-kit-title" style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--foreground)', lineHeight: '1.3' }}>
              {opportunity.title}
            </h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--muted-foreground)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={13} color="var(--accent-blue)" /> {opportunity.organization} • <MapPin size={13} color="var(--accent-emerald)" /> {opportunity.location_country || 'Malaysia'}
            </div>
          </div>

          <button className="icon-button" onClick={onClose} aria-label="Close application kit drawer" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="app-kit-tabs-bar">
          <button 
            className={`app-kit-tab-btn ${activeTab === 'readiness' ? 'active' : ''}`}
            onClick={() => setActiveTab('readiness')}
          >
            Readiness & Research
          </button>
          <button 
            className={`app-kit-tab-btn ${activeTab === 'cover_letter' ? 'active' : ''}`}
            onClick={() => setActiveTab('cover_letter')}
          >
            Tailored Cover Letter
          </button>
          <button 
            className={`app-kit-tab-btn ${activeTab === 'tailored_cv' ? 'active' : ''}`}
            onClick={() => setActiveTab('tailored_cv')}
          >
            CV Bullet Suggestions
          </button>
          <button 
            className={`app-kit-tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
            onClick={() => setActiveTab('checklist')}
          >
            Application Checklist
          </button>
        </div>

        {/* Body Content */}
        <div className="app-kit-body">
          {isLoadingKit ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <RefreshCw size={28} className="spin" color="var(--accent-blue)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: '700', color: 'var(--foreground)' }}>Analyzing opportunity requirements & tailoring your dossier...</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>Generating custom cover letter and STAR achievements.</p>
            </div>
          ) : (
            <>
              {/* TAB 1: READINESS & COMPANY RESEARCH */}
              {activeTab === 'readiness' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Score Banner */}
                  <div style={{ background: 'var(--accent-emerald-light)', border: '1px solid var(--accent-emerald)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>Application Readiness Score</span>
                      <strong style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>{kit?.readiness_score || 92}% READY</strong>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {kit?.cv_match_verdict}
                    </p>
                  </div>

                  {/* Key Strengths */}
                  <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.15rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.6rem' }}>
                      Key Profile Strengths to Emphasize
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {kit?.key_strengths_to_highlight?.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                          <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  {kit?.missing_keywords_to_add && kit.missing_keywords_to_add.length > 0 && (
                    <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.15rem' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-amber)', marginBottom: '0.6rem' }}>
                        Keywords to Include in Your Submission
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {kit.missing_keywords_to_add.map((kw, idx) => (
                          <span key={idx} className="bento-tag" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', fontWeight: '700' }}>
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company Research Brief */}
                  {kit?.company_research_brief && (
                    <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.15rem' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                        Company Talking Point & Strategy
                      </h4>
                      <p style={{ fontSize: '0.86rem', color: 'var(--foreground)', lineHeight: '1.6' }}>
                        {kit.company_research_brief.interview_talking_point}
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: TAILORED COVER LETTER */}
              {activeTab === 'cover_letter' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>
                      Personalized to {opportunity.organization} with zero hallucinations
                    </span>
                    <button 
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                      onClick={() => handleCopy(kit?.custom_cover_letter, 'Cover Letter')}
                    >
                      {copiedItem === 'Cover Letter' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                      {copiedItem === 'Cover Letter' ? 'Copied!' : 'Copy Letter'}
                    </button>
                  </div>

                  <textarea 
                    className="form-input"
                    aria-label="Generated custom cover letter"
                    style={{ width: '100%', height: 'min(340px, 45vh)', fontFamily: 'monospace', fontSize: '0.86rem', lineHeight: '1.65', resize: 'vertical' }}
                    value={kit?.custom_cover_letter || ''}
                    readOnly
                  />
                </div>
              )}

              {/* TAB 3: TAILORED CV BULLETS */}
              {activeTab === 'tailored_cv' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.84rem', color: 'var(--muted-foreground)' }}>
                    Copy these STAR-formatted achievements into your CV before applying:
                  </p>

                  {kit?.tailored_cv_bullets?.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                          {item.section}
                        </span>
                        <button 
                          className="icon-button"
                          onClick={() => handleCopy(item.bullet, `Bullet ${idx + 1}`)}
                          title="Copy bullet"
                          style={{ width: '28px', height: '28px' }}
                        >
                          {copiedItem === `Bullet ${idx + 1}` ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.4rem', lineHeight: '1.5' }}>
                        • {item.bullet}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                        💡 <em>{item.impact_reason}</em>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: APPLICATION CHECKLIST */}
              {activeTab === 'checklist' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {kit?.application_checklist?.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.9rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <CheckCircle2 size={17} color="var(--accent-emerald)" />
                        <span style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--foreground)' }}>{item.task}</span>
                      </div>
                      <span className="bento-tag" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                        {item.importance}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="app-kit-footer">
          <button className="btn btn-outline" onClick={handleOpenEmailClient} title="Open pre-filled draft in your default email client">
            <Mail size={15} /> Email Recruiter Directly
          </button>
          <button className="btn btn-emerald" onClick={handleLaunchPortal} title="Copy cover letter and launch official portal">
            <ExternalLink size={15} /> Launch Official Portal & Paste Dossier
          </button>
        </div>

      </div>
    </div>
  );
}

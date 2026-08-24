import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Bookmark, 
  Layers, 
  X,
  Copy,
  Check,
  Send
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function AuraDrawer({
  opportunity,
  onClose,
  isSaved,
  onToggleSave,
  onUpdateStage,
  currentStage,
  onOpenAiLab
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ai-tailor' | 'eligibility'
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  if (!opportunity) return null;

  const {
    id,
    title,
    organization,
    company,
    opportunity_type,
    location_country,
    location_city,
    stipend_text,
    deadline_raw,
    deadline_utc,
    no_ielts,
    description,
    benefits_summary,
    eligibility_summary,
    official_apply_url,
    official_program_url,
    trust_score = 98,
    match_score = 88
  } = opportunity;

  const orgName = company || organization || 'Global Enterprise';
  const location = location_country ? (location_city ? `${location_city}, ${location_country}` : location_country) : 'Worldwide / Remote';
  const applyUrl = official_apply_url || official_program_url || '#';

  const handleGenerateCoverLetter = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/career-copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Draft a high-impact, persuasive, 3-paragraph ATS-tailored cover letter for the role: "${title}" at "${orgName}". Highlight relevant capabilities, enthusiasm, and career alignment.`
        })
      });
      const data = await res.json();
      setCoverLetter(data.reply || data.response || `Dear Hiring Committee at ${orgName},\n\nI am writing to express my strong enthusiasm for the ${title} position. With my background and commitment to excellence, I look forward to contributing to your initiatives.\n\nSincerely,\nCandidate`);
    } catch (e) {
      setCoverLetter(`Dear Hiring Committee at ${orgName},\n\nI am writing to enthusiastically apply for the ${title} opportunity. My core competencies and academic background make me a strong candidate for your team.\n\nSincerely,\nCandidate`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="aura-drawer-overlay" onClick={onClose}>
      <div className="aura-drawer-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Bar */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--aura-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--aura-surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="aura-chip aura-chip-iris" style={{ fontSize: '0.74rem' }}>
              <ShieldCheck size={12} />
              <span>Verified Official Source</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => onToggleSave(id)}
              className="aura-btn-ghost aura-btn-icon"
              style={{ width: '32px', height: '32px', color: isSaved ? 'var(--aura-primary)' : 'var(--aura-text-tertiary)' }}
              title={isSaved ? 'Remove Bookmark' : 'Bookmark'}
            >
              <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={onClose}
              className="aura-btn-ghost aura-btn-icon"
              style={{ width: '32px', height: '32px' }}
              title="Close Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--aura-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--aura-radius-md)',
              background: 'var(--aura-surface)',
              border: '1px solid var(--aura-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1.2rem',
              color: 'var(--aura-primary)',
              flexShrink: 0
            }}>
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{orgName}</span>
                <ShieldCheck size={15} color="var(--aura-emerald)" />
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--aura-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={12} />
                <span>{location}</span>
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', lineHeight: 1.3, marginBottom: '0.85rem' }}>
            {title}
          </h1>

          {/* Sub-Tabs */}
          <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem' }}>
            {[
              { id: 'overview', label: 'Program Overview' },
              { id: 'ai-tailor', label: '⚡ 1-Click AI Tailor' },
              { id: 'eligibility', label: 'Eligibility & Criteria' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--aura-radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === tab.id ? '800' : '600',
                  background: activeTab === tab.id ? 'var(--aura-primary)' : 'var(--aura-surface-elevated)',
                  color: activeTab === tab.id ? '#fff' : 'var(--aura-text-secondary)',
                  border: activeTab === tab.id ? '1px solid var(--aura-primary)' : '1px solid var(--aura-border)',
                  cursor: 'pointer',
                  transition: 'all var(--trans-fast)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="custom-scroll" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--aura-text-tertiary)', marginBottom: '0.35rem' }}>
                  Opportunity Summary
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--aura-text-secondary)', lineHeight: 1.6 }}>
                  {description || 'Official verified career opportunity. Selected candidates receive professional mentoring, practical experience, and career acceleration.'}
                </p>
              </div>

              {benefits_summary && (
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--aura-text-tertiary)', marginBottom: '0.35rem' }}>
                    Stipend & Benefits
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#fff', background: 'var(--aura-surface-elevated)', border: '1px solid var(--aura-border)', borderRadius: 'var(--aura-radius-md)', padding: '0.85rem' }}>
                    {benefits_summary}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--aura-text-tertiary)', marginBottom: '0.35rem' }}>
                  Application Deadline
                </div>
                <div style={{ fontSize: '0.86rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={14} color="var(--aura-amber)" />
                  <span>{deadline_raw || deadline_utc || 'Rolling Admissions'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-tailor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--aura-surface-elevated)', border: '1px solid var(--aura-border)', borderRadius: 'var(--aura-radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <Sparkles size={16} color="var(--aura-pink)" />
                  <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#fff' }}>Gemini AI Cover Letter Drafter</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--aura-text-secondary)', marginBottom: '0.85rem' }}>
                  Generate an ATS-optimized, personalized cover letter drafted specifically for {orgName}.
                </p>

                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGenerating}
                  className="aura-btn aura-btn-ai"
                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.58rem 1rem' }}
                >
                  <Sparkles size={14} className={isGenerating ? 'spin-slow' : ''} />
                  <span>{isGenerating ? 'Drafting with Gemini AI...' : 'Draft 1-Click AI Tailored Pitch'}</span>
                </button>
              </div>

              {coverLetter && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--aura-text-tertiary)' }}>Tailored Output</span>
                    <button
                      onClick={handleCopy}
                      className="aura-btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {copied ? <Check size={12} color="var(--aura-emerald)" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={coverLetter}
                    rows={10}
                    style={{
                      width: '100%',
                      background: 'var(--aura-surface-elevated)',
                      border: '1px solid var(--aura-border)',
                      borderRadius: 'var(--aura-radius-md)',
                      padding: '0.85rem',
                      color: 'var(--aura-text-primary)',
                      fontSize: '0.82rem',
                      lineHeight: 1.55,
                      fontFamily: 'var(--font-sans)',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--aura-text-tertiary)', marginBottom: '0.35rem' }}>
                  Candidate Eligibility
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--aura-text-secondary)', lineHeight: 1.6 }}>
                  {eligibility_summary || 'Open to qualified students, undergraduates, and recent graduates. Verify official company requirements.'}
                </p>
              </div>

              <div style={{ background: 'var(--aura-surface-elevated)', border: '1px solid var(--aura-border)', borderRadius: 'var(--aura-radius-md)', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff', marginBottom: '0.35rem' }}>English Language Testing</div>
                <div style={{ fontSize: '0.78rem', color: no_ielts === 1 ? 'var(--aura-emerald)' : 'var(--aura-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={14} color={no_ielts === 1 ? 'var(--aura-emerald)' : 'var(--aura-text-tertiary)'} />
                  <span>{no_ielts === 1 ? 'English Proficiency Waiver Accepted (No IELTS Required)' : 'IELTS / TOEFL may be required if applicable'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--aura-border)',
          background: 'var(--aura-surface-elevated)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="aura-btn aura-btn-primary"
            style={{ flex: 1, padding: '0.75rem 1.25rem', fontSize: '0.88rem' }}
          >
            <span>Apply on Official Portal</span>
            <ExternalLink size={15} />
          </a>

          <button
            onClick={() => onUpdateStage(id, currentStage === 'applied' ? 'interview' : 'applied')}
            className="aura-btn aura-btn-secondary"
            style={{ padding: '0.75rem 1rem' }}
          >
            <Layers size={15} />
            <span>{currentStage ? `Stage: ${currentStage}` : 'Track in CRM'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

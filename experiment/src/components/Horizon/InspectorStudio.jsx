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
  Send, 
  FileText, 
  X,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function HorizonInspectorStudio({
  opportunity,
  onClose,
  isSaved,
  onToggleSave,
  onUpdateStage,
  currentStage,
  onOpenCvStudio
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ai-tailor' | 'eligibility'
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  if (!opportunity) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border-default)' }}>
          <Sparkles size={24} color="var(--primary)" />
        </div>
        <h4 style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1rem', marginBottom: '0.35rem' }}>Select an Opportunity Passport</h4>
        <p style={{ fontSize: '0.82rem', maxWidth: '280px', lineHeight: 1.5 }}>
          Click any opportunity from your stream to inspect verified intelligence, calibrate ATS matching, and generate AI tailored applications.
        </p>
      </div>
    );
  }

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
    match_score = 85
  } = opportunity;

  const orgName = company || organization || 'Global Enterprise';
  const location = location_country ? (location_city ? `${location_city}, ${location_country}` : location_country) : 'Worldwide / Remote';
  const applyUrl = official_apply_url || official_program_url || '#';

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/career-copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Draft a high-impact, persuasive, 3-paragraph ATS-tailored cover letter for the role: "${title}" at "${orgName}". Highlight relevant technical capabilities, enthusiasm, and career alignment.`
        })
      });
      const data = await res.json();
      if (data.reply || data.response) {
        setCoverLetter(data.reply || data.response);
      } else {
        setCoverLetter(`Dear Hiring Committee at ${orgName},\n\nI am writing to express my strong interest in the ${title} position. With my background and passion for excellence, I am confident in my ability to make an immediate, meaningful contribution to your team.\n\nThroughout my academic and project experiences, I have focused on building robust problem-solving skills and delivering measurable results. This role at ${orgName} perfectly aligns with my long-term career ambitions.\n\nThank you for your time and consideration. I look forward to discussing how my capabilities align with your strategic goals.\n\nSincerely,\nCandidate`);
      }
    } catch (e) {
      setCoverLetter(`Dear Hiring Committee at ${orgName},\n\nI am writing to enthusiastically apply for the ${title} opportunity. My background and core competencies make me an exceptional fit for your team's upcoming initiatives.\n\nI look forward to discussing how I can add immediate value.\n\nSincerely,\nCandidate`);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>
            Intelligence Inspector
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button 
            onClick={() => onToggleSave(id)}
            className="hz-btn-ghost hz-btn-icon"
            style={{ width: '30px', height: '30px', color: isSaved ? 'var(--primary)' : 'var(--text-tertiary)' }}
            title={isSaved ? 'Saved' : 'Save'}
          >
            <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={onClose}
            className="hz-btn-ghost hz-btn-icon"
            style={{ width: '30px', height: '30px' }}
            title="Close Inspector"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Hero Dossier */}
      <div style={{ padding: '1.25rem 0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--bg-surface-elevated)', 
            border: '1px solid var(--border-default)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '1.15rem',
            color: 'var(--primary)',
            flexShrink: 0
          }}>
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>{orgName}</span>
              <ShieldCheck size={15} color="var(--emerald)" />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={12} />
              <span>{location}</span>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', lineHeight: 1.3, marginBottom: '0.85rem' }}>
          {title}
        </h2>

        {/* Match Breakdown Gauge */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-secondary)' }}>AI Candidate Match</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--emerald)' }}>{match_score}% High Alignment</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-overlay)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${match_score}%`, height: '100%', background: 'var(--grad-iris)', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>

        {/* Inspector Sub-Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
          {[
            { id: 'overview', label: 'Overview & Details' },
            { id: 'ai-tailor', label: '⚡ 1-Click AI Tailor' },
            { id: 'eligibility', label: 'Eligibility & Criteria' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--primary-subtle)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                border: activeTab === tab.id ? '1px solid var(--primary-border)' : '1px solid transparent',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.75rem',
                fontSize: '0.76rem',
                fontWeight: activeTab === tab.id ? '800' : '600',
                cursor: 'pointer',
                transition: 'all var(--trans-fast)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Body Content */}
      <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.35rem' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
                Program Description
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {description || 'Comprehensive professional opportunity offering real-world experience, mentorship, and career growth in an industry-leading environment.'}
              </p>
            </div>

            {benefits_summary && (
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
                  Benefits & Compensation
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                  {benefits_summary}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
                Application Cutoff
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} color="var(--amber)" />
                <span>{deadline_raw || deadline_utc || 'Rolling Admissions'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-tailor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--pink)" />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>Gemini AI Cover Letter & Pitch</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                Generate a customized, ATS-friendly cover letter drafted specifically for {orgName}.
              </p>

              <button
                onClick={handleGenerateCoverLetter}
                disabled={isGeneratingCoverLetter}
                className="hz-btn hz-btn-ai"
                style={{ width: '100%', fontSize: '0.82rem', padding: '0.55rem 1rem' }}
              >
                <Sparkles size={14} className={isGeneratingCoverLetter ? 'spin-slow' : ''} />
                <span>{isGeneratingCoverLetter ? 'Drafting with Gemini AI...' : 'Generate 1-Click Tailored Pitch'}</span>
              </button>
            </div>

            {coverLetter && (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-tertiary)' }}>Draft Output</span>
                  <button
                    onClick={handleCopyCoverLetter}
                    className="hz-btn-ghost"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {copied ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={coverLetter}
                  rows={9}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-sans)',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'eligibility' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
                Eligibility Requirements
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {eligibility_summary || 'Open to qualified students, undergraduates, and recent graduates. Check official requirements for exact details.'}
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff', marginBottom: '0.45rem' }}>Language Certification</div>
              <div style={{ fontSize: '0.78rem', color: no_ielts === 1 ? 'var(--emerald)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} color={no_ielts === 1 ? 'var(--emerald)' : 'var(--text-tertiary)'} />
                <span>{no_ielts === 1 ? 'English Proficiency Waiver Accepted (No IELTS Required)' : 'IELTS / TOEFL may be required if applicable'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '0.65rem', marginTop: 'auto' }}>
        <a 
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hz-btn hz-btn-primary"
          style={{ flex: 1, padding: '0.72rem 1.15rem', fontSize: '0.88rem' }}
        >
          <span>Official Application</span>
          <ExternalLink size={15} />
        </a>

        <button 
          onClick={() => onUpdateStage(id, currentStage === 'applied' ? 'interview' : 'applied')}
          className="hz-btn hz-btn-secondary"
          style={{ padding: '0.72rem 1rem' }}
          title="Track in CRM"
        >
          <Layers size={16} />
          <span>{currentStage ? `Stage: ${currentStage}` : 'Track in CRM'}</span>
        </button>
      </div>
    </div>
  );
}

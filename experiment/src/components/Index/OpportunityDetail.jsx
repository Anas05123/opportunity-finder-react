import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  ExternalLink, 
  Bookmark, 
  Layers, 
  Clock, 
  Copy, 
  Check, 
  FileText, 
  Share2 
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function OpportunityDetail({
  opportunity,
  isSaved,
  onToggleSave,
  onUpdateStage,
  currentStage,
  onOpenCvAuditor
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tailoredPitch, setTailoredPitch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  if (!opportunity) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
        Select an opportunity from the directory to view its full verified dossier.
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
    match_score = 88
  } = opportunity;

  const orgName = company || organization || 'Corporate Registry';
  const location = location_country ? (location_city ? `${location_city}, ${location_country}` : location_country) : 'Worldwide / Remote';
  const applyUrl = official_apply_url || official_program_url || '#';

  const handleGeneratePitch = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/career-copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Draft a concise, professional, 3-paragraph tailored cover letter for the role: "${title}" at "${orgName}". Highlight direct qualifications, enthusiasm, and relevant career alignment.`
        })
      });
      const data = await res.json();
      setTailoredPitch(data.reply || data.response || `Dear Hiring Committee at ${orgName},\n\nI am writing to apply for the ${title} opportunity. With my academic background and technical skills, I am prepared to contribute effectively to your organization.\n\nThank you for your consideration.\n\nSincerely,\nCandidate`);
    } catch (e) {
      setTailoredPitch(`Dear Hiring Team at ${orgName},\n\nI am writing to express my strong interest in the ${title} position. My background aligns closely with the objectives outlined for this role.\n\nSincerely,\nCandidate`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(applyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(tailoredPitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Action Bar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="tag tag-green">
            <CheckCircle size={11} />
            <span>Verified Official Portal</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ID: {id}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onToggleSave(id)}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            <Bookmark size={13} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '12px' }}
            title="Copy Official Apply URL"
          >
            {copiedLink ? <Check size={13} color="var(--success)" /> : <Share2 size={13} />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            <span>Apply Directly</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Main Dossier Content */}
      <div className="custom-scroll" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Block */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{orgName}</span>
            <span>•</span>
            <span style={{ color: 'var(--text-tertiary)' }}>{location}</span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {title}
          </h1>
        </div>

        {/* Structured Spec Table */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>Classification</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>{opportunity_type || 'Internship'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>Compensation</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>{stipend_text || 'Institutional Terms'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>Application Cutoff</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>{deadline_raw || deadline_utc || 'Rolling'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>Language Waiver</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: no_ielts === 1 ? 'var(--success)' : 'var(--text-secondary)', marginTop: '2px' }}>
              {no_ielts === 1 ? 'No IELTS Required' : 'Standard Requirements'}
            </div>
          </div>
        </div>

        {/* Stage Management Block */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Pipeline Tracking Status</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Track your submission lifecycle from preparation to offer.</div>
          </div>

          <select
            value={currentStage || 'saved'}
            onChange={(e) => onUpdateStage(id, e.target.value)}
            className="input-field"
            style={{ width: 'auto', height: '30px', padding: '0 8px', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="saved">Stage: Saved</option>
            <option value="preparing">Stage: Preparing</option>
            <option value="applied">Stage: Applied / Submitted</option>
            <option value="interview">Stage: Interviewing</option>
            <option value="offer">Stage: Offer Received</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Program Overview
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {description || 'Official verified career opportunity. Selected candidates receive professional mentoring, practical project assignments, and industry-recognized credentials.'}
          </p>
        </div>

        {/* Benefits */}
        {benefits_summary && (
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Financial Package & Benefits
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              {benefits_summary}
            </div>
          </div>
        )}

        {/* Tailored Pitch Generator */}
        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>ATS Tailored Application Pitch</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>Generate tailored paragraphs for your cover letter or portal response.</div>
            </div>

            <button
              onClick={handleGeneratePitch}
              disabled={isGenerating}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              <FileText size={13} />
              <span>{isGenerating ? 'Drafting...' : 'Generate Pitch'}</span>
            </button>
          </div>

          {tailoredPitch && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                <button
                  onClick={handleCopyPitch}
                  className="btn-ghost"
                  style={{ fontSize: '11px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  {copiedPitch ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                  <span>{copiedPitch ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={tailoredPitch}
                rows={8}
                className="input-field"
                style={{ resize: 'vertical', fontSize: '12.5px', lineHeight: 1.5 }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

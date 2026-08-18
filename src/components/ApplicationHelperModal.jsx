import React, { useState } from 'react';
import { 
  Wand2, FileText, Mail, Megaphone, CheckCircle2, Copy, Sparkles, BookOpen, ChevronRight, X
} from 'lucide-react';

export default function ApplicationHelperModal({ opportunity, onClose, triggerToast }) {
  const [activeTab, setActiveTab] = useState('sop');
  const [userBackground, setUserBackground] = useState('Advertising & Marketing student passionate about brand strategy, creative storytelling, and digital campaigns.');

  // SOP State
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    triggerToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // SOP Outline Generator Output based on selected opportunity
  const generatedSop = {
    title: `Statement of Purpose Outline: ${opportunity.title}`,
    introduction: `I am writing to express my enthusiastic application for the ${opportunity.title} hosted by ${opportunity.organization}. As a Bachelor student specializing in Advertising and Brand Strategy, my objective is to leverage creative storytelling and consumer insights to solve complex communication challenges.`,
    motivation: `The mission of ${opportunity.organization} in ${opportunity.location_country || 'global programs'} aligns perfectly with my ambition to pioneer data-driven creative advertising. Program benefits such as ${opportunity.stipend_text || 'full financial sponsorship'} will enable me to immerse myself completely in high-impact brand innovation.`,
    background: `Throughout my academic tenure in Advertising, I have led campaign strategy decks, developed cross-channel digital marketing concepts, and honed copywriting skills across multimedia platforms. ${userBackground}`,
    conclusion: `Joining ${opportunity.title} represents a pivotal catalyst in my development as a global advertising leader. I look forward to contributing my strategic vision and creative energy to ${opportunity.organization}.`
  };

  // Recommendation Request Template
  const recTemplate = `Subject: Reference Letter Request - Application for ${opportunity.title}

Dear Professor [Name] / [Manager Name],

I hope this email finds you well.

I am applying for the ${opportunity.title} at ${opportunity.organization} (Deadline: ${opportunity.deadline_raw || opportunity.deadline_utc}), a prestigious opportunity offering ${opportunity.stipend_text || 'full sponsorship'}.

Given our work together on [Course Name / Project Name], where I achieved [Highlight / Grade], I would be truly honored if you would consider writing a letter of recommendation supporting my application.

I have attached my CV, academic transcript, and a draft of my Statement of Purpose for your convenience. The recommendation deadline is [Date].

Thank you very much for your time, guidance, and support.

Warm regards,
[Your Name]
Bachelor in Advertising & Communications`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>

        <div style={{ padding: '2rem 2.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-modal-banner)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-violet)', fontSize: '0.82rem', fontWeight: '800', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
            <Wand2 size={16} /> AI Application Assistant & Advisor
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-headings)' }}>Application Helper for: {opportunity.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            {opportunity.organization} • {opportunity.location_country || 'Global'}
          </p>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '0 1.75rem' }}>
          <button 
            className={`nav-btn ${activeTab === 'sop' ? 'active' : ''}`}
            onClick={() => setActiveTab('sop')}
            style={{ borderRadius: '0', borderBottom: activeTab === 'sop' ? '2.5px solid var(--accent-primary)' : 'none', padding: '0.75rem 1rem' }}
          >
            <FileText size={15} /> SOP & Cover Letter Draft
          </button>
          <button 
            className={`nav-btn ${activeTab === 'rec' ? 'active' : ''}`}
            onClick={() => setActiveTab('rec')}
            style={{ borderRadius: '0', borderBottom: activeTab === 'rec' ? '2.5px solid var(--accent-primary)' : 'none', padding: '0.75rem 1rem' }}
          >
            <Mail size={15} /> Recommendation Email Template
          </button>
          <button 
            className={`nav-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
            style={{ borderRadius: '0', borderBottom: activeTab === 'portfolio' ? '2.5px solid var(--accent-primary)' : 'none', padding: '0.75rem 1rem' }}
          >
            <Megaphone size={15} /> Advertising Portfolio Strategy
          </button>
        </div>

        <div style={{ padding: '2rem 2.25rem' }}>
          {/* TAB 1: SOP GENERATOR */}
          {activeTab === 'sop' && (
            <div>
              <div style={{ marginBottom: '1.35rem' }}>
                <label className="filter-label">Customize Your Background Highlight</label>
                <input 
                  type="text" 
                  className="custom-select" 
                  value={userBackground} 
                  onChange={(e) => setUserBackground(e.target.value)}
                  placeholder="e.g. Advertising student with experience in TikTok brand campaigns and SEO copywriting..."
                />
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-headings)' }}>Tailored Statement of Purpose Structure</h4>
                  <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => copyToClipboard(`${generatedSop.introduction}\n\n${generatedSop.motivation}\n\n${generatedSop.background}\n\n${generatedSop.conclusion}`, 'Full SOP Draft')}>
                    <Copy size={13} /> {copiedSection === 'Full SOP Draft' ? 'Copied All!' : 'Copy Full Outline'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.65' }}>
                  <div style={{ padding: '0.95rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3.5px solid var(--accent-primary)' }}>
                    <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.25rem' }}>Section 1: Strong Opening & Hook</strong>
                    {generatedSop.introduction}
                  </div>

                  <div style={{ padding: '0.95rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3.5px solid var(--accent-emerald)' }}>
                    <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '0.25rem' }}>Section 2: Why This Specific Program</strong>
                    {generatedSop.motivation}
                  </div>

                  <div style={{ padding: '0.95rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3.5px solid var(--accent-amber)' }}>
                    <strong style={{ color: 'var(--accent-amber)', display: 'block', marginBottom: '0.25rem' }}>Section 3: Advertising & Academic Experience</strong>
                    {generatedSop.background}
                  </div>

                  <div style={{ padding: '0.95rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3.5px solid var(--accent-violet)' }}>
                    <strong style={{ color: 'var(--accent-violet)', display: 'block', marginBottom: '0.25rem' }}>Section 4: Vision & Career Impact</strong>
                    {generatedSop.conclusion}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECOMMENDATION EMAIL TEMPLATE */}
          {activeTab === 'rec' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.95rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-headings)' }}>Reference Request Email for Professors / Employers</h4>
                <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => copyToClipboard(recTemplate, 'Email Template')}>
                  <Copy size={13} /> {copiedSection === 'Email Template' ? 'Copied!' : 'Copy Template'}
                </button>
              </div>

              <pre style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '1.35rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: '1.6', boxShadow: 'var(--shadow-sm)' }}>
                {recTemplate}
              </pre>
            </div>
          )}

          {/* TAB 3: ADVERTISING PORTFOLIO STRATEGY */}
          {activeTab === 'portfolio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ background: 'var(--accent-amber-light)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '1.15rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--accent-amber)', fontSize: '1rem', fontWeight: '800', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  📢 Portfolio Checklist for Bachelor in Advertising
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  When applying to creative fellowships like Ogilvy, Google Creative Lab, or L'Oréal Brandstorm, structure your portfolio with 3 to 4 strong campaign case studies.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '1.15rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <h5 style={{ color: 'var(--accent-primary)', marginBottom: '0.45rem', fontSize: '0.95rem' }}>1. The Insight & Challenge</h5>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>State the consumer problem clearly. What human truth or market trend did you identify?</p>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '1.15rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <h5 style={{ color: 'var(--accent-emerald)', marginBottom: '0.45rem', fontSize: '0.95rem' }}>2. Big Creative Idea</h5>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Show your tagline, campaign name, or key visual concept in 1 sentence.</p>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '1.15rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <h5 style={{ color: 'var(--accent-amber)', marginBottom: '0.45rem', fontSize: '0.95rem' }}>3. Execution Mockups</h5>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Include social media posts, guerrilla billboards, storyboards, or digital ads.</p>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '1.15rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <h5 style={{ color: 'var(--accent-violet)', marginBottom: '0.45rem', fontSize: '0.95rem' }}>4. Expected Results</h5>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Detail engagement metrics, target audience reach, or brand awareness impact.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

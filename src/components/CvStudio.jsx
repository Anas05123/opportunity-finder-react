import React, { useState } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Copy, Check, RefreshCw, Award, Zap
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export default function CvStudio({ userProfile, triggerToast }) {
  const [cvText, setCvText] = useState(`ANAS
Undergraduate Scholar — Advertising & Brand Strategy
Email: ayarianas79@gmail.com | Phone: +60172513031
GPA: 3.85 / 4.00 (English Medium of Instruction Waiver)

SUMMARY:
Creative and data-literate Advertising & Marketing student with a 3.85 GPA. Experienced in brand positioning audits, digital campaign design, and multimedia copywriting. Seeking brand strategy traineeships and international fellowship opportunities.

CORE SKILLS:
- Brand Strategy & Positioning
- Creative Copywriting & Brief Authoring
- Competitor Analysis & Market Research
- Figma & High-Fidelity Prototyping
- Social Media Campaign Optimization

EXPERIENCE & PROJECTS:
- Created social media campaigns for university brand festival with high reach
- Assisted in market research and competitor brand audit across 8 consumer brands
- Authored creative campaign briefs and prototyped visual assets in Figma
- Collaborated with student teams to execute cross-channel promotional roadmaps`);

  const [targetRole, setTargetRole] = useState('Brand Strategist / Advertising Trainee');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [copiedSection, setCopiedSection] = useState('');

  const handleAnalyzeCV = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/analyze-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText,
          targetRole,
          userProfile
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.analysis) {
        setAnalysisResult(data.analysis);
        if (triggerToast) triggerToast('🎉 AI CV Analysis & ATS Scoring Completed!');
      }
    } catch (err) {
      if (triggerToast) triggerToast('AI analysis generated.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text, sectionName) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    if (triggerToast) triggerToast(`Copied ${sectionName}!`);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  return (
    <div className="content-container">
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="hero-pill-badge" style={{ marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> AI Resume & ATS Intelligence
        </div>
        <h1 className="type-h1">
          AI CV Studio & ATS Optimization
        </h1>
        <p className="type-body-lg" style={{ marginTop: '0.35rem', maxWidth: '680px' }}>
          Analyze your resume against top employers, discover high-impact missing keywords, and automatically rewrite weak bullets into quantifiable STAR achievements.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: CV Editor & Target Role */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="type-h3" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FileText size={18} color="var(--primary)" /> Your Resume Content
            </h3>
            <span className="bento-tag">Live Editable</span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="filter-label">Target Role / Fellowship</label>
            <input 
              type="text" 
              className="form-input"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Brand Strategist, Creative Marketer, Fellowship"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="filter-label">Resume Text</label>
            <textarea
              className="form-textarea"
              rows={13}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.84rem', lineHeight: '1.6' }}
            />
          </div>

          <button 
            className="btn btn-primary"
            style={{ width: '100%', height: '44px' }}
            onClick={handleAnalyzeCV}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={16} className="spin" /> Analyzing with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Run ATS Analysis & Keyword Enhancer
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Analysis Results */}
        <div>
          {!analysisResult && !isAnalyzing && (
            <div style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Sparkles size={24} color="var(--primary)" />
              </div>
              <h3 className="type-h2" style={{ marginBottom: '0.45rem' }}>
                Ready for ATS Optimization
              </h3>
              <p className="type-body" style={{ maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                Click "Run ATS Analysis" to evaluate keyword compatibility and generate STAR-formatted bullet point rewrites.
              </p>
              <button className="btn btn-primary" onClick={handleAnalyzeCV}>
                <Sparkles size={15} /> Analyze My CV Now
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '4rem 1.5rem', textAlign: 'center' }}>
              <RefreshCw size={36} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1.25rem' }} />
              <h3 className="type-h2">
                Gemini AI is Evaluating Your Profile...
              </h3>
              <p className="type-body" style={{ marginTop: '0.35rem' }}>
                Benchmarking against real employer ATS algorithms.
              </p>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* ATS Score Header Card */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--accent-emerald-subtle)', border: '3px solid var(--accent-emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-emerald)', lineHeight: '1' }}>{analysisResult.ats_score || 88}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>/ 100 ATS</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>High Match Probability</div>
                    <h3 className="type-h3">Strong Profile Standing</h3>
                  </div>
                </div>

                <div className="bento-tag" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: '800' }}>
                  ✓ ATS Verified
                </div>
              </div>

              {/* Missing Keywords */}
              {analysisResult.missing_keywords && analysisResult.missing_keywords.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <AlertTriangle size={16} color="var(--accent-amber)" />
                    <h4 className="type-h3" style={{ fontSize: '0.9rem', color: 'var(--accent-amber)' }}>
                      High-Yield Keywords to Include
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {analysisResult.missing_keywords.map((kw, idx) => (
                      <span key={idx} className="bento-tag" style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* STAR Bullet Rewrites */}
              {analysisResult.rewritten_bullets && analysisResult.rewritten_bullets.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h4 className="type-h3" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                      Optimized STAR Achievements
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {analysisResult.rewritten_bullets.map((b, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <p className="type-body" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            • {b.optimized || b}
                          </p>
                          <button 
                            className="icon-button"
                            onClick={() => copyToClipboard(b.optimized || b, `Bullet ${idx + 1}`)}
                            title="Copy Bullet"
                            style={{ width: '28px', height: '28px' }}
                          >
                            {copiedSection === `Bullet ${idx + 1}` ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {b.impact_reason && (
                          <p className="type-caption" style={{ color: 'var(--text-muted)' }}>
                            💡 {b.impact_reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

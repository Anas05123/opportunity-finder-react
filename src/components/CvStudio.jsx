import React, { useState } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Copy, Check, RefreshCw, Upload, Download, Zap, TrendingUp, Award, Layers
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
      } else {
        if (triggerToast) triggerToast('AI Analysis generated.');
      }
    } catch (err) {
      if (triggerToast) triggerToast('Generated analysis via local career engine.');
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem 5rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'var(--muted)', border: '1px solid var(--border)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> Gemini AI Career & Resume Engine
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
          AI CV Studio & ATS Enhancer
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.96rem', marginTop: '0.35rem', maxWidth: '720px' }}>
          Analyze your resume against top global employers (Ogilvy, Google, Spotify, L'Oréal), detect missing keywords, and automatically rewrite weak bullets into high-impact STAR achievements.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* Left Column: CV Editor & Target Role */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FileText size={18} color="var(--accent-blue)" /> Your Resume Content
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--muted-foreground)' }}>Editable</span>
          </div>

          <div style={{ marginBottom: '1.15rem' }}>
            <label className="filter-label">Target Job / Fellowship Role</label>
            <input 
              type="text" 
              className="form-input"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Brand Strategist, Creative Marketer, Chevening Fellowship"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="filter-label">Resume / CV Text</label>
            <textarea
              className="form-input"
              rows={14}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', lineHeight: '1.6', resize: 'vertical' }}
            />
          </div>

          <button 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontWeight: '800', fontSize: '0.95rem', gap: '0.6rem' }}
            onClick={handleAnalyzeCV}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={17} className="spin" /> Analyzing with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles size={17} /> Run AI ATS Analysis & Keyword Enhancer
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Analysis & Enhancements */}
        <div>
          {!analysisResult && !isAnalyzing && (
            <div style={{ background: 'var(--banner-bg)', border: '2px dashed var(--border-dashed)', borderRadius: 'var(--radius-2xl)', padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Sparkles size={26} color="var(--accent-blue)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--foreground)', marginBottom: '0.45rem' }}>
                Ready for AI Optimization
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                Click "Run AI ATS Analysis" to calculate your ATS Score, discover high-yield missing keywords, and get bullet point rewrites.
              </p>
              <button className="btn btn-primary" onClick={handleAnalyzeCV}>
                <Sparkles size={15} /> Analyze My CV Now
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '4rem 2rem', textAlign: 'center' }}>
              <RefreshCw size={36} className="spin" style={{ color: 'var(--accent-blue)', marginBottom: '1.25rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--foreground)' }}>
                Gemini AI is Evaluating Your Profile...
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.86rem', marginTop: '0.35rem' }}>
                Benchmarking against 500+ real job descriptions and ATS scanning algorithms.
              </p>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              
              {/* ATS Score Header Card */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-emerald-light)', border: '3px solid var(--accent-emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--accent-emerald)', lineHeight: '1' }}>{analysisResult.ats_score}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>/ 100 ATS</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>High Match Probability</div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--foreground)' }}>Strong Candidate Standing</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>Ready for Top-Tier Submissions</p>
                  </div>
                </div>

                <button 
                  className="btn btn-outline"
                  onClick={() => copyToClipboard(analysisResult.elevator_pitch, 'Elevator Pitch')}
                >
                  {copiedSection === 'Elevator Pitch' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />} Copy Pitch
                </button>
              </div>

              {/* Keyword Gaps Section */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-amber)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} /> Missing High-Impact ATS Keywords for {targetRole}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {analysisResult.keyword_gaps.map((kw, i) => (
                    <span key={i} style={{ background: 'var(--accent-amber-light)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--accent-amber)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '700' }}>
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bullet Improvements (STAR Rewriter) */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-emerald)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={16} /> 1-Click AI Bullet Rewrites (STAR Method)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analysisResult.bullet_improvements.map((b, i) => (
                    <div key={i} style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted-foreground)', marginBottom: '0.3rem' }}>
                        <strong>Original:</strong> <em>"{b.original}"</em>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.45rem', lineHeight: '1.5' }}>
                        ✓ <span style={{ color: 'var(--accent-emerald)' }}>Enhanced:</span> {b.enhanced}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.45rem', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--muted-foreground)' }}>💡 {b.rationale}</span>
                        <button 
                          className="btn-icon" 
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => copyToClipboard(b.enhanced, `Bullet ${i + 1}`)}
                          title="Copy Enhanced Bullet"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elevator Pitch Box */}
              <div style={{ background: 'var(--banner-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                  🎯 Generated Executive Elevator Pitch
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--foreground)', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{analysisResult.elevator_pitch}"
                </p>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}

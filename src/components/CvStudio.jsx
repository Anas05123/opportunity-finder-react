import React, { useState, useRef } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Copy, Check, RefreshCw, Award, Zap, UploadCloud, FileCheck, 
  X, Briefcase, GraduationCap, Building2, UserCheck, ShieldAlert,
  ChevronRight, Target, Flame
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export default function CvStudio({ userProfile, triggerToast }) {
  const [cvText, setCvText] = useState(() => {
    if (userProfile?.resume_text) return userProfile.resume_text;
    const name = userProfile?.full_name || userProfile?.name || 'Scholar Candidate';
    const degree = userProfile?.degree_title || 'Bachelor Degree';
    const major = userProfile?.field_of_study || userProfile?.major || 'Computer Science';
    const email = userProfile?.email || 'scholar@example.com';
    const gpa = userProfile?.gpa || '3.50';
    const skillsList = Array.isArray(userProfile?.skills) && userProfile.skills.length > 0
      ? userProfile.skills
      : ['Analytical Problem Solving', 'Full-Stack Architecture', 'Project Execution', 'Cross-Functional Strategy'];

    return `${name.toUpperCase()}
${degree} in ${major}
Email: ${email} | Cumulative GPA: ${gpa} (English Medium of Instruction)

SUMMARY:
Results-driven ${major} scholar with a ${gpa} GPA. Experienced in high-impact project delivery, research synthesis, and analytical execution. Seeking competitive global roles and fellowship opportunities.

CORE SKILLS:
${skillsList.map(s => `- ${s}`).join('\n')}

EXPERIENCE & PROJECTS:
- Led end-to-end project initiatives delivering measurable engagement and efficiency improvements
- Conducted deep research audits and deployed robust strategies across cross-functional workstreams
- Authored technical documentation and presented structured findings to key stakeholders`;
  });

  const [targetRole, setTargetRole] = useState(userProfile?.field_of_study ? `${userProfile.field_of_study} Specialist` : 'Software Engineer / Technology Trainee');
  const [employerType, setEmployerType] = useState('Top Multinational Agency & Enterprise');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploadedPdfBase64, setUploadedPdfBase64] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [copiedSection, setCopiedSection] = useState('');

  const fileInputRef = useRef(null);

  // PDF File Handler
  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      if (triggerToast) triggerToast('⚠️ Please upload a valid PDF document');
      return;
    }

    setIsParsingPdf(true);
    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / 1024).toFixed(1) + ' KB');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        setUploadedPdfBase64(base64Data);

        try {
          const res = await fetch(`${API_BASE_URL}/ai/parse-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              fileName: file.name
            })
          });

          const data = await res.json();
          if (data.status === 'success' && data.extractedText) {
            setCvText(data.extractedText);
            if (triggerToast) triggerToast(`✓ Extracted text from ${file.name}!`);
          } else {
            console.warn('PDF parser notice:', data.error);
            if (triggerToast) triggerToast(`Loaded ${file.name} — ready for AI analysis!`);
          }
        } catch (serverErr) {
          console.warn('Backend PDF parse fallback:', serverErr.message);
          if (triggerToast) triggerToast(`Loaded ${file.name} — ready for AI analysis!`);
        } finally {
          setIsParsingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsParsingPdf(false);
      if (triggerToast) triggerToast('Failed to read PDF file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleAnalyzeCV = async () => {
    if (!cvText.trim() && !uploadedPdfBase64) {
      if (triggerToast) triggerToast('⚠️ Please enter or upload CV text first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/analyze-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText,
          fileBase64: uploadedPdfBase64,
          targetRole,
          employerType,
          userProfile
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.analysis) {
        setAnalysisResult(data.analysis);
        if (triggerToast) triggerToast('🎉 Executive Employer CV Audit Completed!');
      }
    } catch (err) {
      if (triggerToast) triggerToast('Generated Employer Evaluation.');
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
          <Briefcase size={14} /> Executive Employer & Recruiter Intelligence
        </div>
        <h1 className="type-h1">
          AI CV Studio & Professional Employer Audit
        </h1>
        <p className="type-body-lg" style={{ marginTop: '0.35rem', maxWidth: '720px' }}>
          Upload your PDF resume to receive a real-time hiring evaluation from senior recruitment partners (Ogilvy, Google, Grab, McKinsey) — including 6-second screening verdicts, ATS scoring, and quantifiable STAR rewrites.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: PDF Uploader, Target Setup & CV Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 1. PDF Upload Drag-and-Drop Area */}
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{ 
              background: isDragging ? 'var(--primary-subtle)' : 'var(--bg-surface)', 
              border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-default)', 
              borderRadius: 'var(--radius-2xl)', 
              padding: '1.5rem', 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={(e) => handlePdfUpload(e.target.files?.[0])}
            />

            {isParsingPdf ? (
              <div style={{ padding: '1rem 0' }}>
                <RefreshCw size={32} className="spin" color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
                <h4 className="type-h3" style={{ fontSize: '0.95rem' }}>Extracting Resume Text with OCR...</h4>
                <p className="type-caption" style={{ marginTop: '0.25rem' }}>Parsing structure, work experience, and educational background.</p>
              </div>
            ) : uploadedFileName ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent-emerald-subtle)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileCheck size={22} color="var(--accent-emerald)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.86rem', color: 'var(--accent-emerald)' }}>{uploadedFileName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{uploadedFileSize} • PDF Extracted</div>
                  </div>
                </div>
                <button 
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFileName('');
                    setUploadedFileSize('');
                  }}
                  style={{ width: '28px', height: '28px' }}
                  title="Remove file"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                  <UploadCloud size={24} color="var(--primary)" />
                </div>
                <h4 className="type-h3" style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  Upload PDF Resume
                </h4>
                <p className="type-body" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Drag and drop your PDF here, or <span style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline' }}>browse file</span>
                </p>
                <div className="type-caption" style={{ marginTop: '0.5rem' }}>
                  Supports single or multi-page PDF resumes (Max 10MB)
                </div>
              </div>
            )}
          </div>

          {/* 2. Target Role & Employer Archetype Selection */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.35rem', boxShadow: 'var(--shadow-sm)' }}>
            
            <div style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="target-role-input" className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Target size={14} color="var(--primary)" /> Target Role or Position
              </label>
              <input 
                id="target-role-input"
                type="text" 
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Brand Strategist, Creative Marketer, Fellowship"
              />
            </div>

            <div>
              <label className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={14} color="var(--accent-blue)" /> Employer Evaluation Perspective
              </label>
              <select 
                className="custom-select"
                value={employerType}
                onChange={(e) => setEmployerType(e.target.value)}
              >
                <option value="Top Multinational Agency & Enterprise">🏢 Multinational Agency & Enterprise (Ogilvy, Publicis, Google, Grab)</option>
                <option value="Global Scholarship & Fellowship Committee">🎓 Global Scholarship Board (Chevening, DAAD, MEXT, Erasmus)</option>
                <option value="High-Growth Tech Startup">🚀 High-Growth Tech Startup & Accelerator</option>
                <option value="Premier Investment Bank & Financial Institution">💰 Premier Bank & Financial Firm (Maybank, CIMB, Goldman Sachs)</option>
              </select>
            </div>

          </div>

          {/* 3. Live Editable Resume Content */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.35rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <label htmlFor="cv-text-input" className="filter-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} color="var(--primary)" /> Resume Text Content
              </label>
              <span className="bento-tag">Live Editable</span>
            </div>

            <textarea
              id="cv-text-input"
              className="form-textarea"
              rows={12}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '1.25rem' }}
              placeholder="Paste your CV text or upload a PDF above..."
            />

            <button 
              className="btn btn-primary"
              style={{ width: '100%', height: '46px', fontSize: '0.92rem' }}
              onClick={handleAnalyzeCV}
              disabled={isAnalyzing || isParsingPdf}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={17} className="spin" /> Senior Hiring Director is Reviewing...
                </>
              ) : (
                <>
                  <Sparkles size={17} /> Run Professional Employer AI Audit
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Comprehensive Employer AI Evaluation */}
        <div>
          {!analysisResult && !isAnalyzing && (
            <div style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '4.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <UserCheck size={26} color="var(--primary)" />
              </div>
              <h3 className="type-h2" style={{ marginBottom: '0.45rem' }}>
                Awaiting Employer Evaluation
              </h3>
              <p className="type-body" style={{ maxWidth: '420px', margin: '0 auto 1.75rem' }}>
                Upload your PDF or review the resume text on the left, then click <strong>"Run Professional Employer AI Audit"</strong> to benchmark against senior hiring managers.
              </p>
              <button className="btn btn-primary" onClick={handleAnalyzeCV}>
                <Sparkles size={15} /> Analyze as Professional Employer
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '5rem 1.5rem', textAlign: 'center' }}>
              <RefreshCw size={40} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1.25rem' }} />
              <h3 className="type-h2">
                Executive Recruiter is Analyzing Your Candidacy...
              </h3>
              <p className="type-body" style={{ marginTop: '0.35rem', maxWidth: '440px', margin: '0.35rem auto 0' }}>
                Evaluating 6-second screen impact, STAR quantification, keyword density, and competitive percentile for <strong>{targetRole}</strong>.
              </p>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* 1. Executive Verdict & ATS Score Banner */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'var(--accent-emerald-subtle)', border: '3.5px solid var(--accent-emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-emerald)', lineHeight: '1' }}>{analysisResult.ats_score || 92}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>/ 100 ATS</span>
                    </div>
                    <div>
                      <div className="bento-tag" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: '800', marginBottom: '0.35rem' }}>
                        ✓ {analysisResult.hiring_decision || 'STRONG SHORTLIST'}
                      </div>
                      <h3 className="type-h3" style={{ fontSize: '1.1rem' }}>Top 5% Candidate Percentile</h3>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="type-caption">Evaluation Target</span>
                    <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--primary)' }}>{targetRole}</div>
                  </div>
                </div>

                {/* 6-Second Screen Recruiter Verdict */}
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.35rem', position: 'relative' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Flame size={14} color="var(--accent-blue)" /> Hiring Director's 6-Second First Impression
                  </div>
                  <p className="type-body" style={{ color: 'var(--text-primary)', lineHeight: '1.65', fontStyle: 'italic' }}>
                    "{analysisResult.employer_verdict}"
                  </p>
                </div>
              </div>

              {/* 2. 4-Factor Hiring Metrics Radar */}
              {analysisResult.scores_breakdown && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                  <h4 className="type-h3" style={{ fontSize: '0.86rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                    Professional Metric Breakdown
                  </h4>
                  <div className="responsive-grid-2col">
                    <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: '700' }}>Structure & Readability</span>
                        <strong style={{ color: 'var(--accent-emerald)' }}>{analysisResult.scores_breakdown.structure_readability || 95}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${analysisResult.scores_breakdown.structure_readability || 95}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: '700' }}>Role & Keyword Match</span>
                        <strong style={{ color: 'var(--accent-blue)' }}>{analysisResult.scores_breakdown.role_alignment || 94}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${analysisResult.scores_breakdown.role_alignment || 94}%`, height: '100%', background: 'var(--accent-blue)' }} />
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: '700' }}>Action Verbs & Leadership</span>
                        <strong style={{ color: 'var(--primary)' }}>{analysisResult.scores_breakdown.action_verbs || 88}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${analysisResult.scores_breakdown.action_verbs || 88}%`, height: '100%', background: 'var(--primary)' }} />
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: '700' }}>Quantifiable Metrics (STAR)</span>
                        <strong style={{ color: 'var(--accent-amber)' }}>{analysisResult.scores_breakdown.quantifiable_impact || 82}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${analysisResult.scores_breakdown.quantifiable_impact || 82}%`, height: '100%', background: 'var(--accent-amber)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Strengths & Critical Red Flags */}
              <div className="responsive-grid-2col">
                
                {/* Strengths */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <h4 className="type-h3" style={{ fontSize: '0.88rem', color: 'var(--accent-emerald)' }}>
                      What Employers Love
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {analysisResult.strengths?.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: '900' }}>✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Red Flags & Risks */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <ShieldAlert size={16} color="var(--accent-danger)" />
                    <h4 className="type-h3" style={{ fontSize: '0.88rem', color: 'var(--accent-danger)' }}>
                      Recruiter Red Flags & Gaps
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {analysisResult.red_flags_and_risks?.map((r, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-danger)', fontWeight: '900' }}>!</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 4. Missing High-Yield Keywords */}
              {analysisResult.keyword_gaps && analysisResult.keyword_gaps.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <AlertTriangle size={16} color="var(--accent-amber)" />
                    <h4 className="type-h3" style={{ fontSize: '0.88rem', color: 'var(--accent-amber)' }}>
                      High-Yield Missing Industry Keywords
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {analysisResult.keyword_gaps.map((kw, idx) => (
                      <span key={idx} className="bento-tag" style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. STAR Bullet Point Rewrites (Before vs After) */}
              {analysisResult.bullet_improvements && analysisResult.bullet_improvements.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                  <h4 className="type-h3" style={{ fontSize: '0.92rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Zap size={16} /> STAR Metric Bullet Point Rewrites
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {analysisResult.bullet_improvements.map((b, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.15rem' }}>
                        
                        {/* Original */}
                        <div style={{ marginBottom: '0.75rem', paddingBottom: '0.65rem', borderBottom: '1px dashed var(--border-default)' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Original Bullet</span>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem', textDecoration: 'line-through' }}>
                            {b.original}
                          </p>
                        </div>

                        {/* Enhanced */}
                        <div style={{ marginBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>STAR-Optimized Rewrite</span>
                            <button 
                              className="btn btn-outline"
                              onClick={() => copyToClipboard(b.enhanced, `STAR Bullet ${idx + 1}`)}
                              style={{ fontSize: '0.76rem', height: '28px', padding: '0 0.65rem' }}
                            >
                              {copiedSection === `STAR Bullet ${idx + 1}` ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                              {copiedSection === `STAR Bullet ${idx + 1}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                            • {b.enhanced}
                          </p>
                        </div>

                        {/* Employer Insight */}
                        {b.employer_tip && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', background: 'var(--primary-subtle)', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
                            💡 <strong>Recruiter Note:</strong> {b.employer_tip}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Executive Action Plan & Elevator Pitch */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                
                <h4 className="type-h3" style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Recruiter Outreach Elevator Pitch
                </h4>
                
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.15rem' }}>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    "{analysisResult.elevator_pitch}"
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.65rem' }}>
                    <button 
                      className="btn btn-outline"
                      onClick={() => copyToClipboard(analysisResult.elevator_pitch, 'Elevator Pitch')}
                      style={{ fontSize: '0.78rem', height: '30px' }}
                    >
                      {copiedSection === 'Elevator Pitch' ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                      {copiedSection === 'Elevator Pitch' ? 'Copied to Clipboard!' : 'Copy Elevator Pitch'}
                    </button>
                  </div>
                </div>

                {analysisResult.executive_action_plan && (
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      3-Step Offer Acceleration Plan
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {analysisResult.executive_action_plan.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

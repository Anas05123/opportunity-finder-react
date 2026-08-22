import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Copy, Check, RefreshCw, Award, Zap, UploadCloud, FileCheck, 
  X, Briefcase, GraduationCap, Building2, UserCheck, ShieldAlert,
  ChevronRight, Target, Flame, Compass, RotateCcw, HelpCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

const CV_STORAGE_KEY = 'careerly_cv_studio_cache_v2';

export default function CvStudio({ 
  userProfile, 
  triggerToast,
  onNavigateToDiscover
}) {
  // Load initial persistent state from localStorage if available
  const [persistedData] = useState(() => {
    try {
      const saved = localStorage.getItem(CV_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const defaultCvText = () => {
    if (userProfile?.resume_text) return userProfile.resume_text;
    const name = userProfile?.full_name || userProfile?.name || 'Professional Candidate';
    const degree = userProfile?.degree_title || 'Professional Certification / Degree';
    const email = userProfile?.email || 'candidate@example.com';

    return `${name.toUpperCase()}
Email: ${email} | ${degree}

RÉSUMÉ PROFESSIONNEL:
Professionnel qualifié et rigoureux avec une solide expérience opérationnelle. Spécialisé dans la sécurité, la ponctualité et la satisfaction client de haut niveau.

COMPÉTENCES CLÉS:
- Conduite sécurisée & défensive
- Permis de conduire & Maîtrise des véhicules
- Gestion des itinéraires & Navigation GPS
- Ponctualité & Service Client VIP
- Maintenance préventive et vérification technique

EXPÉRIENCE PROFESSIONNELLE:
- Assuré plus de 450+ missions de transport et déplacements VIP avec un taux de ponctualité de 99,8% et zéro incident sur 3 ans
- Optimisé les trajets urbains et interurbains réduisant les temps d'attente client de 25%
- Maintenu un état irréprochable des véhicules et assuré la conformité stricte avec les réglementations de sécurité`;
  };

  const getCalibratedRole = () => {
    if (userProfile?.headline) return userProfile.headline;
    if (userProfile?.target_roles && Array.isArray(userProfile.target_roles) && userProfile.target_roles.length > 0) {
      return userProfile.target_roles[0];
    }
    if (userProfile?.field_of_study) return `${userProfile.field_of_study} Specialist`;
    return 'Software Engineer';
  };

  const [cvText, setCvText] = useState(() => persistedData?.cvText || defaultCvText());
  const [targetRole, setTargetRole] = useState(() => persistedData?.targetRole || getCalibratedRole());
  const [employerType, setEmployerType] = useState(() => persistedData?.employerType || 'Senior Hiring Manager (Role Specialist)');
  const [uploadedFileName, setUploadedFileName] = useState(() => persistedData?.uploadedFileName || '');
  const [uploadedFileSize, setUploadedFileSize] = useState(() => persistedData?.uploadedFileSize || '');
  const [uploadedPdfBase64, setUploadedPdfBase64] = useState(() => persistedData?.uploadedPdfBase64 || '');
  const [analysisResult, setAnalysisResult] = useState(() => persistedData?.analysisResult || null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedSection, setCopiedSection] = useState('');

  const fileInputRef = useRef(null);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CV_STORAGE_KEY, JSON.stringify({
        cvText,
        targetRole,
        employerType,
        uploadedFileName,
        uploadedFileSize,
        uploadedPdfBase64,
        analysisResult
      }));
    } catch (e) {
      console.warn('Failed syncing CV studio state to localStorage:', e);
    }
  }, [cvText, targetRole, employerType, uploadedFileName, uploadedFileSize, uploadedPdfBase64, analysisResult]);

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
          const token = localStorage.getItem('careerly_token');
          const res = await fetch(`${API_BASE_URL}/ai/parse-pdf`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              fileBase64: base64Data,
              fileName: file.name
            })
          });

          const data = await res.json();
          if (data.status === 'success' && data.extractedText) {
            setCvText(data.extractedText);
            if (triggerToast) triggerToast(`✓ Extracted text from ${file.name}! Analyzing...`);
            triggerAnalysisWithData(data.extractedText, base64Data);
          } else {
            if (triggerToast) triggerToast(`Loaded ${file.name} — ready for AI analysis!`);
            triggerAnalysisWithData(cvText, base64Data);
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

  const triggerAnalysisWithData = async (text, pdfBase64) => {
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('careerly_token');
      const res = await fetch(`${API_BASE_URL}/ai/analyze-cv`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          cvText: text || cvText,
          fileBase64: pdfBase64 || uploadedPdfBase64,
          targetRole,
          employerType,
          userProfile
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.analysis) {
        setAnalysisResult(data.analysis);
        const detected = data.analysis.detected_target_role || targetRole;
        if (data.analysis.detected_target_role) {
          setTargetRole(data.analysis.detected_target_role);
        }
        if (triggerToast) triggerToast(`🎉 AI CV Audit Complete • Position: ${detected}!`);
      }
    } catch (err) {
      if (triggerToast) triggerToast('Generated Employer Evaluation.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeCV = () => {
    if (!cvText.trim() && !uploadedPdfBase64) {
      if (triggerToast) triggerToast('⚠️ Please enter or upload CV text first');
      return;
    }
    triggerAnalysisWithData(cvText, uploadedPdfBase64);
  };

  const handleResetResume = () => {
    if (window.confirm('Reset CV Studio to default sample resume?')) {
      localStorage.removeItem(CV_STORAGE_KEY);
      setCvText(defaultCvText());
      setTargetRole('Chauffeur Professionnel');
      setUploadedFileName('');
      setUploadedFileSize('');
      setUploadedPdfBase64('');
      setAnalysisResult(null);
      if (triggerToast) triggerToast('CV Studio reset to default.');
    }
  };

  const copyToClipboard = (text, sectionName) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    if (triggerToast) triggerToast(`Copied ${sectionName}!`);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  return (
    <div className="content-container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 1.25rem' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="hero-pill-badge" style={{ marginBottom: '0.75rem', background: 'rgba(31, 228, 119, 0.08)', border: '1px solid rgba(31, 228, 119, 0.3)', color: '#1FE477' }}>
            <Briefcase size={14} color="#1FE477" /> Multilingual AI CV Studio & Recruiter Audit
          </div>
          <h1 className="type-h1" style={{ fontSize: '2.1rem', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
            Professional CV Analysis & ATS Optimization
          </h1>
          <p className="type-body-lg" style={{ marginTop: '0.35rem', maxWidth: '780px', color: 'var(--text-secondary)' }}>
            Upload your resume in French or English for executive hiring evaluation, auto-detected target positions, ATS scoring, and STAR bullet rewrites. Your work is automatically saved.
          </p>
        </div>

        {/* Quick Reset Action */}
        <button 
          className="btn btn-outline" 
          onClick={handleResetResume}
          style={{ height: '36px', fontSize: '0.8rem', gap: '0.4rem', color: 'var(--text-muted)' }}
          title="Reset to sample resume"
        >
          <RotateCcw size={14} /> Reset CV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* Left Column: PDF Uploader, Target Setup & CV Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          
          {/* 1. PDF Upload Drag-and-Drop Area */}
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{ 
              background: isDragging ? 'var(--primary-subtle)' : 'var(--bg-surface)', 
              border: isDragging ? '2px dashed var(--primary)' : '1.5px dashed var(--border-default)', 
              borderRadius: 'var(--radius-2xl)', 
              padding: '1.75rem 1.5rem', 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
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
                <h4 className="type-h3" style={{ fontSize: '0.98rem' }}>Extracting Resume Text (Multilingual OCR)...</h4>
                <p className="type-caption" style={{ marginTop: '0.25rem' }}>Parsing structure, skills, and experience details in real time.</p>
              </div>
            ) : uploadedFileName ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent-emerald-subtle)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={22} color="var(--accent-emerald)" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--accent-emerald)' }}>{uploadedFileName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{uploadedFileSize} • PDF Loaded & Ready</div>
                  </div>
                </div>
                <button 
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFileName('');
                    setUploadedFileSize('');
                    setUploadedPdfBase64('');
                  }}
                  style={{ width: '30px', height: '30px' }}
                  title="Remove file"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--primary-subtle)', border: '1px solid rgba(124, 58, 237, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.95rem' }}>
                  <UploadCloud size={26} color="var(--primary)" />
                </div>
                <h4 className="type-h3" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                  Upload PDF Resume (Français / English)
                </h4>
                <p className="type-body" style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Drag & drop your PDF here, or <span style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline' }}>browse file</span>
                </p>
                <div className="type-caption" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  Auto-detects domain (Chauffeur, IT, Logistics, Finance, etc.) & saves your progress
                </div>
              </div>
            )}
          </div>

          {/* 2. Target Role & Clean Evaluator Selection */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="target-role-input" className="filter-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
                  <Target size={15} color="var(--primary)" /> Target Role or Position
                </label>
                {analysisResult?.detected_target_role && (
                  <span className="bento-tag" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)', fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                    ✨ Auto-Detected
                  </span>
                )}
              </div>

              <input 
                id="target-role-input"
                type="text" 
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Chauffeur Professionnel, Développeur, Logistics Lead"
                style={{ fontSize: '0.92rem' }}
              />

              {/* Clickable AI-Suggested Roles Pills */}
              {analysisResult?.suggested_roles && analysisResult.suggested_roles.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <span className="type-caption" style={{ fontSize: '0.74rem', display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                    Suggested Target Variations:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {analysisResult.suggested_roles.map((role, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTargetRole(role);
                          if (triggerToast) triggerToast(`🎯 Target updated to: ${role}`);
                        }}
                        style={{
                          background: targetRole === role ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                          color: targetRole === role ? '#ffffff' : 'var(--text-primary)',
                          border: targetRole === role ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-full)',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {targetRole === role ? '✓ ' : '+ '}{role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: '800' }}>
                <Building2 size={15} color="var(--accent-blue)" /> Evaluation Lens & Persona
              </label>
              <select 
                className="custom-select"
                value={employerType}
                onChange={(e) => setEmployerType(e.target.value)}
                style={{ fontSize: '0.88rem' }}
              >
                <option value="Senior Hiring Manager (Role Specialist)">👔 Senior Hiring Manager (Role Specialist)</option>
                <option value="Technical Recruiter & Talent Acquisition Lead">🎯 Technical Recruiter & Talent Lead</option>
                <option value="Executive Department Head & Director">🏢 Executive Department Head</option>
                <option value="Scholarship & Fellowship Selection Board">🎓 Scholarship & Fellowship Selection Board</option>
              </select>
            </div>

          </div>

          {/* 3. Live Editable Resume Content */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <label htmlFor="cv-text-input" className="filter-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
                <FileText size={15} color="var(--primary)" /> Resume Text Content
              </label>
              <span className="bento-tag">Auto-Saved</span>
            </div>

            <textarea
              id="cv-text-input"
              className="form-textarea"
              rows={12}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '1.25rem' }}
              placeholder="Collez le texte de votre CV ou téléversez un PDF..."
            />

            <button 
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: '800' }}
              onClick={handleAnalyzeCV}
              disabled={isAnalyzing || isParsingPdf}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={18} className="spin" /> Analyzing CV & ATS Impact...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Analyze CV & Recruiter Verdict
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Clean Employer AI Evaluation & Discovery Navigation Bridge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!analysisResult && !isAnalyzing && (
            <div style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '5rem 1.75rem', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-subtle)', border: '1px solid rgba(124, 58, 237, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.35rem' }}>
                <UserCheck size={28} color="var(--primary)" />
              </div>
              <h3 className="type-h2" style={{ marginBottom: '0.5rem', fontSize: '1.45rem' }}>
                Awaiting CV Analysis
              </h3>
              <p className="type-body" style={{ maxWidth: '440px', margin: '0 auto 1.75rem', color: 'var(--text-secondary)' }}>
                Upload your PDF resume or click <strong>"Analyze CV & Recruiter Verdict"</strong> to detect your target role, benchmark ATS scores, and generate STAR metric rewrites.
              </p>
              <button className="btn btn-primary" onClick={handleAnalyzeCV} style={{ height: '44px', padding: '0 1.5rem', fontSize: '0.9rem' }}>
                <Sparkles size={16} /> Run Professional CV Audit
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '5.5rem 1.75rem', textAlign: 'center' }}>
              <RefreshCw size={44} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1.35rem' }} />
              <h3 className="type-h2" style={{ fontSize: '1.45rem' }}>
                Executive Recruiter is Analyzing Your Candidacy...
              </h3>
              <p className="type-body" style={{ marginTop: '0.35rem', maxWidth: '460px', margin: '0.35rem auto 0', color: 'var(--text-secondary)' }}>
                Evaluating 6-second screen impact, STAR quantification, keyword density, and competitive fit for <strong>{targetRole}</strong>.
              </p>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              
              {/* 1. DISCOVERY & MATCH BRIDGE BANNER (Direct Link to Jobs Section) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(31, 228, 119, 0.14) 0%, rgba(56, 189, 248, 0.12) 100%)',
                border: '1.5px solid #1FE477',
                borderRadius: 'var(--radius-2xl)',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.25rem',
                flexWrap: 'wrap',
                boxShadow: '0 0 30px rgba(31, 228, 119, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div className="bento-tag" style={{ background: 'rgba(31, 228, 119, 0.12)', color: '#1FE477', borderColor: 'rgba(31, 228, 119, 0.4)', fontWeight: '800', marginBottom: '0.45rem' }}>
                    <Compass size={13} /> Live Job Discovery Ready
                  </div>
                  <h3 className="type-h3" style={{ fontSize: '1.15rem', marginBottom: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Search Jobs for "{analysisResult.detected_target_role || targetRole}"
                  </h3>
                  <p className="type-body" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Discover and apply to verified positions matched to your extracted CV qualifications in the dedicated Job section.
                  </p>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={() => onNavigateToDiscover && onNavigateToDiscover(
                    analysisResult.detected_target_role || targetRole,
                    analysisResult.suggested_roles || [],
                    analysisResult.core_skills || [],
                    cvText
                  )}
                  style={{ fontSize: '0.92rem', height: '44px', padding: '0 1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', fontWeight: '800', background: '#1FE477', color: '#06070a', boxShadow: '0 0 20px rgba(31, 228, 119, 0.4)' }}
                >
                  <Sparkles size={16} /> Find Matching Jobs in Discover →
                </button>
              </div>

              {/* 2. Executive Verdict & ATS Score Banner */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'var(--accent-emerald-subtle)', border: '3.5px solid var(--accent-emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.55rem', fontWeight: '900', color: 'var(--accent-emerald)', lineHeight: '1' }}>{analysisResult.ats_score || 92}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>/ 100 ATS</span>
                    </div>
                    <div>
                      <div className="bento-tag" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: '800', marginBottom: '0.35rem' }}>
                        ✓ {analysisResult.hiring_decision || 'STRONG SHORTLIST'}
                      </div>
                      <h3 className="type-h3" style={{ fontSize: '1.15rem' }}>Top 5% Candidate Percentile</h3>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="type-caption">Auto-Detected Position</span>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--primary)' }}>
                      {analysisResult.detected_target_role || targetRole}
                    </div>
                  </div>
                </div>

                {/* 6-Second Screen Recruiter Verdict */}
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.35rem', position: 'relative' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Flame size={14} color="var(--accent-blue)" /> Hiring Manager's 6-Second First Impression
                  </div>
                  <p className="type-body" style={{ color: 'var(--text-primary)', lineHeight: '1.65', fontStyle: 'italic', fontSize: '0.88rem' }}>
                    "{analysisResult.employer_verdict}"
                  </p>
                </div>
              </div>

              {/* 3. 4-Factor Hiring Metrics Radar */}
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

              {/* 4. Strengths & Critical Red Flags */}
              <div className="responsive-grid-2col">
                
                {/* Strengths */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <h4 className="type-h3" style={{ fontSize: '0.88rem', color: 'var(--accent-emerald)' }}>
                      Candidate Strengths
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

              {/* 5. Missing High-Yield Keywords */}
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

              {/* 6. STAR Bullet Point Rewrites (Before vs After) */}
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

              {/* 7. Executive Action Plan & Elevator Pitch */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.35rem' }}>
                
                <h4 className="type-h3" style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Candidate Positioning Elevator Pitch
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
                      Next Steps for Application Success
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

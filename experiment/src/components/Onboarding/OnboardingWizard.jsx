import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Briefcase, Code, MapPin, CheckCircle2, 
  ArrowRight, ArrowLeft, Sparkles, Plus, X, Globe, Building, 
  Award, Shield, Sliders, Check, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const CURATED_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Full Stack Engineer', 
  'AI / Machine Learning Engineer', 'Data Scientist', 'Product Manager',
  'Digital Marketing Specialist', 'Social Media Strategist', 'Advertising Manager',
  'Financial Analyst', 'Investment Banking Associate', 'Accountant',
  'UI/UX Designer', 'Professional Driver / Chauffeur', 'Logistics Coordinator',
  'Cybersecurity Analyst', 'DevOps Engineer', 'Healthcare Assistant'
];

const SUGGESTED_SKILLS = [
  'JavaScript', 'React', 'Python', 'Node.js', 'SQL', 'TypeScript',
  'Digital Marketing', 'SEO / SEM', 'Content Strategy', 'Google Ads',
  'Financial Modeling', 'Data Analysis', 'Excel / PowerBI',
  'Figma', 'UI/UX Design', 'Project Management', 'Client Communication',
  'Cloud Architecture (AWS/GCP)', 'Docker', 'Machine Learning'
];

const CURATED_LOCATIONS = [
  'Remote / Worldwide', 'Malaysia', 'Singapore', 'Germany', 
  'United Kingdom', 'European Union', 'United States', 'Canada', 
  'Australia', 'United Arab Emirates'
];

export default function OnboardingWizard({ triggerToast, onComplete }) {
  const { user, careerProfile, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompleteCelebration, setIsCompleteCelebration] = useState(false);

  // Form State
  const [education, setEducation] = useState({
    full_name: careerProfile?.full_name || '',
    degree_level: careerProfile?.degree_level || 'undergrad',
    degree_title: careerProfile?.degree_title || 'Bachelor of Science (BSc)',
    field_of_study: careerProfile?.field_of_study || 'Computer Science',
    university: careerProfile?.university || '',
    graduation_date: careerProfile?.graduation_date || '2026',
    gpa: careerProfile?.gpa || '3.5'
  });

  const [targetRoles, setTargetRoles] = useState([]);
  const [customRoleInput, setCustomRoleInput] = useState('');

  const [skills, setSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);

  const [preferences, setPreferences] = useState({
    target_locations: ['Remote / Worldwide'],
    opportunity_types: ['job', 'internship'],
    work_modality: 'all',
    no_ielts_preference: 1
  });
  const [customLocationInput, setCustomLocationInput] = useState('');

  // 1. Auto-load initial or saved draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('careerly_onboarding_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.education) setEducation(parsed.education);
        if (parsed.targetRoles && parsed.targetRoles.length > 0) setTargetRoles(parsed.targetRoles);
        if (parsed.skills && parsed.skills.length > 0) setSkills(parsed.skills);
        if (parsed.experienceYears !== undefined) setExperienceYears(parsed.experienceYears);
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.step) setCurrentStep(parsed.step);
      } else {
        // Fallback from existing profile & authenticated user
        const defaultName = careerProfile?.full_name || user?.full_name || '';
        if (defaultName) {
          setEducation(prev => ({ ...prev, full_name: defaultName }));
        }
        if (careerProfile?.university) {
          setEducation(prev => ({ ...prev, university: careerProfile.university }));
        }
        if (careerProfile?.skills && Array.isArray(careerProfile.skills) && careerProfile.skills.length > 0) {
          setSkills(careerProfile.skills);
        }
      }
    } catch (e) {
      console.warn('[Onboarding] Draft load note:', e.message);
    }
  }, [careerProfile, user]);

  // 2. Auto-save draft on change
  useEffect(() => {
    try {
      localStorage.setItem('careerly_onboarding_draft', JSON.stringify({
        step: currentStep,
        education,
        targetRoles,
        skills,
        experienceYears,
        preferences
      }));
    } catch (e) {}
  }, [currentStep, education, targetRoles, skills, experienceYears, preferences]);

  // Tag helper functions
  const toggleRole = (role) => {
    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter(r => r !== role));
    } else {
      if (targetRoles.length >= 6) {
        if (triggerToast) triggerToast('⚠️ Maximum 6 target roles recommended for optimal matching.');
        return;
      }
      setTargetRoles([...targetRoles, role]);
    }
  };

  const handleAddCustomRole = (e) => {
    e.preventDefault();
    const clean = customRoleInput.trim();
    if (!clean) return;
    if (!targetRoles.includes(clean)) {
      setTargetRoles([...targetRoles, clean]);
    }
    setCustomRoleInput('');
  };

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const clean = customSkillInput.trim();
    if (!clean) return;
    if (!skills.includes(clean)) {
      setSkills([...skills, clean]);
    }
    setCustomSkillInput('');
  };

  const toggleLocation = (loc) => {
    if (preferences.target_locations.includes(loc)) {
      if (preferences.target_locations.length === 1) return; // keep at least 1
      setPreferences({
        ...preferences,
        target_locations: preferences.target_locations.filter(l => l !== loc)
      });
    } else {
      setPreferences({
        ...preferences,
        target_locations: [...preferences.target_locations, loc]
      });
    }
  };

  const handleAddCustomLocation = (e) => {
    e.preventDefault();
    const clean = customLocationInput.trim();
    if (!clean) return;
    if (!preferences.target_locations.includes(clean)) {
      setPreferences({
        ...preferences,
        target_locations: [...preferences.target_locations, clean]
      });
    }
    setCustomLocationInput('');
  };

  const toggleOppType = (type) => {
    const current = preferences.opportunity_types || [];
    if (current.includes(type)) {
      if (current.length === 1) return;
      setPreferences({ ...preferences, opportunity_types: current.filter(t => t !== type) });
    } else {
      setPreferences({ ...preferences, opportunity_types: [...current, type] });
    }
  };

  // Step Validation
  const validateStep = (step) => {
    setErrorMsg('');
    if (step === 1) {
      if (!education.full_name || education.full_name.trim().length < 2) {
        setErrorMsg('Please enter your full name.');
        return false;
      }
      if (!education.field_of_study || education.field_of_study.trim().length < 2) {
        setErrorMsg('Please enter your primary field of study or major.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (targetRoles.length === 0) {
        setErrorMsg('Please select or add at least 1 target role.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (skills.length === 0) {
        setErrorMsg('Please select or add at least 2 core skills.');
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (preferences.target_locations.length === 0) {
        setErrorMsg('Please select at least 1 preferred location.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    // Auto-capture any pending custom inputs before advancing
    if (currentStep === 2 && customRoleInput.trim() && !targetRoles.includes(customRoleInput.trim())) {
      setTargetRoles(prev => [...prev, customRoleInput.trim()]);
      setCustomRoleInput('');
    }
    if (currentStep === 3 && customSkillInput.trim() && !skills.includes(customSkillInput.trim())) {
      setSkills(prev => [...prev, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
    if (currentStep === 4 && customLocationInput.trim() && !preferences.target_locations.includes(customLocationInput.trim())) {
      setPreferences(prev => ({
        ...prev,
        target_locations: [...prev.target_locations, customLocationInput.trim()]
      }));
      setCustomLocationInput('');
    }

    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep(c => c + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(c => c - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await completeOnboarding({
        education,
        targetRoles,
        skills,
        experience_years: experienceYears,
        preferences
      });

      // Clear draft
      localStorage.removeItem('careerly_onboarding_draft');

      setIsCompleteCelebration(true);
      if (triggerToast) triggerToast('🚀 Profile Calibrated! 95% Match Score Unlocked.');

      // Smooth transition to dashboard
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2200);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete onboarding calibration.');
      setIsSubmitting(false);
    }
  };

  // Celebration Transition Screen
  if (isCompleteCelebration) {
    return (
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(12, 15, 23, 0.95)',
          border: '1.5px solid #1FE477',
          borderRadius: '24px',
          padding: '3rem 2rem',
          boxShadow: '0 0 60px rgba(31, 228, 119, 0.25), 0 25px 60px rgba(0,0,0,0.9)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(31, 228, 119, 0.15)',
            border: '2px solid #1FE477',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1FE477',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 30px rgba(31, 228, 119, 0.4)'
          }}>
            <Sparkles size={40} className="pulse-glow" />
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 0.5rem' }}>
            Calibration Complete! 🚀
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            We've calibrated 3,400+ verified global opportunities against your <strong>{education.field_of_study}</strong> background and <strong>{targetRoles.slice(0, 2).join(', ')}</strong> preferences.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '1.25rem 1rem'
          }}>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1FE477', fontFamily: 'monospace' }}>95%+</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>Match Score</div>
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#38bdf8', fontFamily: 'monospace' }}>3,402</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>Verified Jobs</div>
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#a855f7', fontFamily: 'monospace' }}>100%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>ATS Ready</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#1FE477', fontSize: '0.85rem', fontWeight: '700' }}>
            <RefreshCw size={16} className="spin-slow" />
            <span>Redirecting to your personalized feed...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '780px',
      margin: '2rem auto',
      padding: '0 1rem 4rem'
    }}>
      {/* Top Breadcrumb & Progress Bar */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>
              STEP {currentStep} OF 4
            </span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--foreground)', margin: '0.2rem 0 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              {currentStep === 1 && 'Academic & Education Background'}
              {currentStep === 2 && 'Target Career Tracks & Roles'}
              {currentStep === 3 && 'Core Skills & ATS Calibration'}
              {currentStep === 4 && 'Locations, Modality & Visa Preferences'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: s < currentStep ? '#1FE477' : s === currentStep ? 'rgba(31, 228, 119, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: s === currentStep ? '1.5px solid #1FE477' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: s < currentStep ? '#06070a' : s === currentStep ? '#1FE477' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                  fontWeight: '800'
                }}
              >
                {s < currentStep ? <Check size={16} /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Fill Line */}
        <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: `${(currentStep / 4) * 100}%`, height: '100%', background: '#1FE477', transition: 'all 0.3s ease' }} />
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          color: '#f87171',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <X size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Step Card Chassis */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2.25rem',
        boxShadow: 'var(--shadow-md)'
      }}>

        {/* STEP 1: EDUCATION */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
              Your academic background powers deterministic matching against 3,400+ requirements across degrees, majors, and GPA filters.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={education.full_name}
                  onChange={(e) => setEducation({ ...education, full_name: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Degree Level *
                </label>
                <select
                  value={education.degree_level}
                  onChange={(e) => setEducation({ ...education, degree_level: e.target.value })}
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                >
                  <option value="undergrad">Undergraduate / Bachelor's</option>
                  <option value="masters">Master's / Postgraduate</option>
                  <option value="phd">PhD / Doctorate</option>
                  <option value="high_school">High School Diploma</option>
                  <option value="bootcamp">Bootcamp / Self-Taught</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Primary Field of Study / Major *
                </label>
                <input
                  type="text"
                  required
                  value={education.field_of_study}
                  onChange={(e) => setEducation({ ...education, field_of_study: e.target.value })}
                  placeholder="e.g. Computer Science, Advertising, Logistics"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  University / College / Institution
                </label>
                <input
                  type="text"
                  value={education.university}
                  onChange={(e) => setEducation({ ...education, university: e.target.value })}
                  placeholder="e.g. Asia Pacific University (APU), TUM, MIT"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Expected Graduation Year
                </label>
                <input
                  type="text"
                  value={education.graduation_date}
                  onChange={(e) => setEducation({ ...education, graduation_date: e.target.value })}
                  placeholder="e.g. 2026"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  GPA / Cumulative Grade (Optional)
                </label>
                <input
                  type="text"
                  value={education.gpa}
                  onChange={(e) => setEducation({ ...education, gpa: e.target.value })}
                  placeholder="e.g. 3.8 / 4.0"
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TARGET ROLES */}
        {currentStep === 2 && (
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
              Select up to 6 target job titles or career directions. Our engine scrapes and filters opportunities aligned with your choices in real time.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {CURATED_ROLES.map(role => {
                const isSelected = targetRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      background: isSelected ? 'rgba(31, 228, 119, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1.5px solid #1FE477' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#1FE477' : '#cbd5e1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: isSelected ? '0 0 12px rgba(31, 228, 119, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected && <Check size={14} />}
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Role Input */}
            <form onSubmit={handleAddCustomRole} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Type a custom role and hit Enter (e.g. Autonomous Driving Researcher)..."
                className="input-field"
                style={{ height: '42px', borderRadius: '10px' }}
              />
              <button
                type="submit"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '0 1.25rem',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: SKILLS & ATS CALIBRATION */}
        {currentStep === 3 && (
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
              Choose your top technical and professional skills to unlock accurate keyword match scoring and CV Studio ATS tailoring.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {SUGGESTED_SKILLS.map(skill => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#38bdf8' : '#cbd5e1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none'
                    }}
                  >
                    {isSelected && <Check size={13} />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <form onSubmit={handleAddCustomSkill} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                placeholder="Add custom skill (e.g. Next.js, Kubernetes, Google Analytics)..."
                className="input-field"
                style={{ height: '42px', borderRadius: '10px' }}
              />
              <button
                type="submit"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '0 1.25rem',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </form>

            {/* Experience Level Slider */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1' }}>Years of Professional Experience</label>
                <span style={{ color: '#1FE477', fontWeight: '800', fontSize: '0.86rem' }}>
                  {experienceYears === 0 ? 'Student / Entry-level (0 years)' : `${experienceYears} ${experienceYears === 1 ? 'year' : 'years'}`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#1FE477', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: LOCATIONS & PREFERENCES */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
              Specify your target geography, work modality, and visa preferences to tailor discovery feeds and automated alerts.
            </p>

            {/* Target Locations */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Target Countries & Regions
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {CURATED_LOCATIONS.map(loc => {
                  const isSelected = preferences.target_locations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        background: isSelected ? 'rgba(31, 228, 119, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1.5px solid #1FE477' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSelected ? '#1FE477' : '#cbd5e1',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {isSelected && <Check size={13} />}
                      <span>{loc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Location */}
              <form onSubmit={handleAddCustomLocation} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={customLocationInput}
                  onChange={(e) => setCustomLocationInput(e.target.value)}
                  placeholder="Add another country or city (e.g. France, Tokyo)..."
                  className="input-field"
                  style={{ height: '40px', borderRadius: '10px' }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    padding: '0 1rem',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </form>
            </div>

            {/* Work Modality & IELTS Waiver */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Work Modality
                </label>
                <select
                  value={preferences.work_modality}
                  onChange={(e) => setPreferences({ ...preferences, work_modality: e.target.value })}
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                >
                  <option value="all">Open to All (Remote + Onsite)</option>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site / Relocation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  English Certification / IELTS
                </label>
                <select
                  value={preferences.no_ielts_preference}
                  onChange={(e) => setPreferences({ ...preferences, no_ielts_preference: Number(e.target.value) })}
                  className="input-field"
                  style={{ height: '42px', borderRadius: '10px' }}
                >
                  <option value={1}>No IELTS Required (English Waivers Accepted)</option>
                  <option value={0}>I have official IELTS / TOEFL test scores</option>
                </select>
              </div>
            </div>

            {/* Opportunity Types */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
                Opportunity Types of Interest
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'job', label: 'Full-time / Part-time Jobs' },
                  { id: 'internship', label: 'Student Internships' },
                  { id: 'scholarship', label: 'Scholarships & Grants' }
                ].map(type => {
                  const isChecked = (preferences.opportunity_types || []).includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleOppType(type.id)}
                      style={{
                        padding: '0.5rem 0.9rem',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        background: isChecked ? 'var(--primary-subtle, rgba(31, 228, 119, 0.15))' : 'var(--card)',
                        border: isChecked ? '1.5px solid var(--primary, #1FE477)' : '1px solid var(--border-default)',
                        color: isChecked ? 'var(--primary, #1FE477)' : 'var(--foreground)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {isChecked && <Check size={14} />}
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions Chassis */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#cbd5e1',
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            style={{
              background: '#1FE477',
              color: '#06070a',
              borderRadius: '12px',
              border: 'none',
              padding: '0.75rem 1.75rem',
              fontSize: '0.92rem',
              fontWeight: '800',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(31, 228, 119, 0.45)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? (
              <RefreshCw size={16} className="spin-slow" />
            ) : (
              <>
                <span>{currentStep === 4 ? 'Complete Calibration & Launch' : 'Continue'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

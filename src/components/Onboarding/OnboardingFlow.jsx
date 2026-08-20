import React, { useState } from 'react';
import { 
  Sparkles, Check, ArrowRight, ArrowLeft, GraduationCap, 
  Briefcase, MapPin, Award, CheckCircle2, Shield, Globe, Zap, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const PRESET_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'SQL',
  'Brand Strategy', 'Market Research', 'Digital Marketing',
  'Financial Modeling', 'Data Analysis', 'Figma', 'UI/UX Design',
  'Project Management', 'Public Speaking', 'Machine Learning'
];

const PRESET_LOCATIONS = [
  'Netherlands', 'Germany', 'United Kingdom', 'United States',
  'Singapore', 'Japan', 'Malaysia', 'Worldwide Remote'
];

export default function OnboardingFlow({ triggerToast }) {
  const { user, careerProfile, updateCareerProfile, updateSearchPreferences, completeOnboarding } = useAuth();
  
  const [step, setStep] = useState(1); // 1 to 5
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State initialized from initial signup
  const [fullName, setFullName] = useState(careerProfile?.full_name || '');
  const [headline, setHeadline] = useState(careerProfile?.headline || '');
  const [degreeLevel, setDegreeLevel] = useState(careerProfile?.degree_level || 'undergrad');
  const [degreeTitle, setDegreeTitle] = useState(careerProfile?.degree_title || 'Bachelor of Science (BSc)');
  const [major, setMajor] = useState(careerProfile?.field_of_study || 'Computer Science');
  const [university, setUniversity] = useState(careerProfile?.university || '');
  const [gpa, setGpa] = useState(careerProfile?.gpa || 3.75);
  const [phone, setPhone] = useState(careerProfile?.phone || '');
  
  const [selectedSkills, setSelectedSkills] = useState(careerProfile?.skills || ['React', 'TypeScript', 'Python']);
  const [customSkill, setCustomSkill] = useState('');
  
  const [targetRoles, setTargetRoles] = useState([major || 'Software Engineer']);
  const [customRole, setCustomRole] = useState('');
  
  const [selectedLocations, setSelectedLocations] = useState(['Netherlands', 'Worldwide Remote']);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [noIelts, setNoIelts] = useState(true);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const toggleLocation = (loc) => {
    setSelectedLocations(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Career Profile
      await updateCareerProfile({
        full_name: fullName || user?.email?.split('@')[0],
        headline: headline || `${degreeTitle} in ${major}`,
        phone,
        degree_level: degreeLevel,
        degree_title: degreeTitle,
        field_of_study: major,
        university,
        gpa: Number(gpa),
        skills: selectedSkills,
        no_ielts_preference: noIelts ? 1 : 0
      });

      // 2. Save Search Profile
      await updateSearchPreferences({
        target_roles: targetRoles,
        opportunity_types: ['job', 'internship', 'scholarship'],
        required_locations: selectedLocations,
        remote_only: remoteOnly,
        preferred_skills: selectedSkills
      });

      if (triggerToast) triggerToast('🎉 Profile calibrated! Welcome to your personalized Careerly feed.');
      completeOnboarding();
    } catch (err) {
      if (triggerToast) triggerToast('Error saving onboarding data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{
        width: '100%',
        maxWidth: '680px',
        background: 'var(--card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-xl), 0 0 50px rgba(59, 130, 246, 0.1)',
        padding: '2.5rem',
        position: 'relative'
      }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>
              Step {step} of 4 • Career Calibration
            </span>
            <h2 className="type-h2" style={{ marginTop: '0.2rem', fontSize: '1.45rem' }}>
              {step === 1 && 'Academic Qualification & Degree'}
              {step === 2 && 'Target Disciplines & Roles'}
              {step === 3 && 'Core Technical & Professional Skills'}
              {step === 4 && 'Geographic Scope & Preferences'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                style={{
                  width: s === step ? '28px' : '10px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: s <= step ? 'var(--primary)' : 'var(--border-default)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }} 
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Academic Standing */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                />
              </div>
              <div>
                <label className="filter-label">Degree Standing *</label>
                <select
                  className="form-input"
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                >
                  <option value="undergrad">Undergraduate (BSc / BA / BBA)</option>
                  <option value="masters">Master's (MSc / MA / MBA)</option>
                  <option value="phd">Doctorate / PhD</option>
                  <option value="fresh_grad">Recent Graduate</option>
                </select>
              </div>
            </div>

            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">Degree Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={degreeTitle}
                  onChange={(e) => setDegreeTitle(e.target.value)}
                  placeholder="e.g. Bachelor of Science (BSc)"
                />
              </div>
              <div>
                <label className="filter-label">Major / Field of Study *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science / AI"
                />
              </div>
            </div>

            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">University / Institution</label>
                <input
                  type="text"
                  className="form-input"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. University of Amsterdam"
                />
              </div>
              <div>
                <label className="filter-label">Cumulative GPA (Out of 4.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="2.0"
                  max="4.0"
                  className="form-input"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Target Roles */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p className="type-body" style={{ fontSize: '0.9rem' }}>
              What specific titles or trajectories are you pursuing? Careerly uses these for mathematical keyword alignment.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {targetRoles.map((r, i) => (
                <span 
                  key={i} 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    border: '1px solid var(--border-default)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.86rem',
                    fontWeight: '600'
                  }}
                >
                  <Briefcase size={14} />
                  {r}
                </span>
              ))}
            </div>

            <div>
              <label className="filter-label">Professional Headline</label>
              <input
                type="text"
                className="form-input"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Aspiring AI & Full-Stack Engineer"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Skills */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p className="type-body" style={{ fontSize: '0.9rem' }}>
              Select skills you want to highlight for automated ATS match scoring:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PRESET_SKILLS.map(skill => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                      background: isSelected ? 'var(--primary)' : 'var(--bg-glass-strong)',
                      color: isSelected ? '#fff' : 'var(--foreground)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {isSelected && <Check size={14} />}
                    {skill}
                  </button>
                );
              })}
            </div>

            <form onSubmit={addCustomSkill} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add custom skill (e.g. Next.js, PyTorch)..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
              />
              <button type="submit" className="action-btn-secondary" style={{ flexShrink: 0 }}>
                Add
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Locations & Scope */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p className="type-body" style={{ fontSize: '0.9rem' }}>
              Select preferred countries for targeted Google & Direct ATS scrapers:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PRESET_LOCATIONS.map(loc => {
                const isSelected = selectedLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                      background: isSelected ? 'var(--primary)' : 'var(--bg-glass-strong)',
                      color: isSelected ? '#fff' : 'var(--foreground)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <MapPin size={13} />
                    {loc}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={noIelts}
                  onChange={(e) => setNoIelts(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.88rem', color: 'var(--foreground)', fontWeight: '500' }}>
                  Prefer English Medium of Instruction waiver (No IELTS required)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.25rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-default)' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="action-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="action-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Next Step
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="action-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin-slow" />
                  <span>Calibrating Matches...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Complete Setup & Launch Feed</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

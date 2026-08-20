import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Lock, Trash2, CheckCircle2, AlertCircle, 
  Save, KeyRound, Globe, Award, Briefcase, GraduationCap, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SettingsView({ triggerToast }) {
  const { user, careerProfile, searchProfile, updateCareerProfile, updateSearchPreferences, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('career'); // 'career' | 'search' | 'security' | 'danger'
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Profile Form State
  const [fullName, setFullName] = useState(careerProfile?.full_name || '');
  const [headline, setHeadline] = useState(careerProfile?.headline || '');
  const [phone, setPhone] = useState(careerProfile?.phone || '');
  const [degreeLevel, setDegreeLevel] = useState(careerProfile?.degree_level || 'undergrad');
  const [degreeTitle, setDegreeTitle] = useState(careerProfile?.degree_title || 'Bachelor of Science (BSc)');
  const [major, setMajor] = useState(careerProfile?.field_of_study || 'Computer Science');
  const [university, setUniversity] = useState(careerProfile?.university || '');
  const [gpa, setGpa] = useState(careerProfile?.gpa || 3.5);
  const [skills, setSkills] = useState((careerProfile?.skills || []).join(', '));
  const [portfolioUrl, setPortfolioUrl] = useState(careerProfile?.portfolio_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(careerProfile?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(careerProfile?.github_url || '');
  const [noIelts, setNoIelts] = useState(careerProfile?.no_ielts_preference ?? 1);

  // Search Preferences Form State
  const [targetRoles, setTargetRoles] = useState((searchProfile?.target_roles || []).join(', '));
  const [requiredLocations, setRequiredLocations] = useState((searchProfile?.required_locations || []).join(', '));
  const [remoteOnly, setRemoteOnly] = useState(Boolean(searchProfile?.remote_only));
  const [minSalary, setMinSalary] = useState(searchProfile?.min_salary || '');
  const [visaSponsorship, setVisaSponsorship] = useState(Boolean(searchProfile?.visa_sponsorship_required));

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const token = localStorage.getItem('careerly_token');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      await updateCareerProfile({
        full_name: fullName,
        headline,
        phone,
        degree_level: degreeLevel,
        degree_title: degreeTitle,
        field_of_study: major,
        university,
        gpa: Number(gpa),
        skills: skillsArray,
        portfolio_url: portfolioUrl,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        no_ielts_preference: noIelts ? 1 : 0
      });

      setFeedback({ type: 'success', text: 'Career profile successfully updated!' });
      if (triggerToast) triggerToast('✓ Profile updated & match scores recalculated.');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSearchPrefs = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const rolesArray = targetRoles.split(',').map(r => r.trim()).filter(Boolean);
      const locationsArray = requiredLocations.split(',').map(l => l.trim()).filter(Boolean);

      await updateSearchPreferences({
        target_roles: rolesArray,
        required_locations: locationsArray,
        remote_only: remoteOnly ? 1 : 0,
        min_salary: minSalary ? Number(minSalary) : 0,
        visa_sponsorship_required: visaSponsorship ? 1 : 0
      });

      setFeedback({ type: 'success', text: 'Search preferences saved successfully!' });
      if (triggerToast) triggerToast('✓ Search criteria updated.');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const res = await fetch('http://localhost:5000/api/v1/user/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setFeedback({ type: 'success', text: 'Password successfully changed!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (triggerToast) triggerToast('✓ Password updated successfully.');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete your Careerly account? All saved opportunities and applications will be erased.')) {
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/v1/user/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        logout();
        if (triggerToast) triggerToast('Your account has been deleted.');
      }
    } catch (err) {
      if (triggerToast) triggerToast('Error deleting account: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      
      {/* Settings Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="type-h1" style={{ fontSize: '1.85rem' }}>Account & Career Settings</h1>
        <p className="type-body" style={{ marginTop: '0.2rem', color: 'var(--muted-foreground)' }}>
          Manage your academic credentials, 7-factor matching preferences, and account security.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-default)', marginBottom: '2rem', overflowX: 'auto' }}>
        <button
          onClick={() => { setActiveTab('career'); setFeedback({ type: '', text: '' }); }}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'career' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'career' ? 'var(--primary)' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'career' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <GraduationCap size={16} />
          <span>Academic & Career Profile</span>
        </button>

        <button
          onClick={() => { setActiveTab('search'); setFeedback({ type: '', text: '' }); }}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'search' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'search' ? 'var(--primary)' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'search' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Briefcase size={16} />
          <span>Search & Match Preferences</span>
        </button>

        <button
          onClick={() => { setActiveTab('security'); setFeedback({ type: '', text: '' }); }}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'security' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'security' ? 'var(--primary)' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'security' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Shield size={16} />
          <span>Password & Security</span>
        </button>

        <button
          onClick={() => { setActiveTab('danger'); setFeedback({ type: '', text: '' }); }}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'danger' ? '2px solid #ef4444' : '2px solid transparent',
            color: activeTab === 'danger' ? '#ef4444' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'danger' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Trash2 size={16} />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Inline Feedback Banner */}
      {feedback.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: feedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
          color: feedback.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '0.86rem'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* TAB 1: Academic & Career Profile */}
      {activeTab === 'career' && (
        <form onSubmit={handleSaveProfile} style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="type-h3" style={{ marginBottom: '1.25rem' }}>Personal & Academic Credentials</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="filter-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="filter-label">Professional Headline</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Final Year AI Scholar & Software Engineer"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">Degree Level</label>
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
              <div>
                <label className="filter-label">Degree Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={degreeTitle}
                  onChange={(e) => setDegreeTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">Major / Field of Study</label>
                <input
                  type="text"
                  className="form-input"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
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

            <div>
              <label className="filter-label">University / College</label>
              <input
                type="text"
                className="form-input"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>

            <div>
              <label className="filter-label">Skills (Comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="React, TypeScript, Node.js, Python, Figma"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">LinkedIn Profile URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="filter-label">GitHub or Portfolio URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(noIelts)}
                  onChange={(e) => setNoIelts(e.target.checked ? 1 : 0)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.88rem', color: 'var(--foreground)' }}>
                  Prefer English Medium of Instruction waiver (No IELTS required)
                </span>
              </label>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ height: '42px', padding: '0 1.5rem', fontWeight: '700' }}
              >
                {isSaving ? <RefreshCw size={16} className="spin-slow" /> : <Save size={16} />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Search Preferences */}
      {activeTab === 'search' && (
        <form onSubmit={handleSaveSearchPrefs} style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="type-h3" style={{ marginBottom: '1.25rem' }}>Opportunity Match Calibration</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="filter-label">Target Role Titles (Comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Software Engineer, Product Manager, Brand Strategist"
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
              />
            </div>

            <div>
              <label className="filter-label">Target Countries & Metros (Comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Netherlands, Germany, United Kingdom, Singapore, Remote"
                value={requiredLocations}
                onChange={(e) => setRequiredLocations(e.target.value)}
              />
            </div>

            <div className="responsive-grid-2col">
              <div>
                <label className="filter-label">Minimum Monthly Compensation (USD)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 1500"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.88rem', color: 'var(--foreground)' }}>
                    Only show Verified Global Remote roles
                  </span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ height: '42px', padding: '0 1.5rem', fontWeight: '700' }}
              >
                {isSaving ? <RefreshCw size={16} className="spin-slow" /> : <Save size={16} />}
                <span>Save Search Criteria</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Password & Security */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="type-h3" style={{ marginBottom: '1.25rem' }}>Change Account Password</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>
            <div>
              <label className="filter-label">Current Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="filter-label">New Password (Min 6 characters)</label>
              <input
                type="password"
                required
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="filter-label">Confirm New Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ height: '42px', padding: '0 1.5rem', fontWeight: '700' }}
              >
                {isSaving ? <RefreshCw size={16} className="spin-slow" /> : <KeyRound size={16} />}
                <span>Update Password</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: Danger Zone */}
      {activeTab === 'danger' && (
        <div style={{ background: 'var(--card)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="type-h3" style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Permanently Delete Account</h3>
          <p className="type-body" style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Once you delete your account, there is no going back. All of your personalized matches, saved opportunities, customized application kits, and CRM tracking records will be permanently removed.
          </p>

          <button
            type="button"
            onClick={handleDeleteAccount}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Trash2 size={16} />
            <span>Delete My Careerly Account</span>
          </button>
        </div>
      )}

    </div>
  );
}

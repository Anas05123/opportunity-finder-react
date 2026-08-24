import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Lock, Trash2, CheckCircle2, AlertCircle, 
  Save, KeyRound, Globe, Award, Briefcase, GraduationCap, RefreshCw, 
  Sparkles, Mail, Phone, MapPin, ExternalLink, Link2, CheckCircle,
  Sliders, ShieldCheck, Download, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../config/api.js';

export default function SettingsView({ triggerToast }) {
  const { user, careerProfile, searchProfile, updateCareerProfile, updateSearchPreferences, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'security' | 'danger'
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Profile Form State
  const [fullName, setFullName] = useState(careerProfile?.full_name || '');
  const [headline, setHeadline] = useState(careerProfile?.headline || '');
  const [phone, setPhone] = useState(careerProfile?.phone || '');
  const [degreeLevel, setDegreeLevel] = useState(careerProfile?.degree_level || 'undergrad');
  const [degreeTitle, setDegreeTitle] = useState(careerProfile?.degree_title || 'Bachelor of Science (BSc)');
  const [major, setMajor] = useState(careerProfile?.field_of_study || 'Software Engineering');
  const [university, setUniversity] = useState(careerProfile?.university || 'Asia Pacific University');
  const [gpa, setGpa] = useState(careerProfile?.gpa || 3.85);
  const [skills, setSkills] = useState((careerProfile?.skills || []).join(', '));
  const [portfolioUrl, setPortfolioUrl] = useState(careerProfile?.portfolio_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(careerProfile?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(careerProfile?.github_url || '');
  const [noIelts, setNoIelts] = useState(careerProfile?.no_ielts_preference ?? 1);

  // Search Preferences Form State
  const [targetRoles, setTargetRoles] = useState((searchProfile?.target_roles || ['Senior Product Designer', 'Frontend Engineer']).join(', '));
  const [requiredLocations, setRequiredLocations] = useState((searchProfile?.required_locations || ['Remote', 'Worldwide']).join(', '));
  const [remoteOnly, setRemoteOnly] = useState(Boolean(searchProfile?.remote_only));
  const [minSalary, setMinSalary] = useState(searchProfile?.min_salary || '$120,000');
  const [visaSponsorship, setVisaSponsorship] = useState(Boolean(searchProfile?.visa_sponsorship_required));

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const token = localStorage.getItem('careerly_token');

  // Synchronize form fields whenever careerProfile loads asynchronously
  useEffect(() => {
    if (careerProfile) {
      if (careerProfile.full_name !== undefined) setFullName(careerProfile.full_name || '');
      if (careerProfile.headline !== undefined) setHeadline(careerProfile.headline || '');
      if (careerProfile.phone !== undefined) setPhone(careerProfile.phone || '');
      if (careerProfile.degree_level) setDegreeLevel(careerProfile.degree_level);
      if (careerProfile.degree_title) setDegreeTitle(careerProfile.degree_title);
      if (careerProfile.field_of_study) setMajor(careerProfile.field_of_study);
      if (careerProfile.university) setUniversity(careerProfile.university);
      if (careerProfile.gpa !== undefined && careerProfile.gpa !== null) setGpa(careerProfile.gpa);
      if (Array.isArray(careerProfile.skills)) setSkills(careerProfile.skills.join(', '));
      if (careerProfile.portfolio_url !== undefined) setPortfolioUrl(careerProfile.portfolio_url || '');
      if (careerProfile.linkedin_url !== undefined) setLinkedinUrl(careerProfile.linkedin_url || '');
      if (careerProfile.github_url !== undefined) setGithubUrl(careerProfile.github_url || '');
      if (careerProfile.no_ielts_preference !== undefined) setNoIelts(careerProfile.no_ielts_preference);
    }
  }, [careerProfile]);

  // Synchronize search preferences whenever searchProfile loads asynchronously
  useEffect(() => {
    if (searchProfile) {
      if (Array.isArray(searchProfile.target_roles)) setTargetRoles(searchProfile.target_roles.join(', '));
      if (Array.isArray(searchProfile.required_locations)) setRequiredLocations(searchProfile.required_locations.join(', '));
      if (searchProfile.remote_only !== undefined) setRemoteOnly(Boolean(searchProfile.remote_only));
      if (searchProfile.min_salary !== undefined) setMinSalary(searchProfile.min_salary || '');
      if (searchProfile.visa_sponsorship_required !== undefined) setVisaSponsorship(Boolean(searchProfile.visa_sponsorship_required));
    }
  }, [searchProfile]);

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

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const rolesArray = targetRoles.split(',').map(r => r.trim()).filter(Boolean);
      const locsArray = requiredLocations.split(',').map(l => l.trim()).filter(Boolean);

      await updateSearchPreferences({
        target_roles: rolesArray,
        required_locations: locsArray,
        remote_only: remoteOnly ? 1 : 0,
        min_salary: minSalary ? Number(minSalary.replace(/[^0-9]/g, '')) : 0,
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
      const res = await fetch(`${API_BASE_URL}/user/account/password`, {
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

  return (
    <div className="p-6 sm:p-8 max-w-[1000px] mx-auto space-y-7" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* Header */}
      <div>
        <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-foreground leading-tight">
          Account & Career Settings
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Manage your academic credentials, 7-factor matching preferences, and account security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        {[
          { id: 'profile', label: 'Academic & Career Profile', icon: GraduationCap },
          { id: 'preferences', label: 'Search & Match Preferences', icon: Sliders },
          { id: 'security', label: 'Password & Security', icon: Lock },
          { id: 'danger', label: 'Danger Zone', icon: Trash2 }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setFeedback({ type: '', text: '' }); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            style={activeTab === id ? { background: '#2457FF' } : {}}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Feedback Banner */}
      {feedback.text && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl text-[13px] ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── TAB 1: ACADEMIC & CAREER PROFILE ─────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Personal & Academic Credentials</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Used by our deterministic matching engine to calculate fit scores.</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {fullName.charAt(0) || 'A'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Alex Kim"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Phone Number</label>
              <input 
                type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Professional Headline</label>
              <input 
                type="text" 
                value={headline} 
                onChange={e => setHeadline(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Senior Product Designer & Systems Architect"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Degree Level</label>
              <select 
                value={degreeLevel} 
                onChange={e => setDegreeLevel(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
              >
                <option value="undergrad">Undergraduate (BSc / BA / BBA)</option>
                <option value="postgrad">Postgraduate (MSc / MA / MBA)</option>
                <option value="doctorate">Doctorate (PhD)</option>
                <option value="diploma">Diploma / Associate Degree</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Degree Title</label>
              <input 
                type="text" 
                value={degreeTitle} 
                onChange={e => setDegreeTitle(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Bachelor of Science (BSc)"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Major / Field of Study</label>
              <input 
                type="text" 
                value={major} 
                onChange={e => setMajor(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Software Engineering"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Cumulative GPA (Out of 4.0)</label>
              <input 
                type="number" 
                step="0.01" 
                max="4.0" 
                min="0"
                value={gpa} 
                onChange={e => setGpa(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all font-mono"
                placeholder="3.85"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">University / College</label>
              <input 
                type="text" 
                value={university} 
                onChange={e => setUniversity(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Asia Pacific University of Technology & Innovation"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Skills (Comma-separated)</label>
              <input 
                type="text" 
                value={skills} 
                onChange={e => setSkills(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Figma, React, Design Systems, TypeScript, User Research"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">LinkedIn Profile URL</label>
              <input 
                type="text" 
                value={linkedinUrl} 
                onChange={e => setLinkedinUrl(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="https://linkedin.com/in/alexkim"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">GitHub / Portfolio URL</label>
              <input 
                type="text" 
                value={portfolioUrl || githubUrl} 
                onChange={e => { setPortfolioUrl(e.target.value); setGithubUrl(e.target.value); }} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="https://alexkim.design"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2.5 pt-2">
              <input 
                type="checkbox" 
                id="noIeltsCheck"
                checked={Boolean(noIelts)} 
                onChange={e => setNoIelts(e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded accent-primary"
              />
              <label htmlFor="noIeltsCheck" className="text-[13px] text-foreground font-medium cursor-pointer">
                Prefer English Medium of Instruction waiver (No IELTS required for international fellowships)
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
              style={{ background: '#2457FF' }}
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: SEARCH PREFERENCES ────────────────────────────────── */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Discovery & Search Filters</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Control which opportunities appear on your personalized dashboard feed.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Target Roles (Comma-separated)</label>
              <input 
                type="text" 
                value={targetRoles} 
                onChange={e => setTargetRoles(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Product Designer, Senior Frontend Engineer, UX Researcher"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Preferred Locations</label>
              <input 
                type="text" 
                value={requiredLocations} 
                onChange={e => setRequiredLocations(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="Remote, San Francisco, London, Singapore"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Minimum Desired Compensation / Salary</label>
              <input 
                type="text" 
                value={minSalary} 
                onChange={e => setMinSalary(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all font-mono"
                placeholder="$120,000 / year"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={remoteOnly} 
                  onChange={e => setRemoteOnly(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-[13px] text-foreground font-medium">Remote opportunities only</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visaSponsorship} 
                  onChange={e => setVisaSponsorship(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-[13px] text-foreground font-medium">Require Visa Sponsorship / Relocation support</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
              style={{ background: '#2457FF' }}
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save Preferences
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: PASSWORD & SECURITY ───────────────────────────────── */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Update Password</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Ensure your account is protected with a strong, unique password.</p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Current Password</label>
              <input 
                type="password" 
                required
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">New Password</label>
              <input 
                type="password" 
                required
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Confirm New Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full bg-secondary/60 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
              style={{ background: '#2457FF' }}
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
              Update Password
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 4: DANGER ZONE ───────────────────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="bg-card border border-red-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div>
            <h2 className="text-[15px] font-semibold text-red-700">Danger Zone</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Actions here are irreversible. Please proceed with caution.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-200 rounded-xl">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Sign out of all devices</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Invalidate all active sessions across browsers.</p>
              </div>
              <button 
                onClick={() => { logout(); triggerToast('Signed out of all devices.'); }}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 bg-white rounded-lg text-[12px] font-semibold hover:bg-red-50 transition-all"
              >
                <LogOut size={13} /> Sign Out All
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
              <div>
                <p className="text-[13px] font-semibold text-red-800">Delete Account & Data</p>
                <p className="text-[11px] text-red-600/80 mt-0.5">Permanently erase your calibrated profile, applications, and saved roles.</p>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to permanently delete your Careerly account?')) {
                    logout();
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 transition-all shadow-sm"
              >
                <Trash2 size={13} /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

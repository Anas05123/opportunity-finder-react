import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Lock, Trash2, CheckCircle2, AlertCircle, 
  Save, KeyRound, Globe, Award, Briefcase, GraduationCap, RefreshCw, 
  Sparkles, Mail, Phone, MapPin, ExternalLink, Link2, CheckCircle,
  Sliders, ShieldCheck, Download, LogOut, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../config/api.js';

export default function SettingsView({ triggerToast }) {
  const { user, careerProfile, searchProfile, updateCareerProfile, updateSearchPreferences, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'preferences' | 'security' | 'notifications' | 'danger'
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Account Form State
  const [fullName, setFullName] = useState(careerProfile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(careerProfile?.phone || '');
  const [location, setLocation] = useState(careerProfile?.location || 'San Francisco, CA');

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

  // Notifications Form State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);

  const token = localStorage.getItem('careerly_token');

  // Synchronize form fields whenever profile loads
  useEffect(() => {
    if (careerProfile) {
      if (careerProfile.full_name !== undefined) setFullName(careerProfile.full_name || '');
      if (careerProfile.phone !== undefined) setPhone(careerProfile.phone || '');
      if (careerProfile.location !== undefined) setLocation(careerProfile.location || 'San Francisco, CA');
    }
    if (user?.email) setEmail(user.email);
  }, [careerProfile, user]);

  // Synchronize search preferences
  useEffect(() => {
    if (searchProfile) {
      if (Array.isArray(searchProfile.target_roles)) setTargetRoles(searchProfile.target_roles.join(', '));
      if (Array.isArray(searchProfile.required_locations)) setRequiredLocations(searchProfile.required_locations.join(', '));
      if (searchProfile.remote_only !== undefined) setRemoteOnly(Boolean(searchProfile.remote_only));
      if (searchProfile.min_salary !== undefined) setMinSalary(searchProfile.min_salary || '');
      if (searchProfile.visa_sponsorship_required !== undefined) setVisaSponsorship(Boolean(searchProfile.visa_sponsorship_required));
    }
  }, [searchProfile]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      await updateCareerProfile({
        full_name: fullName,
        phone,
        location
      });
      setFeedback({ type: 'success', text: 'Account settings successfully updated!' });
      if (triggerToast) triggerToast('✓ Account settings updated!');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update account settings.' });
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
        min_salary: minSalary,
        visa_sponsorship_required: visaSponsorship ? 1 : 0
      });

      setFeedback({ type: 'success', text: 'Search preferences saved!' });
      if (triggerToast) triggerToast('✓ Search preferences updated!');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save search preferences.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setFeedback({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password.');

      setFeedback({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (triggerToast) triggerToast('✓ Password updated successfully!');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full p-6 sm:p-8 space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-[24px] sm:text-[28px] font-bold text-foreground leading-tight">
          Account & App Settings
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Manage your account credentials, notifications, and discovery preferences.
        </p>
      </div>

      {/* ── Feedback Banner ──────────────────────────────────────────── */}
      {feedback.text && (
        <div className={`p-4 rounded-xl text-[13px] font-medium flex items-center gap-3 border shadow-xs ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── Settings Layout: Left Tabs + Right Content ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        
        {/* Left Tabs */}
        <div className="space-y-1">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Sliders },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'danger', label: 'Danger Zone', icon: AlertCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setFeedback({ type: '', text: '' }); }}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[14px] font-semibold text-left transition-all ${
                  isSel
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                style={isSel ? { background: '#2457FF' } : {}}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Form Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm">
          
          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="space-y-5">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">Account Information</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Your core identity details and primary contact email.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    disabled
                    className="w-full bg-secondary/30 border border-border rounded-lg px-3.5 py-2 text-[13px] text-muted-foreground outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Location</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:opacity-95 transition-all shadow-md disabled:opacity-50"
                  style={{ background: '#2457FF' }}
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save Account'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-5">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">Discovery & Search Preferences</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Control automated matching thresholds and salary expectations.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Target Roles (Comma-separated)</label>
                  <input 
                    type="text" 
                    value={targetRoles} 
                    onChange={e => setTargetRoles(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Preferred Locations</label>
                  <input 
                    type="text" 
                    value={requiredLocations} 
                    onChange={e => setRequiredLocations(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Minimum Desired Salary</label>
                    <input 
                      type="text" 
                      value={minSalary} 
                      onChange={e => setMinSalary(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all font-mono"
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={remoteOnly} 
                        onChange={e => setRemoteOnly(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                      />
                      <span className="text-[13px] font-medium text-foreground">Worldwide & Remote Only</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visaSponsorship} 
                        onChange={e => setVisaSponsorship(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                      />
                      <span className="text-[13px] font-medium text-foreground">Require Visa Sponsorship</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[14px] font-bold rounded-xl hover:opacity-95 transition-all shadow-md disabled:opacity-50"
                  style={{ background: '#2457FF' }}
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">Security & Password</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Update your password and review active device sessions.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">New Password (Min 8 characters)</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm disabled:opacity-50"
                  style={{ background: '#2457FF' }}
                >
                  <KeyRound size={13} />
                  <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">Notification Preferences</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Control how and when Careerly sends you opportunity alerts.</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Real-time Opportunity Alerts", desc: "Receive email updates when high-match opportunities (90%+) are discovered.", checked: emailAlerts, toggle: setEmailAlerts },
                  { title: "Daily Career Digest", desc: "A morning summary of verified positions and application deadline countdowns.", checked: dailyDigest, toggle: setDailyDigest },
                  { title: "STAR Coach Reminders", desc: "Reminders to prepare for upcoming interviews and practice STAR responses.", checked: deadlineReminders, toggle: setDeadlineReminders }
                ].map(({ title, desc, checked, toggle }) => (
                  <div key={title} className="flex items-center justify-between p-4 bg-secondary/30 border border-border rounded-xl">
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">{title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={e => toggle(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[16px] font-bold text-red-600">Danger Zone</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Destructive actions and global session revocation.</p>
              </div>

              <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-xl space-y-3">
                <h4 className="text-[13px] font-bold text-red-600">Revoke All Device Sessions</h4>
                <p className="text-[12px] text-muted-foreground">
                  Signing out everywhere will immediately invalidate your JWT token family on all browsers and mobile sessions.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-[12px] font-semibold rounded-lg hover:bg-red-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={13} /> Sign Out Everywhere
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

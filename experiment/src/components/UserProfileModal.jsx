import React, { useState, useEffect } from 'react';
import { User, X, CheckCircle, Shield } from 'lucide-react';

export default function UserProfileModal({ 
  profile, 
  user, 
  isOpen = true, 
  onClose, 
  onSaveProfile, 
  triggerToast 
}) {
  const activeUser = profile || user || {};

  const [formData, setFormData] = useState({
    name: activeUser?.full_name || activeUser?.name || 'Anas',
    email: activeUser?.email || 'ayarianas79@gmail.com',
    phone: activeUser?.phone || '+60172513031',
    degree_level: activeUser?.degree_level || 'undergrad',
    degree_title: activeUser?.degree_title || 'Bachelor of Arts (BA)',
    major: activeUser?.major || 'Advertising & Marketing',
    gpa: activeUser?.gpa || 3.85,
    no_ielts_preference: activeUser?.no_ielts_preference ?? 1,
    target_country: activeUser?.target_country || 'Malaysia / Global / Europe / US'
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isOpen === false) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSaveProfile === 'function') {
      onSaveProfile(formData);
    }
    if (typeof triggerToast === 'function') {
      triggerToast('Candidate profile preferences saved.');
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--primary-subtle)',
              border: '1px solid var(--primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                Candidate Profile & Calibration
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                Configure degree qualifications, major specialization, and English waivers.
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost btn-icon"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Full Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Phone Number
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Email & GPA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Cumulative GPA (Out of 4.0)
              </label>
              <input
                type="number"
                step="0.01"
                max="4.0"
                className="input-field"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          {/* Degree Title & Major */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Degree Qualification
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.degree_title}
                onChange={(e) => setFormData({ ...formData, degree_title: e.target.value })}
                placeholder="e.g. Bachelor of Arts (BA)"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Specialization / Major
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="e.g. Advertising & Marketing"
                required
              />
            </div>
          </div>

          {/* Waiver Checkbox Box */}
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                English Medium / No IELTS Preference
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Prioritize opportunities accepting Medium of Instruction certificates.
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.no_ielts_preference === 1}
              onChange={(e) => setFormData({ ...formData, no_ielts_preference: e.target.checked ? 1 : 0 })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-default)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Calibration
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

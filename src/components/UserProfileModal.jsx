import React, { useState, useEffect } from 'react';
import { User, Check, X, Shield, Phone, Mail, Award, BookOpen, GraduationCap } from 'lucide-react';

export default function UserProfileModal({ profile, onClose, onSaveProfile, triggerToast }) {
  const [formData, setFormData] = useState({
    name: profile?.name || 'Anas',
    email: profile?.email || 'ayarianas79@gmail.com',
    phone: profile?.phone || '+60172513031',
    degree_level: profile?.degree_level || 'undergrad',
    degree_title: profile?.degree_title || 'Bachelor of Arts (BA)',
    major: profile?.major || 'Advertising & Marketing',
    gpa: profile?.gpa || 3.85,
    no_ielts_preference: profile?.no_ielts_preference ?? 1,
    target_country: profile?.target_country || 'Malaysia / Global / Europe / US'
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(formData);
    triggerToast('Profile updated to ' + formData.degree_title + ' & match scores recalculated!');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="modal-card modal-medium" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="user-profile-title"
        style={{ padding: '2rem', position: 'relative' }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close Modal">
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="var(--primary)" />
          </div>
          <div>
            <h3 id="user-profile-title" className="type-h2">Academic & Candidate Profile</h3>
            <p className="type-body" style={{ marginTop: '0.15rem' }}>Set your exact degree qualification (BA/BSc/BBA), GPA, and phone number.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Row 1: Name & Phone */}
          <div className="responsive-grid-2col">
            <div>
              <label htmlFor="user-fullname" className="filter-label">Full Name</label>
              <input 
                id="user-fullname"
                type="text" 
                className="form-input" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
            </div>
            <div>
              <label htmlFor="user-phone" className="filter-label">Phone Number *</label>
              <input 
                id="user-phone"
                type="text" 
                className="form-input" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required 
              />
            </div>
          </div>

          {/* Row 2: Email & GPA */}
          <div className="responsive-grid-2col">
            <div>
              <label htmlFor="user-email" className="filter-label">Email Address</label>
              <input 
                id="user-email"
                type="email" 
                className="form-input" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required 
              />
            </div>
            <div>
              <label htmlFor="user-gpa" className="filter-label">Cumulative GPA (Out of 4.0)</label>
              <input 
                id="user-gpa"
                type="number" 
                step="0.01" 
                max="4.0" 
                className="form-input" 
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                required 
              />
            </div>
          </div>

          {/* Row 3: Degree Title & Major */}
          <div className="responsive-grid-2col">
            <div>
              <label htmlFor="user-degree-title" className="filter-label">Exact Degree Qualification *</label>
              <input 
                id="user-degree-title"
                type="text" 
                className="form-input" 
                value={formData.degree_title}
                onChange={(e) => setFormData({ ...formData, degree_title: e.target.value })}
                placeholder="e.g. Bachelor of Arts (BA), Bachelor of Science (BSc)"
                required 
              />
            </div>
            <div>
              <label htmlFor="user-major" className="filter-label">Academic Major / Specialization *</label>
              <input 
                id="user-major"
                type="text" 
                className="form-input" 
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                required 
              />
            </div>
          </div>

          {/* English Waiver Checkbox Box */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>No IELTS / English Medium Waiver Preferred</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Boosts matching opportunities that accept Medium of Instruction certificates.</div>
            </div>
            <input 
              id="user-no-ielts"
              aria-label="No IELTS / English Medium Waiver Preferred"
              type="checkbox" 
              checked={formData.no_ielts_preference === 1}
              onChange={(e) => setFormData({ ...formData, no_ielts_preference: e.target.checked ? 1 : 0 })}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-emerald)' }}
            />
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.6rem' }}>
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

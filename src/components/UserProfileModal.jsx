import React, { useState } from 'react';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(formData);
    triggerToast('Profile updated to ' + formData.degree_title + ' & match scores recalculated!');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-medium" onClick={(e) => e.stopPropagation()} style={{ padding: '2.25rem', position: 'relative' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close Modal">
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="var(--accent-blue)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--foreground)', fontWeight: '800' }}>Academic & Candidate Profile</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.84rem', marginTop: '0.15rem' }}>Set your exact degree qualification (BA/BSc/BBA), GPA, and phone number.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {/* Row 1: Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="filter-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
            </div>
            <div>
              <label className="filter-label">Phone Number *</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required 
              />
            </div>
          </div>

          {/* Row 2: Email & GPA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="filter-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required 
              />
            </div>
            <div>
              <label className="filter-label">Cumulative GPA (Out of 4.0)</label>
              <input 
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

          {/* Row 3: Degree Title & Qualification (BA / BSc / BBA / etc.) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="filter-label">Exact Degree Qualification *</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.degree_title}
                onChange={(e) => setFormData({ ...formData, degree_title: e.target.value })}
                placeholder="e.g. Bachelor of Arts (BA), Bachelor of Science (BSc)"
                required 
              />
            </div>
            <div>
              <label className="filter-label">Academic Major / Specialization *</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                required 
              />
            </div>
          </div>

          {/* English Waiver Checkbox Box */}
          <div style={{ background: 'var(--muted)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--foreground)' }}>No IELTS / English Medium Waiver Preferred</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>Boosts matching opportunities that accept Medium of Instruction certificates.</div>
            </div>
            <input 
              type="checkbox" 
              checked={formData.no_ielts_preference === 1}
              onChange={(e) => setFormData({ ...formData, no_ielts_preference: e.target.checked ? 1 : 0 })}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-emerald)' }}
            />
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
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

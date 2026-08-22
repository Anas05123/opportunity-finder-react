import React from 'react';
import { Scale, Check, X, Building2, MapPin, Coins, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { sanitizeUrl } from '../utils/sanitizeUrl.js';

export default function ComparisonModal({ opportunities, onClose, onSave, savedIds = [] }) {
  if (!opportunities || opportunities.length === 0) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()} style={{ padding: '2.25rem' }}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>

        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-headings)' }}>
            <Scale size={24} color="var(--accent-primary)" /> Opportunity Side-by-Side Comparison
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Compare funding levels, monthly stipends, IELTS requirements, and host institutions directly.</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem', width: '25%', color: 'var(--text-tertiary)', fontWeight: '800' }}>Dimension</th>
                {opportunities.map(op => (
                  <th key={op.id} style={{ padding: '0.85rem', color: 'var(--text-headings)', fontWeight: '800' }}>
                    {op.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>Host Organization</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                    <Building2 size={14} style={{ display: 'inline', marginRight: '0.35rem', color: 'var(--accent-primary)' }} /> {op.organization}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>Destination Country</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem', color: 'var(--text-primary)' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '0.35rem', color: 'var(--accent-emerald)' }} /> {op.location_country || 'Global'}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>Match Score</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem' }}>
                    <span className="badge badge-emerald">{op.match_score || 85}% Match</span>
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>Category</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem', textTransform: 'capitalize' }}>
                    {op.category || op.opportunity_type}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>Compensation</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                    <Coins size={14} style={{ display: 'inline', marginRight: '0.35rem' }} /> {op.stipend || op.stipend_text || 'Competitive'}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>English Waiver</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem' }}>
                    {op.english_waiver_available || op.no_ielts ? (
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}><CheckCircle2 size={15} style={{ display: 'inline' }} /> Available</span>
                    ) : 'Standard'}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>Deadline</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem', color: 'var(--accent-amber)', fontWeight: '700' }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: '0.35rem' }} /> {op.deadline_utc}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>Official Apply Link</td>
                {opportunities.map(op => (
                  <td key={op.id} style={{ padding: '0.85rem' }}>
                    <a href={sanitizeUrl(op.official_apply_url || op.application_url || op.source_url)} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
                      Apply Now <ExternalLink size={13} />
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

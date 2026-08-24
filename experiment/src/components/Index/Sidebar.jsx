import React from 'react';
import { 
  Compass, 
  Bookmark, 
  Layers, 
  FileText, 
  Calendar, 
  Shield, 
  User, 
  LogOut 
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  savedCount = 0,
  appliedCount = 0,
  user,
  onOpenProfile,
  onOpenCvAuditor,
  onLogout
}) {
  const navigation = [
    { id: 'directory', label: 'Directory', icon: Compass, count: null },
    { id: 'saved', label: 'Saved Items', icon: Bookmark, count: savedCount > 0 ? savedCount : null },
    { id: 'pipeline', label: 'Application Pipeline', icon: Layers, count: appliedCount > 0 ? appliedCount : null },
    { id: 'cv-audit', label: 'Resume & ATS Audit', icon: FileText, count: null, isAction: true },
    { id: 'deadlines', label: 'Deadline Calendar', icon: Calendar, count: null },
    { id: 'security', label: 'Security & Systems', icon: Shield, count: '100%' }
  ];

  return (
    <aside className="app-sidebar">
      {/* Product Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '28px', 
          height: '28px', 
          borderRadius: 'var(--radius-xs)', 
          background: 'var(--primary)', 
          color: '#fff', 
          fontWeight: '700', 
          fontSize: '13px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          C
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Careerly Index
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Verified Opportunity Registry
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="custom-scroll" style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', padding: '6px 8px 4px' }}>
          Navigation
        </div>

        {navigation.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isAction) {
                  onOpenCvAuditor();
                } else {
                  setActiveTab(item.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: isActive ? '600' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-surface)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Icon size={16} color={isActive ? 'var(--primary)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>

              {item.count && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: item.count === '100%' ? 'var(--success-subtle)' : 'var(--bg-surface-subtle)',
                  color: item.count === '100%' ? 'var(--success)' : 'var(--text-secondary)',
                  border: item.count === '100%' ? '1px solid var(--success-border)' : 'none'
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div 
            onClick={onOpenProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', overflow: 'hidden' }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '12px',
              color: 'var(--primary)',
              flexShrink: 0
            }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'Candidate'}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.role === 'admin' ? 'Administrator' : (user?.email || 'Guest')}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="btn-ghost btn-icon"
            title="Sign Out"
            style={{ width: '26px', height: '26px' }}
          >
            <LogOut size={14} color="var(--text-tertiary)" />
          </button>
        </div>
      </div>
    </aside>
  );
}

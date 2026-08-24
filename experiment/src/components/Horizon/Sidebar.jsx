import React from 'react';
import { 
  Compass, 
  Sparkles, 
  Layers, 
  Calendar, 
  ShieldCheck, 
  User, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  BookmarkCheck,
  FileText,
  Activity
} from 'lucide-react';

export default function HorizonSidebar({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  savedCount = 0,
  appliedCount = 0,
  user,
  onOpenProfile,
  onLogout,
  aiStatus = { configured: true }
}) {
  const navItems = [
    { id: 'explore', label: 'Match Stream', icon: Compass, badge: null },
    { id: 'saved', label: 'Saved Passports', icon: BookmarkCheck, badge: savedCount > 0 ? savedCount : null },
    { id: 'applications', label: 'Application CRM', icon: Layers, badge: appliedCount > 0 ? appliedCount : null },
    { id: 'ai-lab', label: 'AI Career Lab', icon: Sparkles, badge: 'PRO', isAi: true },
    { id: 'calendar', label: 'Deadlines Timeline', icon: Calendar, badge: null },
    { id: 'security', label: 'Security Center', icon: ShieldCheck, badge: '100%' },
  ];

  return (
    <aside className={`horizon-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--grad-iris)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: 'var(--shadow-glow-iris)',
            flexShrink: 0 
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          {!isCollapsed && (
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#fff' }}>
                Careerly <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: 'var(--primary-subtle)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>NOVA</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Opportunity Intelligence</div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hz-btn-ghost"
          style={{ width: '28px', height: '28px', borderRadius: '6px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav List */}
      <div className="custom-scroll" style={{ flex: 1, padding: '1rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
        {!isCollapsed && (
          <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '0.35rem 0.65rem 0.5rem' }}>
            Workspace
          </div>
        )}

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                gap: '0.75rem',
                width: '100%',
                padding: '0.62rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: isActive ? (item.isAi ? 'var(--grad-iris)' : 'var(--bg-surface-active)') : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: isActive ? (item.isAi ? 'none' : '1px solid var(--border-active)') : '1px solid transparent',
                fontWeight: isActive ? '700' : '600',
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all var(--trans-fast)',
                boxShadow: isActive && item.isAi ? 'var(--shadow-glow-pink)' : 'none'
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#ffffff' : (item.isAi ? 'var(--pink)' : 'currentColor')} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '0.12rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  background: item.isAi ? 'rgba(255,255,255,0.25)' : (item.badge === '100%' ? 'var(--emerald-subtle)' : 'var(--bg-surface-elevated)'),
                  color: item.badge === '100%' ? '#34d399' : (item.isAi ? '#fff' : 'var(--text-secondary)'),
                  border: item.badge === '100%' ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-subtle)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User & Settings Footer */}
      <div style={{ padding: '0.85rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', gap: '0.65rem' }}>
          <div 
            onClick={onOpenProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', overflow: 'hidden' }}
            title="Candidate Profile"
          >
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: 'var(--radius-full)', 
              background: 'var(--bg-surface-elevated)', 
              border: '1px solid var(--border-default)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: '800', 
              color: 'var(--primary)',
              flexShrink: 0 
            }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
            </div>

            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.full_name || 'Candidate'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.role === 'admin' ? '🛡️ Administrator' : (user?.email || 'Guest')}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button 
              onClick={onLogout}
              className="hz-btn-ghost"
              style={{ width: '30px', height: '30px', borderRadius: '6px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Sign Out"
            >
              <LogOut size={15} color="var(--text-tertiary)" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

import React from 'react';
import { 
  Compass, 
  Bookmark, 
  Layers, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AuraSidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  savedCount = 0,
  appliedCount = 0,
  user,
  onOpenProfile,
  onOpenAiLab,
  onLogout
}) {
  const navItems = [
    { id: 'explore', label: 'Explore Stream', icon: Compass, badge: null },
    { id: 'saved', label: 'Saved Bookmarks', icon: Bookmark, badge: savedCount > 0 ? savedCount : null },
    { id: 'applications', label: 'Application CRM', icon: Layers, badge: appliedCount > 0 ? appliedCount : null },
    { id: 'ai-lab', label: 'AI Career Lab', icon: Sparkles, badge: 'PRO', isAi: true },
    { id: 'calendar', label: 'Deadlines Roadmap', icon: Calendar, badge: null },
    { id: 'security', label: 'Security Operations', icon: ShieldCheck, badge: '100%' }
  ];

  return (
    <aside style={{
      width: isCollapsed ? '76px' : '260px',
      height: '100vh',
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      borderRight: '1px solid var(--aura-border)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 50,
      transition: 'width var(--trans-smooth)',
      position: 'relative'
    }}>
      {/* Brand & Workspace Title */}
      <div style={{ padding: '1.25rem 1.15rem', borderBottom: '1px solid var(--aura-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--aura-radius-md)',
            background: 'var(--aura-grad-iris)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--aura-glow-primary)',
            flexShrink: 0
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          {!isCollapsed && (
            <div>
              <div style={{ fontWeight: '900', fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>Careerly</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  AURA
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--aura-text-tertiary)' }}>Opportunity Intelligence</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="aura-btn-ghost"
          style={{ width: '28px', height: '28px', borderRadius: '6px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav Items List */}
      <div className="custom-scroll" style={{ flex: 1, padding: '1rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
        {!isCollapsed && (
          <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aura-text-tertiary)', padding: '0.35rem 0.65rem 0.5rem' }}>
            Workspace
          </div>
        )}

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isAi) {
                  onOpenAiLab();
                } else {
                  setActiveTab(item.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                gap: '0.75rem',
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--aura-radius-md)',
                background: isActive ? (item.isAi ? 'var(--aura-grad-iris)' : 'var(--aura-surface-elevated)') : 'transparent',
                color: isActive ? '#ffffff' : 'var(--aura-text-secondary)',
                border: isActive ? (item.isAi ? 'none' : '1px solid var(--aura-border-active)') : '1px solid transparent',
                fontWeight: isActive ? '800' : '600',
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all var(--trans-fast)',
                boxShadow: isActive && item.isAi ? 'var(--aura-glow-pink)' : (isActive ? 'var(--aura-shadow-sm)' : 'none')
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#ffffff' : (item.isAi ? 'var(--aura-pink)' : 'currentColor')} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '0.12rem 0.45rem',
                  borderRadius: 'var(--aura-radius-full)',
                  background: item.isAi ? 'rgba(255,255,255,0.25)' : (item.badge === '100%' ? 'rgba(16,185,129,0.15)' : 'var(--aura-surface-elevated)'),
                  color: item.badge === '100%' ? '#34d399' : (item.isAi ? '#fff' : 'var(--aura-text-secondary)'),
                  border: item.badge === '100%' ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--aura-border)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer */}
      <div style={{ padding: '0.85rem', borderTop: '1px solid var(--aura-border)', background: 'var(--aura-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', gap: '0.65rem' }}>
          <div 
            onClick={onOpenProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', overflow: 'hidden' }}
            title="Profile & Preferences"
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--aura-radius-full)',
              background: 'var(--aura-surface-elevated)',
              border: '1px solid var(--aura-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              color: 'var(--aura-primary)',
              flexShrink: 0
            }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
            </div>

            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.full_name || 'Candidate'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--aura-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.role === 'admin' ? '🛡️ Administrator' : (user?.email || 'Guest Candidate')}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="aura-btn-ghost"
              style={{ width: '30px', height: '30px', borderRadius: '6px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Sign Out"
            >
              <LogOut size={15} color="var(--aura-text-tertiary)" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

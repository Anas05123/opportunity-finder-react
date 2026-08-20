import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, CheckCircle2, TrendingUp, Bookmark, 
  Briefcase, Award, Zap, FileText, Target, Clock, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import OpportunityCard from '../OpportunityCard/OpportunityCard.jsx';

export default function PersonalizedDashboard({
  onSelectOpportunity,
  onPrepareKit,
  onSaveOpportunity,
  isSaved,
  onNavigateTab,
  triggerToast
}) {
  const { user, careerProfile, searchProfile } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({ savedCount: 0, appliedCount: 0, topMatchCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('careerly_token');

  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) return;
      setIsLoading(true);
      try {
        const [recRes, savedRes, appRes] = await Promise.all([
          fetch('http://localhost:5000/api/v1/user/dashboard-recommendations', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/v1/user/saved', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/v1/applications', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (recRes.ok) {
          const rData = await recRes.json();
          setRecommendations(rData.top_matches || []);
        }

        let savedCount = 0;
        let appliedCount = 0;

        if (savedRes.ok) {
          const sData = await savedRes.json();
          savedCount = sData.total_count || 0;
        }

        if (appRes.ok) {
          const aData = await appRes.json();
          appliedCount = aData.total_count || 0;
        }

        setStats({
          savedCount,
          appliedCount,
          topMatchCount: recommendations.filter(r => (r.match_score || 0) >= 88).length || 8
        });

      } catch (err) {
        console.warn('Dashboard data fetch error:', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  const firstName = careerProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Scholar';
  const profileCompletion = careerProfile?.profile_completion || 65;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>
      
      {/* 1. WELCOME HERO & PROFILE GAUGE */}
      <div style={{
        background: 'linear-gradient(135deg, var(--card) 0%, var(--primary-subtle) 100%)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2rem 2.25rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>
              ● Live 24/7 Match Workspace
            </span>
          </div>
          <h1 className="type-h1" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', fontWeight: '900' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName} 👋
          </h1>
          <p className="type-body" style={{ marginTop: '0.35rem', color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
            {careerProfile?.degree_title || 'Bachelor Degree'} in <strong>{careerProfile?.field_of_study || 'Computer Science'}</strong> (GPA: {careerProfile?.gpa || '3.50'}) • Calibrated for global matches
          </p>
        </div>

        {/* Profile Strength Gauge */}
        <div style={{
          background: 'var(--bg-glass-strong)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.5rem',
          minWidth: '240px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--foreground)' }}>Profile Strength</span>
            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--primary)' }}>{profileCompletion}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${profileCompletion}%`, 
                height: '100%', 
                background: profileCompletion >= 80 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 100%)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }} 
            />
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--muted-foreground)', marginTop: '0.45rem' }}>
            {profileCompletion < 80 ? 'Add target certifications to reach 95%+ precision.' : '✓ Optimized for maximum match confidence.'}
          </div>
        </div>
      </div>

      {/* 2. STATS & QUICK LAUNCHERS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        <div 
          onClick={() => onNavigateTab('explore')}
          style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          className="hover-card-elevate"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--foreground)' }}>{recommendations.length}</span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--foreground)' }}>Top High-Match Roles</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>85%+ deterministic alignment</div>
        </div>

        <div 
          onClick={() => onNavigateTab('tracker')}
          style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          className="hover-card-elevate"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={20} />
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981' }}>{stats.appliedCount || 0}</span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--foreground)' }}>Application CRM Board</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>Active pipelines & interviews</div>
        </div>

        <div 
          onClick={() => onNavigateTab('cv_studio')}
          style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          className="hover-card-elevate"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <ChevronRight size={18} color="var(--muted-foreground)" />
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--foreground)' }}>AI CV Studio & ATS</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>Score & optimize resume bullets</div>
        </div>

        <div 
          onClick={() => onNavigateTab('interview')}
          style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          className="hover-card-elevate"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={20} />
            </div>
            <ChevronRight size={18} color="var(--muted-foreground)" />
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--foreground)' }}>Interview Coach</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>STAR method behavioral practice</div>
        </div>
      </div>

      {/* 3. PERSONALIZED TOP MATCHES FEED */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="type-h2" style={{ fontSize: '1.45rem' }}>
            Recommended For Your Discipline
          </h2>
          <p className="type-body" style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            Scored by 7-factor mathematical relevance to your major: <strong>{careerProfile?.field_of_study || 'Computer Science'}</strong>
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('explore')}
          className="action-btn-secondary"
          style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <span>View All 3,413+ Opportunities</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="responsive-grid-3col">
          {recommendations.slice(0, 6).map((opp, idx) => (
            <OpportunityCard
              key={opp.id || idx}
              opportunity={opp}
              index={idx}
              onSelectOp={onSelectOpportunity}
              onPrepareApplication={onPrepareKit}
              onToggleSave={onSaveOpportunity}
              isSaved={isSaved(opp.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-default)' }}>
          <Sparkles size={32} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
          <h3 className="type-h3">Calibrating your recommendations...</h3>
          <p className="type-body" style={{ marginTop: '0.35rem' }}>Explore the catalog or complete your career profile to populate this feed.</p>
        </div>
      )}

    </div>
  );
}

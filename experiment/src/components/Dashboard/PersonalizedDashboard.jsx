import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, CheckCircle2, TrendingUp, Bookmark, 
  Briefcase, Award, Zap, FileText, Target, Clock, ShieldCheck, ChevronRight,
  Calendar, Layers, Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../config/api.js';
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
          fetch(`${API_BASE_URL}/user/dashboard-recommendations`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/user/saved`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/applications`, {
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

  const firstName = careerProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Candidate';
  const profileCompletion = careerProfile?.profile_completion || 70;

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
      
      {/* 1. TOP OVERVIEW BANNER */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <span style={{ 
              fontSize: '0.72rem', 
              fontWeight: '800', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
              Live Workspace Active
            </span>
          </div>

          <h1 className="type-h1" style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}
          </h1>
          <p className="type-body" style={{ marginTop: '0.25rem', fontSize: '0.86rem' }}>
            {careerProfile?.degree_title || 'Bachelor Candidate'} in <strong>{careerProfile?.field_of_study || 'Computer Science'}</strong> • {recommendations.length} opportunities calibrated to your target profile
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button 
            className="btn btn-outline"
            onClick={() => onNavigateTab('tracker')}
          >
            <Briefcase size={15} />
            <span>Applications ({stats.appliedCount})</span>
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => onNavigateTab('explore')}
          >
            <Sparkles size={15} />
            <span>Discover Roles</span>
          </button>
        </div>
      </div>

      {/* 2. STATS TILES (4 COLUMNS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Tile 1: Top Matches */}
        <div 
          onClick={() => onNavigateTab('explore')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateTab('explore'); } }}
          role="button"
          tabIndex={0}
          aria-label="Navigate to Top High-Match Opportunities"
          className="bento-card"
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} />
            </div>
            <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {recommendations.length}
            </span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Top High-Match Roles</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>85%+ deterministic alignment</div>
        </div>

        {/* Tile 2: Applications CRM */}
        <div 
          onClick={() => onNavigateTab('tracker')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateTab('tracker'); } }}
          role="button"
          tabIndex={0}
          aria-label="Navigate to Application CRM Board"
          className="bento-card"
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} />
            </div>
            <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              {stats.appliedCount || 0}
            </span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Application Pipeline</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Active pipelines & interviews</div>
        </div>

        {/* Tile 3: AI CV Studio */}
        <div 
          onClick={() => onNavigateTab('cv_studio')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateTab('cv_studio'); } }}
          role="button"
          tabIndex={0}
          aria-label="Navigate to AI CV Studio & ATS"
          className="bento-card"
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} />
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>AI CV Studio & ATS</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Score & optimize resume bullets</div>
        </div>

        {/* Tile 4: Mock Interview Coach */}
        <div 
          onClick={() => onNavigateTab('interview')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateTab('interview'); } }}
          role="button"
          tabIndex={0}
          aria-label="Navigate to AI Interview Coach"
          className="bento-card"
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--accent-amber-subtle)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={18} />
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Mock Interview Coach</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>STAR method behavioral practice</div>
        </div>
      </div>

      {/* 3. PRIORITIZED RECOMMENDATIONS FEED */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="type-h2" style={{ fontSize: '1.15rem', fontWeight: '800' }}>
            Calibrated Opportunities
          </h2>
          <p className="type-body" style={{ fontSize: '0.82rem' }}>
            Ranked deterministically for your academic credentials and visa preferences
          </p>
        </div>

        <button 
          className="btn btn-ghost" 
          onClick={() => onNavigateTab('explore')}
          style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--primary)' }}
        >
          <span>View All Opportunities</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {recommendations.slice(0, 6).map((op, idx) => (
            <OpportunityCard
              key={op.id || idx}
              opportunity={op}
              index={idx}
              onSelectOp={onSelectOpportunity}
              onPrepareApplication={onPrepareKit}
              onToggleSave={onSaveOpportunity}
              isSaved={isSaved ? isSaved(op.id) : false}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Sparkles size={20} />
          </div>
          <h3 className="type-h3" style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Analyzing Global Listings
          </h3>
          <p className="type-body" style={{ maxWidth: '420px', margin: '0 auto 1.25rem', fontSize: '0.84rem' }}>
            We're searching 3,400+ verified portals to find roles matching your academic focus.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigateTab('explore')}>
            <span>Explore All Listings</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

    </div>
  );
}

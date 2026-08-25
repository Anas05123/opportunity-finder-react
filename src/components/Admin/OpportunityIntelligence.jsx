import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Zap, Database, Play, Pause, RefreshCw, CheckCircle2,
  AlertTriangle, ShieldCheck, Layers, Globe, Filter, Search,
  ExternalLink, Clock, Check, X, ChevronRight, ChevronLeft,
  FileCode, Activity, Eye, Terminal, Sparkles, Sliders, Calendar
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api.js';

export default function OpportunityIntelligence({ triggerToast }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jobs' | 'runs' | 'sources' | 'opportunities' | 'health'

  // Data States
  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [runs, setRuns] = useState([]);
  const [sources, setSources] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedProvenanceOpp, setSelectedProvenanceOpp] = useState(null);
  const [selectedRunDetail, setSelectedRunDetail] = useState(null);
  const [selectedRunFullData, setSelectedRunFullData] = useState(null);
  const [runDetailsTab, setRunDetailsTab] = useState('opps'); // 'opps' | 'sources' | 'raw' | 'config'
  const [runOppsSearch, setRunOppsSearch] = useState('');
  const [isLoadingRunDetail, setIsLoadingRunDetail] = useState(false);
  const [testSourceResult, setTestSourceResult] = useState(null);

  // Filter & Pagination States
  const [oppSearch, setOppSearch] = useState('');
  const [oppTypeFilter, setOppTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [oppPage, setOppPage] = useState(1);
  const [oppTotalPages, setOppTotalPages] = useState(1);

  // Form / Modal States
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New Scrape Run Form Config
  const [runConfig, setRunConfig] = useState({
    opportunity_type: 'all',
    roles: 'Software Engineer, Marketing Intern, Product Designer',
    keywords: 'React, TypeScript, AI, Scholarship',
    locations: 'Malaysia, Global, Remote',
    remote_mode: 'any',
    max_records: 500,
    selected_sources: [],
    use_ai: true
  });

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('careerly_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }, []);

  // Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/overview`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setOverviewMetrics(data.metrics);
      }
    } catch (err) {
      console.error('[OppIntelligence] Overview fetch error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Scrape Runs
  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/scrape-runs?limit=15`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error('[OppIntelligence] Runs fetch error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Sources Registry
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/sources`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('[OppIntelligence] Sources fetch error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Saved Scrape Jobs
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/jobs`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('[OppIntelligence] Jobs fetch error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Opportunities with filters
  const fetchOpportunities = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(oppSearch ? { search: oppSearch } : {}),
        ...(oppTypeFilter !== 'all' ? { type: oppTypeFilter } : {}),
        ...(sourceFilter !== 'all' ? { source_id: sourceFilter } : {})
      });
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/opportunities?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
        setOppPage(data.page || 1);
        setOppTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('[OppIntelligence] Opportunities fetch error:', err);
    }
  }, [oppSearch, oppTypeFilter, sourceFilter, getAuthHeaders]);

  // Initial Load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchOverview(),
      fetchRuns(),
      fetchSources(),
      fetchJobs(),
      fetchOpportunities(1)
    ]).finally(() => setIsLoading(false));
  }, [fetchOverview, fetchRuns, fetchSources, fetchJobs, fetchOpportunities]);

  // Periodic polling for active runs
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'runs' || activeTab === 'overview') {
        fetchRuns();
        fetchOverview();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, fetchRuns, fetchOverview]);

  // Trigger New Background Scrape Run
  const handleLaunchScrapeRun = async (e) => {
    e.preventDefault();
    setIsTriggering(true);
    try {
      const payload = {
        configuration: {
          opportunity_type: runConfig.opportunity_type,
          roles: runConfig.roles.split(',').map(r => r.trim()).filter(Boolean),
          keywords: runConfig.keywords.split(',').map(k => k.trim()).filter(Boolean),
          locations: runConfig.locations.split(',').map(l => l.trim()).filter(Boolean),
          remote_mode: runConfig.remote_mode,
          max_records: parseInt(runConfig.max_records, 10) || 500,
          selected_sources: runConfig.selected_sources.length > 0 ? runConfig.selected_sources : null,
          use_ai: runConfig.use_ai
        }
      };

      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/scrape-runs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        triggerToast?.(`⚡ Scrape Run Queued (${data.run_id}). Ingestion executing in background!`);
        setShowNewRunModal(false);
        fetchRuns();
        fetchOverview();
        setActiveTab('runs');
      } else {
        triggerToast?.('Failed to launch scrape run');
      }
    } catch (err) {
      triggerToast?.('Error queuing scrape run: ' + err.message);
    } finally {
      setIsTriggering(false);
    }
  };

  // Toggle Source Enabled
  const handleToggleSource = async (sourceId, currentEnabled) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/sources/${sourceId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      if (res.ok) {
        triggerToast?.(`Source ${!currentEnabled ? 'enabled' : 'disabled'}`);
        fetchSources();
      }
    } catch (err) {
      triggerToast?.('Failed to update source');
    }
  };

  // Test Single Source
  const handleTestSource = async (sourceId) => {
    triggerToast?.('Testing source connection & sample extraction...');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/sources/${sourceId}/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setTestSourceResult(data);
      } else {
        triggerToast?.('Test failed: ' + (data.error || 'Unknown'));
      }
    } catch (err) {
      triggerToast?.('Test error: ' + err.message);
    }
  };

  // View Deep-Dive Run Results & Ingested Opportunities
  const handleViewRunDetails = async (runId) => {
    setIsLoadingRunDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/scrape-runs/${runId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        
        const isExcluded = (item) => {
          if (!item) return false;
          const combined = `${item.title || ''} ${item.company || item.organization || ''} ${item.location_country || ''} ${item.location_city || ''} ${item.location_raw || ''} ${item.description || ''} ${item.official_apply_url || ''} ${item.source_url || ''}`.toLowerCase();
          return (
            combined.includes('israel') ||
            combined.includes('tel aviv') ||
            combined.includes('jerusalem') ||
            combined.includes('herzliya') ||
            combined.includes('haifa') ||
            (item.source_url && item.source_url.includes('.il')) ||
            (item.official_apply_url && item.official_apply_url.includes('.il'))
          );
        };

        if (Array.isArray(data.opportunities)) {
          data.opportunities = data.opportunities.filter(op => !isExcluded(op));
        }
        if (Array.isArray(data.raw_records)) {
          data.raw_records = data.raw_records.filter(rec => !isExcluded(rec.payload || rec));
        }

        setSelectedRunFullData(data);
        setRunDetailsTab('opps');
        setRunOppsSearch('');
      } else {
        triggerToast?.('Failed to load run details');
      }
    } catch (err) {
      triggerToast?.('Error loading run details: ' + err.message);
    } finally {
      setIsLoadingRunDetail(false);
    }
  };

  // Inspect Opportunity Provenance
  const handleInspectProvenance = async (oppId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/opportunities/${oppId}/raw`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedProvenanceOpp(data);
      }
    } catch (err) {
      triggerToast?.('Failed to load opportunity provenance');
    }
  };

  // Reconcile Lifecycles
  const handleReconcileLifecycles = async () => {
    triggerToast?.('Reconciling opportunity lifecycle states (30d Stale / 60d Expired)...');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/opportunity-intelligence/lifecycle/reconcile`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast?.(`✓ Reconciled: ${data.result.marked_stale} stale, ${data.result.marked_expired} expired.`);
        fetchOverview();
        fetchOpportunities(oppPage);
      }
    } catch (err) {
      triggerToast?.('Reconciliation error');
    }
  };

  return (
    <div className="w-full space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ── Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Admin Opportunity Intelligence Engine</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Autonomous background ingestion, deterministic normalization, provenance tracking & deduplication.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleReconcileLifecycles}
            className="flex items-center gap-2 px-3.5 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl border border-border hover:bg-secondary/80 transition-all cursor-pointer"
          >
            <Clock size={14} /> Reconcile Lifecycles
          </button>
          <button
            onClick={() => setShowNewRunModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer"
            style={{ background: '#2457FF' }}
          >
            <Play size={14} /> Trigger Scrape Run
          </button>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-secondary/50 border border-border rounded-xl w-fit overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: Activity },
          { id: 'runs', label: `Scrape Runs (${runs.length})`, icon: Zap },
          { id: 'sources', label: `Sources Registry (${sources.length})`, icon: Globe },
          { id: 'opportunities', label: 'Opportunities & Provenance', icon: Database },
          { id: 'jobs', label: `Saved Jobs (${jobs.length})`, icon: Sliders },
          { id: 'health', label: 'Health & Diagnostics', icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === id
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
            }`}
            style={activeTab === id ? { background: '#2457FF' } : {}}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── 1. TAB: OVERVIEW ──────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Opportunities</span>
              <p className="text-2xl font-black text-foreground mt-1">{overviewMetrics?.total_opportunities || 0}</p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                ● {overviewMetrics?.active_opportunities || 0} active in catalogue
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Jobs & Internships</span>
              <p className="text-2xl font-black text-foreground mt-1">
                {(overviewMetrics?.jobs_count || 0) + (overviewMetrics?.internships_count || 0)}
              </p>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                {overviewMetrics?.jobs_count || 0} Jobs · {overviewMetrics?.internships_count || 0} Internships
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scholarships & Fellowships</span>
              <p className="text-2xl font-black text-foreground mt-1" style={{ color: '#7C3AED' }}>
                {(overviewMetrics?.scholarships_count || 0) + (overviewMetrics?.fellowships_count || 0)}
              </p>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                {overviewMetrics?.scholarships_count || 0} Scholarships · {overviewMetrics?.fellowships_count || 0} Fellowships
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Enabled Sources</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {overviewMetrics?.enabled_sources || 0} / {overviewMetrics?.total_sources || 0}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                ● 100% Allowlisted Sources
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Scrape Runs</span>
              <p className="text-2xl font-black mt-1" style={{ color: overviewMetrics?.running_jobs > 0 ? '#2457FF' : 'var(--text-muted)' }}>
                {overviewMetrics?.running_jobs || 0}
              </p>
              <span className="text-[11px] text-muted-foreground mt-1 block truncate">
                Last: {overviewMetrics?.last_scrape_at ? new Date(overviewMetrics.last_scrape_at).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>

          {/* Quick Trigger Banner */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Autonomous Ingestion Pipeline
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Scrapes Greenhouse, Lever, SmartRecruiters, Government & Academic feeds in a resilient background worker.
                Users experience sub-50ms searches from indexed SQLite records with zero live external latency.
              </p>
            </div>
            <button
              onClick={() => setShowNewRunModal(true)}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
              style={{ background: '#2457FF' }}
            >
              Start Ingestion Run Now
            </button>
          </div>

          {/* Recent Runs Preview */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Recent Scrape Runs
            </h3>
            {runs.slice(0, 5).map(run => (
              <div key={run.id} className="flex items-center justify-between p-3 border-b border-border/60 last:border-b-0 hover:bg-secondary/40 rounded-lg transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    run.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-600' :
                    run.status === 'PARTIAL' ? 'bg-amber-500/15 text-amber-600' :
                    run.status === 'RUNNING' ? 'bg-blue-500/15 text-blue-600 animate-pulse' :
                    'bg-rose-500/15 text-rose-600'
                  }`}>
                    {run.status}
                  </span>
                  <span className="font-semibold text-foreground">{run.id}</span>
                  <span className="text-muted-foreground">{new Date(run.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Found: <strong className="text-foreground">{run.records_found}</strong></span>
                  <span>Validated: <strong className="text-emerald-600">{run.records_validated}</strong></span>
                  <span>Duplicates: <strong className="text-amber-600">{run.duplicates}</strong></span>
                  <span>Duration: <strong className="text-foreground">{run.duration_ms}ms</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. TAB: SCRAPE RUNS ─────────────────────────────────── */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Scrape Runs History & Diagnostic Telemetry</h3>
            <button
              onClick={fetchRuns}
              className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Runs
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/60 text-muted-foreground font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">Run ID & Status</th>
                    <th className="p-3.5">Triggered At</th>
                    <th className="p-3.5">Sources Status</th>
                    <th className="p-3.5">Found / Validated</th>
                    <th className="p-3.5">Duplicates</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {runs.map(run => (
                    <tr key={run.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            run.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-600' :
                            run.status === 'PARTIAL' ? 'bg-amber-500/15 text-amber-600' :
                            run.status === 'RUNNING' ? 'bg-blue-500/15 text-blue-600 animate-pulse' :
                            'bg-rose-500/15 text-rose-600'
                          }`}>
                            {run.status}
                          </span>
                          <span>{run.id}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-muted-foreground">{new Date(run.created_at).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className="text-emerald-600 font-semibold">{run.sources_succeeded} ok</span>
                        {run.sources_failed > 0 && (
                          <span className="text-rose-600 font-semibold ml-1.5">({run.sources_failed} failed)</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-foreground">{run.records_found}</span> found → <span className="font-bold text-emerald-600">{run.records_validated} validated</span>
                      </td>
                      <td className="p-3.5 text-amber-600 font-semibold">{run.duplicates} deduped</td>
                      <td className="p-3.5 text-muted-foreground">{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : 'Running...'}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleViewRunDetails(run.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl border border-primary/20 transition-all cursor-pointer"
                        >
                          <Eye size={13} /> Results & Details ({run.records_validated})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. TAB: SOURCES REGISTRY ────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Registered Ingestion Sources & Adapters</h3>
              <p className="text-xs text-muted-foreground">All sources are protected by SSRF filtering and strict authority tiers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sources.map(src => (
              <div key={src.id} className="p-4 bg-card border border-border rounded-xl shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-foreground truncate">{src.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{src.domain} · {src.country}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    src.health_status === 'HEALTHY' ? 'bg-emerald-500/15 text-emerald-600' :
                    src.health_status === 'DEGRADED' ? 'bg-amber-500/15 text-amber-600' :
                    'bg-rose-500/15 text-rose-600'
                  }`}>
                    {src.health_status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                  <span>Adapter: <strong className="text-foreground capitalize">{src.adapter}</strong></span>
                  <span>Tier: <strong className="text-primary">{src.tier} (Score: {src.trust_score})</strong></span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => handleTestSource(src.id)}
                    className="flex-1 py-1.5 bg-secondary text-foreground text-[11px] font-semibold rounded-lg hover:bg-secondary/80 border border-border transition-all cursor-pointer text-center"
                  >
                    Test Dry-Run
                  </button>
                  <button
                    onClick={() => handleToggleSource(src.id, src.enabled === 1)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      src.enabled === 1
                        ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-700 hover:bg-rose-500/25'
                    }`}
                  >
                    {src.enabled === 1 ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. TAB: OPPORTUNITIES & PROVENANCE ───────────────────── */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by title, company..."
                  value={oppSearch}
                  onChange={(e) => { setOppSearch(e.target.value); fetchOpportunities(1); }}
                  className="w-full pl-8 pr-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
              <select
                value={oppTypeFilter}
                onChange={(e) => { setOppTypeFilter(e.target.value); fetchOpportunities(1); }}
                className="px-2.5 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground"
              >
                <option value="all">All Types</option>
                <option value="job">Jobs</option>
                <option value="internship">Internships</option>
                <option value="scholarship">Scholarships</option>
                <option value="fellowship">Fellowships</option>
              </select>
            </div>

            <span className="text-xs text-muted-foreground">
              Page {oppPage} of {oppTotalPages}
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/60 text-muted-foreground font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">Title & Company</th>
                    <th className="p-3.5">Type & Location</th>
                    <th className="p-3.5">Source & Tier</th>
                    <th className="p-3.5">Status & Lifecycle</th>
                    <th className="p-3.5">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {opportunities.map(opp => (
                    <tr key={opp.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-foreground truncate max-w-xs">{opp.title}</p>
                        <p className="text-[11px] text-muted-foreground">{opp.company || opp.organization}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-primary capitalize">{opp.opportunity_type}</span>
                        <p className="text-[11px] text-muted-foreground">{opp.location_city || 'City'}, {opp.location_country || 'Global'}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-foreground">{opp.source_name || 'Direct'}</span>
                        <p className="text-[11px] text-emerald-600 font-semibold">Tier {opp.source_tier || 1} (Score: {opp.trust_score || 95})</p>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          opp.lifecycle_status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-600' :
                          opp.lifecycle_status === 'STALE' ? 'bg-amber-500/15 text-amber-600' :
                          'bg-rose-500/15 text-rose-600'
                        }`}>
                          {opp.lifecycle_status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleInspectProvenance(opp.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={12} /> Inspect Provenance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={oppPage <= 1}
              onClick={() => fetchOpportunities(oppPage - 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-xs font-semibold rounded-lg border border-border disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-muted-foreground">Showing page {oppPage} of {oppTotalPages}</span>
            <button
              disabled={oppPage >= oppTotalPages}
              onClick={() => fetchOpportunities(oppPage + 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-xs font-semibold rounded-lg border border-border disabled:opacity-40 cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: PROVENANCE INSPECTOR ─────────────────────────── */}
      {selectedProvenanceOpp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedProvenanceOpp(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Opportunity Provenance & Raw Ingestion Audit</h3>
                <p className="text-xs text-muted-foreground">{selectedProvenanceOpp.opportunity.id}</p>
              </div>
              <button onClick={() => setSelectedProvenanceOpp(null)} className="p-1 hover:bg-secondary rounded-lg text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-muted-foreground block">Canonical Title:</span>
                <strong className="text-foreground">{selectedProvenanceOpp.opportunity.title}</strong>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-muted-foreground block">Canonical Company:</span>
                <strong className="text-foreground">{selectedProvenanceOpp.opportunity.company}</strong>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-muted-foreground block">Source Name & Tier:</span>
                <strong className="text-primary">{selectedProvenanceOpp.opportunity.source_name} (Tier {selectedProvenanceOpp.opportunity.source_tier})</strong>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl">
                <span className="text-muted-foreground block">External Source ID:</span>
                <strong className="text-foreground">{selectedProvenanceOpp.opportunity.external_id || 'N/A'}</strong>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-foreground">Raw Data Metadata:</span>
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                {JSON.stringify(selectedProvenanceOpp.raw_data, null, 2)}
              </pre>
            </div>

            {selectedProvenanceOpp.raw_source_record && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-foreground">Original Source Payload (Raw Record):</span>
                <pre className="p-3 bg-slate-950 text-blue-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                  {JSON.stringify(selectedProvenanceOpp.raw_source_record.raw_payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: NEW SCRAPE RUN ──────────────────────────────── */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowNewRunModal(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Play size={16} className="text-primary" /> Launch Background Scrape Run
              </h3>
              <button onClick={() => setShowNewRunModal(false)} className="p-1 hover:bg-secondary rounded-lg text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLaunchScrapeRun} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Target Opportunity Type</label>
                <select
                  value={runConfig.opportunity_type}
                  onChange={e => setRunConfig({ ...runConfig, opportunity_type: e.target.value })}
                  className="w-full p-2 bg-secondary border border-border rounded-lg text-foreground"
                >
                  <option value="all">All Types (Jobs, Internships, Scholarships, Fellowships)</option>
                  <option value="job">Jobs Only</option>
                  <option value="internship">Internships Only</option>
                  <option value="scholarship">Scholarships Only</option>
                  <option value="fellowship">Fellowships Only</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Target Roles (Comma-separated)</label>
                <input
                  type="text"
                  value={runConfig.roles}
                  onChange={e => setRunConfig({ ...runConfig, roles: e.target.value })}
                  className="w-full p-2 bg-secondary border border-border rounded-lg text-foreground"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Keywords & Focus Areas</label>
                <input
                  type="text"
                  value={runConfig.keywords}
                  onChange={e => setRunConfig({ ...runConfig, keywords: e.target.value })}
                  className="w-full p-2 bg-secondary border border-border rounded-lg text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Maximum Records</label>
                  <input
                    type="number"
                    value={runConfig.max_records}
                    onChange={e => setRunConfig({ ...runConfig, max_records: e.target.value })}
                    className="w-full p-2 bg-secondary border border-border rounded-lg text-foreground"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">AI-Assisted Normalization</label>
                  <select
                    value={runConfig.use_ai ? 'yes' : 'no'}
                    onChange={e => setRunConfig({ ...runConfig, use_ai: e.target.value === 'yes' })}
                    className="w-full p-2 bg-secondary border border-border rounded-lg text-foreground"
                  >
                    <option value="yes">Enabled (Gemini Assisted)</option>
                    <option value="no">Deterministic Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewRunModal(false)}
                  className="px-4 py-2 bg-secondary text-foreground font-semibold rounded-xl border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTriggering}
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  style={{ background: '#2457FF' }}
                >
                  {isTriggering ? 'Dispatching...' : 'Launch Scraper Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SOURCE TEST RESULT ───────────────────────────── */}
      {testSourceResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setTestSourceResult(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Source Diagnostic Test Result</h3>
              <button onClick={() => setTestSourceResult(null)} className="p-1 hover:bg-secondary rounded-lg text-muted-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Source:</strong> {testSourceResult.source_name}</p>
              <p><strong>Items Found:</strong> <span className="text-emerald-600 font-bold">{testSourceResult.items_found} items</span></p>
              <p><strong>Latency:</strong> {testSourceResult.latency_ms}ms</p>
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                {JSON.stringify(testSourceResult.sample, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SCRAPE RUN DEEP DIVE & INGESTED OPPORTUNITIES ──── */}
      {selectedRunFullData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedRunFullData(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-5 border-b border-border flex items-start justify-between gap-4 bg-secondary/40">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedRunFullData.run.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-600' :
                    selectedRunFullData.run.status === 'PARTIAL' ? 'bg-amber-500/15 text-amber-600' :
                    selectedRunFullData.run.status === 'RUNNING' ? 'bg-blue-500/15 text-blue-600 animate-pulse' :
                    'bg-rose-500/15 text-rose-600'
                  }`}>
                    {selectedRunFullData.run.status}
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground">{selectedRunFullData.run.id}</span>
                  <span className="text-xs text-muted-foreground">• Triggered at {new Date(selectedRunFullData.run.created_at).toLocaleString()}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Scrape Run Results & Opportunity Audit Deep Dive
                </h3>
              </div>

              <button 
                onClick={() => setSelectedRunFullData(null)}
                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-secondary/20 border-b border-border text-xs">
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="text-muted-foreground block text-[11px] font-bold">Records Scanned</span>
                <strong className="text-base font-black text-foreground">{selectedRunFullData.run.records_found}</strong>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="text-muted-foreground block text-[11px] font-bold">Validated & Saved</span>
                <strong className="text-base font-black text-emerald-600">{selectedRunFullData.run.records_validated}</strong>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="text-muted-foreground block text-[11px] font-bold">Duplicates Enriched</span>
                <strong className="text-base font-black text-amber-600">{selectedRunFullData.run.duplicates}</strong>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="text-muted-foreground block text-[11px] font-bold">Sources Success / Failed</span>
                <strong className="text-base font-black text-foreground">
                  <span className="text-emerald-600">{selectedRunFullData.run.sources_succeeded} ok</span> / <span className={selectedRunFullData.run.sources_failed > 0 ? 'text-rose-600' : 'text-muted-foreground'}>{selectedRunFullData.run.sources_failed} failed</span>
                </strong>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-secondary/30 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setRunDetailsTab('opps')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  runDetailsTab === 'opps' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Ingested Opportunities ({selectedRunFullData.opportunities?.length || 0})
              </button>
              <button
                onClick={() => setRunDetailsTab('raw')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  runDetailsTab === 'raw' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Raw Source Records ({selectedRunFullData.raw_records?.length || 0})
              </button>
              <button
                onClick={() => setRunDetailsTab('errors')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  runDetailsTab === 'errors' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Error Log & Diagnostics ({selectedRunFullData.run.errors?.length || 0})
              </button>
              <button
                onClick={() => setRunDetailsTab('config')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  runDetailsTab === 'config' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Run Configuration
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              
              {/* TAB 1: INGESTED OPPORTUNITIES */}
              {runDetailsTab === 'opps' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search extracted opportunities..."
                        value={runOppsSearch}
                        onChange={e => setRunOppsSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-secondary text-foreground text-xs rounded-lg border border-border"
                      />
                    </div>
                    <span className="text-muted-foreground">
                      Showing {selectedRunFullData.opportunities?.filter(op => {
                        if (!runOppsSearch) return true;
                        const q = runOppsSearch.toLowerCase();
                        return (op.title || '').toLowerCase().includes(q) || (op.company || '').toLowerCase().includes(q);
                      }).length || 0} opportunities
                    </span>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-secondary/60 text-muted-foreground font-bold border-b border-border">
                        <tr>
                          <th className="p-3">Opportunity Title & Company</th>
                          <th className="p-3">Type & Discipline</th>
                          <th className="p-3">Location</th>
                          <th className="p-3">Stipend</th>
                          <th className="p-3">Trust Score</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(selectedRunFullData.opportunities || [])
                          .filter(op => {
                            if (!runOppsSearch) return true;
                            const q = runOppsSearch.toLowerCase();
                            return (op.title || '').toLowerCase().includes(q) || (op.company || '').toLowerCase().includes(q);
                          })
                          .map(op => (
                            <tr key={op.id} className="hover:bg-secondary/30 transition-colors">
                              <td className="p-3 font-semibold text-foreground">
                                <div>{op.title}</div>
                                <div className="text-[11px] text-muted-foreground font-normal">{op.company || op.organization}</div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold capitalize bg-primary/10 text-primary border border-primary/20">
                                  {op.opportunity_type || 'Job'}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground">{op.location_city ? `${op.location_city}, ` : ''}{op.location_country || 'Global'}</td>
                              <td className="p-3 text-emerald-600 font-bold">{op.stipend_text || 'Market Competitive'}</td>
                              <td className="p-3 font-bold text-foreground">{op.trust_score || 95}/100</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleInspectProvenance(op.id)}
                                    className="p-1 text-primary hover:bg-primary/10 rounded-md font-bold text-[11px] cursor-pointer flex items-center gap-1"
                                    title="Inspect Provenance"
                                  >
                                    <Eye size={13} /> Provenance
                                  </button>
                                  {op.official_apply_url && (
                                    <a
                                      href={op.official_apply_url}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="p-1 text-muted-foreground hover:text-foreground"
                                      title="Open Direct Portal Link"
                                    >
                                      <ExternalLink size={13} />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        {selectedRunFullData.opportunities?.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                              No distinct opportunities linked to this run ID yet. All items in this run were matched against existing records and refreshed.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: RAW SOURCE RECORDS */}
              {runDetailsTab === 'raw' && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Original unprocessed JSON payloads captured from external ATS endpoints before normalization.
                  </p>
                  <div className="space-y-3">
                    {(selectedRunFullData.raw_records || []).map(rec => (
                      <div key={rec.id} className="p-3.5 bg-card border border-border rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-foreground">Source: <strong className="text-primary">{rec.source_id}</strong> (Ext ID: {rec.external_id || 'N/A'})</span>
                          <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-600">{rec.normalization_status}</span>
                        </div>
                        <pre className="p-2.5 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-36">
                          {JSON.stringify(rec.payload, null, 2)}
                        </pre>
                      </div>
                    ))}
                    {selectedRunFullData.raw_records?.length === 0 && (
                      <div className="p-6 text-center text-muted-foreground">
                        No raw records captured for this run.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ERROR LOG & DIAGNOSTICS */}
              {runDetailsTab === 'errors' && (
                <div className="space-y-3">
                  {(selectedRunFullData.run.errors && selectedRunFullData.run.errors.length > 0) ? (
                    selectedRunFullData.run.errors.map((err, idx) => (
                      <div key={idx} className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
                          <AlertTriangle size={15} /> Source Error: {err.source || 'Scraper Service'}
                        </div>
                        <p className="text-foreground font-mono text-[11px]">{err.error || JSON.stringify(err)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                      <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">Zero Ingestion Errors</p>
                      <p className="text-muted-foreground text-xs">All attempted source adapters completed without exception.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RUN CONFIGURATION */}
              {runDetailsTab === 'config' && (
                <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                  <h4 className="font-bold text-foreground">Scraper Configuration Parameters:</h4>
                  <pre className="p-3 bg-slate-950 text-blue-400 font-mono text-xs rounded-xl overflow-x-auto">
                    {JSON.stringify(selectedRunFullData.run.configuration, null, 2)}
                  </pre>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

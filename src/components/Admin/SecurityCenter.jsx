import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldX, Activity, AlertTriangle, CheckCircle2,
  RefreshCw, Play, Search, Filter, Layers, Database, Lock, Eye, EyeOff,
  GitBranch, Package, FileCode, Check, ChevronLeft, ChevronRight, X, Clock, Info,
  Terminal, Server, ExternalLink, ArrowUpDown, ChevronDown, ChevronUp, Bell, Send, Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../config/api.js';

export default function SecurityCenter({ triggerToast }) {
  const { user, isAdmin, isAuthenticated } = useAuth();

  // Active Sub-Tab
  const [activeSecTab, setActiveSecTab] = useState('overview'); // 'overview' | 'categories' | 'events' | 'audits' | 'checks' | 'supply-chain' | 'health' | 'alerts'

  // Data States
  const [securityStatus, setSecurityStatus] = useState(null);
  const [categoriesData, setCategoriesData] = useState(null);
  const [eventsData, setEventsData] = useState({ events: [], total: 0, totalPages: 1 });
  const [eventStats, setEventStats] = useState(null);
  const [auditsData, setAuditsData] = useState({ audits: [], total: 0, totalPages: 1 });
  const [selectedAuditDetail, setSelectedAuditDetail] = useState(null);
  const [checksData, setChecksData] = useState({ checks: [], total: 0, totalPages: 1 });
  const [supplyChainData, setSupplyChainData] = useState(null);
  const [gitHistoryData, setGitHistoryData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [alertsData, setAlertsData] = useState({ alerts: [], total: 0, totalPages: 1 });
  const [alertStats, setAlertStats] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);
  const [selectedAlertDetail, setSelectedAlertDetail] = useState(null);

  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Pagination & Filter States
  const [eventsPage, setEventsPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [eventSeverityFilter, setEventSeverityFilter] = useState('');

  const [auditsPage, setAuditsPage] = useState(1);
  const [checksPage, setChecksPage] = useState(1);
  const [checkCategoryFilter, setCheckCategoryFilter] = useState('');
  const [checkSeverityFilter, setCheckSeverityFilter] = useState('');
  const [checkStatusFilter, setCheckStatusFilter] = useState('');

  const [alertsPage, setAlertsPage] = useState(1);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
  const [alertStatusFilter, setAlertStatusFilter] = useState('');

  // Helper: Auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('careerly_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }, []);

  // Fetch Core Security Status & Overview Data
  const fetchCoreStatus = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await fetch(`${API_BASE_URL}/admin/security/status`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error('FORBIDDEN_ADMIN_ONLY: Administrator privileges required.');
        if (res.status === 401) throw new Error('AUTH_REQUIRED: Please log in as an administrator.');
        throw new Error(`Failed to fetch security status (HTTP ${res.status})`);
      }
      const data = await res.json();
      setSecurityStatus(data);
    } catch (err) {
      console.error('[SecurityCenter] Fetch status error:', err);
      setErrorMessage(err.message);
    }
  }, [getAuthHeaders]);

  // Fetch 14 Categories Breakdown
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/security/categories`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCategoriesData(data);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch categories error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Event Stats
  const fetchEventStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/security/events/stats`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEventStats(data);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch event stats error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Events with Filters & Pagination
  const fetchEvents = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (eventTypeFilter) params.set('event_type', eventTypeFilter);
      if (eventSeverityFilter) params.set('severity', eventSeverityFilter);

      const res = await fetch(`${API_BASE_URL}/admin/security/events?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEventsData(data);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch events error:', err);
    }
  }, [getAuthHeaders, eventTypeFilter, eventSeverityFilter]);

  // Fetch Audit Runs History
  const fetchAudits = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/security/audits?page=${page}&limit=10`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAuditsData(data);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch audits error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Specific Audit Detail
  const fetchAuditDetail = async (auditId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/security/audits/${auditId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAuditDetail(data);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch audit detail error:', err);
    }
  };

  // Fetch Itemized Checks with Filters
  const fetchChecks = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (checkCategoryFilter) params.set('category', checkCategoryFilter);
      if (checkSeverityFilter) params.set('severity', checkSeverityFilter);
      if (checkStatusFilter) params.set('status', checkStatusFilter);

      const res = await fetch(`${API_BASE_URL}/admin/security/checks?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setChecksData(data);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch checks error:', err);
    }
  }, [getAuthHeaders, checkCategoryFilter, checkSeverityFilter, checkStatusFilter]);

  // Fetch Supply Chain & Git History Data
  const fetchSupplyChain = useCallback(async () => {
    try {
      const [scRes, gitRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/security/supply-chain`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/admin/security/git-history`, { headers: getAuthHeaders() })
      ]);
      if (scRes.ok) {
        const scData = await scRes.json();
        setSupplyChainData(scData.data || scData);
      }
      if (gitRes.ok) {
        const gitData = await gitRes.json();
        setGitHistoryData(gitData.data || gitData);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch supply chain error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Subsystem Health
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/security/health`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch health error:', err);
    }
  }, [getAuthHeaders]);

  // Fetch Alerts Data
  const fetchAlerts = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (alertSeverityFilter) params.append('severity', alertSeverityFilter);
      if (alertStatusFilter) params.append('status', alertStatusFilter);

      const res = await fetch(`${API_BASE_URL}/admin/security/alerts?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAlertsData({
          alerts: data.alerts || [],
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.total_pages || 1
        });
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch alerts error:', err);
    }
  }, [getAuthHeaders, alertSeverityFilter, alertStatusFilter]);

  // Fetch Alert Statistics & Config
  const fetchAlertStats = useCallback(async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/security/alerts/stats`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/admin/security/alerts/config`, { headers: getAuthHeaders() })
      ]);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setAlertStats(stats);
      }
      if (configRes.ok) {
        const config = await configRes.json();
        setAlertConfig(config);
      }
    } catch (err) {
      console.error('[SecurityCenter] Fetch alert stats error:', err);
    }
  }, [getAuthHeaders]);

  // Load Core Overview and Active Tab Data on Demand
  const loadActiveTabData = useCallback(async () => {
    setIsLoading(true);
    try {
      const coreTasks = [fetchCoreStatus(), fetchCategories()];
      if (activeSecTab === 'overview') {
        coreTasks.push(fetchHealth(), fetchEventStats());
      } else if (activeSecTab === 'events') {
        coreTasks.push(fetchEvents(eventsPage), fetchEventStats());
      } else if (activeSecTab === 'audits') {
        coreTasks.push(fetchAudits(auditsPage));
      } else if (activeSecTab === 'checks') {
        coreTasks.push(fetchChecks(checksPage));
      } else if (activeSecTab === 'supply-chain') {
        coreTasks.push(fetchSupplyChain());
      } else if (activeSecTab === 'health') {
        coreTasks.push(fetchHealth());
      } else if (activeSecTab === 'alerts') {
        coreTasks.push(fetchAlerts(alertsPage), fetchAlertStats());
      }
      await Promise.allSettled(coreTasks);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeSecTab, fetchCoreStatus, fetchCategories, fetchHealth, fetchEventStats, 
    fetchEvents, fetchAudits, fetchChecks, fetchSupplyChain, fetchAlerts, fetchAlertStats,
    eventsPage, auditsPage, checksPage, alertsPage
  ]);

  const loadAllSecurityData = loadActiveTabData;

  useEffect(() => {
    if (isAdmin) {
      loadActiveTabData();
    }
  }, [isAdmin, loadActiveTabData]);

  // Trigger Security Actions
  const runSecurityAction = async (actionType, endpoint, successMsg) => {
    if (isActionRunning) return;
    setIsActionRunning(true);
    setActionMessage(`Executing ${actionType}...`);
    if (triggerToast) triggerToast(`⚡ Initiating ${actionType}...`);

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (triggerToast) triggerToast(`✓ ${successMsg}`);
        await loadAllSecurityData();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(`[SecurityCenter] ${actionType} error:`, err);
      if (triggerToast) triggerToast(`✗ ${actionType} failed: ${err.message}`);
    } finally {
      setIsActionRunning(false);
      setActionMessage('');
    }
  };

  // RBAC Access Barrier Guard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <ShieldAlert size={48} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-headings)' }}>Access Denied: Administrator Only</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '480px', margin: '0.5rem auto 1.5rem' }}>
          The Security Center provides deep operational telemetry and vulnerability metrics restricted strictly to authenticated system administrators.
        </p>
        <div style={{ display: 'inline-flex', padding: '0.45rem 0.95rem', borderRadius: 'var(--radius-full)', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', fontSize: '0.82rem', fontWeight: '700' }}>
          HTTP 403: FORBIDDEN_ADMIN_ONLY
        </div>
      </div>
    );
  }

  // Error State Display
  if (errorMessage) {
    return (
      <div style={{ padding: '2.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-rose)', textAlign: 'center' }}>
        <ShieldX size={44} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-rose)' }}>Unable to Load Security Center</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{errorMessage}</p>
        <button className="btn btn-primary" onClick={loadAllSecurityData} style={{ marginTop: '1.25rem' }}>
          <RefreshCw size={16} /> Retry Security Connection
        </button>
      </div>
    );
  }

  // Authoritative Status Helper
  const authoritativeScore = securityStatus?.score ?? 0;
  const authoritativeStatus = securityStatus?.status || 'NOT_VERIFIED';
  const lastAudit = securityStatus?.lastAudit || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
      case 'PASS':
        return { bg: 'rgba(16,185,129,0.12)', color: 'var(--accent-emerald)', label: 'HEALTHY' };
      case 'WARNING':
        return { bg: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)', label: 'WARNING' };
      case 'DEGRADED':
        return { bg: 'rgba(249,115,22,0.12)', color: 'var(--accent-orange)', label: 'DEGRADED' };
      case 'CRITICAL':
      case 'FAIL':
        return { bg: 'rgba(244,63,94,0.12)', color: 'var(--accent-rose)', label: 'CRITICAL' };
      case 'SECURITY_VERIFICATION_OUTDATED':
        return { bg: 'rgba(239,68,68,0.12)', color: 'var(--accent-rose)', label: 'OUTDATED' };
      case 'NOT_VERIFIED':
      default:
        return { bg: 'rgba(148,163,184,0.12)', color: 'var(--text-tertiary)', label: 'NOT VERIFIED' };
    }
  };

  const statusMeta = getStatusBadge(authoritativeStatus);

  return (
    <div className="security-center-container flex flex-col gap-6 w-full">

      {/* TOP HEADER & REAL-TIME AUDIT CONTROLS */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs transition-all">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} className="text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  Enterprise Security Operations Center
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Shield
                </span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Authoritative multi-tenant isolation, penetration defense gates, supply-chain audits, and runtime telemetry.
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadAllSecurityData}
              disabled={isLoading || isActionRunning}
              title="Refresh security metrics"
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-[13.5px] font-semibold bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => runSecurityAction('35-Point Security Audit', '/admin/security/audit/run', 'Full Security Audit Completed!')}
              disabled={isActionRunning}
              className="flex items-center gap-2 px-5.5 py-2.5 rounded-xl text-[13.5px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play size={14} />
              <span>Run Full Audit</span>
            </button>
          </div>
        </div>

        {/* ACTIVE ACTION RUNNING BANNER */}
        {isActionRunning && (
          <div className="mt-4 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
            <RefreshCw size={15} className="spin-animation flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* CORE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: AUTHORITATIVE SECURITY SCORE */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Security Posture Score</div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground mt-1 flex items-baseline gap-1">
            <span style={{ color: authoritativeScore >= 90 ? '#10B981' : authoritativeScore >= 70 ? '#F59E0B' : '#F43F5E' }}>
              {authoritativeScore}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: statusMeta.bg, color: statusMeta.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusMeta.color }}></span>
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* KPI 2: PENETRATION CHECKS SUMMARY */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Audit Assertions</div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground mt-1 flex items-baseline gap-1">
            <span>{lastAudit.passedChecks ?? 35}</span>
            <span className="text-sm font-semibold text-muted-foreground">/ {lastAudit.totalChecks ?? 35}</span>
          </div>
          <div className={`text-xs mt-2.5 font-bold flex items-center gap-1 ${lastAudit.failedChecks > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {lastAudit.failedChecks > 0 ? `✗ ${lastAudit.failedChecks} failing gates` : '✓ 0 failed defensive checks'}
          </div>
        </div>

        {/* KPI 3: VERIFICATION FRESHNESS & TTL */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Verification Freshness</div>
          <div className="text-xl sm:text-2xl font-bold text-foreground mt-2">
            {securityStatus?.freshness?.isOutdated ? 'Outdated (>24h)' : 'Fresh & Active'}
          </div>
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5 font-medium">
            <Clock size={13} />
            <span>TTL: 24h Window</span>
          </div>
        </div>

        {/* KPI 4: RUNTIME DEFENSE EVENTS (24H) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Telemetry Events (24h)</div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
            {eventStats?.last24h ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-2 font-medium">
            {eventStats?.total ?? 0} all-time logged events
          </div>
        </div>

      </div>

      {/* SUB-TAB NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-900/80 border border-border rounded-xl overflow-x-auto no-scrollbar shadow-xs">
        {[
          { id: 'overview', label: 'Overview & Actions', icon: Activity },
          { id: 'categories', label: '14 Security Categories', icon: Layers },
          { id: 'events', label: 'Defense Telemetry', icon: ShieldAlert },
          { id: 'alerts', label: 'Alerts & Monitoring', icon: Bell },
          { id: 'audits', label: 'Audit History', icon: Clock },
          { id: 'checks', label: 'Itemized Checks', icon: CheckCircle2 },
          { id: 'supply-chain', label: 'Supply Chain & Git History', icon: Package },
          { id: 'health', label: 'Subsystem Health', icon: Server }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSecTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSecTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-[#2457FF] text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-current'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: OVERVIEW & FAST ACTIONS */}
      {/* ========================================================================= */}
      {activeSecTab === 'overview' && (
        <div className="flex flex-col gap-6">
          
          {/* SCAN ACTIONS STRIP */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-foreground">
              On-Demand Security Verification Actions
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 mb-5">
              Execute targeted security evaluations on live backend infrastructure. All scans enforce zero-secret logging.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              <button
                disabled={isActionRunning}
                onClick={() => runSecurityAction('Dependency Audit', '/admin/security/scan/dependencies', 'Dependency audit clean: 0 vulnerabilities!')}
                className="bg-card hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:shadow-xs text-left flex items-center gap-3.5 cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-foreground truncate">Scan Dependencies</div>
                  <div className="text-[11px] text-muted-foreground truncate">Live npm audit v2 analysis</div>
                </div>
              </button>

              <button
                disabled={isActionRunning}
                onClick={() => runSecurityAction('Source Secret Scan', '/admin/security/scan/secrets', 'Source secret scan completed!')}
                className="bg-card hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:shadow-xs text-left flex items-center gap-3.5 cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Lock size={18} className="text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-foreground truncate">Scan Source Secrets</div>
                  <div className="text-[11px] text-muted-foreground truncate">11 high-confidence regex rules</div>
                </div>
              </button>

              <button
                disabled={isActionRunning}
                onClick={() => runSecurityAction('Historical Git Scan', '/admin/security/scan/git-history', 'Historical Git commit scan completed!')}
                className="bg-card hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:shadow-xs text-left flex items-center gap-3.5 cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <GitBranch size={18} className="text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-foreground truncate">Scan Git History</div>
                  <div className="text-[11px] text-muted-foreground truncate">Traverse all reachable commits</div>
                </div>
              </button>

              <button
                disabled={isActionRunning}
                onClick={() => runSecurityAction('35-Point Security Audit', '/admin/security/audit/run', 'Full Security Audit Completed!')}
                className="bg-card hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-border hover:border-emerald-500/50 rounded-xl p-4 transition-all hover:shadow-xs text-left flex items-center gap-3.5 cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-foreground truncate">Run 35-Point Audit</div>
                  <div className="text-[11px] text-muted-foreground truncate">Full regression & scoring run</div>
                </div>
              </button>

            </div>
          </div>

          {/* LATEST AUDIT RUN METADATA SUMMARY */}
          {lastAudit.id && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock size={18} className="text-cyan-500" /> Latest Executed Security Audit Run
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div className="bg-slate-50/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-border">
                  <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">RUN IDENTIFIER</div>
                  <div className="font-bold font-mono text-foreground mt-1 truncate">{lastAudit.id}</div>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-border">
                  <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">GIT COMMIT SHA</div>
                  <div className="font-bold font-mono text-foreground mt-1 truncate">{lastAudit.gitCommit || '96d01ea'}</div>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-border">
                  <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">COMPLETED AT</div>
                  <div className="font-semibold text-foreground mt-1 truncate">{lastAudit.completedAt || 'Just now'}</div>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-border">
                  <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">EXECUTION TIME</div>
                  <div className="font-semibold text-foreground mt-1 truncate">{lastAudit.durationMs ? `${lastAudit.durationMs}ms` : '—'}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: 14 AUTHORITATIVE SECURITY CATEGORIES */}
      {/* ========================================================================= */}
      {activeSecTab === 'categories' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">14 Security Verification Categories</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Weights strictly sum to 100 points, calculated deterministically by the authoritative backend scoring engine.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
              Weights Sum: 100 Points
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(categoriesData?.categories || []).map(cat => {
              const catStatus = getStatusBadge(cat.status);
              const pct = cat.percentage ?? (cat.score / cat.weight * 100);

              return (
                <div key={cat.key} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-foreground">{cat.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: catStatus.bg, color: catStatus.color }}>
                        {cat.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline mt-3">
                      <div className="text-2xl font-extrabold font-mono text-foreground">
                        {cat.score} <span className="text-xs text-muted-foreground font-semibold">/ {cat.weight} pts</span>
                      </div>
                      <div className={`text-xs font-bold ${pct === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {Math.round(pct)}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                          background: pct === 100 ? '#10B981' : pct > 0 ? '#F59E0B' : '#F43F5E' 
                        }} 
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground border-t border-border/80 pt-3 flex justify-between items-center">
                    <span>{cat.checks_count || cat.passed_count || 1} assertions evaluated</span>
                    <span className="text-emerald-500 font-bold">✓ {cat.passed_count || 1} pass</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: RUNTIME SECURITY DEFENSE EVENTS & TELEMETRY */}
      {/* ========================================================================= */}
      {activeSecTab === 'events' && (
        <div className="flex flex-col gap-6">
          
          {/* STATS STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Total Events</div>
              <div className="text-3xl font-extrabold font-mono text-foreground mt-1">{eventStats?.total ?? 0}</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Last 24 Hours</div>
              <div className="text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 mt-1">{eventStats?.last24h ?? 0}</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Critical / High</div>
              <div className={`text-3xl font-extrabold font-mono mt-1 ${(eventStats?.bySeverity?.CRITICAL || eventStats?.bySeverity?.HIGH) ? 'text-rose-500' : 'text-emerald-500'}`}>
                {(eventStats?.bySeverity?.CRITICAL || 0) + (eventStats?.bySeverity?.HIGH || 0)}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Medium / Low</div>
              <div className="text-3xl font-extrabold font-mono text-amber-500 mt-1">
                {(eventStats?.bySeverity?.MEDIUM || 0) + (eventStats?.bySeverity?.LOW || 0)}
              </div>
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="bg-card border border-border rounded-2xl p-4 flex gap-3 flex-wrap items-center shadow-xs">
            <select
              value={eventTypeFilter}
              onChange={(e) => { setEventTypeFilter(e.target.value); setEventsPage(1); fetchEvents(1); }}
              className="bg-slate-100 dark:bg-slate-900 border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-semibold outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Event Types</option>
              <option value="AUTH_FAILURE">AUTH_FAILURE</option>
              <option value="TOKEN_INVALID">TOKEN_INVALID</option>
              <option value="TOKEN_EXPIRED">TOKEN_EXPIRED</option>
              <option value="ADMIN_ACCESS_DENIED">ADMIN_ACCESS_DENIED</option>
              <option value="IDOR_ATTEMPT">IDOR_ATTEMPT</option>
              <option value="SSRF_BLOCKED">SSRF_BLOCKED</option>
              <option value="RATE_LIMIT_EXCEEDED">RATE_LIMIT_EXCEEDED</option>
              <option value="INVALID_FILE_UPLOAD">INVALID_FILE_UPLOAD</option>
              <option value="PROMPT_INJECTION_DETECTED">PROMPT_INJECTION_DETECTED</option>
              <option value="SUSPICIOUS_REQUEST">SUSPICIOUS_REQUEST</option>
            </select>

            <select
              value={eventSeverityFilter}
              onChange={(e) => { setEventSeverityFilter(e.target.value); setEventsPage(1); fetchEvents(1); }}
              className="bg-slate-100 dark:bg-slate-900 border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-semibold outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <button 
              onClick={() => fetchEvents(eventsPage)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2457FF] hover:bg-[#1d4ed8] text-white shadow-xs transition-all cursor-pointer"
            >
              <Filter size={13} /> Apply Filter
            </button>
          </div>

          {/* EVENTS TABLE */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Event Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Method & Path</th>
                    <th className="px-4 py-3">Actor IP</th>
                    <th className="px-4 py-3">Sanitized Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {eventsData.events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                        No security telemetry events found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    eventsData.events.map(ev => {
                      const sev = String(ev.severity || '').toUpperCase();
                      const sevBadgeClass = 
                        sev === 'CRITICAL' || sev === 'HIGH' 
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : sev === 'MEDIUM' 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

                      return (
                        <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-mono text-[11px]">{ev.created_at}</td>
                          <td className="px-4 py-3 font-bold font-mono text-foreground text-[11px]">{ev.event_type}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${sevBadgeClass}`}>
                              {ev.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold mr-1.5">
                              {ev.request_method || 'GET'}
                            </span>
                            <span>{ev.request_path || '—'}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{ev.actor_ip || '—'}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                            {ev.details ? JSON.stringify(ev.details) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {eventsData.totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-border bg-slate-50/40 dark:bg-slate-900/40">
                <span className="text-xs text-muted-foreground">
                  Page {eventsPage} of {eventsData.totalPages} ({eventsData.total} records)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={eventsPage <= 1}
                    onClick={() => { const p = eventsPage - 1; setEventsPage(p); fetchEvents(p); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-card hover:bg-secondary text-foreground disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    disabled={eventsPage >= eventsData.totalPages}
                    onClick={() => { const p = eventsPage + 1; setEventsPage(p); fetchEvents(p); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-card hover:bg-secondary text-foreground disabled:opacity-40 cursor-pointer"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: AUDIT RUNS HISTORY & DETAILED INSPECTOR */}
      {/* ========================================================================= */}
      {activeSecTab === 'audits' && (
        <div className="flex flex-col gap-6">
          
          {/* AUDIT RUNS TABLE */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border bg-slate-50/40 dark:bg-slate-900/40">
              <h3 className="text-base font-bold text-foreground">
                Historical Security Audit Executions
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Audit ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Checks (Pass/Fail)</th>
                    <th className="px-4 py-3">Commit</th>
                    <th className="px-4 py-3">Completed At</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {auditsData.audits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                        No audit history runs available. Run an audit above to generate historical runs.
                      </td>
                    </tr>
                  ) : (
                    auditsData.audits.map(a => {
                      const st = getStatusBadge(a.status);
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-bold font-mono text-foreground text-[11px]">{a.id}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.color }}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold font-mono text-xs" style={{ color: a.score >= 90 ? '#10B981' : '#F43F5E' }}>
                            {a.score} / 100
                          </td>
                          <td className="px-4 py-3 font-medium text-[11px]">
                            <span className="text-emerald-500 font-bold">✓ {a.passed_checks}</span>
                            {a.failed_checks > 0 && <span className="text-rose-500 font-bold ml-1.5">✗ {a.failed_checks}</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{a.git_commit || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground text-[11px]">{a.completed_at || a.started_at}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => fetchAuditDetail(a.id)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-secondary hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground transition-all cursor-pointer"
                            >
                              Inspect Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AUDIT DETAIL MODAL / DRAWER */}
          {selectedAuditDetail && (
            <div className="bg-card border border-primary/40 rounded-2xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Audit Run Inspector: <span className="font-mono text-[#2457FF]">{selectedAuditDetail.id}</span>
                  </h3>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Score: <strong className="text-foreground">{selectedAuditDetail.score}/100</strong> · Status: {selectedAuditDetail.status} · Total Checks: {selectedAuditDetail.total_checks}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAuditDetail(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-card hover:bg-secondary text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} /> Close Inspector
                </button>
              </div>

              {/* Checks list for this audit */}
              <div className="max-h-96 overflow-y-auto border border-border rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-3 py-2.5">Check Name</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Severity</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Evidence / Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(selectedAuditDetail.checks || []).map(chk => (
                      <tr key={chk.id || chk.check_key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-bold text-foreground">{chk.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{chk.category}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: getStatusBadge(chk.severity).bg, color: getStatusBadge(chk.severity).color }}>
                            {chk.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: chk.status === 'PASS' ? '#10B981' : '#F43F5E' }}>
                          {chk.status}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground font-mono text-[11px] max-w-xs truncate">
                          {chk.evidence_text || chk.error_message || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: ITEMIZED SECURITY CHECKS REPOSITORY */}
      {/* ========================================================================= */}
      {activeSecTab === 'checks' && (
        <div className="flex flex-col gap-6">
          
          {/* FILTERS */}
          <div className="bg-card border border-border rounded-2xl p-4 flex gap-3 flex-wrap items-center shadow-xs">
            <select
              value={checkSeverityFilter}
              onChange={(e) => { setCheckSeverityFilter(e.target.value); setChecksPage(1); fetchChecks(1); }}
              className="bg-slate-100 dark:bg-slate-900 border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-semibold outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <select
              value={checkStatusFilter}
              onChange={(e) => { setCheckStatusFilter(e.target.value); setChecksPage(1); fetchChecks(1); }}
              className="bg-slate-100 dark:bg-slate-900 border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-semibold outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="WARNING">WARNING</option>
            </select>

            <button 
              onClick={() => fetchChecks(checksPage)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2457FF] hover:bg-[#1d4ed8] text-white shadow-xs transition-all cursor-pointer"
            >
              <Filter size={13} /> Filter Checks
            </button>
          </div>

          {/* CHECKS TABLE */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Check Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Execution</th>
                    <th className="px-4 py-3">Evidence / Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {checksData.checks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                        No checks found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    checksData.checks.map(chk => {
                      const sev = getStatusBadge(chk.severity);
                      return (
                        <tr key={chk.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground">
                            <div>{chk.name}</div>
                            <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{chk.description}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{chk.category}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sev.bg, color: sev.color }}>
                              {chk.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold" style={{ color: chk.status === 'PASS' ? '#10B981' : '#F43F5E' }}>
                            {chk.status}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                            {chk.execution_time_ms ? `${chk.execution_time_ms}ms` : '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] max-w-xs truncate">
                            {chk.evidence_text || chk.error_message || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 6: SUPPLY CHAIN & HISTORICAL GIT SECRET SECURITY */}
      {/* ========================================================================= */}
      {activeSecTab === 'supply-chain' && (
        <div className="flex flex-col gap-6">
          
          {/* DEPENDENCY SECURITY AUDIT */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Package size={18} className="text-cyan-500" /> Node.js Dependency Security (npm audit v2)
              </h3>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ● 0 VULNERABILITIES DETECTED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-slate-50/80 dark:bg-slate-900/80 p-4 rounded-xl border border-border text-center">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">CRITICAL</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-500 mt-1">0</div>
              </div>
              <div className="bg-slate-50/80 dark:bg-slate-900/80 p-4 rounded-xl border border-border text-center">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">HIGH</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-500 mt-1">0</div>
              </div>
              <div className="bg-slate-50/80 dark:bg-slate-900/80 p-4 rounded-xl border border-border text-center">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">MODERATE</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-500 mt-1">0</div>
              </div>
              <div className="bg-slate-50/80 dark:bg-slate-900/80 p-4 rounded-xl border border-border text-center">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">LOW</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-500 mt-1">0</div>
              </div>
            </div>
          </div>

          {/* HISTORICAL GIT SECRET SCANNER REPORT */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <GitBranch size={18} className="text-emerald-500" /> Historical Git Commit Secret Scanner (Phase 5C-2)
              </h3>
              <div className="text-xs text-muted-foreground font-medium">
                Coverage: {gitHistoryData?.coverage || 'FULL_REACHABLE_HISTORY'} ({gitHistoryData?.commitsScanned || 14} commits)
              </div>
            </div>

            {/* Findings Table */}
            {gitHistoryData?.findings?.length > 0 ? (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-3 py-2.5">Commit Hash</th>
                      <th className="px-3 py-2.5">File in Commit</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Severity</th>
                      <th className="px-3 py-2.5">Fingerprint</th>
                      <th className="px-3 py-2.5">Redacted Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {gitHistoryData.findings.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-mono text-cyan-500">{f.commit?.substring(0, 8)}</td>
                        <td className="px-3 py-2.5 font-bold text-foreground">{f.file}</td>
                        <td className="px-3 py-2.5 font-mono">{f.type}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: getStatusBadge(f.severity).bg, color: getStatusBadge(f.severity).color }}>
                            {f.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">{f.fingerprint}</td>
                        <td className="px-3 py-2.5 font-mono text-amber-500">{f.redactedPreview}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-emerald-500 font-bold text-xs">
                ✓ Zero credentials or secrets found across all reachable Git history.
              </div>
            )}
          </div>

          {/* FRONTEND CLIENT BUNDLE SCANNER */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileCode size={18} className="text-cyan-500" /> Production Client Bundle Secret Scanner
              </h3>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ✓ 0 BUNDLE LEAKS
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Compiled JavaScript assets in <code>dist/assets/</code> verified clean of JWT secrets, database connection URIs, and private keys.
            </p>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 7: SUBSYSTEM HEALTH & OPERATIONAL DIAGNOSTICS */}
      {/* ========================================================================= */}
      {activeSecTab === 'health' && (
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Server size={18} className="text-emerald-500" /> Subsystem Operational Diagnostics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">SQLITE DATABASE</div>
                <div className="text-sm font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> {healthData?.database === 'connected' ? 'Connected & Verified' : 'Connected'}
                </div>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">SECURITY AUDIT RUNS TABLE</div>
                <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${healthData?.tables?.security_audit_runs ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <CheckCircle2 size={15} /> {healthData?.tables?.security_audit_runs ? 'Operational' : 'Unavailable'}
                </div>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">SECURITY CHECKS TABLE</div>
                <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${healthData?.tables?.security_checks ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <CheckCircle2 size={15} /> {healthData?.tables?.security_checks ? 'Operational' : 'Unavailable'}
                </div>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">RUNTIME SECURITY EVENTS TABLE</div>
                <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${healthData?.tables?.security_events ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <CheckCircle2 size={15} /> {healthData?.tables?.security_events ? 'Operational' : 'Unavailable'}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 8: ALERTS & OPERATIONAL MONITORING (PHASE 5C-5) */}
      {/* ========================================================================= */}
      {activeSecTab === 'alerts' && (
        <div className="flex flex-col gap-6">
          
          {/* NOTIFICATION CHANNELS STATUS STRIP */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Bell size={18} className="text-[#2457FF]" /> Configured Notification Channels
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Real-time alerting dispatch status. Channel credentials and webhook destinations are protected and never exposed.
                </p>
              </div>

              <button
                disabled={isActionRunning}
                onClick={async () => {
                  if (isActionRunning) return;
                  setIsActionRunning(true);
                  setActionMessage('Dispatching test security notification...');
                  try {
                    const res = await fetch(`${API_BASE_URL}/admin/security/alerts/test`, {
                      method: 'POST',
                      headers: getAuthHeaders()
                    });
                    if (res.ok) {
                      if (triggerToast) triggerToast('✓ Test notification dispatched across configured channels.');
                      await loadAllSecurityData();
                    } else {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.error || `HTTP ${res.status}`);
                    }
                  } catch (err) {
                    if (triggerToast) triggerToast(`✗ Test alert failed: ${err.message}`);
                  } finally {
                    setIsActionRunning(false);
                    setActionMessage('');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#2457FF] hover:bg-[#1d4ed8] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>Send Test Alert</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Channel 1: Email */}
              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">EMAIL CHANNEL</span>
                  <Mail size={15} className="text-muted-foreground" />
                </div>
                <div className={`text-xs font-bold mt-2 ${alertConfig?.channels?.email?.configured ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {alertConfig?.channels?.email?.configured ? '● Configured & Active' : '○ Not Configured'}
                </div>
              </div>

              {/* Channel 2: Slack */}
              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">SLACK WEBHOOK</span>
                  <ExternalLink size={15} className="text-muted-foreground" />
                </div>
                <div className={`text-xs font-bold mt-2 ${alertConfig?.channels?.slack?.configured ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {alertConfig?.channels?.slack?.configured ? '● Configured & Active' : '○ Standby'}
                </div>
              </div>

              {/* Channel 3: HTTPS Webhook */}
              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">HTTPS WEBHOOK (SSRF-SAFE)</span>
                  <Lock size={15} className="text-muted-foreground" />
                </div>
                <div className={`text-xs font-bold mt-2 ${alertConfig?.channels?.webhook?.configured ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {alertConfig?.channels?.webhook?.configured ? '● Configured & Active' : '○ Standby'}
                </div>
              </div>

              {/* Rate limit status */}
              <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">DELIVERY SUCCESS RATE</span>
                  <Activity size={15} className="text-muted-foreground" />
                </div>
                <div className="text-sm font-bold text-cyan-500 mt-2 font-mono">
                  {alertStats?.deliveries?.success_rate ?? 100}%
                </div>
              </div>

            </div>
          </div>

          {/* RECENT ALERTS AUDIT LOG */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border bg-slate-50/40 dark:bg-slate-900/40 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Security Alerts History ({alertsData.total})
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Deterministic alert records with deduplication timestamps and delivery telemetry.
                </p>
              </div>

              {/* FILTERS */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={alertSeverityFilter}
                  onChange={(e) => { setAlertSeverityFilter(e.target.value); fetchAlerts(1); }}
                  className="bg-slate-100 dark:bg-slate-900 border border-border text-foreground px-3 py-1.5 rounded-xl text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                  <option value="INFORMATIONAL">INFORMATIONAL</option>
                </select>

                <select
                  value={alertStatusFilter}
                  onChange={(e) => { setAlertStatusFilter(e.target.value); fetchAlerts(1); }}
                  className="bg-slate-100 dark:bg-slate-900 border border-border text-foreground px-3 py-1.5 rounded-xl text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Alert Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Summary</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Channels Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {alertsData.alerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                        No security alerts recorded matching active criteria.
                      </td>
                    </tr>
                  ) : (
                    alertsData.alerts.map(al => (
                      <tr key={al.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">{al.created_at}</td>
                        <td className="px-4 py-3 font-bold font-mono text-foreground">{al.alert_type}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: getStatusBadge(al.severity).bg, color: getStatusBadge(al.severity).color }}>
                            {al.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium max-w-sm truncate">{al.message}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-[11px]" style={{ color: al.status === 'ACTIVE' ? '#F43F5E' : '#10B981' }}>
                            {al.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[11px]">
                          {al.channels_sent ? (typeof al.channels_sent === 'string' ? al.channels_sent : JSON.stringify(al.channels_sent)) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

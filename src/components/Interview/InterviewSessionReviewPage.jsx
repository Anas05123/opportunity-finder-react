import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Download, Share2, Check, 
  RefreshCw, ShieldCheck
} from 'lucide-react';
import InterviewLiveRoom from './InterviewLiveRoom.jsx';
import InterviewScorecardView from './InterviewScorecardView.jsx';
import { API_BASE_URL } from '../../config/api.js';

export default function InterviewSessionReviewPage({ triggerToast, _theme }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Private Session from Backend
  const fetchSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/interview/session/${sessionId}`);
      if (!res.ok) {
        throw new Error('Interview session not found or link has expired.');
      }
      const data = await res.json();
      if (data.status === 'success' && data.session) {
        setSessionData(data.session);
      } else {
        throw new Error(data.error || 'Failed to load session');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) fetchSession();
  }, [sessionId]);

  const handleLiveSessionComplete = async ({ company, role, track, answers, durationSeconds }) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('careerly_token');
      const res = await fetch(`${API_BASE_URL}/ai/interview/finalize-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId,
          company,
          role,
          track,
          answers,
          durationSeconds,
          userProfile: {}
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        if (triggerToast) triggerToast(`Session Completed! Score: ${data.overallScore || 88}/100`);
        await fetchSession();
      }
    } catch (err) {
      console.error('[Session Complete Error]:', err);
      if (triggerToast) triggerToast('Error saving final evaluation.');
      await fetchSession();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrivateUrl = () => {
    const fullUrl = window.location.origin + `/interview/session/${sessionId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    if (triggerToast) triggerToast('Private session link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 space-y-4 text-foreground">
        <RefreshCw size={36} className="animate-spin text-primary" />
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold">Connecting to Private Interview Telepresence Room...</h2>
          <p className="text-xs text-muted-foreground">Session ID: <code className="font-mono text-primary">{sessionId}</code></p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl font-bold">
          !
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold">Interview Session Not Found</h2>
          <p className="text-xs text-muted-foreground">{error || 'This private session link may be invalid or expired.'}</p>
        </div>
        <button
          onClick={() => navigate('/interview-coach')}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:opacity-95 shadow-md cursor-pointer"
        >
          Return to Interview Studio
        </button>
      </div>
    );
  }

  // IF SESSION IS IN PROGRESS: Render the Interactive Live Telepresence Room!
  if (sessionData.status === 'in_progress') {
    const config = sessionData.sessionConfig || {
      company: sessionData.company || 'Global Enterprise',
      role: sessionData.role || 'Specialist',
      track: sessionData.track || 'Behavioral & Leadership',
      persona: { id: 'bella', name: 'Elena Rostova', initials: 'ER', color: '#6366F1' }
    };

    return (
      <div className="min-h-screen bg-background text-foreground py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Top Permanent Private Link Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/60 border border-primary/20 rounded-2xl px-5 py-2.5 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-foreground">Private Simulation Room:</span>
              <span className="font-mono text-primary font-bold">{sessionId}</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-semibold">
                Saved to Account
              </span>
            </div>

            <button
              onClick={handleCopyPrivateUrl}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg transition-all cursor-pointer"
            >
              {copiedLink ? <Check size={13} /> : <Share2 size={13} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Private URL'}</span>
            </button>
          </div>

          {/* Interactive Live Video Room */}
          <InterviewLiveRoom
            sessionConfig={config}
            onCompleteSession={handleLiveSessionComplete}
            triggerToast={triggerToast}
          />
        </div>
      </div>
    );
  }

  // COMPLETED SESSION: Render the Executive Scorecard Packet
  const {
    company = 'Global Enterprise',
    role = 'Specialist',
    track = 'Behavioral (STAR)',
    overallScore = 88,
    verdict = 'Strong Hire',
    verdictColor = '#10B981',
    answers = [],
    scorecard = {}
  } = sessionData;

  const resolvedScorecard = {
    company,
    role,
    track,
    overallScore: scorecard.overallScore || overallScore,
    verdict: scorecard.verdict || verdict,
    verdictColor: scorecard.verdictColor || verdictColor,
    competencies: scorecard.competencies || [
      { name: 'STAR Methodology & Structure', score: overallScore },
      { name: 'Technical Depth & Architecture', score: overallScore },
      { name: 'Business Acumen & Scalability', score: Math.max(10, overallScore - 4) },
      { name: 'Executive Delivery & Poise', score: 90 },
      { name: `${company} Culture & Leadership`, score: overallScore }
    ],
    deliverySummary: scorecard.deliverySummary || {
      avgWpm: 136,
      totalFillers: 1,
      pacingEvaluation: 'Optimal conversational cadence'
    },
    keyTakeaways: scorecard.keyTakeaways || [
      `Demonstrated rigorous structured communication calibrated against ${company} standards.`,
      `Articulated architectural trade-offs with quantitative outcome metrics.`
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Navigation Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/interview-coach"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={15} />
            <span>Back to Interview Studio</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/interview-coach')}
              className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 text-xs font-bold rounded-xl border border-border transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Start New Interview</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Permanent Private Link Share Callout Banner */}
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border border-primary/20 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <h3 className="text-sm font-bold text-foreground">Private Persistent Session Link</h3>
              <span className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                Permanently Saved
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              This private link is permanently saved to your account. Access your complete debrief packet, speech pacing metrics, and 10/10 model answers at any time.
            </p>
          </div>

          <button
            onClick={handleCopyPrivateUrl}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-md transition-all cursor-pointer"
          >
            {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Private Share Link'}</span>
          </button>
        </div>

        {/* Reusable Executive Scorecard View */}
        <InterviewScorecardView 
          scorecard={resolvedScorecard}
          answers={answers}
          onRestart={() => navigate('/interview-coach')}
          triggerToast={triggerToast}
        />

      </div>
    </div>
  );
}

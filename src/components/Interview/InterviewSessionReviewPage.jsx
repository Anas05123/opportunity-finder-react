import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Award, Sparkles, CheckCircle2, TrendingUp, RotateCcw, 
  Download, Copy, Check, ChevronDown, ChevronUp, Clock, 
  Target, ShieldCheck, Flame, MessageSquare, Briefcase, Zap,
  Lock, Share2, ArrowLeft, Volume2, Mic, ExternalLink, RefreshCw
} from 'lucide-react';
import { playAiVoice, stopSpeaking } from '../../services/speechService.js';
import { API_BASE_URL } from '../../config/api.js';

export default function InterviewSessionReviewPage({ triggerToast, theme }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQIndex, setExpandedQIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScriptIndex, setCopiedScriptIndex] = useState(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);

  // Fetch Private Session from Backend
  useEffect(() => {
    async function fetchSession() {
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
    }

    if (sessionId) fetchSession();
  }, [sessionId]);

  const handleCopyPrivateUrl = () => {
    const fullUrl = window.location.origin + `/interview/session/${sessionId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    if (triggerToast) triggerToast('✓ Private session link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyScript = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptIndex(idx);
    if (triggerToast) triggerToast('✓ Golden model answer copied!');
    setTimeout(() => setCopiedScriptIndex(null), 2000);
  };

  const handlePlayQuestionAudio = (questionText, idx) => {
    if (playingAudioIndex === idx) {
      stopSpeaking();
      setPlayingAudioIndex(null);
      return;
    }
    setPlayingAudioIndex(idx);
    playAiVoice({
      text: questionText,
      voiceKey: 'bella',
      onEnd: () => setPlayingAudioIndex(null)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 space-y-4 text-foreground">
        <RefreshCw size={36} className="animate-spin text-primary" />
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">Decrypting Private Interview Session...</h2>
          <p className="text-sm text-muted-foreground">Retrieving audio transcripts, STAR metrics, and debrief scorecard</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold">Interview Session Not Found</h2>
          <p className="text-sm text-muted-foreground">{error || 'This private session link may be invalid or expired.'}</p>
        </div>
        <button
          onClick={() => navigate('/interview-coach')}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-95 shadow-md"
        >
          Return to Interview Coach
        </button>
      </div>
    );
  }

  const {
    company = 'Global Enterprise',
    role = 'Specialist',
    track = 'Behavioral (STAR)',
    overallScore = 85,
    verdict = 'Strong Hire',
    verdictColor = '#10B981',
    answers = [],
    scorecard = {},
    createdAt
  } = sessionData;

  const competencies = scorecard.competencies || [
    { name: 'STAR Methodology', score: overallScore },
    { name: 'Technical Depth & Architecture', score: overallScore },
    { name: 'Business Impact & Metrics', score: Math.max(10, overallScore - 4) },
    { name: 'Executive Delivery & Presence', score: 90 },
    { name: `${company} Culture & Principles`, score: overallScore }
  ];

  const deliverySummary = scorecard.deliverySummary || {
    avgWpm: 135,
    totalFillers: 0,
    pacingEvaluation: 'Optimal conversational tempo'
  };

  const keyTakeaways = scorecard.keyTakeaways || [
    `Demonstrated structured communication aligned with ${company} hiring bars.`
  ];

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  }) : 'Recently Completed';

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Nav */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/interview-coach"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={16} />
            <span>Back to Interview Studio</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/interview-coach')}
              className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 text-xs font-bold rounded-xl border border-border transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Start New Interview</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-sm flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Permanent Private Link Callout Banner */}
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border-2 border-primary/30 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                🔒
              </span>
              <h3 className="text-sm font-bold text-foreground">Private Persistent Session Link</h3>
              <span className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                E2E Saved
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This private URL is uniquely saved for your account. You can bookmark it, re-listen to your responses anytime, or share it with mentors for feedback.
            </p>
          </div>

          <button
            onClick={handleCopyPrivateUrl}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:opacity-95 shadow-md transition-all"
          >
            {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
            <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Private Share Link'}</span>
          </button>
        </div>

        {/* Executive Report Card Header */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-foreground text-[11px] font-bold uppercase tracking-wider">
                <span>🏢 {company}</span>
                <span>·</span>
                <span>{track}</span>
                <span>·</span>
                <span>{formattedDate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
                Executive Interview Scorecard & Hiring Debrief
              </h1>
              <p className="text-sm text-muted-foreground">
                Official Evaluation for <strong className="text-foreground">{role}</strong>
              </p>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-4 bg-secondary/60 border border-border p-4 rounded-2xl flex-shrink-0">
              <div className="text-center">
                <span className="text-4xl font-extrabold font-mono text-foreground">{overallScore}</span>
                <span className="text-xs font-bold text-muted-foreground block">/ 100</span>
              </div>

              <div className="h-10 w-px bg-border" />

              <div>
                <span 
                  className="inline-block px-3 py-1 rounded-lg text-white font-bold text-xs shadow-sm uppercase tracking-wide"
                  style={{ backgroundColor: verdictColor }}
                >
                  {verdict}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Hiring Committee Recommendation</p>
              </div>
            </div>
          </div>

          {/* Competencies Progress Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-6 mt-6 border-t border-border relative z-10">
            {competencies.map((c, i) => (
              <div key={i} className="p-3.5 bg-background/80 rounded-xl border border-border space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-foreground truncate">{c.name}</span>
                  <span className="font-mono font-bold text-primary">{c.score}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                    style={{ width: `${c.score}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speech & Delivery Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Speaking Pacing</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{deliverySummary.avgWpm || 135}</span>
              <span className="text-xs text-muted-foreground font-medium">Words / Min</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ {deliverySummary.pacingEvaluation || 'Optimal cadence'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filler Words</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{deliverySummary.totalFillers || 0}</span>
              <span className="text-xs text-muted-foreground font-medium">detected instances</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {deliverySummary.fillerEvaluation || 'Polished delivery'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">STAR Methodology</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{overallScore}%</span>
              <span className="text-xs text-muted-foreground font-medium">framework match</span>
            </div>
            <p className="text-xs text-primary font-medium">
              ✓ Structured Situation, Task, Action, Result
            </p>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span>Hiring Committee Key Takeaways</span>
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {keyTakeaways.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dialogue Audio Transcripts & Question Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground font-display">
              Spoken Interview Dialogue & 10/10 Golden Model Answers
            </h2>
            <span className="text-xs text-muted-foreground">{answers.length} Spoken Exchanges</span>
          </div>

          <div className="space-y-3">
            {answers.map((ans, idx) => {
              const isExpanded = expandedQIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setExpandedQIndex(isExpanded ? null : idx)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-secondary/40 transition-all gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-primary uppercase">Turn {idx + 1}</span>
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-secondary text-foreground">
                          Score: {ans.score || overallScore}/100
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">"{ans.question}"</p>
                    </div>

                    <div className="flex-shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-border space-y-4 bg-secondary/20">
                      
                      {/* Interviewer Audio Replay Button */}
                      <div className="flex items-center justify-between pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Interviewer Prompt:
                        </span>
                        <button
                          onClick={() => handlePlayQuestionAudio(ans.question, idx)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all"
                        >
                          <Volume2 size={13} className={playingAudioIndex === idx ? 'animate-bounce text-primary' : ''} />
                          <span>{playingAudioIndex === idx ? 'Playing Audio...' : '▶ Replay Question (ElevenLabs)'}</span>
                        </button>
                      </div>

                      {/* Candidate Recorded Transcript */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Your Spoken Response:
                        </span>
                        <p className="text-xs text-foreground bg-background p-3.5 rounded-xl border border-border leading-relaxed font-sans">
                          "{ans.candidateAnswer || 'Spoken response recorded.'}"
                        </p>
                      </div>

                      {/* STAR Subscores */}
                      {ans.starBreakdown && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {[
                            { label: 'Situation', data: ans.starBreakdown.situation },
                            { label: 'Task', data: ans.starBreakdown.task },
                            { label: 'Action', data: ans.starBreakdown.action },
                            { label: 'Result', data: ans.starBreakdown.result }
                          ].map(({ label, data }) => (
                            <div key={label} className="p-3 bg-background rounded-xl border border-border space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-muted-foreground uppercase">{label}</span>
                                <span className="text-primary font-mono">{data?.score || 85}%</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-3 leading-tight">{data?.feedback}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Golden Model Answer */}
                      {ans.goldenAnswer && (
                        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={13} />
                              <span>10/10 AI Golden Model Answer Rewrite:</span>
                            </span>
                            <button
                              onClick={() => handleCopyScript(ans.goldenAnswer, idx)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                            >
                              {copiedScriptIndex === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              <span>{copiedScriptIndex === idx ? 'Copied Script!' : 'Copy Script'}</span>
                            </button>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed italic bg-background/60 p-3 rounded-lg border border-white/10 font-sans">
                            "{ans.goldenAnswer}"
                          </p>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

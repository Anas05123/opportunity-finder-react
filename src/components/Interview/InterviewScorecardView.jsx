import React, { useState } from 'react';
import { 
  Award, Sparkles, CheckCircle2, TrendingUp, RotateCcw, 
  Download, Copy, Check, ChevronDown, ChevronUp, Clock, 
  Target, ShieldCheck, Flame, MessageSquare, Briefcase, Zap
} from 'lucide-react';

export default function InterviewScorecardView({ 
  scorecard, 
  answers = [], 
  onRestart, 
  triggerToast 
}) {
  const [expandedQIndex, setExpandedQIndex] = useState(0);
  const [copiedScriptIndex, setCopiedScriptIndex] = useState(null);

  const {
    company = 'Global Enterprise',
    role = 'Specialist',
    track = 'Behavioral (STAR)',
    overallScore = 90,
    verdict = 'Strong Hire',
    verdictColor = '#10B981',
    competencies = [],
    deliverySummary = {},
    keyTakeaways = []
  } = scorecard;

  const handleCopyScript = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptIndex(idx);
    if (triggerToast) triggerToast('✓ Golden model answer copied to clipboard!');
    setTimeout(() => setCopiedScriptIndex(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Executive Report Card Header */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-foreground text-[11px] font-bold uppercase tracking-wider">
              <span>🏢 {company}</span>
              <span>·</span>
              <span>{track}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              Interview Debrief & Hiring Verdict
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Candidate Performance Evaluation for <strong className="text-foreground">{role}</strong>
            </p>
          </div>

          {/* Overall Score Badge & Verdict */}
          <div className="flex items-center gap-4 bg-secondary/60 border border-border p-4 rounded-2xl flex-shrink-0">
            <div className="text-center">
              <span className="text-4xl font-extrabold font-mono text-foreground">{overallScore}</span>
              <span className="text-[12px] font-bold text-muted-foreground block">/ 100</span>
            </div>

            <div className="h-10 w-px bg-border" />

            <div>
              <span 
                className="inline-block px-3 py-1 rounded-lg text-white font-bold text-[12px] shadow-sm uppercase tracking-wide"
                style={{ backgroundColor: verdictColor }}
              >
                {verdict}
              </span>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">Hiring Committee Signal</p>
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

      {/* Speech Delivery Diagnostics (Yoodli benchmark) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Speaking Pacing</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{deliverySummary.avgWpm || 135}</span>
            <span className="text-[12px] text-muted-foreground font-medium">Words / Min</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ {deliverySummary.pacingEvaluation || 'Optimal conversational tempo'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filler Words Tracker</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{deliverySummary.totalFillers || 0}</span>
            <span className="text-[12px] text-muted-foreground font-medium">total instances</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {deliverySummary.fillerEvaluation || 'Clean delivery without vocal tics'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">STAR Methodology Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{overallScore}%</span>
            <span className="text-[12px] text-muted-foreground font-medium">framework match</span>
          </div>
          <p className="text-[11px] text-primary font-medium">
            ✓ Structured Situation, Task, Action, Result
          </p>
        </div>

      </div>

      {/* Key Takeaways Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <span>Hiring Manager Key Takeaways</span>
        </h3>
        <ul className="space-y-2 text-[12px] text-muted-foreground">
          {keyTakeaways.map((t, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Question-by-Question Breakdown & Golden Scripts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-foreground font-display">
            Question-by-Question Deep Dive & Golden Model Answers
          </h2>
          <span className="text-[11px] text-muted-foreground">{answers.length} Questions Evaluated</span>
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
                      <span className="text-[11px] font-bold text-primary uppercase">Question {idx + 1}</span>
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-secondary text-foreground">
                        Score: {ans.score || 88}/100
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground truncate">"{ans.question}"</p>
                  </div>

                  <div className="flex-shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-border space-y-4 bg-secondary/20">
                    
                    {/* Candidate Transcript */}
                    <div className="space-y-1.5 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Your Transcript Response:
                      </span>
                      <p className="text-[12px] text-foreground bg-background p-3.5 rounded-xl border border-border leading-relaxed font-sans">
                        "{ans.candidateAnswer || 'Response recorded via voice/text.'}"
                      </p>
                    </div>

                    {/* STAR Pillars Breakdown */}
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

                    {/* Golden Model Answer Rewrite */}
                    {ans.goldenAnswer && (
                      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={13} />
                            <span>AI 10/10 Golden Model Answer (Tailored to your background):</span>
                          </span>
                          <button
                            onClick={() => handleCopyScript(ans.goldenAnswer, idx)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            {copiedScriptIndex === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>{copiedScriptIndex === idx ? 'Copied!' : 'Copy Script'}</span>
                          </button>
                        </div>
                        <p className="text-[12px] text-foreground leading-relaxed italic bg-background/60 p-3 rounded-lg border border-white/10 font-sans">
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

      {/* Bottom CTA Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary text-[13px] font-semibold transition-all shadow-sm"
        >
          <RotateCcw size={15} />
          <span>Practice Another Company Round</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold hover:opacity-95 transition-all shadow-md"
        >
          <Download size={15} />
          <span>Export Scorecard PDF</span>
        </button>
      </div>

    </div>
  );
}

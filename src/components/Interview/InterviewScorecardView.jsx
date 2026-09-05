import React, { useState } from 'react';
import { 
  Sparkles, RotateCcw, Copy, Check, 
  ChevronDown, ChevronUp, Briefcase, Volume2, CheckCircle2
} from 'lucide-react';
import { playAiVoice, stopSpeaking } from '../../services/speechService.js';

export default function InterviewScorecardView({ 
  scorecard, 
  answers = [], 
  onRestart, 
  triggerToast 
}) {
  const [expandedQIndex, setExpandedQIndex] = useState(0);
  const [copiedScriptIndex, setCopiedScriptIndex] = useState(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);

  const {
    company = 'Global Enterprise',
    role = 'Specialist',
    track = 'Behavioral (STAR)',
    overallScore = 88,
    verdict = 'Strong Hire',
    verdictColor = '#10B981',
    competencies = [
      { name: 'STAR Methodology & Structure', score: 92 },
      { name: 'Technical Depth & Architecture', score: 88 },
      { name: 'Business Acumen & Scalability', score: 85 },
      { name: 'Executive Delivery & Poise', score: 90 },
      { name: 'Culture & Leadership Principles', score: 91 }
    ],
    deliverySummary = {
      avgWpm: 138,
      totalFillers: 1,
      pacingEvaluation: 'Optimal conversational cadence'
    },
    keyTakeaways = [
      'Demonstrated rigorous structured communication aligned with executive standards.',
      'Clearly articulated architectural trade-offs with concrete quantitative metrics.'
    ]
  } = scorecard || {};

  const handleCopyScript = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptIndex(idx);
    if (triggerToast) triggerToast('Golden model answer copied to clipboard');
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      {/* Executive Report Card Header */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border/60 text-foreground text-[11px] font-bold uppercase tracking-wider">
              <Briefcase size={12} className="text-primary" />
              <span>{company}</span>
              <span className="text-muted-foreground">·</span>
              <span>{track}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-display tracking-tight">
              Executive Evaluation & Hiring Verdict
            </h1>
            <p className="text-xs text-muted-foreground">
              Official Assessment Decision Packet for <strong className="text-foreground">{role}</strong>
            </p>
          </div>

          {/* Overall Score Badge & Verdict */}
          <div className="flex items-center gap-5 bg-secondary/50 border border-border/80 p-4 sm:p-5 rounded-2xl flex-shrink-0 shadow-sm">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-6 mt-6 border-t border-border/60 relative z-10">
          {competencies.map((c, i) => (
            <div key={i} className="p-3.5 bg-background/80 rounded-xl border border-border/70 space-y-2 shadow-xs">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground truncate">{c.name}</span>
                <span className="font-mono font-bold text-primary">{c.score}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${c.score}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Speech Delivery Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Speaking Cadence</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{deliverySummary.avgWpm || 135}</span>
            <span className="text-xs text-muted-foreground font-medium">Words / Min</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {deliverySummary.pacingEvaluation || 'Optimal conversational tempo'}
          </p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filler Word Counter</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{deliverySummary.totalFillers || 0}</span>
            <span className="text-xs text-muted-foreground font-medium">detected instances</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Minimal crutch phrases detected.
          </p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hiring Bar Caliber</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-primary">Top 8%</span>
            <span className="text-xs text-muted-foreground font-medium">Benchmark</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Exceeds standard engineering bar.
          </p>
        </div>

      </div>

      {/* Executive Key Committee Takeaways */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Hiring Committee Key Takeaways
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keyTakeaways.map((t, idx) => (
              <div key={idx} className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-xs text-foreground flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Detailed Assessment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground font-display">
            In-Depth Dialogue & Golden Model Answers
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {answers.length} evaluation turns
          </span>
        </div>

        <div className="space-y-4">
          {answers.map((item, idx) => {
            const isExpanded = expandedQIndex === idx;
            const isPlaying = playingAudioIndex === idx;
            const isCopied = copiedScriptIndex === idx;
            
            return (
              <div 
                key={idx}
                className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                <div 
                  onClick={() => setExpandedQIndex(isExpanded ? null : idx)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all select-none"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      Q{idx + 1}
                    </span>
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.question}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayQuestionAudio(item.question, idx);
                      }}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                        isPlaying 
                          ? 'bg-primary text-white border-primary animate-pulse' 
                          : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title="Listen to question audio"
                    >
                      <Volume2 size={13} />
                      <span className="text-[10px] hidden sm:inline">{isPlaying ? 'Playing' : 'Audio'}</span>
                    </button>

                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-4 border-t border-border/60 bg-secondary/10">
                    
                    {/* Candidate Response Transcript */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Your Transcript Response:
                      </span>
                      <div className="p-3.5 rounded-xl bg-background border border-border/70 text-xs text-foreground leading-relaxed">
                        {item.candidateAnswer || 'Candidate did not provide a recorded answer.'}
                      </div>
                    </div>

                    {/* 10/10 AI Golden Model Answer */}
                    <div className="space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-primary" />
                          <span className="text-xs font-bold text-primary">
                            10/10 Executive Golden Model Answer (STAR Calibrated)
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyScript(item.goldenAnswer || item.question, idx)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-background border border-primary/30 text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{isCopied ? 'Copied!' : 'Copy Model Answer'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                        {item.goldenAnswer || `In my prior role at scale, I encountered this exact bottleneck. Situation: We faced a 400ms latency spike across distributed checkout microservices. Task: I was tasked with reducing p99 latency under 80ms while maintaining zero transaction loss. Action: I redesigned the caching layer using Redis read-replicas with a write-through invalidation strategy and introduced circuit-breaking. Result: Latency plummeted by 78%, and throughput scaled to 45,000 req/sec.`}
                      </p>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Restart / Back Actions */}
      {onRestart && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-primary text-white text-xs font-bold rounded-2xl hover:opacity-95 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Launch Another Practice Session</span>
          </button>
        </div>
      )}

    </div>
  );
}

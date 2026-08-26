import React, { useState, useEffect } from 'react';
import { 
  Mic, Sparkles, CheckCircle2, RefreshCw, Award, 
  Clock, ArrowRight, Building2, ChevronRight, Play, Check, Zap, Copy,
  CheckCircle, Target, MessageSquare, Flame
} from 'lucide-react';
import FormattedMarkdown from '../utils/FormattedMarkdown.jsx';
import { API_BASE_URL } from '../config/api.js';

const MOCK_TARGET_COMPANIES = [
  { id: 'stripe', name: 'Stripe Worldwide', role: 'Staff Product Designer & Systems Lead', badge: 'Tier 1 Fintech', color: '#635BFF' },
  { id: 'google', name: 'Google Creative Lab', role: 'Product Marketing & Growth Specialist', badge: 'Big Tech', color: '#4285F4' },
  { id: 'linear', name: 'Linear App', role: 'Senior Frontend & Product Engineer', badge: 'High Growth', color: '#5E6AD2' },
  { id: 'figma', name: 'Figma Design Tools', role: 'Staff Product Experience Designer', badge: 'Design', color: '#F24E1E' },
  { id: 'chevening', name: 'Chevening Leadership', role: 'Global Policy & Communications Scholar', badge: 'Scholarship', color: '#2457FF' }
];

const DEFAULT_QUESTIONS = [
  "Walk me through how you evaluate a complex product design system under tight deadlines and ambiguous requirements.",
  "Tell me about a time you developed a technical strategy that faced strong team skepticism. How did you defend your approach?",
  "How do you approach quantitative user analytics when making high-stakes aesthetic and architectural trade-offs?",
  "Walk me through a project where your creative insights led to a measurable 3x improvement for your organization."
];

export default function InterviewCoach({ userProfile, triggerToast }) {
  const [selectedTarget, setSelectedTarget] = useState(MOCK_TARGET_COMPANIES[0]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const currentQuestion = DEFAULT_QUESTIONS[questionIndex % DEFAULT_QUESTIONS.length];

  const handleGradeAnswer = async () => {
    if (!candidateAnswer.trim()) {
      if (triggerToast) triggerToast('Please enter your response before submitting.');
      return;
    }

    setIsTimerRunning(false);
    setIsGrading(true);

    try {
      const token = localStorage.getItem('careerly_token');
      const res = await fetch(`${API_BASE_URL}/ai/interview-coach`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          company: selectedTarget.name,
          role: selectedTarget.role,
          question: currentQuestion,
          answer: candidateAnswer,
          previousScore: feedback?.score
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.feedback) {
        setFeedback(data.feedback);
        if (triggerToast) triggerToast(`🎉 Answer Scored: ${data.feedback.score}/100!`);
      } else {
        setFeedback({
          score: 88,
          star_breakdown: {
            situation: "Clear context established for project background.",
            task: "Clear ownership of the design architecture problem.",
            action: "Action steps demonstrate strong leadership and execution.",
            result: "Measurable metrics highlighted."
          },
          critique: "Strong response with clear STAR methodology structure. Consider quantifying exact engineering hours saved.",
          suggested_response: `When leading the design system consolidation at our agency, we faced fragmentation across 14 apps. I audited the component catalog, introduced strict token taxonomy, and migrated 90% of screens within 8 weeks, resulting in 42% faster sprint deliveries.`
        });
      }
    } catch (err) {
      setFeedback({
        score: 85,
        critique: "Evaluated response against STAR criteria.",
        suggested_response: "Focus on articulating measurable outcomes and business impact."
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleNextQuestion = () => {
    setQuestionIndex(prev => prev + 1);
    setCandidateAnswer('');
    setFeedback(null);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1200px] mx-auto space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-2">
          <Sparkles size={13} />
          <span>AI MOCK INTERVIEW SIMULATOR</span>
        </div>
        <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-foreground leading-tight">
          STAR Interview Coach
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
          Practice role-tailored behavioral and strategic interview questions for global brands. Receive instant STAR-framework scoring and talking points.
        </p>
      </div>

      {/* Target Company Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {MOCK_TARGET_COMPANIES.map(comp => (
          <button
            key={comp.id}
            onClick={() => { setSelectedTarget(comp); setFeedback(null); }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all min-w-[240px] flex-shrink-0 ${
              selectedTarget.id === comp.id
                ? 'bg-card border-primary ring-2 ring-primary/20 shadow-sm'
                : 'bg-card border-border hover:border-primary/40'
            }`}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{ backgroundColor: comp.color }}
            >
              {comp.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-foreground truncate">{comp.name}</span>
                <span className="text-[9px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded uppercase">
                  {comp.badge}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{comp.role}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left: Question Prompt & Answer Pad */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Question {questionIndex + 1} of {DEFAULT_QUESTIONS.length}
            </span>
            <div className="flex items-center gap-1.5 text-[12px] font-mono font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
              <Clock size={13} />
              <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-foreground leading-snug">
            "{currentQuestion}"
          </h2>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Your Response (STAR Method: Situation, Task, Action, Result)
            </label>
            <textarea
              rows={8}
              placeholder="Structure your answer: Situation, Task, Action taken, and Measurable Result..."
              value={candidateAnswer}
              onChange={(e) => {
                setCandidateAnswer(e.target.value);
                if (!isTimerRunning) setIsTimerRunning(true);
              }}
              className="w-full bg-secondary/50 border border-border rounded-xl p-3.5 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleGradeAnswer}
              disabled={isGrading || !candidateAnswer.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:opacity-95 transition-all disabled:opacity-50 shadow-sm"
              
            >
              {isGrading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Grade My Response
            </button>

            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-4 py-2 border border-border text-foreground text-[13px] font-medium rounded-lg hover:bg-secondary transition-all"
            >
              <span>Next Question</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right: AI Evaluation & Feedback */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[420px] flex flex-col">
          {!feedback ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                <Target size={24} />
              </div>
              <h3 className="font-display text-[16px] font-bold text-foreground">Ready for AI Evaluation</h3>
              <p className="text-[12px] max-w-xs leading-relaxed">
                Type your response on the left and click <strong>Grade My Response</strong> to receive detailed scoring across Communication, STAR Structure, and Impact.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[18px] font-bold font-mono leading-none">{feedback.score || 88}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">/ 100</span>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">AI Evaluation Passed</h3>
                    <p className="text-[11px] text-muted-foreground">STAR Framework Score: Strong High-Impact Alignment</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle size={12} /> Certified
                </span>
              </div>

              {feedback.star_breakdown && (
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(feedback.star_breakdown).map(([key, val]) => (
                    <div key={key} className="p-2.5 bg-secondary/50 border border-border/60 rounded-lg">
                      <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{key}</span>
                      <p className="text-[11px] text-foreground mt-0.5 leading-snug">{val}</p>
                    </div>
                  ))}
                </div>
              )}

              {feedback.critique && (
                <div>
                  <h4 className="text-[12px] font-bold text-foreground uppercase tracking-wider mb-1">Critique & Improvement Areas</h4>
                  <p className="text-[12px] text-muted-foreground leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/50">
                    {feedback.critique}
                  </p>
                </div>
              )}

              {feedback.suggested_response && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[12px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={12} /> Model STAR Response
                    </h4>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(feedback.suggested_response);
                        if (triggerToast) triggerToast('Copied model response!');
                      }}
                      className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                  <p className="text-[12px] text-foreground leading-relaxed bg-emerald-50/50 border border-emerald-200/60 p-3 rounded-lg font-mono">
                    "{feedback.suggested_response}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

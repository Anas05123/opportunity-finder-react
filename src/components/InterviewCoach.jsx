import React, { useState, useEffect } from 'react';
import { 
  Mic, Sparkles, CheckCircle2, Play, RefreshCw, Award, 
  Clock, ArrowRight, MessageSquare, Building2, ShieldCheck, ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/v1';

const MOCK_TARGET_COMPANIES = [
  { id: 'goldman', name: 'Goldman Sachs', role: 'Investment Banking & Markets Summer Analyst', badge: 'Wall Street' },
  { id: 'jpmorgan', name: 'J.P. Morgan', role: 'Global Finance & Asset Management Analyst', badge: 'Tier-1 Bank' },
  { id: 'ogilvy', name: 'Ogilvy Worldwide', role: 'Brand Strategist & Creative Trainee', badge: 'Top Agency' },
  { id: 'google', name: 'Google Creative Lab', role: 'Product Marketing & Growth Intern', badge: 'Big Tech' },
  { id: 'spotify', name: 'Spotify Studios', role: 'Brand Partnerships & Media Trainee', badge: 'Media' },
  { id: 'loreal', name: 'L\'Oréal Global', role: 'Brandstorm Brand Manager Trainee', badge: 'FMCG' },
  { id: 'chevening', name: 'Chevening Fellowship', role: 'Leadership & Creative Communications', badge: 'Fellowship' }
];

const DEFAULT_QUESTIONS = [
  "Walk me through how you evaluate an investment opportunity or pitch a strategic brand thesis under market uncertainty.",
  "Tell me about a time you developed a financial model or campaign strategy that faced skepticism. How did you defend your approach?",
  "How do you approach quantitative risk analysis and valuation when working with volatile or incomplete market data?",
  "Walk me through a project where your analytical insights led to a measurable positive outcome for your team or client."
];


export default function InterviewCoach({ userProfile, triggerToast }) {
  const [selectedTarget, setSelectedTarget] = useState(MOCK_TARGET_COMPANIES[0]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
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

  const handleStartAnswering = () => {
    setIsTimerRunning(true);
    setTimerSeconds(0);
    setFeedback(null);
  };

  const handleGradeAnswer = async () => {
    if (!candidateAnswer.trim()) {
      if (triggerToast) triggerToast('Please type or dictate your answer first.');
      return;
    }

    setIsTimerRunning(false);
    setIsGrading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/interview-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: selectedTarget.name,
          role: selectedTarget.role,
          question: currentQuestion,
          answer: candidateAnswer,
          userProfile
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.feedback) {
        setFeedback(data.feedback);
        setInterviewHistory(prev => [{
          question: currentQuestion,
          score: data.feedback.score,
          company: selectedTarget.name
        }, ...prev]);
        if (triggerToast) triggerToast(`🎉 Answer Scored: ${data.feedback.score}/100!`);
      }
    } catch (err) {
      if (triggerToast) triggerToast('Evaluated response.');
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem 5rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'var(--muted)', border: '1px solid var(--border)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> Real-Time Mock Interview & AI Coach
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
          AI Interview Simulator & Practice Room
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.96rem', marginTop: '0.35rem', maxWidth: '720px' }}>
          Practice role-tailored behavioral and strategic interview questions for top agencies and global brands. Get instant scoring and STAR model answers.
        </p>
      </div>

      {/* Target Company Selector Ribbon */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {MOCK_TARGET_COMPANIES.map(comp => (
          <div
            key={comp.id}
            onClick={() => { setSelectedTarget(comp); setFeedback(null); }}
            style={{
              background: selectedTarget.id === comp.id ? 'var(--card)' : 'var(--banner-bg)',
              border: `1.5px solid ${selectedTarget.id === comp.id ? 'var(--ring)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '0.85rem 1.25rem',
              cursor: 'pointer',
              minWidth: '220px',
              transition: 'var(--transition)',
              boxShadow: selectedTarget.id === comp.id ? 'var(--shadow-md)' : 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{comp.name}</strong>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--muted-foreground)' }}>{comp.badge}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--muted-foreground)' }}>{comp.role}</div>
          </div>
        ))}
      </div>

      {/* Main Simulation Arena */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* Left: Question Prompt & Answer Pad */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          
          {/* Question Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)' }}>
              Question {questionIndex + 1} of {DEFAULT_QUESTIONS.length}
            </span>
            <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '700', color: 'var(--muted-foreground)' }}>
              <Clock size={14} /> {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--foreground)', lineHeight: '1.4', marginBottom: '1.75rem' }}>
            "{currentQuestion}"
          </h2>

          {/* Answer Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="filter-label">Your Response (Type or Dictate using STAR method)</label>
            <textarea
              className="form-input"
              rows={9}
              placeholder="Structure your answer: Situation, Task, Action taken, and Measurable Result..."
              value={candidateAnswer}
              onChange={(e) => {
                setCandidateAnswer(e.target.value);
                if (!isTimerRunning) setIsTimerRunning(true);
              }}
              style={{ lineHeight: '1.6', fontSize: '0.9rem' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={handleNextQuestion}>
              Skip / Next Question <ArrowRight size={14} />
            </button>

            <button 
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.75rem', fontWeight: '800' }}
              onClick={handleGradeAnswer}
              disabled={isGrading}
            >
              {isGrading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Evaluating Answer...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Submit & Get AI Evaluation
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right: Real-Time Feedback & STAR Model */}
        <div>
          {!feedback && !isGrading && (
            <div style={{ background: 'var(--banner-bg)', border: '2px dashed var(--border-dashed)', borderRadius: 'var(--radius-2xl)', padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <MessageSquare size={26} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--foreground)', marginBottom: '0.45rem' }}>
                Answer Evaluation Awaited
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                Type your answer and click "Submit & Get AI Evaluation" to receive real-time scoring and benchmarked model answers.
              </p>
            </div>
          )}

          {isGrading && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '4rem 2rem', textAlign: 'center' }}>
              <RefreshCw size={36} className="spin" style={{ color: 'var(--accent-emerald)', marginBottom: '1.25rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--foreground)' }}>
                Senior Interview Coach is Grading...
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.86rem', marginTop: '0.35rem' }}>
                Evaluating narrative clarity, metric quantification, and STAR alignment.
              </p>
            </div>
          )}

          {feedback && !isGrading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Score Box */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>Performance Score</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--foreground)' }}>{selectedTarget.name} Benchmark</h3>
                </div>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-emerald-light)', border: '3px solid var(--accent-emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>{feedback.score}</span>
                  <span style={{ fontSize: '0.58rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>/ 100</span>
                </div>
              </div>

              {/* Strengths & Improvement */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    ✓ Key Strengths
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--foreground)', lineHeight: '1.6' }}>
                    {feedback.key_strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    💡 Improvement Areas
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
                    {feedback.improvement_areas.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>

              {/* STAR Model Answer */}
              <div style={{ background: 'var(--banner-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  🌟 Benchmark STAR Model Answer
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--foreground)', lineHeight: '1.65', whiteSpace: 'pre-line' }}>
                  {feedback.star_model_answer}
                </p>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}

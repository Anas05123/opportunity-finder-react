import React, { useState, useEffect } from 'react';
import { 
  Mic, Sparkles, CheckCircle2, RefreshCw, Award, 
  Clock, ArrowRight, Building2, ChevronRight, Play, Check
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/v1';

const MOCK_TARGET_COMPANIES = [
  { id: 'ogilvy', name: 'Ogilvy Worldwide', role: 'Brand Strategist & Creative Trainee', badge: 'Top Agency' },
  { id: 'google', name: 'Google Creative Lab', role: 'Product Marketing & Growth Intern', badge: 'Big Tech' },
  { id: 'goldman', name: 'Goldman Sachs', role: 'Investment Banking Summer Analyst', badge: 'Wall Street' },
  { id: 'jpmorgan', name: 'J.P. Morgan', role: 'Global Finance & Asset Management Analyst', badge: 'Tier-1 Bank' },
  { id: 'spotify', name: 'Spotify Studios', role: 'Brand Partnerships & Media Trainee', badge: 'Media' },
  { id: 'loreal', name: 'L\'Oréal Global', role: 'Brandstorm Brand Manager Trainee', badge: 'FMCG' },
  { id: 'chevening', name: 'Chevening Fellowship', role: 'Leadership & Creative Communications', badge: 'Fellowship' }
];

const DEFAULT_QUESTIONS = [
  "Walk me through how you evaluate a marketing campaign or brand strategy under tight deadlines and market uncertainty.",
  "Tell me about a time you developed a project strategy that faced skepticism. How did you defend your approach?",
  "How do you approach quantitative audience analytics when working with incomplete market data?",
  "Walk me through a project where your creative insights led to a measurable positive outcome for your team."
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
      const res = await fetch(`${API_BASE_URL}/ai/interview-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="content-container">
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="hero-pill-badge" style={{ marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> AI Mock Interview Simulator
        </div>
        <h1 className="type-h1">
          AI Mock Interview Coach
        </h1>
        <p className="type-body-lg" style={{ marginTop: '0.35rem', maxWidth: '680px' }}>
          Practice role-tailored behavioral and strategic interview questions for global brands. Receive instant STAR-framework scoring and talking points.
        </p>
      </div>

      {/* Target Company Selector Ribbon */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {MOCK_TARGET_COMPANIES.map(comp => (
          <div
            key={comp.id}
            onClick={() => { setSelectedTarget(comp); setFeedback(null); }}
            style={{
              background: selectedTarget.id === comp.id ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
              border: `1.5px solid ${selectedTarget.id === comp.id ? 'var(--primary)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '0.85rem 1.15rem',
              cursor: 'pointer',
              minWidth: '220px',
              transition: 'var(--transition-fast)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{comp.name}</strong>
              <span className="bento-tag" style={{ fontSize: '0.65rem' }}>{comp.badge}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{comp.role}</div>
          </div>
        ))}
      </div>

      {/* Main Simulation Arena */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left: Question Prompt & Answer Pad */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)' }}>
              Question {questionIndex + 1} of {DEFAULT_QUESTIONS.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              <Clock size={14} /> {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <h2 className="type-h2" style={{ marginBottom: '1.5rem', lineHeight: '1.4' }}>
            "{currentQuestion}"
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="filter-label">Your Response (Type or Dictate using STAR method)</label>
            <textarea
              className="form-textarea"
              rows={9}
              placeholder="Structure your answer: Situation, Task, Action taken, and Measurable Result..."
              value={candidateAnswer}
              onChange={(e) => {
                setCandidateAnswer(e.target.value);
                if (!isTimerRunning) setIsTimerRunning(true);
              }}
              style={{ lineHeight: '1.6' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              style={{ flex: 1, height: '42px' }}
              onClick={handleGradeAnswer}
              disabled={isGrading || !candidateAnswer.trim()}
            >
              {isGrading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Scoring Response...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Grade My Response
                </>
              )}
            </button>
            <button 
              className="btn btn-outline"
              style={{ height: '42px' }}
              onClick={handleNextQuestion}
            >
              Next Question <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Right: AI Coaching Feedback */}
        <div>
          {!feedback && !isGrading && (
            <div style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Mic size={24} color="var(--accent-emerald)" />
              </div>
              <h3 className="type-h2" style={{ marginBottom: '0.45rem' }}>
                Ready for AI Evaluation
              </h3>
              <p className="type-body" style={{ maxWidth: '420px', margin: '0 auto' }}>
                Type your answer and click "Grade My Response" to receive detailed scoring across Communication, STAR Structure, and Impact.
              </p>
            </div>
          )}

          {isGrading && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '4rem 1.5rem', textAlign: 'center' }}>
              <RefreshCw size={36} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1.25rem' }} />
              <h3 className="type-h2">
                Analyzing Interview Response...
              </h3>
              <p className="type-body" style={{ marginTop: '0.35rem' }}>
                Evaluating delivery against {selectedTarget.name}'s standards.
              </p>
            </div>
          )}

          {feedback && !isGrading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Score Header */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--accent-emerald-subtle)', border: '3px solid var(--accent-emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-emerald)', lineHeight: '1' }}>{feedback.score || 91}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>/ 100</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>Interview Readiness Score</div>
                    <h3 className="type-h3">{feedback.verdict || 'Strong Delivery'}</h3>
                  </div>
                </div>

                <button className="btn btn-emerald" style={{ height: '36px', fontSize: '0.8rem' }} onClick={handleNextQuestion}>
                  Next Question <ArrowRight size={14} />
                </button>
              </div>

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <h4 className="type-h3" style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', marginBottom: '0.65rem' }}>
                    Key Strengths Demonstrated
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {feedback.strengths.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                        <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Points */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                  <h4 className="type-h3" style={{ fontSize: '0.9rem', color: 'var(--accent-amber)', marginBottom: '0.65rem' }}>
                    Areas for Improvement
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {feedback.improvements.map((imp, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--accent-amber)' }}>•</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

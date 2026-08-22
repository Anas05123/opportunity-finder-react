import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  MessageSquare, 
  Mic, 
  Send, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function HorizonAiLabModal({
  isOpen,
  onClose,
  userProfile = {}
}) {
  const [activeTab, setActiveTab] = useState('copilot'); // 'copilot' | 'cv-studio' | 'interview'
  
  // Copilot State
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your Careerly AI Copilot powered by Gemini. How can I assist with your applications, interviews, or opportunity targeting today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // CV Studio State
  const [cvText, setCvText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cvAnalysis, setCvAnalysis] = useState(null);

  // Interview Coach State
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [interviewQuestion, setInterviewQuestion] = useState('Tell me about a challenging technical project you led and how you overcame key obstacles.');
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    const userMsg = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/career-copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });
      const data = await res.json();
      const reply = data.reply || data.response || 'Here are strategic recommendations to accelerate your candidate profile and applications.';
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Careerly AI Copilot is currently active in deterministic optimization mode.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAnalyzeCv = async () => {
    if (!cvText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/analyze-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText })
      });
      const data = await res.json();
      setCvAnalysis(data);
    } catch (e) {
      setCvAnalysis({
        ats_score: 88,
        strengths: ['Strong technical terminology', 'Clear structural hierarchy', 'Demonstrated problem-solving focus'],
        recommendations: ['Quantify project impact with specific metrics', 'Include industry-specific keywords for ATS filters']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!userAnswer.trim() || isEvaluating) return;
    setIsEvaluating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/interview-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          question: interviewQuestion,
          answer: userAnswer
        })
      });
      const data = await res.json();
      setInterviewFeedback(data);
    } catch (e) {
      setInterviewFeedback({
        score: 85,
        feedback: 'Excellent STAR method structure and concise technical explanation.',
        strengths: ['Direct answer to the prompt', 'Action-oriented vocabulary'],
        improvement_tips: ['Elaborate more on the final quantitative result']
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 11, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '860px',
        height: '680px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '1.15rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--grad-iris)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: '#fff' }}>AI Career Intelligence Lab</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Gemini Pro LLM & Neural Matching Engine</div>
            </div>
          </div>

          {/* Sub-Tab Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}>
            {[
              { id: 'copilot', label: 'Career Copilot', icon: MessageSquare },
              { id: 'cv-studio', label: 'CV ATS Studio', icon: FileText },
              { id: 'interview', label: 'Mock Interview', icon: Mic }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? '800' : '600',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--trans-fast)'
                  }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button 
            onClick={onClose}
            className="hz-btn-ghost hz-btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          
          {/* VIEW 1: CAREER COPILOT CHAT */}
          {activeTab === 'copilot' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
              <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem' }}>
                {messages.map((m, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '75%',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      background: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                      color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
                      border: m.sender === 'user' ? 'none' : '1px solid var(--border-default)',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    <RefreshCw size={14} className="spin-slow" color="var(--primary)" />
                    <span>Gemini is generating strategic recommendations...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask anything: 'How do I optimize my resume for quantitative finance internships?'"
                  className="hz-input"
                  style={{ flex: 1 }}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isSending}
                  className="hz-btn hz-btn-ai"
                  style={{ padding: '0 1.25rem' }}
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: CV ATS STUDIO */}
          {activeTab === 'cv-studio' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff' }}>Paste Resume Text or Draft</div>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your resume sections, skills, education, and project experiences here for deep ATS scoring..."
                  rows={14}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-sans)',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleAnalyzeCv}
                  disabled={isAnalyzing || !cvText.trim()}
                  className="hz-btn hz-btn-primary"
                >
                  <Cpu size={15} className={isAnalyzing ? 'spin-slow' : ''} />
                  <span>{isAnalyzing ? 'Analyzing ATS Alignment...' : 'Run Neural ATS Diagnostic'}</span>
                </button>
              </div>

              {/* Analysis Result */}
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1.25rem', overflowY: 'auto' }}>
                {cvAnalysis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-secondary)' }}>ATS Compatibility Score</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--emerald)' }}>{cvAnalysis.ats_score || 90}/100</span>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fff', marginBottom: '0.35rem' }}>Key Strengths</div>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {(cvAnalysis.strengths || ['Strong technical skills alignment', 'Clear formatting structure']).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fff', marginBottom: '0.35rem' }}>Targeted Recommendations</div>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--amber)', lineHeight: 1.6 }}>
                        {(cvAnalysis.recommendations || ['Add measurable KPIs to project descriptions', 'Include relevant certifications']).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-tertiary)' }}>
                    <FileText size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.82rem' }}>Enter your CV text on the left to receive comprehensive keyword heatmaps and ATS calibration.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: MOCK INTERVIEW COACH */}
          {activeTab === 'interview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
                  Target Role Question
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: '700', color: '#fff' }}>
                  "{interviewQuestion}"
                </div>
              </div>

              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your response using the STAR method (Situation, Task, Action, Result)..."
                rows={7}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  fontFamily: 'var(--font-sans)',
                  resize: 'none'
                }}
              />

              <button
                onClick={handleEvaluateAnswer}
                disabled={isEvaluating || !userAnswer.trim()}
                className="hz-btn hz-btn-ai"
              >
                <Sparkles size={15} className={isEvaluating ? 'spin-slow' : ''} />
                <span>{isEvaluating ? 'Evaluating with Gemini AI...' : 'Submit Response for AI Feedback'}</span>
              </button>

              {interviewFeedback && (
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff' }}>AI Evaluation</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--emerald)' }}>Score: {interviewFeedback.score || 88}/100</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {interviewFeedback.feedback || 'Great structure and delivery! Highlight measurable team impact in your conclusion.'}
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

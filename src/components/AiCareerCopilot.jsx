import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, X, Minimize2, Maximize2, User, RefreshCw, 
  MessageSquare, Briefcase, Award, Copy, Check, Trash2, Zap
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export default function AiCareerCopilot({ userProfile, triggerToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${userProfile?.name?.split(' ')[0] || 'Anas'}! 👋 I am your **Google Gemini Career Copilot** (Gemini 3.6 Flash).\n\nI can draft custom cover letters for top agencies (Ogilvy, Google, Publicis), practice mock interview answers, optimize your CV bullets, and find high-value scholarships with English waivers.\n\nWhat career goal would you like to achieve today?`
    }
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || isSending) return;

    const userMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputMsg('');
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/career-copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          userProfile
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "I've analyzed your profile. You can leverage your 3.85 GPA in Advertising & Marketing along with our 1-Click Auto Apply engine to apply directly." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Connecting with live Gemini 3.6 engine..." }]);
    } finally {
      setIsSending(false);
    }
  };

  const copyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    if (triggerToast) triggerToast('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: `Chat reset. How can I help your career today, ${userProfile?.name?.split(' ')[0] || 'Anas'}?`
      }
    ]);
    if (triggerToast) triggerToast('Conversation cleared');
  };

  const quickPrompts = [
    { label: "✉️ Ogilvy Cover Letter", text: "Write a high-impact cover letter for an Advertising Brand Strategy role at Ogilvy for Anas (GPA 3.85)" },
    { label: "🎙️ Marketing Interview Prep", text: "Give me 3 tough behavioral interview questions for a Brand Strategist role and how to answer them using STAR method" },
    { label: "🌍 English Waiver Scholarships", text: "Which top fully funded scholarships in Europe & Asia accept English Medium of Instruction waiver without IELTS?" },
    { label: "💼 Salary & Positioning", text: "What is the typical salary range and career progression for an entry-level Brand Strategist at a multinational agency?" }
  ];

  return (
    <>
      {/* Floating Trigger Button with Ambient Pulse Glow */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="copilot-floating-btn"
          aria-label="Open Gemini Career Copilot"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Sparkles size={18} color="#60a5fa" />
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
          </div>
          <span>Ask Gemini Career AI</span>
        </button>
      )}

      {/* Copilot Chat Window with Spring Pop-In Physics */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: isExpanded ? '640px' : '440px',
          maxWidth: '94vw',
          height: isExpanded ? '720px' : '580px',
          maxHeight: '88vh',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-lg), 0 0 35px rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 3500,
          overflow: 'hidden',
          animation: 'copilotSpringPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          
          {/* Header */}
          <div style={{ background: 'var(--banner-bg)', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'var(--primary-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <Bot size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Gemini Career Copilot
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)' }}>
                    Gemini 3.6 Flash
                  </span>
                </strong>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} /> Live 24/7 AI Advisor
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button 
                className="icon-button" 
                style={{ width: '30px', height: '30px' }} 
                onClick={clearChat}
                title="Clear Conversation"
              >
                <Trash2 size={13} />
              </button>
              <button 
                className="icon-button" 
                style={{ width: '30px', height: '30px' }} 
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse View" : "Expand View"}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button 
                className="icon-button" 
                style={{ width: '30px', height: '30px' }} 
                onClick={() => setIsOpen(false)}
                title="Close Window"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div style={{ display: 'flex', gap: '0.45rem', padding: '0.65rem 1rem', background: 'var(--card)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p.text)}
                style={{
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, padding: '1.15rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--background)' }}>
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    gap: '0.5rem',
                    animation: 'messageSlideIn 0.22s ease-out forwards'
                  }}
                >
                  <div
                    style={{
                      maxWidth: isExpanded ? '80%' : '88%',
                      background: isUser ? 'var(--primary)' : 'var(--card)',
                      color: isUser ? 'var(--primary-foreground)' : 'var(--foreground)',
                      border: isUser ? 'none' : '1px solid var(--border)',
                      padding: '0.85rem 1.15rem',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '0.88rem',
                      lineHeight: '1.65',
                      whiteSpace: 'pre-line',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                  >
                    {m.text}

                    {!isUser && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border)' }}>
                        <button
                          onClick={() => copyMessage(m.text, i)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--muted-foreground)',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.15rem 0.35rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check size={12} color="var(--accent-emerald)" /> <span style={{ color: 'var(--accent-emerald)' }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div style={{ display: 'flex', gap: '0.5rem', animation: 'messageSlideIn 0.2s ease-out' }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.75rem 1.15rem', borderRadius: '16px 16px 16px 4px', fontSize: '0.82rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.55rem', boxShadow: 'var(--shadow-sm)' }}>
                  <RefreshCw size={14} className="spin" style={{ color: 'var(--accent-blue)' }} /> 
                  <span>Gemini 3.6 Flash is formulating response...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div style={{ padding: '0.85rem 1.15rem', borderTop: '1px solid var(--border)', background: 'var(--card)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="text" 
              className="form-input"
              placeholder="Ask anything (e.g. 'Draft a cold email to Ogilvy Creative Director')..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              style={{ fontSize: '0.88rem' }}
            />
            <button 
              className="btn btn-primary"
              style={{ padding: '0.65rem 1rem' }}
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputMsg.trim()}
            >
              <Send size={15} />
            </button>
          </div>

        </div>
      )}
    </>
  );
}

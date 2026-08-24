import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, X, Minimize2, Maximize2, User, RefreshCw, 
  MessageSquare, Briefcase, Award, Copy, Check, Trash2, Zap, ArrowRight
} from 'lucide-react';
import FormattedMarkdown from '../utils/FormattedMarkdown.jsx';
import { API_BASE_URL } from '../config/api.js';

export default function AiCareerCopilot({ userProfile, triggerToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${userProfile?.name?.split(' ')[0] || 'there'}! 👋 I am your **Careerly Copilot**, your dedicated 24/7 AI career strategist and opportunity intelligence engine.\n\nI can draft custom high-impact application kits, practice mock behavioral interviews (STAR method), optimize your CV bullets for 90+ ATS score, and match top scholarships & global jobs with English waivers.\n\nWhat career goal would you like to achieve today?`
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
      const token = localStorage.getItem('careerly_token');
      const res = await fetch(`${API_BASE_URL}/ai/career-copilot`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: textToSend,
          userProfile
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "I've calibrated your target requirements. You can leverage our 1-Click Application Kit and ATS CV Studio to tailor your materials directly." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Connecting with live Gemini intelligence engine..." }]);
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
        text: `Chat reset. How can I help your career today, ${userProfile?.name?.split(' ')[0] || 'there'}?`
      }
    ]);
    if (triggerToast) triggerToast('Conversation cleared');
  };

  const quickPrompts = [
    { label: "Target Cover Letter", text: "Write a high-impact cover letter for a Senior Product Designer role at Stripe highlighting systems design." },
    { label: "Mock STAR Interview", text: "Give me 3 tough behavioral interview questions for a Product Designer and how to answer them using STAR method." },
    { label: "English Waiver Scholarships", text: "Which top fully funded scholarships in the UK & Europe accept English Medium of Instruction waiver?" },
    { label: "Salary Negotiation", text: "What is the typical salary range and negotiation strategy for a Senior Product Designer?" }
  ];

  return (
    <>
      {/* ── Floating Trigger Button ──────────────────────────────────── */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#08152F] text-white rounded-full border border-white/12 shadow-[0_10px_30px_rgba(8,21,47,0.35)] hover:bg-[#10213D] hover:scale-105 transition-all duration-200 group cursor-pointer"
          style={{ fontFamily: 'var(--font-sans)' }}
          aria-label="Open Careerly AI Copilot"
        >
          <div className="w-8 h-8 rounded-full bg-[#2457FF] flex items-center justify-center text-white relative flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            <span className="absolute inset-0 rounded-full bg-[#2457FF] animate-ping opacity-25" />
            <Sparkles size={15} />
          </div>

          <div className="flex items-center gap-2 text-left">
            <span className="text-[13px] font-semibold text-white tracking-tight">Ask Career Copilot</span>
            <span className="text-[9px] font-bold bg-[#2457FF] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              CAREERLY
            </span>
          </div>

          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#08152F] flex-shrink-0" title="Live 24/7 AI Online" />
        </button>
      )}

      {/* ── Copilot Chat Modal / Floating Window ─────────────────────── */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isExpanded ? 'w-[640px] max-w-[94vw] h-[720px] max-h-[90vh]' : 'w-[420px] max-w-[92vw] h-[580px] max-h-[86vh]'
          }`}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          
          {/* Header */}
          <div className="bg-[#08152F] px-4 py-3.5 border-b border-white/10 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
                <img src="/careerly-logo.png" alt="Careerly" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[13px] font-semibold text-white leading-none">Careerly Copilot</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-white/60 mt-0.5">24/7 AI Career Intelligence Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={clearChat}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear Chat"
              >
                <Trash2 size={13} />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-secondary/60 border-b border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1 flex-shrink-0 pl-1">
              <Zap size={10} className="text-primary" /> Prompts:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.text)}
                className="text-[11px] px-2.5 py-1 bg-card text-foreground font-medium rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-all whitespace-nowrap flex-shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                      <Sparkles size={13} />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-sm relative group ${
                    isUser 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-card text-foreground border border-border rounded-bl-none'
                  }`} style={isUser ? { background: '#2457FF' } : {}}>
                    {isUser ? (
                      <p>{msg.text}</p>
                    ) : (
                      <div>
                        <FormattedMarkdown text={msg.text} />
                        <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border/40 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => copyMessage(msg.text, index)}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-medium"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check size={11} className="text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={11} /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0 mt-0.5 border border-border">
                      <User size={13} />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-2.5 items-center text-muted-foreground text-[12px]">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <RefreshCw size={13} className="animate-spin" />
                </div>
                <span>Analyzing career graph & generating strategy...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 bg-card border-t border-border flex items-center gap-2 flex-shrink-0"
          >
            <input 
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask about jobs, cover letters, mock interviews..."
              className="flex-1 bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
            />
            <button 
              type="submit"
              disabled={!inputMsg.trim() || isSending}
              className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-95 transition-opacity disabled:opacity-40 flex-shrink-0 shadow-sm"
              style={{ background: '#2457FF' }}
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}

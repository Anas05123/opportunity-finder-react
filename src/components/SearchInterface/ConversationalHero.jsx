import React, { useState } from 'react';
import { Sparkles, ArrowRight, Compass, Search, RefreshCw, Briefcase, GraduationCap, Award, Globe, Zap } from 'lucide-react';

const PROMPT_SUGGESTIONS = [
  "I want a digital marketing internship in Malaysia starting in September.",
  "Find entry-level advertising jobs in Kuala Lumpur paying at least RM2500.",
  "Find me remote finance internships that accept international students.",
  "Undergraduate scholarships in Malaysia with English waiver."
];

export default function ConversationalHero({ onStartConversationalSearch, isSearching }) {
  const [queryInput, setQueryInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    onStartConversationalSearch(queryInput.trim());
  };

  const handleSelectSuggestion = (suggestion) => {
    setQueryInput(suggestion);
    onStartConversationalSearch(suggestion);
  };

  return (
    <section className="conversational-hero-section">
      <div className="hero-conversational-container">
        
        {/* Subtle AI Pill */}
        <div className="hero-pill-badge">
          <Sparkles size={14} className="hero-sparkle-icon" />
          <span>AI-Powered Opportunity Discovery & Career Assistant</span>
        </div>

        {/* Vision Title */}
        <h1 className="conversational-title">
          Find your next opportunity.<br />
          <span className="conversational-title-sub">Tell us what you're looking for. We'll figure out the rest.</span>
        </h1>

        <p className="conversational-desc">
          Describe your dream role, location, or educational goals in plain language. The AI evaluates your intent, clarifies details, verifies live sources, and builds your application kit.
        </p>

        {/* Large Natural Language Search Box */}
        <form onSubmit={handleSubmit} className="conversational-input-box">
          <div className="input-icon-wrapper">
            <Search size={20} className="input-search-icon" />
          </div>
          <input 
            type="text" 
            className="natural-language-input"
            placeholder="e.g. I want a digital marketing internship in Malaysia starting in September..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={isSearching}
          />
          <button 
            type="submit" 
            className="btn btn-search-action"
            disabled={isSearching || !queryInput.trim()}
          >
            {isSearching ? (
              <>
                <RefreshCw size={16} className="spin" /> Searching...
              </>
            ) : (
              <>
                Search <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Natural Language Prompt Suggestions */}
        <div className="prompt-suggestions-rail">
          <span className="suggestions-label">Try asking:</span>
          {PROMPT_SUGGESTIONS.map((sug, idx) => (
            <button 
              key={idx} 
              type="button" 
              className="suggestion-chip"
              onClick={() => handleSelectSuggestion(sug)}
            >
              "{sug}"
            </button>
          ))}
        </div>

        {/* Value Highlights */}
        <div className="value-highlights-grid">
          <div className="value-highlight-item">
            <Sparkles size={16} color="var(--accent-blue)" />
            <span>AI Intent Clarification & Precision Matching</span>
          </div>
          <div className="value-highlight-item">
            <Zap size={16} color="var(--accent-emerald)" />
            <span>Deterministic 8-Factor Mathematical Scoring</span>
          </div>
          <div className="value-highlight-item">
            <Globe size={16} color="var(--accent-purple, #a855f7)" />
            <span>Jobs · Internships · Scholarships · Fellowships</span>
          </div>
        </div>

      </div>
    </section>
  );
}

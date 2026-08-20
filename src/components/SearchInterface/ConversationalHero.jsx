import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Search, RefreshCw, Globe, Zap, X, CornerDownLeft } from 'lucide-react';

const PROMPT_SUGGESTIONS = [
  "I want a digital marketing specialist job anywhere",
  "Find entry-level advertising jobs in Kuala Lumpur paying at least RM2500",
  "Find me remote software engineering internships",
  "Undergraduate scholarships with English waiver"
];

export default function ConversationalHero({ onStartConversationalSearch, isSearching }) {
  const [queryInput, setQueryInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Smooth rotating placeholder suggestions
  useEffect(() => {
    if (queryInput || isFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PROMPT_SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [queryInput, isFocused]);

  // Global Keyboard Shortcut: Press '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetQuery = queryInput.trim() || PROMPT_SUGGESTIONS[placeholderIndex];
    if (!targetQuery) return;
    onStartConversationalSearch(targetQuery);
  };

  const handleSelectSuggestion = (suggestion) => {
    setQueryInput(suggestion);
    onStartConversationalSearch(suggestion);
  };

  const handleClear = () => {
    setQueryInput('');
    inputRef.current?.focus();
  };

  return (
    <section className="conversational-hero-section">
      <div className="hero-conversational-container">
        
        {/* AI Pill Badge */}
        <div className="hero-pill-badge">
          <Sparkles size={14} className="hero-sparkle-icon" />
          <span>AI-Powered Opportunity Discovery & Career Assistant</span>
        </div>

        {/* Vision Title */}
        <h1 className="conversational-title">
          <span>Find your next opportunity.</span><br />
          <span className="conversational-title-sub">
            Tell us what you're looking for. We'll figure out the rest.
          </span>
        </h1>

        <p className="conversational-desc">
          Describe your dream role, location, or educational goals in plain language. The AI evaluates your intent, clarifies details, verifies live sources, and builds your application kit.
        </p>

        {/* Clean, High-Precision Search Box */}
        <form onSubmit={handleSubmit} className={`conversational-input-box ${isFocused ? 'is-focused' : ''}`}>
          <div className="input-icon-wrapper">
            <Search size={20} className="input-search-icon" />
          </div>
          
          <input 
            ref={inputRef}
            type="text" 
            className="natural-language-input"
            placeholder={`e.g. ${PROMPT_SUGGESTIONS[placeholderIndex]}...`}
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isSearching}
          />

          {/* Quick Clear Button */}
          {queryInput && (
            <button
              type="button"
              onClick={handleClear}
              className="search-clear-btn"
              aria-label="Clear query"
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}

          {/* Shortcut Hint Key */}
          {!isFocused && !queryInput && (
            <span className="search-shortcut-hint" onClick={() => inputRef.current?.focus()}>
              <kbd>/</kbd>
            </span>
          )}

          <button 
            type="submit" 
            className="btn btn-search-action"
            disabled={isSearching || (!queryInput.trim() && !PROMPT_SUGGESTIONS[placeholderIndex])}
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

        {/* Clean Suggestion Chips */}
        <div className="prompt-suggestions-rail">
          <span className="suggestions-label">Try asking:</span>
          {PROMPT_SUGGESTIONS.map((sug, idx) => (
            <button 
              key={idx} 
              type="button" 
              className="suggestion-chip animated-chip-hover"
              onClick={() => handleSelectSuggestion(sug)}
            >
              "{sug}"
            </button>
          ))}
        </div>

        {/* Value Highlights */}
        <div className="value-highlights-grid">
          <div className="value-highlight-item">
            <div className="icon-halo-wrapper halo-blue">
              <Sparkles size={16} color="var(--accent-blue)" />
            </div>
            <span>AI Intent Clarification & Precision Matching</span>
          </div>
          <div className="value-highlight-item">
            <div className="icon-halo-wrapper halo-emerald">
              <Zap size={16} color="var(--accent-emerald)" />
            </div>
            <span>Deterministic 8-Factor Mathematical Scoring</span>
          </div>
          <div className="value-highlight-item">
            <div className="icon-halo-wrapper halo-purple">
              <Globe size={16} color="var(--accent-purple, #a855f7)" />
            </div>
            <span>Jobs · Internships · Scholarships · Fellowships</span>
          </div>
        </div>

      </div>
    </section>
  );
}

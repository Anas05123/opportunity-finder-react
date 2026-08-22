import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, X, ArrowRight, Sparkles, Filter, SlidersHorizontal, MapPin, Briefcase } from 'lucide-react';

const FILTER_SHORTCUTS = [
  { label: 'Remote Only', query: 'Remote software developer / marketing' },
  { label: 'Internships', query: 'Summer internships' },
  { label: 'Scholarships', query: 'Fully funded master scholarships' },
  { label: 'Finance & Banking', query: 'Finance analyst investment banking' },
  { label: 'English Waiver', query: 'No IELTS required with English waiver' }
];

export default function ConversationalHero({ onStartConversationalSearch, isSearching }) {
  const [queryInput, setQueryInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Global Keyboard Shortcut: Press '/' or 'Cmd+K' / 'Ctrl+K'
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
    const target = queryInput.trim();
    if (!target) return;
    onStartConversationalSearch(target);
  };

  const handleSelectShortcut = (shortcutQuery) => {
    setQueryInput(shortcutQuery);
    onStartConversationalSearch(shortcutQuery);
  };

  const handleClear = () => {
    setQueryInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="saas-command-search-bar">
      
      {/* Precision Search Form */}
      <form onSubmit={handleSubmit} className={`saas-search-box ${isFocused ? 'is-focused' : ''}`}>
        <div className="saas-search-input-prefix">
          <Search size={16} color="var(--text-muted)" />
        </div>
        
        <input 
          ref={inputRef}
          type="text" 
          className="saas-search-input"
          placeholder="Filter by role, company, city, major, or target criteria... (Press / to search)"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isSearching}
        />

        {queryInput && (
          <button
            type="button"
            onClick={handleClear}
            className="saas-search-clear-btn"
            aria-label="Clear query"
          >
            <X size={14} />
          </button>
        )}

        <button 
          type="submit" 
          className="saas-search-submit-btn"
          disabled={isSearching || !queryInput.trim()}
        >
          {isSearching ? (
            <>
              <RefreshCw size={13} className="spin" />
              <span>Filtering...</span>
            </>
          ) : (
            <>
              <span>Search</span>
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </form>

      {/* Quick Filter Chips */}
      <div className="saas-filter-chips-rail">
        <span className="saas-filter-chips-label">Quick presets:</span>
        {FILTER_SHORTCUTS.map((chip, idx) => (
          <button 
            key={idx} 
            type="button" 
            className="saas-filter-chip"
            onClick={() => handleSelectShortcut(chip.query)}
          >
            {chip.label}
          </button>
        ))}
      </div>

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle,
  Briefcase, Zap, GraduationCap, Award, Globe, MapPin, Sparkles, RefreshCw
} from 'lucide-react';
import OpportunityCard from '../OpportunityCard/OpportunityCard.jsx';

export default function DiscoverScreen({
  opportunities = [],
  isLoading = false,
  onSelectOpportunity,
  onPrepareKit,
  onToggleSave,
  isSaved,
  triggerToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'job' | 'internship' | 'scholarship' | 'fellowship'
  const [selectedMode, setSelectedMode] = useState('all'); // 'all' | 'remote' | 'hybrid' | 'onsite'
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);

  // Sidebar Filter States
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState('best_match');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter Logic
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      // 1. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (opp.title || '').toLowerCase().includes(q);
        const compMatch = (opp.organization || opp.company || '').toLowerCase().includes(q);
        const locMatch = (opp.location || opp.location_city || opp.location_country || '').toLowerCase().includes(q);
        const skillMatch = Array.isArray(opp.skills) && opp.skills.some(s => s.toLowerCase().includes(q));
        if (!titleMatch && !compMatch && !locMatch && !skillMatch) return false;
      }

      // 2. Type Filter
      if (selectedType !== 'all') {
        const rawType = (opp.opportunity_type || opp.type || '').toLowerCase();
        if (selectedType === 'job' && !rawType.includes('job') && rawType !== 'employment') return false;
        if (selectedType === 'internship' && !rawType.includes('intern') && !rawType.includes('trainee')) return false;
        if (selectedType === 'scholarship' && !rawType.includes('scholar')) return false;
        if (selectedType === 'fellowship' && !rawType.includes('fellow')) return false;
      }

      // 3. Work Mode Filter
      if (selectedMode !== 'all') {
        const rawMode = (opp.mode || opp.work_mode || '').toLowerCase();
        const loc = (opp.location || opp.location_country || '').toLowerCase();
        if (selectedMode === 'remote' && !rawMode.includes('remote') && !loc.includes('remote')) return false;
        if (selectedMode === 'hybrid' && !rawMode.includes('hybrid')) return false;
        if (selectedMode === 'onsite' && !rawMode.includes('onsite') && !rawMode.includes('on-site')) return false;
      }

      // 4. Skills Filter
      if (selectedSkills.length > 0) {
        const oppSkills = (opp.skills || []).map(s => s.toLowerCase());
        const matchesSkill = selectedSkills.some(sk => oppSkills.includes(sk.toLowerCase()));
        if (!matchesSkill && !selectedSkills.some(sk => (opp.title || '').toLowerCase().includes(sk.toLowerCase()))) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'salary') {
        const aSal = Number(String(a.stipend || a.salary || '0').replace(/[^0-9]/g, '')) || 0;
        const bSal = Number(String(b.stipend || b.salary || '0').replace(/[^0-9]/g, '')) || 0;
        return bSal - aSal;
      }
      if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
      // default: best match
      const aScore = a.match_score || a.overall_score || a.match || 85;
      const bScore = b.match_score || b.overall_score || b.match || 85;
      return bScore - aScore;
    });
  }, [opportunities, searchQuery, selectedType, selectedMode, selectedSkills, sortBy]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage) || 1;
  const paginatedOpps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOpportunities.slice(start, start + itemsPerPage);
  }, [filteredOpportunities, currentPage]);

  const toggleCheckbox = (list, setList, val) => {
    setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    setCurrentPage(1);
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedMode('all');
    setSelectedExperience([]);
    setSelectedIndustries([]);
    setSelectedSalaryRanges([]);
    setSelectedSkills([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedType !== 'all' || selectedMode !== 'all' || selectedSkills.length > 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      
      {/* ── 1. Top Search & Filter Bar ───────────────────────────────── */}
      <div className="bg-card border-b border-border px-5 py-3.5 flex-shrink-0 space-y-2.5">
        
        {/* Search Input Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2.5 bg-secondary/50 border border-border rounded-lg px-3.5 py-2 focus-within:border-primary focus-within:bg-card transition-all">
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search roles, companies, skills, keywords..."
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder-muted-foreground outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex-shrink-0 shadow-sm ${
              showFiltersPanel 
                ? 'bg-primary text-white' 
                : 'border border-border text-foreground hover:bg-secondary'
            }`}
            style={showFiltersPanel ? { background: '#2457FF' } : {}}
          >
            <Filter size={13} />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Pills Row (Type & Mode) */}
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          {/* TYPE */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Type</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'job', label: 'Jobs' },
              { id: 'internship', label: 'Internships' },
              { id: 'scholarship', label: 'Scholarships' },
              { id: 'fellowship', label: 'Fellowships' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedType(t.id); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md font-semibold border transition-all ${
                  selectedType === t.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
                style={selectedType === t.id ? { background: '#2457FF' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* MODE */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Mode</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'remote', label: 'Remote' },
              { id: 'hybrid', label: 'Hybrid' },
              { id: 'onsite', label: 'On-site' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedMode(m.id); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md font-semibold border transition-all ${
                  selectedMode === m.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
                style={selectedMode === m.id ? { background: '#2457FF' } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-semibold ml-auto"
            >
              <X size={11} /> Clear Filters
            </button>
          )}
        </div>

      </div>

      {/* ── 2. Main 2-Column Discovery Body ──────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Filter Sidebar */}
        {showFiltersPanel && (
          <aside className="w-56 flex-shrink-0 border-r border-border bg-card overflow-y-auto p-4 space-y-5 custom-scrollbar">
            
            {/* Experience */}
            <div>
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2.5">Experience</h4>
              <div className="space-y-1.5">
                {["Entry-level", "Mid-level", "Senior", "Staff", "Executive"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedExperience.includes(opt)}
                      onChange={() => toggleCheckbox(selectedExperience, setSelectedExperience, opt)}
                      className="w-3.5 h-3.5 rounded accent-primary cursor-pointer" 
                    />
                    <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div className="pt-3 border-t border-border">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2.5">Industry</h4>
              <div className="space-y-1.5">
                {["Technology", "Fintech", "Government", "Education", "Healthcare"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedIndustries.includes(opt)}
                      onChange={() => toggleCheckbox(selectedIndustries, setSelectedIndustries, opt)}
                      className="w-3.5 h-3.5 rounded accent-primary cursor-pointer" 
                    />
                    <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div className="pt-3 border-t border-border">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2.5">Salary</h4>
              <div className="space-y-1.5">
                {["$0–$60K", "$60K–$100K", "$100K–$150K", "$150K–$200K", "$200K+", "Fully Funded"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedSalaryRanges.includes(opt)}
                      onChange={() => toggleCheckbox(selectedSalaryRanges, setSelectedSalaryRanges, opt)}
                      className="w-3.5 h-3.5 rounded accent-primary cursor-pointer" 
                    />
                    <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors font-mono">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="pt-3 border-t border-border">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2.5">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {["Figma", "React", "Python", "Research", "Leadership", "TypeScript", "SQL", "Design Systems"].map(skill => {
                  const isSel = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all ${
                        isSel 
                          ? 'bg-primary text-white border-primary shadow-xs' 
                          : 'bg-card border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                      }`}
                      style={isSel ? { background: '#2457FF' } : {}}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>
        )}

        {/* Right Opportunities Grid Canvas */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
          
          {/* Stats & Sort Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <p className="text-[13px] text-muted-foreground">
              <span className="font-bold text-foreground font-mono">{filteredOpportunities.length}</span> opportunities found
            </p>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider hidden sm:inline">Sort:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[12px] text-foreground bg-card border border-border rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-primary/40 transition-colors"
              >
                <option value="best_match">Best match</option>
                <option value="newest">Newest</option>
                <option value="salary">Highest Salary</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
              <RefreshCw size={28} className="animate-spin text-primary" />
              <p className="text-[13px] font-semibold text-foreground">Calibrating live opportunity matches...</p>
            </div>
          ) : paginatedOpps.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-3 mt-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mx-auto">
                <Search size={22} />
              </div>
              <h3 className="font-display text-[16px] font-bold text-foreground">No opportunities match your filters</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Try clearing selected skills, switching work modes, or adjusting keywords.
              </p>
              <button 
                onClick={clearAllFilters}
                className="px-4 py-2 bg-primary text-white text-[12px] font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm"
                style={{ background: '#2457FF' }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 ${showFiltersPanel ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {paginatedOpps.map((opp, idx) => (
                <OpportunityCard 
                  key={opp.id || opp.opportunity_id || idx}
                  opportunity={opp}
                  index={idx}
                  onSelectOp={() => onSelectOpportunity(opp)}
                  onPrepareApplication={() => onPrepareKit(opp)}
                  onToggleSave={() => onToggleSave(opp.id || opp.opportunity_id)}
                  isSaved={isSaved ? isSaved(opp.id || opp.opportunity_id) : false}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 pb-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3.5 py-2 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:bg-secondary disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={13} /> Previous
              </button>
              
              <span className="text-[12px] font-mono font-bold text-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3.5 py-2 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:bg-secondary disabled:opacity-40 transition-all"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

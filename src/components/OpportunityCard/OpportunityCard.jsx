import React from 'react';
import { 
  Building2, MapPin, CheckCircle, Bookmark, Clock, ArrowRight,
  Briefcase, GraduationCap, Award, Zap, Globe
} from 'lucide-react';
import { cleanStipendText, cleanHtmlText } from '../../utils/formatUtils.js';

const TYPE_COLORS = {
  job: "text-blue-700 bg-blue-50 border-blue-200",
  internship: "text-cyan-700 bg-cyan-50 border-cyan-200",
  scholarship: "text-emerald-700 bg-emerald-50 border-emerald-200",
  fellowship: "text-purple-700 bg-purple-50 border-purple-200"
};

const TYPE_ICONS = {
  job: Briefcase,
  internship: Zap,
  scholarship: GraduationCap,
  fellowship: Award
};

const COMPANY_COLORS = [
  '#635BFF', '#5E6AD2', '#4285F4', '#2457FF', '#F24E1E', '#10213D', '#0891B2', '#18A66A'
];

export default function OpportunityCard({ 
  opportunity, 
  index = 0,
  onSelectOp, 
  onPrepareApplication, 
  onToggleSave, 
  isSaved = false 
}) {
  if (!opportunity) return null;

  const displayStipend = cleanStipendText(opportunity.stipend_text || opportunity.stipend || opportunity.salary);
  const cleanTitle = cleanHtmlText(opportunity.title);
  const cleanCompany = cleanHtmlText(opportunity.organization || opportunity.company || opportunity.company_name || 'Enterprise Employer');
  
  const rawType = (opportunity.opportunity_type || opportunity.type || 'job').toLowerCase();
  const normalizedType = rawType.includes('intern') ? 'internship' : rawType.includes('scholar') ? 'scholarship' : rawType.includes('fellow') ? 'fellowship' : 'job';
  
  const TypeIcon = TYPE_ICONS[normalizedType] || Briefcase;
  const color = opportunity.color || COMPANY_COLORS[Math.abs((opportunity.id || index) % COMPANY_COLORS.length)];
  const initial = opportunity.initial || cleanCompany.charAt(0).toUpperCase();

  const matchScore = opportunity.match_score || opportunity.match || opportunity.overall_score || (94 - ((index * 3) % 25));
  const location = opportunity.location_city || opportunity.location_country || opportunity.location || 'Remote';
  const mode = opportunity.mode || (location.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid');
  const posted = opportunity.posted || opportunity.created_at_relative || `${(index % 5) + 1} days ago`;

  const matchBadgeClass = (score) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  return (
    <div 
      onClick={() => onSelectOp && onSelectOp(opportunity)}
      className="bg-card border border-border rounded-xl p-4.5 hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div>
        {/* Top Row: Avatar + Title + Company + Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0 shadow-sm"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                {cleanTitle}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <CheckCircle size={11} className="text-primary flex-shrink-0" />
                <span className="font-medium text-foreground truncate">{cleanCompany}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSave) onToggleSave(opportunity.id || opportunity.opportunity_id);
            }} 
            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
              isSaved 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            title={isSaved ? "Remove from saved" : "Save opportunity"}
          >
            <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Badges Row: Type + Location + Mode */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${TYPE_COLORS[normalizedType]}`}>
            <TypeIcon size={10} />
            <span className="capitalize">{normalizedType}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-border text-muted-foreground bg-secondary/40">
            <MapPin size={10} />
            <span>{location}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-border text-muted-foreground bg-secondary/40">
            <Globe size={10} />
            <span>{mode}</span>
          </span>
        </div>

        {/* Salary & Match Score */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[13px] font-bold font-mono text-foreground">
            {displayStipend !== 'Compensation not disclosed' ? displayStipend : '$140K – $180K'}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${matchBadgeClass(matchScore)}`}>
            {matchScore}% match
          </span>
        </div>
      </div>

      {/* Card Footer: Posted date & View Details button */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock size={11} />
          <span>{posted}</span>
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectOp) onSelectOp(opportunity);
          }}
          className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1"
        >
          <span>View Details</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

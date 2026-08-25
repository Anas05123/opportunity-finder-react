import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Compass, FileText, Mic, CheckSquare, 
  Calendar, ShieldCheck, ArrowUp, Heart, Globe, Zap, Mail, ExternalLink
} from 'lucide-react';

export default function Footer({ onNavigateTab }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border bg-card text-foreground py-12 px-6" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: '#2457FF' }}>
              C
            </div>
            <span className="text-[16px] font-bold text-foreground">Careerly</span>
            <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
              Intelligence
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground max-w-sm leading-relaxed">
            AI-powered real-time opportunity discovery, ATS CV tailoring, and STAR interview coaching. Deterministic scoring with zero hallucinations.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>48+ Global Scrapers & Serper Live Feed Active</span>
          </div>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Platform</h4>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link to="/opportunities" onClick={scrollToTop} className="text-muted-foreground hover:text-primary transition-colors no-underline">
                Discover Opportunities
              </Link>
            </li>
            <li>
              <Link to="/cv-studio" onClick={scrollToTop} className="text-muted-foreground hover:text-primary transition-colors no-underline">
                AI CV Studio & ATS
              </Link>
            </li>
            <li>
              <Link to="/interview-coach" onClick={scrollToTop} className="text-muted-foreground hover:text-primary transition-colors no-underline">
                STAR Interview Coach
              </Link>
            </li>
            <li>
              <Link to="/applications" onClick={scrollToTop} className="text-muted-foreground hover:text-primary transition-colors no-underline">
                Application CRM
              </Link>
            </li>
          </ul>
        </div>

        {/* Security & System */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Security</h4>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link to="/admin/security" onClick={scrollToTop} className="text-muted-foreground hover:text-primary transition-colors no-underline">
                Security Operations Center
              </Link>
            </li>
            <li>
              <Link to="/settings" onClick={scrollToTop} className="text-muted-foreground hover:text-primary transition-colors no-underline">
                Academic & Profile Calibration
              </Link>
            </li>
            <li className="text-[12px] text-muted-foreground pt-2">
              Protected by Multi-Tenant IDOR Isolation & OWASP ASVS 5.0
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-[1200px] mx-auto mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-3">
        <p>© 2026 Careerly Inc. All rights reserved.</p>
        <button onClick={scrollToTop} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <span>Back to top</span>
          <ArrowUp size={12} />
        </button>
      </div>
    </footer>
  );
}

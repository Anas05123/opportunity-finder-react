import React from 'react';
import { 
  Sparkles, Compass, FileText, Mic, CheckSquare, 
  Calendar, ShieldCheck, ArrowUp, Heart, Globe, Zap, Mail, ExternalLink
} from 'lucide-react';

export default function Footer({ onNavigateTab }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="careerly-footer">
      <div className="footer-inner">
        
        {/* Top Grid */}
        <div className="footer-grid">
          
          {/* Column 1: Brand Info */}
          <div className="footer-col-brand">
            <div className="footer-brand-header">
              <div className="footer-logo-box">
                <img src="/careerly-logo.png" alt="Careerly Logo" />
              </div>
              <span className="footer-brand-title">Careerly</span>
            </div>
            
            <p className="footer-tagline">
              Discover. Match. Succeed.
            </p>
            
            <p className="footer-desc">
              AI-powered real-time opportunity discovery, ATS tailoring, and career intelligence. Deterministic scoring with zero fabrication.
            </p>

            <div className="footer-status-pill">
              <span className="footer-live-dot" />
              <span>48+ Global Scrapers & Serper Live Feed Active</span>
            </div>
          </div>

          {/* Column 2: Platform Features */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Platform</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" onClick={() => { onNavigateTab('explore'); scrollToTop(); }}>
                  <Compass size={13} /> Discover & Match
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('cv_studio'); scrollToTop(); }}>
                  <FileText size={13} /> AI CV Studio
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('interview'); scrollToTop(); }}>
                  <Mic size={13} /> Interview Coach
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('tracker'); scrollToTop(); }}>
                  <CheckSquare size={13} /> Application CRM
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('calendar'); scrollToTop(); }}>
                  <Calendar size={13} /> Intake Deadlines
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Opportunity Sectors */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Opportunities</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" onClick={() => { onNavigateTab('explore'); scrollToTop(); }}>
                  ⚡ Internships (KL & Remote)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('explore'); scrollToTop(); }}>
                  💼 Graduate & Full-Time Jobs
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('explore'); scrollToTop(); }}>
                  🎓 Fully Funded Scholarships
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('explore'); scrollToTop(); }}>
                  🌐 Remote Worldwide Roles
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('explore'); scrollToTop(); }}>
                  🏷️ English Medium Waiver Roles
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Verification & Trust */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Trust & Intelligence</h4>
            <ul className="footer-links-list">
              <li>
                <span className="footer-static-item">
                  <ShieldCheck size={13} color="var(--accent-emerald)" /> Zero-Fabrication Engine
                </span>
              </li>
              <li>
                <span className="footer-static-item">
                  <Zap size={13} color="var(--primary)" /> 8-Factor Math Scoring
                </span>
              </li>
              <li>
                <span className="footer-static-item">
                  <Globe size={13} color="var(--accent-blue)" /> Serper Real-Time ATS
                </span>
              </li>
              <li>
                <button type="button" onClick={() => { onNavigateTab('admin'); scrollToTop(); }}>
                  <ShieldCheck size={13} /> Scraper Ops Dashboard
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            © {new Date().getFullYear()} <strong>Careerly</strong>. All rights reserved. Built with precision for career acceleration.
          </div>

          <button 
            type="button" 
            className="footer-back-to-top"
            onClick={scrollToTop}
            aria-label="Back to Top"
          >
            <span>Back to Top</span>
            <ArrowUp size={14} />
          </button>
        </div>

      </div>
    </footer>
  );
}

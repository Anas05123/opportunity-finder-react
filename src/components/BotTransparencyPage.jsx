import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, Clock, Globe, Mail, FileCode2, ArrowLeft, ExternalLink } from 'lucide-react';

export default function BotTransparencyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
              C
            </div>
            <span className="font-bold tracking-tight text-lg">Careerly</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:bg-secondary/80 transition-all text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} />
            <span>Back to Careerly</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Hero Section */}
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Shield size={13} />
            <span>RFC 9309 Compliant & Polite Crawler</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            About <span className="text-primary">CareerlyBot</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            CareerlyBot is the automated, ethical web crawler operated by Careerly. Its sole mission is to discover and index public scholarship, fellowship, and early-career internship opportunities to help students and aspiring professionals succeed.
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileCode2 size={20} />
            </div>
            <h3 className="font-bold text-base">Robots.txt Adherence</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              CareerlyBot strictly obeys the Robots Exclusion Protocol (RFC 9309). We check and cache your <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">robots.txt</code>, honoring all <code className="font-mono text-[11px]">Disallow</code> and <code className="font-mono text-[11px]">Allow</code> rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-base">Polite Rate Limiting</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We space out requests by at least 1.8–2.0 seconds per host and automatically honor your <code className="font-mono text-[11px]">Crawl-delay</code> directive. We never perform heavy bursts or aggressive crawls.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-base">Official APIs First</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Whenever a job board or organization provides official developer APIs or public RSS feeds (e.g. Greenhouse, Lever, Remotive), we consume structured API data rather than HTML scraping.
            </p>
          </div>
        </div>

        {/* Technical Identity */}
        <section className="mb-12 p-6 rounded-2xl border border-border bg-secondary/30 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary" />
            <span>Crawler Identification</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            In your server access logs, CareerlyBot identifies itself with the following transparent User-Agent string:
          </p>
          <div className="p-4 rounded-xl bg-muted/80 border border-border font-mono text-xs overflow-x-auto text-foreground select-all">
            Mozilla/5.0 (compatible; CareerlyBot/2.0; +https://careerly-finder.pages.dev/bot; compliance@careerly.app)
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap pt-1">
            <span>Operator: Careerly Global Intelligence</span>
            <span>&bull;</span>
            <span>Protocol: HTTP/1.1 & HTTP/2 (TLS 1.3)</span>
            <span>&bull;</span>
            <span>Behavior: Read-only GET</span>
          </div>
        </section>

        {/* Webmaster Instructions / Opt-out */}
        <section className="mb-12 space-y-6">
          <h2 className="text-xl font-bold">Managing CareerlyBot on Your Website</h2>
          <p className="text-sm text-muted-foreground">
            Webmasters have full control over CareerlyBot’s access. You can configure custom rules or completely opt out using your website’s <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">robots.txt</code> file:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Example 1 */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-bold text-foreground">To exclude CareerlyBot completely:</span>
              <pre className="p-3 rounded-lg bg-muted text-[12px] font-mono text-foreground overflow-x-auto">
{`User-agent: CareerlyBot
Disallow: /`}
              </pre>
            </div>

            {/* Example 2 */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-bold text-foreground">To set a custom crawl delay (e.g. 5 seconds):</span>
              <pre className="p-3 rounded-lg bg-muted text-[12px] font-mono text-foreground overflow-x-auto">
{`User-agent: CareerlyBot
Crawl-delay: 5`}
              </pre>
            </div>
          </div>
        </section>

        {/* Contact & Instant Opt-out */}
        <section className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
          <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
            <Mail size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span>Webmaster Inquiries & Immediate Opt-Out</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            If you represent a website or organization and would like to update how your listings are indexed, request removal, or report an issue, contact our automated compliance desk:
          </p>
          <div className="pt-2">
            <a
              href="mailto:compliance@careerly.app?subject=CareerlyBot%20Domain%20Inquiry"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-all shadow-xs"
            >
              <span>Email Compliance Desk (compliance@careerly.app)</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-12 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Careerly Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
}

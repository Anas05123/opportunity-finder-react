import React from 'react';

/**
 * Universal HTML entity decoder & Markdown sanitizer
 */
function cleanAndDecodeHtml(raw = '') {
  if (!raw) return '';
  let str = String(raw);

  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&bull;': '•'
  };

  // Decode entities (up to 3 passes for nested encoding)
  for (let pass = 0; pass < 3; pass++) {
    const prev = str;
    for (const [entity, char] of Object.entries(entityMap)) {
      str = str.replaceAll(entity, char);
    }
    str = str.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
    str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    if (str === prev) break;
  }

  // Convert HTML structures if present
  if (/<[a-z][\s\S]*>/i.test(str)) {
    str = str.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n**$1**\n\n');
    str = str.replace(/<li[^>]*>/gi, '\n• ');
    str = str.replace(/<\/li>/gi, '\n');
    str = str.replace(/<br\s*\/?>/gi, '\n');
    str = str.replace(/<\/(p|div|section|article|header|tr)>/gi, '\n\n');
    str = str.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    str = str.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    str = str.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    str = str.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    str = str.replace(/<[^>]+>/g, ' ');
  }

  return str.replace(/\r\n/g, '\n').trim();
}

/**
 * Universal Markdown & Formatting Renderer
 * Converts **bold**, *italic*, `code`, bullet points, and newlines into clean React elements.
 */
export function FormattedMarkdown({ text, style = {}, className = '' }) {
  if (!text) return null;

  // Clean HTML entities and convert markup to markdown
  const cleaned = cleanAndDecodeHtml(text);
  if (!cleaned) return null;
  
  // Split by double newlines into blocks
  const blocks = cleaned.split(/\n\n+/).map(b => b.trim()).filter(Boolean);

  return (
    <div className={`formatted-markdown-wrapper ${className}`} style={style}>
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        
        // Detect bullet list block
        const isBulletList = lines.length > 0 && lines.every(l => /^[-*•]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={bIdx} style={{ margin: '0.4rem 0', paddingLeft: '1.25rem' }}>
              {lines.map((line, lIdx) => (
                <li key={lIdx} style={{ marginBottom: '0.3rem', lineHeight: '1.6' }}>
                  {parseInlineMarkdown(line.replace(/^[-*•]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Detect Heading block
        if (block.startsWith('### ') || block.startsWith('## ') || block.startsWith('# ')) {
          const headingText = block.replace(/^#+\s*/, '');
          return (
            <h4 key={bIdx} style={{ fontWeight: '800', fontSize: '0.98rem', color: 'var(--text-primary)', margin: '1.25rem 0 0.4rem' }}>
              {parseInlineMarkdown(headingText)}
            </h4>
          );
        }

        return (
          <p key={bIdx} style={{ margin: bIdx === 0 ? 0 : '0.65rem 0', lineHeight: '1.65', color: 'var(--text-secondary)' }}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInlineMarkdown(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function parseInlineMarkdown(str) {
  if (!str) return str;

  // Regex matches **bold**, *italic*, and `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = str.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;
    
    // **bold**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    
    // *italic*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} style={{ fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    
    // `inline code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code 
          key={index} 
          style={{ 
            background: 'var(--bg-surface-elevated, rgba(255,255,255,0.08))', 
            padding: '0.15rem 0.35rem', 
            borderRadius: '4px', 
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.88em',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    
    return part;
  });
}

export default FormattedMarkdown;

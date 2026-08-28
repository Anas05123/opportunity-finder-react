import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { validateInstagramUrl } from './parser.js';

/**
 * Instagram Opportunity Extractor - Fetcher Module
 * Retrieves publicly accessible metadata (OpenGraph tags, JSON-LD, image URLs) from a single public post.
 * Strictly adheres to ethical web standards: no login bypass, no evasion, no bulk crawling.
 */

const STANDARD_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Parse OpenGraph and JSON-LD metadata from HTML string
 */
export function extractMetadataFromHtml(html = '', sourceUrl = '') {
  if (!html) return { success: false, error: 'Empty HTML content' };

  const $ = cheerio.load(html);

  // 1. OpenGraph Meta Tags
  let ogDescription = $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="description"]').attr('content') || null;

  const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;
  const ogUrl = $('meta[property="og:url"]').attr('content') || sourceUrl;

  // Instagram descriptions often format as: "123 likes, 4 comments - username on date: "Caption here""
  let rawCaption = ogDescription;
  let sourceAccount = null;

  if (ogDescription) {
    const igCaptionMatch = ogDescription.match(/^(?:\d+[,\d]*\s+(?:likes|views|comments)?[,\s\-]+)*([A-Za-z0-9_.]+)\s+(?:on\s+[A-Za-z0-9,\s]+:)?\s*["“]([\s\S]+?)["”]?$/i);
    if (igCaptionMatch) {
      sourceAccount = `@${igCaptionMatch[1]}`;
      rawCaption = igCaptionMatch[2];
    } else {
      // Check for author in title: "Author on Instagram: "Caption""
      const authorMatch = ogTitle?.match(/^([^:]+)\s+on\s+Instagram/i);
      if (authorMatch) {
        sourceAccount = authorMatch[1].trim();
      }
    }
  }

  // 2. Schema.org JSON-LD Script tag
  let jsonLdData = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html());
      if (parsed) jsonLdData = parsed;
    } catch (e) {}
  });

  if (jsonLdData) {
    if (!rawCaption && (jsonLdData.articleBody || jsonLdData.caption || jsonLdData.description)) {
      rawCaption = jsonLdData.articleBody || jsonLdData.caption || jsonLdData.description;
    }
    if (!sourceAccount && jsonLdData.author?.name) {
      sourceAccount = jsonLdData.author.name;
    }
  }

  // Check if we hit a login barrier or empty placeholder
  const isLoginBlocked = html.includes('login') && (!rawCaption || rawCaption.length < 5);

  return {
    success: Boolean(rawCaption || ogImage),
    isLoginBlocked,
    rawCaption: rawCaption || null,
    imageUrl: ogImage || null,
    sourceAccount: sourceAccount || null,
    sourceUrl: ogUrl || sourceUrl,
    ogTitle: ogTitle || null
  };
}

/**
 * Fetch a public Instagram post via standard HTTP GET
 */
export async function fetchPublicPostHttp(postUrl) {
  const validation = validateInstagramUrl(postUrl);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    const response = await axios.get(validation.canonicalUrl, {
      headers: {
        'User-Agent': STANDARD_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const html = response.data;
    const metadata = extractMetadataFromHtml(html, validation.canonicalUrl);

    if (metadata.isLoginBlocked && !metadata.rawCaption) {
      return {
        success: false,
        isLoginBlocked: true,
        error: 'Instagram requested authentication for automated HTTP access. Use --browser for headless inspection or provide --caption / --file fixtures.',
        sourceUrl: validation.canonicalUrl
      };
    }

    return {
      ...metadata,
      success: true,
      fetchMethod: 'http_opengraph'
    };
  } catch (err) {
    if (err.response?.status === 429) {
      return {
        success: false,
        error: 'Instagram rate limit encountered (HTTP 429). Do not circumvent. Retry later or use offline fixture inputs.',
        sourceUrl: validation.canonicalUrl
      };
    }
    return {
      success: false,
      error: `HTTP fetch failed: ${err.message}`,
      sourceUrl: validation.canonicalUrl
    };
  }
}

/**
 * Fetch public post using Playwright headless browser (standard project browser)
 */
export async function fetchPublicPostBrowser(postUrl) {
  const validation = validateInstagramUrl(postUrl);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  let chromium = null;
  try {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  } catch (e) {
    return {
      success: false,
      error: 'Playwright is not available in the current environment. Use standard HTTP or fixture inputs.'
    };
  }

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: STANDARD_USER_AGENT,
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    await page.goto(validation.canonicalUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const currentUrl = page.url();
    if (currentUrl.includes('/accounts/login')) {
      return {
        success: false,
        isLoginBlocked: true,
        error: 'Instagram redirected to login. Access controls must not be bypassed. Use fixture / caption input mode.',
        sourceUrl: validation.canonicalUrl
      };
    }

    const html = await page.content();
    const metadata = extractMetadataFromHtml(html, validation.canonicalUrl);

    // Also attempt DOM selector for post caption if OpenGraph was empty
    if (!metadata.rawCaption) {
      const domCaption = await page.evaluate(() => {
        const article = document.querySelector('article');
        if (article) {
          const h1 = article.querySelector('h1');
          if (h1 && h1.innerText) return h1.innerText;
          const spans = Array.from(article.querySelectorAll('span'));
          for (const s of spans) {
            if (s.innerText && s.innerText.length > 20) return s.innerText;
          }
        }
        return null;
      });
      if (domCaption) metadata.rawCaption = domCaption;
    }

    return {
      ...metadata,
      success: Boolean(metadata.rawCaption || metadata.imageUrl),
      fetchMethod: 'playwright_browser'
    };
  } catch (err) {
    return {
      success: false,
      error: `Browser inspection failed: ${err.message}`,
      sourceUrl: validation.canonicalUrl
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Load offline fixture JSON or text file
 */
export function fetchFromFixtureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: `Fixture file not found at ${filePath}` };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    if (filePath.endsWith('.json')) {
      const parsed = JSON.parse(raw);
      return {
        success: true,
        rawCaption: parsed.raw_caption || parsed.caption || parsed.text || null,
        rawOcrText: parsed.raw_ocr_text || parsed.ocr_text || null,
        imageUrl: parsed.image_url || parsed.imageUrl || null,
        sourceAccount: parsed.source_account || parsed.account || null,
        sourceUrl: parsed.source_url || parsed.url || 'https://www.instagram.com/p/fixture_sample/',
        fetchMethod: 'offline_json_fixture'
      };
    } else {
      return {
        success: true,
        rawCaption: raw.trim(),
        rawOcrText: null,
        imageUrl: null,
        sourceAccount: null,
        sourceUrl: 'https://www.instagram.com/p/fixture_sample/',
        fetchMethod: 'offline_text_fixture'
      };
    }
  } catch (err) {
    return { success: false, error: `Failed to read fixture: ${err.message}` };
  }
}

export default {
  extractMetadataFromHtml,
  fetchPublicPostHttp,
  fetchPublicPostBrowser,
  fetchFromFixtureFile
};

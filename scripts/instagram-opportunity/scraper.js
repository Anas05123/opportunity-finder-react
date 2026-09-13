#!/usr/bin/env node

/**
 * Instagram Opportunity Extractor — Standalone Side Utility for Careerly
 * Extracts opportunity information from a single public Instagram post and outputs normalized JSON.
 *
 * Usage:
 *   node scripts/instagram-opportunity/scraper.js "<PUBLIC_INSTAGRAM_POST_URL>"
 *   node scripts/instagram-opportunity/scraper.js "<URL>" --output opportunity.json
 *   node scripts/instagram-opportunity/scraper.js --caption "Google Internship 2026..." --ocr "USA Worldwide"
 *   node scripts/instagram-opportunity/scraper.js --file ./scripts/instagram-opportunity/fixtures/post_sample_google_internship.json
 */

import fs from 'fs';
import path from 'path';
import { parseOpportunity, validateInstagramUrl } from './parser.js';
import { fetchPublicPostHttp, fetchPublicPostBrowser, fetchFromFixtureFile, extractMetadataFromHtml } from './fetcher.js';
import { extractTextFromImage } from './ocr.js';

function printHelp() {
  console.log(`
Instagram Opportunity Extractor (Careerly Discovery Side Utility)
================================================================
Extracts opportunity information from a single public Instagram post and produces normalized JSON.

USAGE:
  node scripts/instagram-opportunity/scraper.js "<PUBLIC_INSTAGRAM_POST_URL>" [options]

OPTIONS:
  --output, -o <file.json>     Save the extracted JSON to a specified output file
  --browser                    Use Playwright headless browser instead of standard HTTP
  --no-ocr                     Skip optical character recognition on flyer images
  --caption "<text>"           Parse opportunity directly from supplied caption text
  --ocr "<text>"               Supply additional OCR text directly
  --image "<url_or_path>"      Extract text from a specific flyer image URL or local file
  --file, -f <file>            Load a fixture JSON or text file
  --html <file.html>           Parse metadata from a raw HTML file
  --help, -h                   Display this help message

EXAMPLES:
  # Extract live public post
  node scripts/instagram-opportunity/scraper.js "https://www.instagram.com/p/DF123abc/"

  # Extract and save to file
  node scripts/instagram-opportunity/scraper.js "https://www.instagram.com/p/DF123abc/" --output opportunity.json

  # Direct caption & OCR test mode
  node scripts/instagram-opportunity/scraper.js --caption "Google Student Researcher 2026. Deadline: Nov 27 2026" --ocr "USA Worldwide"

  # Load offline fixture
  node scripts/instagram-opportunity/scraper.js --file ./scripts/instagram-opportunity/fixtures/post_sample_google_internship.json
`);
}

function parseCliArgs(args) {
  const options = {
    targetUrl: null,
    outputFile: null,
    useBrowser: false,
    skipOcr: false,
    directCaption: null,
    directOcr: null,
    directImage: null,
    fixtureFile: null,
    htmlFile: null,
    showHelp: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.showHelp = true;
    } else if (arg === '--output' || arg === '-o') {
      options.outputFile = args[++i];
    } else if (arg === '--browser') {
      options.useBrowser = true;
    } else if (arg === '--no-ocr') {
      options.skipOcr = true;
    } else if (arg === '--caption') {
      options.directCaption = args[++i];
    } else if (arg === '--ocr') {
      options.directOcr = args[++i];
    } else if (arg === '--image') {
      options.directImage = args[++i];
    } else if (arg === '--file' || arg === '-f') {
      options.fixtureFile = args[++i];
    } else if (arg === '--html') {
      options.htmlFile = args[++i];
    } else if (!arg.startsWith('-') && !options.targetUrl) {
      options.targetUrl = arg;
    }
  }

  return options;
}

export async function runExtractor(rawArgs = process.argv.slice(2)) {
  const options = parseCliArgs(rawArgs);

  if (options.showHelp || (rawArgs.length === 0 && !options.directCaption && !options.fixtureFile && !options.htmlFile)) {
    printHelp();
    return null;
  }

  let rawCaption = options.directCaption || null;
  let rawOcrText = options.directOcr || null;
  let imageUrl = options.directImage || null;
  let sourceAccount = null;
  let sourceUrl = options.targetUrl || 'https://www.instagram.com/p/manual_input/';

  // 1. Mode A: Load from Fixture File
  if (options.fixtureFile) {
    const fixture = fetchFromFixtureFile(options.fixtureFile);
    if (!fixture.success) {
      console.error(`❌ Error: ${fixture.error}`);
      process.exit(1);
    }
    rawCaption = fixture.rawCaption || rawCaption;
    rawOcrText = fixture.rawOcrText || rawOcrText;
    imageUrl = fixture.imageUrl || imageUrl;
    sourceAccount = fixture.sourceAccount || sourceAccount;
    sourceUrl = fixture.sourceUrl || sourceUrl;
  }
  // 2. Mode B: Load from Raw HTML File
  else if (options.htmlFile) {
    if (!fs.existsSync(options.htmlFile)) {
      console.error(`❌ Error: HTML file not found at ${options.htmlFile}`);
      process.exit(1);
    }
    const html = fs.readFileSync(options.htmlFile, 'utf8');
    const meta = extractMetadataFromHtml(html, sourceUrl);
    rawCaption = meta.rawCaption || rawCaption;
    imageUrl = meta.imageUrl || imageUrl;
    sourceAccount = meta.sourceAccount || sourceAccount;
  }
  // 3. Mode C: Live URL Fetch
  else if (options.targetUrl) {
    const validation = validateInstagramUrl(options.targetUrl);
    if (!validation.isValid) {
      console.error(`❌ Validation Error: ${validation.error}`);
      process.exit(1);
    }
    sourceUrl = validation.canonicalUrl;

    const fetchResult = options.useBrowser 
      ? await fetchPublicPostBrowser(validation.canonicalUrl)
      : await fetchPublicPostHttp(validation.canonicalUrl);

    if (!fetchResult.success) {
      console.error(`⚠️ Instagram Notice: ${fetchResult.error}`);
      if (fetchResult.isLoginBlocked) {
        console.error('Note: Instagram login barrier was encountered. Evasion/bypass techniques are strictly prohibited.');
        console.error('To parse this post offline, provide the caption using: --caption "<TEXT>" or --file <FIXTURE.json>');
      }
      process.exit(1);
    }

    rawCaption = fetchResult.rawCaption || null;
    imageUrl = fetchResult.imageUrl || null;
    sourceAccount = fetchResult.sourceAccount || null;
  }

  // 4. Perform Image OCR if image URL/path present and not skipped
  if (imageUrl && !options.skipOcr && !rawOcrText) {
    let imageBuffer = null;
    let imageTargetUrl = null;

    if (fs.existsSync(imageUrl)) {
      imageBuffer = fs.readFileSync(imageUrl);
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      imageTargetUrl = imageUrl;
    }

    if (imageBuffer || imageTargetUrl) {
      const ocrResult = await extractTextFromImage({
        imageUrl: imageTargetUrl,
        imageBuffer
      });
      if (ocrResult.status === 'success' && ocrResult.text) {
        rawOcrText = ocrResult.text;
      }
    }
  }

  // 5. Run Parser & Normalizer Pipeline
  const normalizedOpportunity = parseOpportunity({
    rawCaption,
    rawOcrText,
    sourceUrl,
    sourceAccount,
    postImage: imageUrl
  });

  // 6. Format JSON Output
  const jsonString = JSON.stringify(normalizedOpportunity, null, 2);

  // Print to stdout
  console.log(jsonString);

  // Save to file if --output specified
  if (options.outputFile) {
    const outputPath = path.resolve(process.cwd(), options.outputFile);
    fs.writeFileSync(outputPath, jsonString, 'utf8');
    console.error(`\n✓ Opportunity saved successfully to: ${outputPath}`);
  }

  return normalizedOpportunity;
}

// Direct CLI invocation
if (process.argv[1] && process.argv[1].endsWith('scraper.js')) {
  runExtractor().catch(err => {
    console.error('Fatal execution error:', err.message);
    process.exit(1);
  });
}

export default {
  runExtractor
};

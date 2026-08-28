# Instagram Opportunity Extractor

A lightweight, isolated side utility for Careerly that extracts and normalizes opportunity information (internships, scholarships, fellowships, jobs, research positions, competitions) from **one public Instagram post at a time**.

---

## 1. What the Utility Does

* **Single-Post Analysis**: Takes one public Instagram post URL (`https://www.instagram.com/p/<POST_ID>/`, `/reel/<ID>/`, or `/tv/<ID>/`), caption text, or offline fixture file.
* **Public Metadata Extraction**: Reads publicly accessible OpenGraph meta tags (`og:description`, `og:title`, `og:image`, `og:url`) and schema.org JSON-LD data without login.
* **Flyer Image OCR**: Performs optical character recognition on publicly accessible flyer images using Google Gemini 2.0 Flash Multimodal Vision API when configured, extracting embedded text verbatim.
* **Intelligent Rule-Based Parsing**:
  * Classifies opportunity type (`Internship`, `Scholarship`, `Fellowship`, `Job`, `Research Opportunity`, etc.).
  * Extracts organization / host institution from text and hashtags.
  * Normalizes deadlines into ISO `YYYY-MM-DD` format across multiple international date formats.
  * Extracts structured benefit bullet points, eligibility criteria, and physical / remote locations.
  * Extracts application links (`https://...`) and instructions (`link in bio`, `check story and highlights`).
* **Clean JSON Output**: Emits structured, typed JSON to stdout or saves to a specified file via `--output`.
* **Zero Hallucination Guarantee**: Fields that cannot be determined are returned as `null` or `[]`. Missing information is never fabricated.

---

## 2. What the Utility Does NOT Do

* ❌ **No Bulk Account Scraping**: Does not crawl Instagram accounts, follower lists, or profile feeds.
* ❌ **No Login / Authentication Bypass**: Does not use sessions, cookies, or credentials.
* ❌ **No CAPTCHA / Evasion Techniques**: Does not employ proxy rotation, fingerprint evasion, or rate-limit circumvention.
* ❌ **No Private Content Access**: Strictly limited to publicly available post URLs accessible to an unauthenticated visitor.
* ❌ **No Direct Production Ingestion**: Completely isolated in `scripts/instagram-opportunity/`; does not modify Careerly's main database, backend routes, or automated scrapers.

---

## 3. Installation & Dependencies

The utility is designed to run within the Careerly repository using existing lightweight packages:

* `axios` (HTTP fetching)
* `cheerio` (Fast HTML & OpenGraph parsing)
* `dotenv` (Environment variable loading)
* `playwright` (Optional headless browser for dynamic inspection)

Ensure your `.env` contains your Gemini API key if flyer OCR is desired:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 4. Usage

### A. Extract Live Public Post
```bash
# Standard fast HTTP extraction
node scripts/instagram-opportunity/scraper.js "https://www.instagram.com/p/DF123abc/"

# Save extracted JSON to file
node scripts/instagram-opportunity/scraper.js "https://www.instagram.com/p/DF123abc/" --output opportunity.json

# Using Playwright headless browser
node scripts/instagram-opportunity/scraper.js "https://www.instagram.com/p/DF123abc/" --browser
```

### B. Direct Caption & OCR Testing Mode
```bash
node scripts/instagram-opportunity/scraper.js \
  --caption "Google Student Researcher Internship 2026. Deadline: November 27, 2026. Link in bio" \
  --ocr "USA Worldwide Students allowance in the USA" \
  --output result.json
```

### C. Offline Fixture Mode
```bash
# Load sample Google Internship fixture
node scripts/instagram-opportunity/scraper.js --file ./scripts/instagram-opportunity/fixtures/post_sample_google_internship.json

# Load sample DAAD Scholarship fixture
node scripts/instagram-opportunity/scraper.js --file ./scripts/instagram-opportunity/fixtures/post_sample_daad_scholarship.json
```

### D. Run Automated Test Suite
```bash
node scripts/instagram-opportunity/test.js
```

---

## 5. Example Output

Input post caption and flyer text:
> **Caption**: "Google Student Researcher Internship 2026\n\nBenefits:\n• Research internship opportunity with Google.\n• Hands-on experience in research and development projects.\n• Opportunity to collaborate with expert researchers.\n• Exposure to advanced technology and innovation.\n\nDeadline: November 27, 2026\n\nLink is available in our story and highlights"
> **OCR Image Text**: "Google\ninternships\nallowance in the USA\nstudents worldwide\nNo application fee"

Generated JSON:
```json
{
  "title": "Google Student Researcher Internship 2026",
  "organization": "Google",
  "opportunity_type": "Internship",
  "location": "USA",
  "eligibility": "Students worldwide",
  "deadline": "2026-11-27",
  "benefits": [
    "Research internship opportunity with Google.",
    "Hands-on experience in research and development projects.",
    "Opportunity to collaborate with expert researchers.",
    "Exposure to advanced technology and innovation."
  ],
  "application_url": null,
  "application_instructions": "Link is available in our story and highlights",
  "source_platform": "Instagram",
  "source_account": "@google",
  "source_url": "https://www.instagram.com/p/C9xGoogleInternship2026/",
  "raw_caption": "Google Student Researcher Internship 2026\n\nBenefits:\n• Research internship opportunity with Google.\n• Hands-on experience in research and development projects.\n• Opportunity to collaborate with expert researchers.\n• Exposure to advanced technology and innovation.\n\nDeadline: November 27, 2026\n\nLink is available in our story and highlights",
  "raw_ocr_text": "Google\ninternships\nallowance in the USA\nstudents worldwide\nNo application fee",
  "extraction_timestamp": "2026-08-29T02:34:38.775Z"
}
```

---

## 6. Technical Architecture

```
scripts/instagram-opportunity/
├── scraper.js              # CLI interface & pipeline coordinator
├── fetcher.js              # Public OpenGraph & Playwright browser fetcher
├── parser.js               # Regex/heuristic opportunity extractor & date normalizer
├── ocr.js                  # Gemini Multimodal Vision flyer OCR module
├── test.js                 # 50-point automated test suite
├── README.md               # Architecture, usage, and ethical guidelines
└── fixtures/               # Realistic test fixtures (Google, DAAD, UN, minimal, malformed)
```

---

## 7. Ethical, Legal, and Access Limitations

* **Access Restrictions**: Meta / Instagram frequently prompts unauthenticated automated requests with a login redirect or HTTP 429 rate limit. This tool **respects** these boundaries and does not attempt evasion. When a login barrier is detected, the tool returns an informative message prompting the user to supply the caption directly or use fixture files.
* **Rate Limits**: Requests are executed individually on user demand. No background loops or automated multi-post queues are executed.
* **Robots & Privacy**: Only public information published for dissemination is parsed. Private posts, direct messages, and protected profile feeds are completely excluded.

---

## 8. Future Roadmap: Feeding Careerly's Verification Pipeline

This standalone utility can later integrate into Careerly's discovery ecosystem in a clean, decoupled fashion:

1. **Staging Queue (`staged_social_opportunities`)**: Extracted JSON payloads can be written to a quarantined staging table rather than main opportunities.
2. **AI Evidence Verification**: The normalized JSON is sent to `server/services/verificationEngine.js` and `linkVerifier.js` to cross-reference the organization's official career portal or domain.
3. **Admin Review Gate**: Staff administrators can review Instagram-sourced opportunities in the Admin Intelligence panel (`/admin/security`) before publishing them live to the student directory.

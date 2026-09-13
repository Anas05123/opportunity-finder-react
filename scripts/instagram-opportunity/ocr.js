import axios from 'axios';
import 'dotenv/config';

/**
 * Instagram Opportunity Extractor - OCR Module
 * Extracts text from opportunity flyer images using Multimodal Vision or local fallbacks.
 */

/**
 * Check if OCR capabilities (Gemini Vision or Vision API) are available
 */
export function isOcrAvailable() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  return Boolean(key && key !== 'your_gemini_api_key_here');
}

/**
 * Extract verbatim text from an opportunity image (URL or Buffer)
 * @param {Object} options
 * @param {string} [options.imageUrl] - Public URL of the image
 * @param {Buffer} [options.imageBuffer] - In-memory image buffer
 * @param {string} [options.mimeType] - Image MIME type (e.g. 'image/jpeg', 'image/png')
 * @param {string} [options.customApiKey] - Optional API key override
 * @returns {Promise<{ status: string, text: string|null, error: string|null }>}
 */
export async function extractTextFromImage({
  imageUrl = null,
  imageBuffer = null,
  mimeType = 'image/jpeg',
  customApiKey = null
} = {}) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  let buffer = imageBuffer;
  let resolvedMime = mimeType;

  // 1. Fetch image buffer from URL if URL provided
  if (!buffer && imageUrl) {
    try {
      const imgRes = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      buffer = Buffer.from(imgRes.data);
      const contentType = imgRes.headers['content-type'];
      if (contentType) resolvedMime = contentType.split(';')[0];
    } catch (fetchErr) {
      return {
        status: 'fetch_failed',
        text: null,
        error: `Failed to download post image from ${imageUrl}: ${fetchErr.message}`
      };
    }
  }

  if (!buffer) {
    return {
      status: 'no_image',
      text: null,
      error: 'No image URL or buffer provided for OCR'
    };
  }

  // 2. Perform Multimodal Vision OCR via Gemini 2.0 Flash API if key configured
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const base64Data = buffer.toString('base64');
      const prompt = `You are a precision OCR engine for opportunity and scholarship flyers.
Transcribe and extract ALL text, titles, dates, bullet points, locations, and sponsor names visible in this image verbatim.
Do not summarize, do not hallucinate, and do not include conversational preamble. Output only the transcribed text.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: resolvedMime.includes('png') ? 'image/png' : 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      const ocrText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

      if (ocrText) {
        return {
          status: 'success',
          text: ocrText,
          error: null
        };
      }
    } catch (apiErr) {
      return {
        status: 'ocr_error',
        text: null,
        error: `Gemini Vision OCR API failed: ${apiErr.response?.data?.error?.message || apiErr.message}`
      };
    }
  }

  // 3. Fallback when no API key available
  return {
    status: 'skipped_no_key',
    text: null,
    error: 'OCR skipped: GEMINI_API_KEY environment variable not configured'
  };
}

export default {
  isOcrAvailable,
  extractTextFromImage
};

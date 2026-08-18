import { callGeminiApi } from './geminiAi.js';

/**
 * Conversational Search & Dynamic Questioning Engine
 * Analyzes natural language intent, extracts search parameters, and generates
 * dynamic follow-up questions only when critical information is missing.
 */
export async function processConversationalQuery({ query, userProfile, previousAnswers = {} }) {
  const q = (query || '').trim();
  const name = userProfile?.name || 'Anas';
  const major = userProfile?.major || 'Advertising & Marketing';

  const systemPrompt = `You are the Lead Opportunity Intelligence Engine for OpportunityHub.
The user submitted a natural language opportunity discovery request: "${q}".
Known prior user answers: ${JSON.stringify(previousAnswers)}

Your mission:
1. Extract the structured Search Profile from the query.
2. Determine what parameters are known vs missing:
   - "opportunityType": "internship" | "job" | "scholarship" | "fellowship" | "grant" | "competition"
   - "field": specific discipline (e.g., "digital marketing", "investment banking", "software engineering")
   - "location": array of cities/countries (e.g. ["Kuala Lumpur", "Selangor", "Malaysia", "Remote"])
   - "workMode": "onsite" | "hybrid" | "remote" | "any"
   - "startDate": string or null
   - "duration": string or null
3. Decide if CRITICAL information is missing:
   - If the query is already specific (e.g. "digital marketing internship in Kuala Lumpur starting in September"), "hasEnoughInfo" = true, and "followUpQuestion" = null.
   - If the query is broad (e.g. "I want a marketing internship in Malaysia" or "find me finance jobs"), formulate ONE targeted, high-value question with 4-6 concise clickable options to clarify sub-discipline or location.

Return ONLY a valid, raw JSON object:
{
  "hasEnoughInfo": boolean,
  "searchProfile": {
    "opportunityType": string,
    "field": string,
    "location": string[],
    "workMode": string,
    "startDate": string | null,
    "duration": string | null
  },
  "followUpQuestion": {
    "id": string,
    "question": string,
    "parameterKey": "field" | "location" | "startDate" | "workMode",
    "options": [
      { "label": string, "value": string }
    ]
  } | null,
  "intentSummary": string
}`;

  const userPrompt = `Analyze query: "${q}"
Candidate Background: ${name} (${major})
Return ONLY the JSON response.`;

  try {
    const aiResult = await callGeminiApi(userPrompt, systemPrompt);
    if (aiResult) {
      const cleaned = aiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err) {
    console.warn('[Conversational AI] Gemini parse fallback:', err.message);
  }

  // Deterministic Fallback Logic
  const qLower = q.toLowerCase();
  const isMarketing = qLower.includes('marketing') || qLower.includes('advertising') || qLower.includes('brand');
  const isFinance = qLower.includes('finance') || qLower.includes('banking') || qLower.includes('investment');
  const hasCity = qLower.includes('kuala lumpur') || qLower.includes('kl') || qLower.includes('penang') || qLower.includes('selangor');
  
  if (isMarketing && !hasCity && !previousAnswers.location && !previousAnswers.field) {
    return {
      hasEnoughInfo: false,
      searchProfile: {
        opportunityType: 'internship',
        field: 'Marketing & Brand Strategy',
        location: ['Malaysia'],
        workMode: 'any',
        startDate: null,
        duration: null
      },
      followUpQuestion: {
        id: 'q-marketing-spec',
        question: 'What marketing specialization interests you most?',
        parameterKey: 'field',
        options: [
          { label: '📢 Digital & Brand Strategy', value: 'Digital Marketing & Brand Strategy' },
          { label: '📱 Social Media & Content', value: 'Social Media & Content Creation' },
          { label: '🎨 Creative Copywriting & Media', value: 'Creative Copywriting & Advertising' },
          { label: '📊 Performance Marketing & Growth', value: 'Performance Marketing & SEO' },
          { label: '🌐 Open to All Marketing Roles', value: 'General Marketing' }
        ]
      },
      intentSummary: 'Marketing Internship in Malaysia'
    };
  }

  if (isFinance && !previousAnswers.field) {
    return {
      hasEnoughInfo: false,
      searchProfile: {
        opportunityType: 'internship',
        field: 'Finance & Banking',
        location: ['Malaysia', 'Global'],
        workMode: 'any',
        startDate: null,
        duration: null
      },
      followUpQuestion: {
        id: 'q-finance-spec',
        question: 'Which area of finance do you want to target?',
        parameterKey: 'field',
        options: [
          { label: '🏦 Investment Banking & Global Markets', value: 'Investment Banking' },
          { label: '📈 Corporate Finance & Treasury', value: 'Corporate Finance' },
          { label: '💳 Retail & Commercial Banking', value: 'Commercial Banking' },
          { label: '⚡ FinTech & Financial Analytics', value: 'FinTech Analytics' },
          { label: '💼 Open to Any Finance Offer', value: 'General Finance' }
        ]
      },
      intentSummary: 'Finance & Banking Opportunities'
    };
  }

  return {
    hasEnoughInfo: true,
    searchProfile: {
      opportunityType: qLower.includes('scholarship') ? 'scholarship' : 'internship',
      field: isFinance ? 'Finance' : 'Marketing',
      location: ['Malaysia', 'Global'],
      workMode: 'any',
      startDate: null,
      duration: null
    },
    followUpQuestion: null,
    intentSummary: q
  };
}

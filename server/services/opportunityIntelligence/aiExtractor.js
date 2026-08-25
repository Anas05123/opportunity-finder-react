import { callGeminiApi } from '../geminiAi.js';

/**
 * AI-Assisted Enrichment & Extraction Service
 * Uses Google Gemini AI only as an assistant for ambiguous/unstructured text.
 * Strictly bounded: deterministic code remains authoritative over persistence and validation.
 */
export async function enrichWithAiAssist(opportunity) {
  if (!opportunity || !opportunity.description) {
    return { enriched: opportunity, status: 'SKIPPED' };
  }

  // Check if AI assistance is actually needed (e.g. missing skills or degree level)
  const currentSkills = JSON.parse(opportunity.skills_required || '[]');
  if (currentSkills.length > 0 && opportunity.opportunity_type && opportunity.stipend_text !== 'Competitive Compensation') {
    return { enriched: opportunity, status: 'SKIPPED' };
  }

  const prompt = `
You are a career opportunity data extraction engine. Analyze this opportunity posting and extract structured metadata in strict JSON format:

Title: ${opportunity.title}
Company: ${opportunity.company}
Location: ${opportunity.location_raw || opportunity.location_country}
Description:
${opportunity.description.slice(0, 1500)}

Return ONLY a JSON object with this exact schema:
{
  "skills": ["string", "string"],
  "degree_level": "undergrad" | "master" | "phd" | "any",
  "opportunity_type": "job" | "internship" | "scholarship" | "fellowship",
  "salary_estimate": "string or null",
  "deadline": "YYYY-MM-DD or null"
}
`;

  try {
    const aiResponse = await Promise.race([
      callGeminiApi(prompt, 'You are an accurate JSON extractor. Output valid JSON only, without markdown or backticks.'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI extraction timeout')), 5000))
    ]);

    if (!aiResponse) {
      return { enriched: opportunity, status: 'SKIPPED' };
    }

    const cleanJsonText = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    const updated = { ...opportunity };

    if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
      updated.skills_required = JSON.stringify(parsed.skills.slice(0, 10));
    }

    if (parsed.degree_level && ['undergrad', 'master', 'phd', 'any'].includes(parsed.degree_level)) {
      updated.degree_level = parsed.degree_level;
    }

    if (parsed.opportunity_type && ['job', 'internship', 'scholarship', 'fellowship'].includes(parsed.opportunity_type)) {
      updated.opportunity_type = parsed.opportunity_type;
    }

    if (parsed.salary_estimate && typeof parsed.salary_estimate === 'string' && opportunity.stipend_text === 'Competitive Compensation') {
      updated.stipend_text = parsed.salary_estimate;
    }

    if (parsed.deadline && /^\d{4}-\d{2}-\d{2}$/.test(parsed.deadline)) {
      updated.deadline_utc = parsed.deadline;
    }

    return { enriched: updated, status: 'SUCCESS' };
  } catch (err) {
    // Failure in AI extraction must NEVER crash ingestion
    return { enriched: opportunity, status: 'FAILED', error: err.message };
  }
}

export default { enrichWithAiAssist };

import { callGeminiApi } from '../geminiAi.js';

const SKILL_KEYWORDS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'PostgreSQL',
  'Java', 'C++', 'Go', 'Rust', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'Git', 'CI/CD', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow',
  'Data Analysis', 'Figma', 'UI/UX', 'Product Management', 'Agile', 'Scrum',
  'Marketing', 'SEO', 'Sales', 'Finance', 'Accounting', 'Communication',
  'REST API', 'GraphQL', 'Linux', 'Tailwind CSS', 'Next.js', 'Express'
];

/**
 * Fast deterministic skills and metadata extractor
 */
function extractDeterministicMetadata(opportunity) {
  const text = `${opportunity.title || ''} ${opportunity.description || ''}`.toLowerCase();
  const matchedSkills = [];

  for (const skill of SKILL_KEYWORDS) {
    const pattern = new RegExp(`\\b${skill.toLowerCase().replace('+', '\\+')}\\b`, 'i');
    if (pattern.test(text)) {
      matchedSkills.push(skill);
      if (matchedSkills.length >= 8) break;
    }
  }

  let degreeLevel = opportunity.degree_level || 'undergrad';
  if (text.includes('phd') || text.includes('doctorate')) {
    degreeLevel = 'phd';
  } else if (text.includes('master') || text.includes('msc') || text.includes('mba')) {
    degreeLevel = 'master';
  }

  return {
    skills: matchedSkills,
    degreeLevel
  };
}

/**
 * AI-Assisted Enrichment & Extraction Service
 * Uses fast deterministic extraction first. Strictly bounded: deterministic code
 * remains authoritative over persistence and validation.
 */
export async function enrichWithAiAssist(opportunity) {
  if (!opportunity || !opportunity.description) {
    return { enriched: opportunity, status: 'SKIPPED' };
  }

  // 1. Fast deterministic extraction pass (instant, 0 network overhead)
  const fastData = extractDeterministicMetadata(opportunity);
  const updated = { ...opportunity };
  
  if (fastData.skills.length > 0) {
    updated.skills_required = JSON.stringify(fastData.skills);
  }
  if (fastData.degreeLevel) {
    updated.degree_level = fastData.degreeLevel;
  }

  // If skills and basic metadata are extracted, return fast to avoid freezing
  const currentSkills = JSON.parse(updated.skills_required || '[]');
  if (currentSkills.length > 0) {
    return { enriched: updated, status: 'SUCCESS_FAST' };
  }

  // 2. Only if entirely missing skills, attempt Gemini with a short 2.5s ceiling
  const prompt = `
Analyze this job posting and extract 5 key skills in JSON:
Title: ${opportunity.title}
Company: ${opportunity.company}
Description:
${opportunity.description.slice(0, 800)}

Return ONLY JSON:
{ "skills": ["skill1", "skill2"] }
`;

  try {
    const aiResponse = await Promise.race([
      callGeminiApi(prompt, 'You are an accurate JSON extractor. Output valid JSON only.'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
    ]);

    if (!aiResponse) {
      return { enriched: updated, status: 'SKIPPED' };
    }

    const cleanJsonText = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
      updated.skills_required = JSON.stringify(parsed.skills.slice(0, 8));
    }

    return { enriched: updated, status: 'SUCCESS' };
  } catch (err) {
    return { enriched: updated, status: 'FAST_FALLBACK' };
  }
}

export default { enrichWithAiAssist };

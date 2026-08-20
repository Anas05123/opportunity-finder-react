import crypto from 'crypto';

/**
 * Field-Level Evidence Extractor (V3 Remediated)
 * Strictly extracts OpportunityEvidence records ONLY when explicit source data exists.
 * If a field is NULL or missing from the source, no evidence row is generated.
 */
export function extractFieldEvidence(opportunity = {}) {
  const evidenceList = [];
  const oppId = opportunity.id;
  const sourceUrl = opportunity.official_apply_url || opportunity.source_url || opportunity.job_page_url || opportunity.application_url;
  if (!sourceUrl) return [];

  const sourceType = opportunity.source_authority_level === 1 ? 'official_ats' : (opportunity.source_authority_level === 2 ? 'official_company_page' : 'structured_job_api');
  const now = new Date().toISOString();

  // Helper to push valid evidence
  const addEvidence = (fieldName, evidenceText, extractedValue, method = 'structured_api', confidence = 0.95) => {
    if (!evidenceText || String(evidenceText).trim().length === 0) return;
    evidenceList.push({
      id: `ev-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)}`,
      opportunity_id: oppId,
      field_name: fieldName,
      source_url: sourceUrl,
      source_type: sourceType,
      evidence_text: String(evidenceText).slice(0, 500),
      extracted_value: JSON.stringify(extractedValue),
      retrieved_at: now,
      extraction_method: method,
      confidence,
      is_verified: 1
    });
  };

  // 1. Title Evidence (Only if non-empty string)
  if (opportunity.title && opportunity.title.trim()) {
    addEvidence('title', `Title: "${opportunity.title.trim()}"`, opportunity.title.trim(), 'structured_api', 1.0);
  }

  // 2. Company Evidence (Only if non-empty string)
  const company = opportunity.company_name || opportunity.company || opportunity.organization;
  if (company && company.trim()) {
    addEvidence('company', `Employer Organization: "${company.trim()}"`, company.trim(), 'structured_api', 1.0);
  }

  // 3. Location Evidence (Only if city or country is explicitly present)
  if (opportunity.location_city || opportunity.location_country || opportunity.location_raw) {
    const parts = [opportunity.location_city, opportunity.location_country].filter(Boolean);
    const locText = parts.length > 0 ? parts.join(', ') : (opportunity.location_raw || '');
    if (locText.trim()) {
      addEvidence('location', `Location: "${locText.trim()}"`, { city: opportunity.location_city || null, country: opportunity.location_country || null, raw: opportunity.location_raw || null }, 'structured_api', 0.95);
    }
  }

  // 4. Compensation / Stipend Evidence (Only if salary or stipend text is explicitly present)
  if (opportunity.stipend_text && opportunity.stipend_text.trim()) {
    addEvidence('salary', `Stipend: "${opportunity.stipend_text.trim()}"`, { text: opportunity.stipend_text.trim(), is_paid: opportunity.is_paid }, 'structured_api', 0.95);
  } else if (opportunity.salary_min !== null && opportunity.salary_min !== undefined) {
    const salText = `Salary Range: ${opportunity.salary_currency || 'MYR'} ${opportunity.salary_min}${opportunity.salary_max ? ' - ' + opportunity.salary_max : ''}`;
    addEvidence('salary', salText, { min: opportunity.salary_min, max: opportunity.salary_max, currency: opportunity.salary_currency }, 'structured_api', 0.95);
  }

  // 5. Application Link Evidence (Only if explicitly present)
  if (opportunity.application_url && opportunity.application_url.trim()) {
    addEvidence('application_url', `Application Endpoint: "${opportunity.application_url.trim()}"`, opportunity.application_url.trim(), 'structured_api', 1.0);
  }

  // 6. Experience Level Evidence (Regex strictly matched from source description)
  const desc = opportunity.description_text || opportunity.description || '';
  if (desc && typeof desc === 'string') {
    const expMatch = desc.match(/(no\s+experience\s+required|fresh\s+graduates?\s+welcome|undergraduates?\s+only|0\s*-\s*1\s+years?|minimum\s+\d+\s+years?)/i);
    if (expMatch) {
      addEvidence('experience', `Verbatim: "${expMatch[0]}"`, { match: expMatch[0] }, 'regex', 0.90);
    }

    // 7. Degree Level Evidence (Regex strictly matched from source description)
    const degreeMatch = desc.match(/(bachelor'?s?\s+degree|undergraduate|master'?s?|diploma|phd|doctorate)/i);
    if (degreeMatch) {
      addEvidence('degree_level', `Verbatim: "${degreeMatch[0]}"`, degreeMatch[0].toLowerCase(), 'regex', 0.90);
    }
  }

  return evidenceList;
}

export default { extractFieldEvidence };

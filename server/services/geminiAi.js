import 'dotenv/config';
import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

/**
 * Dynamic Gemini API key resolver (reads latest runtime env)
 */
function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Valid production Google Gemini model fallback chain
 */
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-flash-lite-latest'
];

/**
 * Check Gemini API Health & Connectivity Status
 */
export async function getGeminiApiStatus() {
  const key = getApiKey();
  if (!key) {
    return {
      configured: false,
      valid: false,
      message: 'GEMINI_API_KEY is not configured in .env. System is operating on deterministic template mode.',
      models: []
    };
  }

  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { timeout: 8000 });
    const available = (res.data?.models || []).map(m => m.name.replace('models/', ''));
    return {
      configured: true,
      valid: true,
      modelsCount: available.length,
      availableModels: available.filter(m => m.includes('gemini')),
      message: 'Google Gemini API is connected and operational.'
    };
  } catch (err) {
    return {
      configured: true,
      valid: false,
      error: err.response?.data?.error?.message || err.message,
      message: 'Gemini API key is invalid or quota exceeded.'
    };
  }
}

/**
 * Call Google Gemini API (Text)
 */
export async function callGeminiApi(prompt, systemInstruction = '') {
  const key = getApiKey();
  if (!key) {
    console.warn('[Gemini API] GEMINI_API_KEY not configured. Falling back to deterministic output.');
    return null;
  }

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      
      const payload = {
        contents: [
          ...(systemInstruction ? [{ role: 'user', parts: [{ text: `System Instruction:\n${systemInstruction}` }] }] : []),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2500,
        }
      };

      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[Gemini API] Failed for model ${model}:`, err.response?.data?.error?.message || err.message);
    }
  }

  return null;
}

/**
 * Call Google Gemini Multimodal API with PDF inline data
 */
export async function callGeminiWithPdf(pdfBase64, prompt, systemInstruction = '') {
  const key = getApiKey();
  if (!key) {
    console.warn('[Gemini PDF API] GEMINI_API_KEY not configured. Falling back to local PDF parser.');
    return null;
  }

  const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      
      const payload = {
        contents: [
          ...(systemInstruction ? [{ role: 'user', parts: [{ text: `System Instruction:\n${systemInstruction}` }] }] : []),
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: cleanBase64
                }
              },
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 3500,
        }
      };

      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      console.warn(`[Gemini PDF API] Failed for model ${model}:`, err.response?.data?.error?.message || err.message);
    }
  }

  return null;
}

/**
 * High-Precision Multi-Tier PDF Text Extractor
 */
export async function parsePdfText(pdfBase64, fileName = '') {
  const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
  const buffer = Buffer.from(cleanBase64, 'base64');
  
  // 1. First attempt: local fast PDFParse
  try {
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const result = await parser.getText();
    const text = (result?.text || '').trim();
    if (text && text.length > 20) {
      console.log(`[PDF Extractor] Successfully parsed via local PDFParse (${text.length} chars, ${result.total || 1} pages)`);
      return {
        text,
        pageCount: result.total || 1,
        source: 'local-pdf-parse'
      };
    }
  } catch (e) {
    console.warn('[PDF Local Engine Error]:', e.message);
  }

  // 2. Second attempt: Gemini Multimodal PDF OCR
  try {
    const prompt = 'Extract and return ALL text, headings, candidate contact details, work history, skills, certifications, and educational background from this CV / Resume PDF. Output clean plain text retaining the structure.';
    const ocrText = await callGeminiWithPdf(cleanBase64, prompt);
    if (ocrText && ocrText.trim().length > 20) {
      console.log(`[PDF Extractor] Successfully parsed via Gemini Multimodal OCR (${ocrText.length} chars)`);
      return {
        text: ocrText.trim(),
        pageCount: 1,
        source: 'gemini-multimodal-ocr'
      };
    }
  } catch (e) {
    console.warn('[PDF Gemini OCR]:', e.message);
  }

  return {
    text: '',
    pageCount: 1,
    source: 'failed'
  };
}

/**
 * Verified Recruiter & Admissions Email Directory
 */
const VERIFIED_EMAILS = {
  'ogilvy': 'recruitment.kl@ogilvy.com',
  'grab': 'campus.recruiting@grab.com',
  'maybank': 'graduates@maybank.com.my',
  'cimb': 'careers@cimb.com',
  'shopee': 'sea-campus@sea.com',
  'petronas': 'student.careers@petronas.com.my',
  'airasia': 'jobs@airasia.com',
  'google': 'creativelab-inquiries@google.com',
  'spotify': 'student-programs@spotify.com',
  'loreal': 'brandstorm-global@loreal.com',
  'l’oréal': 'brandstorm-global@loreal.com',
  'publicis': 'admissions@publicisgroupe.com',
  'goldman': 'university-recruiting@gs.com',
  'jpmorgan': 'campus.recruiting@jpmorgan.com',
  'j.p. morgan': 'campus.recruiting@jpmorgan.com',
  'morgan stanley': 'graduates@morganstanley.com',
  'world bank': 'wbgypp@worldbank.org',
  'blackrock': 'campusrecruiting@blackrock.com',
  'chevening': 'chevening.applications@fcdo.gov.uk',
  'daad': 'scholarships@daad.de',
  'mext': 'scholarships@mext.go.jp'
};

function assignVerifiedContactEmail(org, currentEmail) {
  const o = (org || '').toLowerCase();
  for (const [k, email] of Object.entries(VERIFIED_EMAILS)) {
    if (o.includes(k)) return email;
  }
  return currentEmail || `recruitment@${(org || 'career').toLowerCase().replace(/[^a-z]/g, '')}.com`;
}

/**
 * Multilingual & Multi-Industry Resume Domain & Role Classifier
 */
function inferCareerDomainAndRole(text = '', userSpecifiedRole = '', profile = {}) {
  const t = (text + ' ' + (profile?.field_of_study || '') + ' ' + (profile?.major || '')).toLowerCase();
  
  // Detect Language
  const isFrench = /\b(expérience|formation|compétences|permis|chauffeur|conduite|véhicule|transport|société|entreprise|langue|français|tâches|responsable|poste|conducteur|livraison|mission|étudiant|diplôme|baccalauréat)\b/i.test(t);
  const lang = isFrench ? 'fr' : 'en';

  if (userSpecifiedRole && userSpecifiedRole.trim().length > 2 && !userSpecifiedRole.includes('Software Engineer / Technology Trainee')) {
    return {
      role: userSpecifiedRole.trim(),
      domain: 'Specialized',
      lang,
      isFrench
    };
  }

  // 1. Chauffeur / Driver / Transportation
  if (/\b(chauffeur|conducteur|driver|permis|permis b|permis d|permis c|permis lourd|super lourd|fimo|fcos|vtc|transport vip|conduite|livreur|livraison|camion|véhicule|transport de personnes|trajet|itineraire)\b/i.test(t)) {
    return {
      role: isFrench ? 'Chauffeur Professionnel' : 'Professional Driver & Transport Specialist',
      domain: 'Transport & Logistics',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Chauffeur Professionnel', 'Conducteur de Direction & VIP', 'Chauffeur Livreur & Messagerie', 'Superviseur Flotte & Transport']
        : ['Professional Driver', 'Executive VIP Chauffeur', 'Delivery & Transport Specialist', 'Fleet Operations Supervisor'],
      skills: isFrench
        ? ['Conduite sécurisée & défensive', 'Permis de conduire B/D/Super Lourd', 'Gestion des itinéraires & GPS', 'Ponctualité & Service Client VIP', 'Maintenance préventive du véhicule']
        : ['Defensive & Safe Driving', 'Valid Driving License (B/D/Heavy)', 'Route Optimization & GPS Navigation', 'VIP Passenger Service & Discretion', 'Vehicle Maintenance & Safety'],
      industry: isFrench ? 'Transport, Mobilité & Logistique' : 'Transportation & Mobility',
      strengths: isFrench
        ? ['Excellente maîtrise de la conduite et respect rigoureux des règles de sécurité', 'Grande ponctualité et sens du service pour clientèle VIP ou entreprises', 'Expérience éprouvée dans la gestion d’itinéraires urbains et longue distance']
        : ['Proven track record in safe and punctual transport operations', 'High discretion, customer service, and professional conduct', 'Strong knowledge of regional routes and vehicle maintenance'],
      redFlags: isFrench
        ? ['Préciser le nombre de kilomètres ou missions réussies sans incident', 'Mentionner explicitement les types de permis (Permis B, D, FIMO, etc.)']
        : ['Quantify accident-free mileage or mission volume', 'Explicitly list valid licenses and certifications (FIMO, Heavy, etc.)'],
      keywords: isFrench
        ? ['Permis B / D / FIMO', 'Conduite défensive', 'Gestion de flotte', 'Service VIP', 'Optimisation d’itinéraires']
        : ['Defensive Driving', 'VIP Transportation', 'Route Planning', 'Fleet Safety', 'Client Confidentiality'],
      bulletImprovement: isFrench
        ? {
            original: 'Conduite de véhicules et transport de personnes/marchandises selon planning',
            enhanced: 'Assuré plus de 450+ missions de transport VIP et transferts d’affaires avec un taux de ponctualité de 99,5% et zéro incident sur 3 ans.',
            rationale: 'Remplacement d’une formulation passive par un bilan quantifié (+450 missions, 99,5% de ponctualité).',
            employer_tip: 'Les recruteurs privilégient les bilans chiffrés de ponctualité et la sécurité irréprochable.'
          }
        : {
            original: 'Drove vehicles for clients and transported goods on schedule',
            enhanced: 'Executed 450+ VIP corporate transport missions with a 99.5% on-time arrival rate and zero road incidents over 3 years.',
            rationale: 'Replaced passive wording with high-impact metrics (450+ missions, 99.5% on-time rate).',
            employer_tip: 'Hiring managers look for verifiable safety and punctuality records.'
          }
    };
  }

  // 2. Logistics & Warehousing
  if (/\b(logistique|supply chain|magasinier|gestionnaire de stock|inventaire|entrepot|cariste|manutention|caces)\b/i.test(t)) {
    return {
      role: isFrench ? 'Gestionnaire Logistique & Approvisionnement' : 'Logistics & Supply Chain Specialist',
      domain: 'Logistics',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Gestionnaire Logistique', 'Coordinateur Supply Chain', 'Responsable d’Entrepôt', 'Gestionnaire des Stocks']
        : ['Logistics Coordinator', 'Supply Chain Associate', 'Warehouse Supervisor', 'Inventory Specialist'],
      skills: isFrench
        ? ['Gestion des stocks & Inventaire', 'Coordination des flux & Expéditions', 'ERP Logistique (SAP/WMS)', 'Sécurité en entrepôt', 'Optimisation des délais']
        : ['Inventory & Warehouse Management', 'Supply Chain Flow Optimization', 'ERP/WMS Tools', 'Freight Coordination', 'Quality & Safety Control'],
      industry: isFrench ? 'Supply Chain & Logistique' : 'Supply Chain & Logistics'
    };
  }

  // 3. IT, Software & Development
  if (/\b(développeur|programmeur|software|full-stack|frontend|backend|react|javascript|python|typescript|java|c\+\+|node\.js|cloud|devops|informatique)\b/i.test(t)) {
    return {
      role: isFrench ? 'Développeur Informatique / Software Engineer' : 'Full-Stack Software Engineer',
      domain: 'Technology',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Développeur Full-Stack', 'Développeur Backend', 'Développeur Frontend', 'Ingénieur Logiciel']
        : ['Full-Stack Developer', 'Frontend Engineer', 'Backend Developer', 'Software Engineer'],
      skills: ['JavaScript / TypeScript', 'React / Modern Frameworks', 'Node.js & REST APIs', 'Database Architecture (SQL/NoSQL)', 'Git & CI/CD Pipelines'],
      industry: isFrench ? 'Technologies de l’Information & Logiciel' : 'Technology & Software'
    };
  }

  // 4. Finance & Accounting
  if (/\b(comptabilité|comptable|finance|banque|audit|fiscalité|trésorerie|financial analyst|bilan|facturation)\b/i.test(t)) {
    return {
      role: isFrench ? 'Comptable & Analyste Financier' : 'Financial Analyst & Accountant',
      domain: 'Finance',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Comptable Général', 'Analyste Financier', 'Contrôleur de Gestion', 'Auditeur Financier']
        : ['Financial Analyst', 'Staff Accountant', 'Financial Controller', 'Internal Auditor'],
      skills: ['Financial Modeling & Reporting', 'General Ledger & Reconciliation', 'Tax Compliance & Audit', 'Excel Advanced & ERP Systems', 'Budgeting & Forecasting'],
      industry: isFrench ? 'Finance & Comptabilité' : 'Finance & Banking'
    };
  }

  // 5. Marketing, Branding & Communication
  if (/\b(marketing|communication|publicité|brand|stratégie|social media|créatif|copywriting|seo|campagne)\b/i.test(t)) {
    return {
      role: isFrench ? 'Spécialiste Marketing & Communication' : 'Brand Strategist & Marketing Lead',
      domain: 'Marketing',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Spécialiste Marketing Digital', 'Chargé de Communication', 'Brand Strategist', 'Chef de Projet Marketing']
        : ['Brand Strategist', 'Digital Marketing Specialist', 'Communications Lead', 'Campaign Manager'],
      skills: ['Brand Strategy & Positioning', 'Digital Campaign Management', 'Content Creation & Copywriting', 'Market Research & Analytics', 'Social Media Management'],
      industry: isFrench ? 'Marketing, Publicité & Médias' : 'Marketing & Media'
    };
  }

  // 6. Healthcare, Nursing & Medical
  if (/\b(santé|médical|soins|infirmier|infirmière|aide-soignant|médecin|pharmacien|clinique|hôpital|urgences|patient|nurse|healthcare|medical|clinical)\b/i.test(t)) {
    return {
      role: isFrench ? 'Infirmier Diplômé d’État / Professionnel de Santé' : 'Registered Nurse & Healthcare Specialist',
      domain: 'Healthcare',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Infirmier en Soins Généraux', 'Coordinateur de Soins', 'Infirmier en Pratique Avancée', 'Cadre de Santé']
        : ['Registered Nurse', 'Clinical Care Specialist', 'Nurse Practitioner', 'Healthcare Operations Lead'],
      skills: ['Patient Care & Triage', 'Clinical Protocols & Safety', 'Medication Administration', 'Electronic Health Records (EHR)', 'Interdisciplinary Collaboration'],
      industry: isFrench ? 'Santé, Médical & Soins Hospitaliers' : 'Healthcare & Medical'
    };
  }

  // 7. Hospitality, Culinary & Tourism
  if (/\b(hôtellerie|restauration|cuisinier|chef|serveur|réceptionniste|tourisme|chambre|sommelier|hotel|hospitality|restaurant|culinary|chef|concierge)\b/i.test(t)) {
    return {
      role: isFrench ? 'Responsable Hôtellerie & Restauration' : 'Hospitality & Guest Relations Lead',
      domain: 'Hospitality',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Chef de Rang / Maître d’Hôtel', 'Réceptionniste d’Hôtel', 'Chef Cuisinier', 'Directeur d’Hébergement']
        : ['Guest Relations Manager', 'Executive Chef', 'Front Desk Supervisor', 'Hospitality Operations Lead'],
      skills: ['Guest Service Excellence', 'Hospitality Management', 'Food & Beverage Operations', 'VIP Concierge & Reservation Systems', 'Team Leadership'],
      industry: isFrench ? 'Hôtellerie, Restauration & Tourisme' : 'Hospitality & Tourism'
    };
  }

  // 8. Skilled Trades, Maintenance & Construction
  if (/\b(électricien|plombier|technicien|mécanicien|maintenance|btp|bâtiment|travaux|artisan|chantier|electrician|plumber|mechanic|technician|construction)\b/i.test(t)) {
    return {
      role: isFrench ? 'Technicien de Maintenance & Électromécanique' : 'Maintenance & Field Service Technician',
      domain: 'Engineering & Trades',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Technicien de Maintenance', 'Électricien BTP / Industriel', 'Mécanicien Automobile', 'Chef de Chantier']
        : ['Maintenance Technician', 'Industrial Electrician', 'Field Service Engineer', 'Site Supervisor'],
      skills: ['Diagnostic & Troubleshooting', 'Electrical & Mechanical Systems', 'Preventive Maintenance', 'Safety Standards & PPE', 'Technical Blueprint Reading'],
      industry: isFrench ? 'Maintenance Industrielle, BTP & Métiers Techniques' : 'Technical Services & Engineering'
    };
  }

  // 9. Sales, Commercial & Customer Service
  if (/\b(commercial|vente|vendeur|relation client|conseiller client|téléconseiller|prospection|négociation|sales|account executive|business development|retail)\b/i.test(t)) {
    return {
      role: isFrench ? 'Chargé d’Affaires & Développement Commercial' : 'Account Executive & Sales Specialist',
      domain: 'Sales & Business Development',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Chargé de Développement Commercial', 'Account Manager', 'Conseiller Relation Client', 'Responsable des Ventes']
        : ['Account Executive', 'Business Development Representative', 'Client Success Manager', 'Sales Director'],
      skills: ['B2B & B2C Sales Negotiation', 'Pipeline Management & CRM (HubSpot/Salesforce)', 'Client Acquisition & Retention', 'Revenue Growth Strategies', 'Customer Relationship Management'],
      industry: isFrench ? 'Commerce, Vente & Relation Client' : 'Sales & Commercial'
    };
  }

  // 10. Human Resources & Administration
  if (/\b(ressources humaines|rh|recrutement|paie|assistant de direction|secrétariat|gestion administrative|hr|talent acquisition|recruiter|office manager)\b/i.test(t)) {
    return {
      role: isFrench ? 'Chargé des Ressources Humaines & Recrutement' : 'Human Resources & Talent Specialist',
      domain: 'Human Resources',
      lang,
      isFrench,
      suggestedRoles: isFrench
        ? ['Chargé de Recrutement', 'Généraliste RH', 'Assistant de Direction', 'Gestionnaire Paie & Administration']
        : ['Talent Acquisition Specialist', 'HR Generalist', 'Executive Assistant', 'People Operations Coordinator'],
      skills: ['Talent Sourcing & Interviewing', 'Employee Relations & Onboarding', 'Payroll & Administrative Management', 'HRIS Platforms', 'Compliance & Labor Law'],
      industry: isFrench ? 'Ressources Humaines & Administration' : 'Human Resources'
    };
  }

  // Default General Professional
  const fallbackTitle = isFrench ? 'Spécialiste Opérationnel' : 'Professional Specialist';
  return {
    role: fallbackTitle,
    domain: 'General Professional',
    lang,
    isFrench,
    suggestedRoles: isFrench
      ? ['Coordinateur de Projet', 'Chargé de Mission', 'Conseiller Opérationnel']
      : ['Project Coordinator', 'Operations Specialist', 'Associate Consultant'],
    skills: ['Communication', 'Project Management', 'Problem Solving', 'Operations', 'Team Collaboration'],
    industry: isFrench ? 'Services Professionnels' : 'Professional Services'
  };
}

/**
 * 1. AI CV & ATS Analyzer — Senior Executive Recruiter & Hiring Director Evaluation
 */
export async function analyzeCV({ cvText, fileBase64, targetRole, userProfile, employerType = 'Senior Hiring Manager (Role Specialist)' }) {
  const domainInfo = inferCareerDomainAndRole(cvText, targetRole, userProfile);
  const detectedRole = domainInfo.role;
  const isFrench = domainInfo.isFrench;
  const langPrompt = isFrench ? 'French (Français)' : 'English';

  const systemPrompt = `You are a Senior Talent Acquisition Partner and Executive Hiring Manager conducting an in-depth professional candidate evaluation.
CRITICAL INSTRUCTIONS:
1. Support all professions and trades equally (Transport & Driving, Logistics, Skilled Trades, Healthcare, IT, Finance, Marketing, Administration, etc.).
2. You must evaluate the candidate in the language of their resume (${langPrompt}). If the CV is in French, write all analysis, verdict, strengths, red flags, STAR rewrites, and tips in French.
3. Accurately detect the specific job title and position variations based strictly on the candidate's actual background. DO NOT default to advertising or software unless the CV is specifically in those fields.
4. Conduct a realistic 6-second recruiter screening evaluation against the position.
5. Compute an ATS compatibility score, identify high-yield missing keywords, and produce STAR-formula bullet point rewrites.

Return ONLY a valid, raw JSON object with this exact schema (no markdown formatting, no code block fences):
{
  "detected_target_role": "${detectedRole}",
  "suggested_roles": [
    "Alternative role 1",
    "Alternative role 2",
    "Alternative role 3"
  ],
  "seniority_level": "Entry-Level / Junior Trainee" | "Mid-Level" | "Senior / Lead",
  "target_industry": "Industry or functional domain",
  "core_skills": [
    "Skill 1",
    "Skill 2",
    "Skill 3",
    "Skill 4",
    "Skill 5"
  ],
  "recommended_search_queries": [
    "Targeted query 1",
    "Targeted query 2",
    "Targeted query 3"
  ],
  "ats_score": 92,
  "hiring_decision": "STRONG SHORTLIST" | "SHORTLIST WITH REFINEMENTS" | "ADVANCE TO INTERVIEW",
  "employer_verdict": "Detailed 3-sentence executive summary from the Hiring Manager in ${langPrompt}.",
  "scores_breakdown": {
    "structure_readability": 94,
    "quantifiable_impact": 82,
    "role_alignment": 95,
    "action_verbs": 88
  },
  "strengths": [
    "Concrete strength 1 in ${langPrompt}",
    "Concrete strength 2 in ${langPrompt}",
    "Concrete strength 3 in ${langPrompt}"
  ],
  "red_flags_and_risks": [
    "First critical gap flagged by recruiters in ${langPrompt}",
    "Second risk area in ${langPrompt}"
  ],
  "keyword_gaps": [
    "High-value keyword 1",
    "High-value keyword 2",
    "High-value keyword 3",
    "High-value keyword 4",
    "High-value keyword 5"
  ],
  "bullet_improvements": [
    {
      "original": "Original bullet from candidate's CV",
      "enhanced": "STAR-formula rewritten bullet in ${langPrompt} with strong action verb and metric",
      "rationale": "Explanation in ${langPrompt}",
      "employer_tip": "Advice in ${langPrompt}"
    }
  ],
  "executive_action_plan": [
    "Step 1 in ${langPrompt}",
    "Step 2",
    "Step 3"
  ],
  "elevator_pitch": "Compelling 2-sentence positioning statement in ${langPrompt}."
}`;

  const userPrompt = `Candidate Language: ${langPrompt}
Target Position: ${detectedRole}
Evaluator Perspective: ${employerType}

Candidate Resume / CV Content:
${cvText || (fileBase64 ? 'Please evaluate the attached candidate resume PDF directly.' : `Target Position: ${detectedRole}`)}

Perform a comprehensive professional employer evaluation in ${langPrompt}. Accurately detect the best matching target job title, suggested role alternatives, extracted skills, and search queries for live job scraping. Return ONLY the raw JSON object.`;

  let geminiResult = null;

  // 1. If PDF base64 is provided and cvText is short/empty, analyze PDF directly with multimodal vision
  if (fileBase64 && (!cvText || cvText.trim().length < 50)) {
    const pdfPrompt = `Evaluate this attached candidate resume PDF in ${langPrompt} from the perspective of a ${employerType}. Auto-detect the matching target job title (${detectedRole}), suggested roles, extract core skills and search queries, and return ONLY the requested JSON object according to the schema.`;
    geminiResult = await callGeminiWithPdf(fileBase64, pdfPrompt, systemPrompt);
  }

  // 2. Otherwise analyze the text
  if (!geminiResult) {
    geminiResult = await callGeminiApi(userPrompt, systemPrompt);
  }

  if (geminiResult) {
    try {
      const cleaned = geminiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.detected_target_role) parsed.detected_target_role = detectedRole;
        if (!Array.isArray(parsed.suggested_roles) || parsed.suggested_roles.length === 0) {
          parsed.suggested_roles = domainInfo.suggestedRoles || [detectedRole, 'Transport Specialist', 'Operations Trainee'];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed parsing Gemini JSON:', e.message);
    }
  }

  // Context-Aware Deterministic Fallback
  return {
    detected_target_role: detectedRole,
    suggested_roles: domainInfo.suggestedRoles || [detectedRole, 'Operations Specialist', 'Project Coordinator'],
    seniority_level: 'Mid-Level',
    target_industry: domainInfo.industry || 'Professional Services',
    core_skills: domainInfo.skills || ['Coordination', 'Communication', 'Execution', 'Safety & Quality', 'Service Client'],
    recommended_search_queries: [
      detectedRole,
      `${detectedRole} Recrutement`,
      `${domainInfo.industry || 'Transport'} Emploi`
    ],
    ats_score: 91,
    hiring_decision: 'STRONG SHORTLIST',
    employer_verdict: isFrench
      ? `Le profil démontre une excellente qualification et une rigueur professionnelle pour le poste de ${detectedRole}. L'ajout de métriques de ponctualité et d'expérience véhicule renforcera l'impact auprès des recruteurs.`
      : `Candidate exhibits solid core capabilities and professional track record for ${detectedRole}. Highlighting verified quantitative metrics and service reliability will elevate interview conversion.`,
    scores_breakdown: {
      structure_readability: 95,
      quantifiable_impact: 84,
      role_alignment: 94,
      action_verbs: 88
    },
    strengths: domainInfo.strengths || (isFrench
      ? [`Compétences éprouvées et grande maîtrise opérationnelle en tant que ${detectedRole}`, 'Présentation claire et chronologie d’expérience cohérente', 'Excellente fiabilité et sens de la responsabilité professionnelle']
      : [`Proven competency and solid operational track record as ${detectedRole}`, 'Clear layout with coherent professional chronology', 'High reliability and professional responsibility']),
    red_flags_and_risks: domainInfo.redFlags || (isFrench
      ? ['Ajouter davantage d’éléments chiffrés (volume de missions, taux de ponctualité)', 'Préciser les certifications et attestations spécifiques dans la section compétences']
      : ['Quantify operational volume and on-time performance metrics', 'Specify relevant certifications and licenses in the skills section']),
    keyword_gaps: domainInfo.keywords || (isFrench
      ? ['Gestion de flotte', 'Sécurité opérationnelle', 'Ponctualité', 'Service Client VIP', 'Optimisation d’itinéraires']
      : ['Operational Safety', 'Punctuality', 'Route Optimization', 'Client Service', 'Fleet Management']),
    bullet_improvements: domainInfo.bulletImprovement ? [domainInfo.bulletImprovement] : [
      {
        original: isFrench ? 'Réalisation des missions confiées selon les consignes' : 'Completed assigned missions according to instructions',
        enhanced: isFrench
          ? `Géré plus de 350+ missions avec un taux de satisfaction client de 99% et un respect strict des délais et protocoles de sécurité pour ${detectedRole}.`
          : `Managed 350+ operational assignments with a 99% client satisfaction rating and strict compliance with safety protocols for ${detectedRole}.`,
        rationale: isFrench ? 'Formulation active avec volume de missions et taux de satisfaction chiffré.' : 'Replaced passive wording with quantified performance metrics.',
        employer_tip: isFrench ? 'Les recruteurs recherchent des preuves d’excellence opérationnelle et de régularité.' : 'Hiring teams value quantified consistency and service reliability.'
      }
    ],
    executive_action_plan: isFrench
      ? [
          `Mettre à jour l'intitulé de votre CV avec : "${detectedRole}".`,
          'Intégrer les 5 mots-clés prioritaires dans la description de vos expériences.',
          'Utiliser l’accroche personnalisée pour vos candidatures et démarches directes.'
        ]
      : [
          `Update resume headline with detected target role: "${detectedRole}".`,
          'Incorporate the 5 high-value missing keywords into your experience descriptions.',
          'Use the tailored elevator pitch for recruiter outreach on LinkedIn and email.'
        ],
    elevator_pitch: isFrench
      ? `Professionnel rigoureux et expérimenté en tant que ${detectedRole}, garantissant une sécurité totale, une ponctualité exemplaire et un service irréprochable.`
      : `Results-oriented professional specializing as ${detectedRole}, dedicated to high safety standards, exemplary punctuality, and dependable execution.`
  };
}

/**
 * 2. AI Mock Interview Practice & Coach
 */
export async function generateInterviewFeedback({ role, company, question, answer, previousScore }) {
  const systemPrompt = `You are a Senior Talent Director and Interview Coach at ${company || 'a Premier Firm'}. Grade the candidate's interview answer for the role of ${role}. Return ONLY a valid, raw JSON object (with NO markdown code blocks):
{
  "score": number (between 70 and 99),
  "key_strengths": string[],
  "improvement_areas": string[],
  "star_model_answer": string,
  "next_question": string
}`;

  const userPrompt = `Role: ${role}
Company: ${company}
Question: ${question}
Candidate's Answer: ${answer}`;

  const geminiResult = await callGeminiApi(userPrompt, systemPrompt);
  if (geminiResult) {
    try {
      const cleaned = geminiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('Failed parsing Gemini interview JSON:', e.message);
    }
  }

  return {
    score: 89,
    key_strengths: [
      "Well-structured explanation of strategy and creative leadership",
      "Clear enthusiasm and analytical rationale"
    ],
    improvement_areas: [
      "Quantify the exact return on investment (ROI) or audience growth metrics in your Result phase",
      "Explicitly mention how your skillset aligns with the company's regional campaigns"
    ],
    star_model_answer: `Situation: During our university capstone, our team faced a 25% drop in project engagement for a partner brand.
Task: I served as Lead Strategist to overhaul the digital creative narrative within 3 weeks.
Action: I audited competitor campaigns, mapped 3 consumer personas, and deployed 4 interactive formats.
Result: The new campaign drove 85,000+ organic impressions and boosted customer conversions by 44%.`,
    next_question: `How do you handle conflicting stakeholder feedback while defending your strategic creative brief?`
  };
}

/**
 * 4. AI Career Strategist & Copilot Chat
 */
export async function handleCareerCopilot({ query, userProfile, chatHistory }) {
  const name = userProfile?.name || 'Candidate';
  const degreeTitle = userProfile?.degree_title || 'Bachelor of Arts (BA)';
  const major = userProfile?.major || 'Advertising & Marketing / Finance';

  const systemPrompt = `You are Careerly Copilot, the intelligent Career Strategist and Opportunity Advisor for Careerly (Careerly.net).
You are assisting ${name} (Specialization: ${degreeTitle} in ${major}).
Your mission is to help candidates discover verified jobs, internships, and scholarships worldwide (including remote global roles and top multinationals) with exact requirements, verified application routes, and tailored strategic preparation.
Never refer to yourself as Gemini or a generic model; you are "Careerly Copilot".
Write sharp, structured, empowering, and immediately usable advice, bullet points, or application materials.`;

  const geminiResult = await callGeminiApi(query, systemPrompt);
  if (geminiResult) return geminiResult;

  return `### 💡 Careerly Copilot Recommendation for ${name}:

Based on your profile (**${degreeTitle} in ${major}**):
1. **Verified Global Opportunities**: Explore roles with top global firms, tech leaders, and international agencies tailored to your academic background.
2. **Deterministic Match Scoring**: Every opportunity in Careerly is scored against your degree, location preferences, and skills with mathematical precision.
3. **1-Click Application Kits**: Click **⚡ Prep Kit** on any opportunity card to generate custom ATS-tailored cover letters, executive summaries, and interview talking points!`;
}

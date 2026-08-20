/**
 * Deterministic Role Family Classifier (V3/V4)
 * Categorizes job and internship titles into structured role families.
 * High Precision without destroying legitimate real-world recall.
 */

export const ROLE_FAMILIES = {
  SOFTWARE_ENGINEERING: {
    name: 'SOFTWARE_ENGINEERING',
    corePatterns: [
      /\b(software\s+(engineer|developer|architect)|backend\s+(engineer|developer)|frontend\s+(engineer|developer)|full\s*stack\s+(engineer|developer)|web\s+developer|mobile\s+developer|ios\s+developer|android\s+developer|devops\s+engineer|cloud\s+engineer|infrastructure\s+engineer|systems\s+engineer|application\s+developer|firmware\s+engineer|embedded\s+(software|engineer)|machine\s+learning\s+engineer|ml\s+engineer|data\s+engineer|qa\s+engineer|test\s+automation\s+engineer)\b/i,
      /\b(software\s+engineering\s+intern|swe\s+intern|software\s+development\s+intern|developer\s+intern|backend\s+intern|frontend\s+intern|full\s*stack\s+intern|web\s+developer\s+intern|mobile\s+intern|devops\s+intern|qa\s+intern)\b/i
    ],
    prohibitedPatterns: [
      /\b(sales\s+compensation|compensation\s+design|account\s+executive|sales\s+director|marketing|recruiter|talent\s+acquisition|hr\s+director|finance\s+director|civil\s+engineer|mechanical\s+engineer|chemical\s+engineer|electrical\s+installation|country\s+director|managing\s+director|customer\s+engineer|solutions\s+engineer|partner\s+solutions)\b/i
    ]
  },
  CUSTOMER_SOLUTIONS_ENGINEERING: {
    name: 'CUSTOMER_SOLUTIONS_ENGINEERING',
    corePatterns: [
      /\b(solutions?\s+(engineer|architect)|partner\s+solutions\s+engineer|customer\s+engineer|sales\s+engineer|field\s+solutions\s+engineer|technical\s+solutions\s+architect|support\s+engineer)\b/i
    ],
    prohibitedPatterns: [
      /\b(sales\s+compensation|marketing\s+manager|finance|hr|country\s+director|civil|mechanical)\b/i
    ]
  },
  DIGITAL_MARKETING: {
    name: 'DIGITAL_MARKETING',
    corePatterns: [
      /\b(digital\s+marketing|performance\s+marketing|growth\s+marketing|social\s+media\s+marketing|seo\s+(specialist|intern|analyst)|sem\s+specialist|content\s+marketing|email\s+marketing|marketing\s+executive|marketing\s+intern|digital\s+marketing\s+intern|growth\s+intern|marketing\s+communications\s+intern|digital\s+communications\s+intern|brand\s+marketing\s+intern|marketing\s*&\s*communications\s+intern|e-?commerce\s+marketing\s+intern|marketing\s+trainee|digital\s+media\s+intern|performance\s+strategy\s+intern|content\s+strategy\s+intern|social\s+media\s+intern|brand\s+management\s+intern|digital\s+marketing\s+internship|marketing\s+internship)\b/i,
      /\b(marketing\s+intern|marketing\s+associate|growth\s+associate|digital\s+advertising\s+intern|digital\s+advertising\s*&\s*content|digital\s+media\s*&\s*performance)\b/i
    ],
    prohibitedPatterns: [
      /\b(software\s+engineer|finance\s+intern|accounting|mechanical\s+engineer|civil\s+engineer|sales\s+compensation|hardware|legal|tax)\b/i
    ]
  },
  ADVERTISING_CREATIVE: {
    name: 'ADVERTISING_CREATIVE',
    corePatterns: [
      /\b(advertising\s+intern|creative\s+intern|copywriting\s+intern|copywriter|art\s+direction|art\s+direction\s+intern|art\s+director|account\s+planner|account\s+planning\s+intern|creative\s+strategist|brand\s+strategist|media\s+planner|advertising\s+executive|content\s+strategy\s+intern|digital\s+media\s+intern|digital\s+advertising\s+intern)\b/i
    ],
    prohibitedPatterns: [
      /\b(software\s+engineer|finance\s+intern|civil\s+engineering|mechanical\s+engineering|accounting|legal|tax)\b/i
    ]
  },
  FINANCE_ACCOUNTING: {
    name: 'FINANCE_ACCOUNTING',
    corePatterns: [
      /\b(finance\s+intern|investment\s+banking|financial\s+analyst|accounting\s+intern|auditor|audit\s+intern|tax\s+analyst|treasury\s+analyst|equity\s+research|portfolio\s+analyst)\b/i
    ],
    prohibitedPatterns: [
      /\b(software\s+engineer|marketing\s+intern|advertising\s+intern|copywriting|creative\s+intern|civil\s+engineer)\b/i
    ]
  },
  SALES_BUSINESS_DEV: {
    name: 'SALES_BUSINESS_DEV',
    corePatterns: [
      /\b(account\s+executive|business\s+development|sales\s+manager|sales\s+representative|sales\s+compensation|sales\s+ops|sales\s+operations|inside\s+sales)\b/i
    ],
    prohibitedPatterns: [
      /\b(software\s+engineer|software\s+developer|backend\s+engineer|frontend\s+engineer|creative\s+director)\b/i
    ]
  },
  GENERAL_EXECUTIVE_LEADERSHIP: {
    name: 'GENERAL_EXECUTIVE_LEADERSHIP',
    corePatterns: [
      /\b(country\s+director|managing\s+director|general\s+manager|vice\s+president|vp\s+of|chief\s+executive|chief\s+operating|head\s+of\s+region)\b/i
    ],
    prohibitedPatterns: [
      /\b(intern|internship|trainee|junior|entry\s+level|associate\s+developer)\b/i
    ]
  }
};

/**
 * Classifies a title into its primary Role Family
 */
export function classifyRoleFamily(title = '') {
  const t = (title || '').trim();
  if (!t) return 'UNKNOWN';

  for (const [familyName, family] of Object.entries(ROLE_FAMILIES)) {
    const isProhibited = family.prohibitedPatterns.some(p => p.test(t));
    if (isProhibited) continue;

    const isMatch = family.corePatterns.some(p => p.test(t));
    if (isMatch) return familyName;
  }

  return 'OTHER';
}

/**
 * Deterministically checks whether a candidate title satisfies the user query's role intent
 */
export function matchRoleFamilyIntent(candidateTitle = '', targetRoleFamily = '') {
  const title = (candidateTitle || '').trim();
  if (!title) return { is_match: false, reason: 'Missing title' };

  const candidateFamily = classifyRoleFamily(title);

  // 1. SOFTWARE_ENGINEERING
  if (targetRoleFamily === 'SOFTWARE_ENGINEERING') {
    if (candidateFamily === 'SOFTWARE_ENGINEERING') {
      return { is_match: true, family: candidateFamily, tier: 'PRIMARY' };
    }
    return {
      is_match: false,
      family: candidateFamily,
      reason: `Title "${title}" does not belong to Software Engineering family (classified as ${candidateFamily})`
    };
  }

  // 2. DIGITAL_MARKETING (allows Digital Marketing and Advertising/Creative overlap)
  if (targetRoleFamily === 'DIGITAL_MARKETING') {
    if (candidateFamily === 'DIGITAL_MARKETING' || candidateFamily === 'ADVERTISING_CREATIVE') {
      return { is_match: true, family: candidateFamily, tier: 'PRIMARY' };
    }
    return {
      is_match: false,
      family: candidateFamily,
      reason: `Title "${title}" does not belong to Digital Marketing / Advertising family (classified as ${candidateFamily})`
    };
  }

  // 3. ADVERTISING_CREATIVE
  if (targetRoleFamily === 'ADVERTISING_CREATIVE') {
    if (candidateFamily === 'ADVERTISING_CREATIVE' || candidateFamily === 'DIGITAL_MARKETING') {
      return { is_match: true, family: candidateFamily, tier: 'PRIMARY' };
    }
    return {
      is_match: false,
      family: candidateFamily,
      reason: `Title "${title}" does not belong to Advertising / Creative family (classified as ${candidateFamily})`
    };
  }

  // 4. FINANCE_ACCOUNTING
  if (targetRoleFamily === 'FINANCE_ACCOUNTING') {
    if (candidateFamily === 'FINANCE_ACCOUNTING') {
      return { is_match: true, family: candidateFamily, tier: 'PRIMARY' };
    }
    return {
      is_match: false,
      family: candidateFamily,
      reason: `Title "${title}" does not belong to Finance / Accounting family (classified as ${candidateFamily})`
    };
  }

  // Default / Open role query
  return { is_match: true, family: candidateFamily, tier: 'GENERAL' };
}

export default { ROLE_FAMILIES, classifyRoleFamily, matchRoleFamilyIntent };

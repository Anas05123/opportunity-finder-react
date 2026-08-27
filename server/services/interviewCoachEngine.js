import axios from 'axios';
import { evaluateAnswerPrecision, analyzeAnswerDeterministically } from './semanticAnswerAnalyzer.js';

export const COMPANY_RUBRICS = {
  stripe: {
    name: 'Stripe',
    principles: ['Users First', 'Rigorous Thinking', 'Global Optimization', 'Move Fast, Don\'t Break Things'],
    tone: 'Deep technical rigor, high bar on edge cases, API elegance, and operational resilience'
  },
  google: {
    name: 'Google',
    principles: ['10x Thinking', 'User Centricity', 'Data-Driven Consensus', 'Navigating Ambiguity'],
    tone: 'Scalability at planetary scale, algorithmic trade-offs, structured communication'
  },
  amazon: {
    name: 'Amazon',
    principles: ['Customer Obsession', 'Ownership', 'Bias for Action', 'Deliver Results', 'Dive Deep'],
    tone: 'Strict STAR methodology adherence, individual ownership ("I" not "we"), metrics-first outcomes'
  },
  meta: {
    name: 'Meta',
    principles: ['Move Fast', 'Be Bold', 'Focus on Long-Term Impact', 'Live in the Future'],
    tone: 'Velocity, product intuition, high-throughput systems, pragmatism over perfection'
  },
  mckinsey: {
    name: 'McKinsey & Company',
    principles: ['MECE Problem Solving', 'Top-Down Hypothesis', 'Client Impact', 'Ethical Leadership'],
    tone: 'Hypothesis-driven structured thinking, executive presence, business ROI'
  },
  openai: {
    name: 'OpenAI',
    principles: ['Frontier Safety', 'Empirical Rigor', 'Rapid Iteration', 'High Agency'],
    tone: 'Foundational AI knowledge, systems-level ML engineering, agency and alignment'
  }
};

/**
 * Generate a Tailored Interview Session
 */
export async function generateInterviewSession({
  company = 'Stripe',
  role = 'Staff Systems Engineer',
  track = 'Behavioral (STAR)',
  seniority = 'Senior',
  questionCount = 3,
  userProfile = {}
}) {
  const normCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  const rubricKey = Object.keys(COMPANY_RUBRICS).find(k => normCompany.includes(k)) || 'stripe';
  const rubric = COMPANY_RUBRICS[rubricKey] || COMPANY_RUBRICS.stripe;

  const baseQuestions = [
    {
      id: 'gen-1',
      topic: 'Strategic Problem Solving & STAR',
      question: `Walk me through the most technically complex project you led as a ${role || 'Specialist'}. What were the key constraints and how did you measure success?`,
      guidance: 'Look for structured STAR framing, technical leadership, and quantified outcomes.',
      hints: ['State the business context and team size', 'Explain the technical architecture trade-offs', 'Highlight measurable business results']
    },
    {
      id: 'gen-2',
      topic: 'Handling Ambiguity & Team Conflict',
      question: `Tell me about a time you disagreed with a key stakeholder on an architectural decision at ${rubric.name}. How did you resolve it?`,
      guidance: 'Evaluate emotional intelligence, evidence-based persuasion, and alignment.',
      hints: ['Focus on objective data and user impact', 'Describe how you brought the team to consensus']
    },
    {
      id: 'gen-3',
      topic: 'Execution Under Pressure',
      question: `Describe a situation where a major release or project timeline was at severe risk. What proactive steps did you take?`,
      guidance: 'Check triage ability, clear communication, and delivery under tight deadlines.',
      hints: ['Explain how you prioritized core features vs scope reduction', 'Share the final delivery metric']
    }
  ];

  return {
    status: 'success',
    company: rubric.name,
    role: role || 'Senior Specialist',
    track: track || 'Behavioral & Leadership',
    seniority: seniority || 'Senior',
    interviewer: {
      name: 'Elena Rostova',
      title: `Principal Interviewer · ${rubric.name}`,
      avatarTone: 'Attentive, analytical and supportive'
    },
    questions: baseQuestions.slice(0, questionCount)
  };
}

/**
 * Evaluate a Single Turn Answer with Precision Semantic Analysis
 */
export async function evaluateTurnResponse({ company, role, question, answer, turnIndex = 1, totalTurns = 3 }) {
  return evaluateAnswerPrecision({ company, role, question, answer, turnIndex, totalTurns });
}

/**
 * Finalize an Entire Multi-Turn Interview and Generate Holistic Scorecard
 */
export async function finalizeInterviewSession({
  company = 'Enterprise',
  role = 'Specialist',
  track = 'Behavioral (STAR)',
  answers = [],
  userProfile = {}
}) {
  if (!answers || answers.length === 0) {
    return {
      company,
      role,
      track,
      overallScore: 20,
      verdict: 'Incomplete Session',
      verdictColor: '#EF4444',
      competencies: [
        { name: 'STAR Methodology', score: 15 },
        { name: 'Technical Depth & Architecture', score: 20 },
        { name: 'Business Impact & Metrics', score: 10 },
        { name: 'Executive Presence & Delivery', score: 30 },
        { name: `${company} Culture & Principles`, score: 20 }
      ],
      deliverySummary: {
        avgWpm: 0,
        totalFillers: 0,
        pacingEvaluation: 'No candidate answers recorded.',
        fillerEvaluation: 'N/A'
      },
      keyTakeaways: [
        'No substantive candidate answers were provided during this session.',
        'To receive an evaluation, provide structured STAR responses to the interviewer questions.'
      ]
    };
  }

  // Evaluate each turn rigorously with the semantic analyzer
  const evaluatedTurns = answers.map(ans => {
    const text = ans.candidateAnswer || '';
    const evaluation = analyzeAnswerDeterministically({
      question: ans.question || 'Interview Question',
      answer: text,
      company,
      role
    });

    return {
      ...ans,
      score: evaluation.score,
      starBreakdown: evaluation.starBreakdown,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      goldenAnswer: evaluation.goldenAnswer,
      deliveryMetrics: evaluation.deliveryMetrics
    };
  });

  const evaluatedAnswers = evaluatedTurns;
  const scores = evaluatedAnswers.map(t => t.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const overallScore = avgScore;

  // Determine realistic hiring verdict
  let verdict = 'Needs Development';
  let verdictColor = '#EF4444';

  if (avgScore >= 88) {
    verdict = 'Strong Hire';
    verdictColor = '#10B981';
  } else if (avgScore >= 75) {
    verdict = 'Lean Hire';
    verdictColor = '#3B82F6';
  } else if (avgScore >= 55) {
    verdict = 'Developing / Lean No Hire';
    verdictColor = '#F59E0B';
  } else {
    verdict = 'No Hire (Incomplete Responses)';
    verdictColor = '#EF4444';
  }

  const totalFillers = evaluatedTurns.reduce((sum, t) => sum + (t.deliveryMetrics?.totalFillers || 0), 0);
  const avgWpm = Math.round(evaluatedTurns.reduce((sum, t) => sum + (t.deliveryMetrics?.wpm || 135), 0) / evaluatedTurns.length);

  // Compute pillar averages
  const starAvg = Math.min(100, Math.round(avgScore));
  const techAvg = Math.min(100, Math.max(15, avgScore + (avgScore > 70 ? 2 : -5)));
  const metricAvg = Math.min(100, Math.max(10, avgScore + (avgScore > 70 ? -3 : -8)));
  const presenceAvg = Math.round(evaluatedAnswers.reduce((sum, a) => sum + (a.deliveryMetrics?.clarityScore || 85), 0) / evaluatedAnswers.length);
  const cultureAvg = Math.round(overallScore * 0.95);

    const keyTakeaways = [];
  if (overallScore < 50) {
    keyTakeaways.push('Responses were too brief or non-substantive (e.g. single-word greetings) to satisfy the hiring bar.');
    keyTakeaways.push('Every interview answer should follow STAR: Situation (context), Task (your goal), Action (technical decisions), Result (metrics).');
    keyTakeaways.push(`Review the Golden Model Answers below to understand the expected depth for a ${role} role at ${company}.`);
  } else if (overallScore < 75) {
    keyTakeaways.push('Good foundational problem solving; sharpen your action verbs to highlight what YOU personally built vs the team.');
    keyTakeaways.push('In the Result stage, quantify business impact with concrete numbers (percentages, latencies, savings).');
  } else {
    keyTakeaways.push(`Outstanding demonstration of ${company} competencies, systems architecture depth, and quantifiable outcomes.`);
    keyTakeaways.push('Strong executive presence and disciplined STAR structure across all responses.');
  }

  const sessionId = 'iv_sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const privateUrl = `/interview/session/${sessionId}`;

  return {
    status: 'success',
    sessionId,
    privateUrl,
    company,
    role,
    track,
    overallScore,
    verdict,
    verdictColor,
    evaluatedAnswers,
    competencies: [
      { name: 'STAR Methodology', score: Math.round(overallScore * 0.98) },
      { name: 'Technical Depth & Architecture', score: Math.round(overallScore * 0.92) },
      { name: 'Business Impact & Metrics', score: Math.round(overallScore * 0.88) },
      { name: 'Executive Presence & Delivery', score: presenceAvg },
      { name: `${company} Principles & Culture Fit`, score: cultureAvg }
    ],
    deliverySummary: {
      avgWpm,
      totalFillers,
      pacingEvaluation: avgWpm > 170 ? 'Fast pace' : avgWpm < 110 ? 'Deliberate / Brief' : 'Optimal conversational tempo (120-160 WPM)',
      fillerEvaluation: totalFillers > 5 ? 'Elevated filler word usage' : totalFillers > 2 ? 'Moderate filler words' : 'Polished, clean delivery'
    },
    keyTakeaways
  };
}

export default {
  COMPANY_RUBRICS,
  generateInterviewSession,
  evaluateTurnResponse,
  finalizeInterviewSession
};

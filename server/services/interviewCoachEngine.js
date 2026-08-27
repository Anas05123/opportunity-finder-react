import axios from 'axios';

/**
 * Company-Specific Hiring Rubrics & Interview Knowledge Base
 */
export const COMPANY_RUBRICS = {
  stripe: {
    name: 'Stripe Worldwide',
    culture: 'Operating Principles & High Agency',
    primaryMetrics: ['First Principles Thinking', 'Extreme Ownership', 'Technical Rigor', 'User Empathy'],
    sampleQuestions: [
      {
        id: 'stripe-1',
        topic: 'First Principles & Complex Systems',
        question: 'Walk me through how you would architect a globally distributed financial transaction ledger requiring strict idempotency and zero data loss.',
        guidance: 'Look for clear trade-offs between ACID consistency, distributed consensus (Raft/Paxos), and idempotency keys.'
      },
      {
        id: 'stripe-2',
        topic: 'Ownership & Technical Trade-offs',
        question: 'Tell me about a high-stakes technical decision you made under ambiguous requirements where key stakeholders disagreed with your approach.',
        guidance: 'Evaluate STAR structure, stakeholder alignment, data-driven defense, and outcome metrics.'
      },
      {
        id: 'stripe-3',
        topic: 'User Empathy & Developer Experience',
        question: 'How do you balance engineering velocity and rapid API feature releases with strict backward-compatibility and zero-downtime guarantees?',
        guidance: 'Check for versioning strategy, canary deployments, graceful degradation, and contract testing.'
      }
    ]
  },
  google: {
    name: 'Google Creative Lab & Engineering',
    culture: 'Googleyness & Scalable Architecture',
    primaryMetrics: ['General Cognitive Ability', 'Role-Related Knowledge', 'Leadership & Collaboration', 'Googleyness & Ambiguity'],
    sampleQuestions: [
      {
        id: 'goog-1',
        topic: 'System Scalability & Billion-Scale Users',
        question: 'How would you design a real-time global notification system that delivers messages to 500 million active users with sub-100ms latency?',
        guidance: 'Assess partitioning, pub/sub architecture (Kafka/Cloud PubSub), backpressure handling, and edge caching.'
      },
      {
        id: 'goog-2',
        topic: 'Navigating Ambiguity & Innovation',
        question: 'Describe a project where there was no established playbook or clear requirements. How did you structure your investigation and deliver value?',
        guidance: 'Look for structured problem decomposition, rapid prototyping, cross-functional discovery, and measurable impact.'
      },
      {
        id: 'goog-3',
        topic: 'Collaboration & Resolving Technical Conflict',
        question: 'Tell me about a time you identified a critical architectural flaw in another senior engineer\'s proposed design. How did you address it?',
        guidance: 'Evaluate respectful disagreement, evidence-based code reviews, proof-of-concepts, and win-win resolution.'
      }
    ]
  },
  amazon: {
    name: 'Amazon Web Services',
    culture: '16 Leadership Principles & Bar Raiser',
    primaryMetrics: ['Customer Obsession', 'Ownership', 'Bias for Action', 'Deliver Results', 'Dive Deep'],
    sampleQuestions: [
      {
        id: 'amzn-1',
        topic: 'Customer Obsession & Working Backwards',
        question: 'Tell me about a time when you had to advocate for the customer experience over a shortcut that would have saved engineering weeks.',
        guidance: 'Assess customer advocacy, long-term thinking over short-term expediency, and quantifiable customer satisfaction.'
      },
      {
        id: 'amzn-2',
        topic: 'Dive Deep & Root Cause Analysis',
        question: 'Walk me through the most catastrophic production outage or performance degradation you personally investigated and resolved.',
        guidance: 'Check 5 Whys methodology, metrics/telemetry deep dive, blast radius mitigation, and durable COE/post-mortem actions.'
      },
      {
        id: 'amzn-3',
        topic: 'Bias for Action vs Calculated Risk',
        question: 'Give an example of a two-way door decision where you made a critical call with only 70% of the information available.',
        guidance: 'Look for speed of decision-making, reversibility assessment, risk boundary mitigation, and outcomes.'
      }
    ]
  },
  meta: {
    name: 'Meta Technologies',
    culture: 'Move Fast, Build Awesome Things & Focus on Impact',
    primaryMetrics: ['Speed & Velocity', 'System Scalability', 'Data-Driven Decision Making', 'Direct Communication'],
    sampleQuestions: [
      {
        id: 'meta-1',
        topic: 'High-Impact Product Engineering',
        question: 'Tell me about a feature or system you built from 0 to 1 that moved a core business metric by at least 15%.',
        guidance: 'Assess top-line metric understanding (DAU/revenue/retention), A/B testing rigor, and engineering execution speed.'
      },
      {
        id: 'meta-2',
        topic: 'Handling Large-Scale Performance Bottlenecks',
        question: 'How do you identify and resolve critical rendering or memory bottlenecks in complex, high-traffic single-page applications?',
        guidance: 'Look for bundle profiling, React reconciliation optimization, virtualization, memory leak defense, and Web Vitals.'
      }
    ]
  },
  mckinsey: {
    name: 'McKinsey & Company',
    culture: 'Structured Problem Solving & Executive Presence',
    primaryMetrics: ['MECE Framework', 'Quantitative Rigor', 'Synthesized Communication', 'Stakeholder Influence'],
    sampleQuestions: [
      {
        id: 'mck-1',
        topic: 'Hypothesis-Driven Problem Solving',
        question: 'A leading global logistics company is experiencing a 25% drop in operational margins despite revenue growth. How would you structure this problem?',
        guidance: 'Check for MECE issue tree, cost vs revenue segmentation, unit economics breakdown, and prioritized hypotheses.'
      },
      {
        id: 'mck-2',
        topic: 'Executive Communication & C-Suite Buy-in',
        question: 'Describe a situation where you had to persuade resistant C-suite executives to pivot their multi-million dollar strategy.',
        guidance: 'Assess top-down communication (Pyramid Principle), data storytelling, empathy for executive incentives, and successful adoption.'
      }
    ]
  }
};

/**
 * Generate Tailored Interview Session Questions
 */
export async function generateInterviewSession({ company, role, track, seniority, questionCount = 3, userProfile = {} }) {
  const companyKey = (company || '').toLowerCase().replace(/[^a-z]/g, '');
  const rubric = COMPANY_RUBRICS[companyKey] || {
    name: company || 'Global Enterprise',
    culture: 'Excellence & High Impact',
    primaryMetrics: ['Problem Solving', 'Domain Expertise', 'Communication', 'STAR Methodology']
  };

  // If Gemini API is available, generate dynamically tailored questions
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are a Principal Bar-Raiser Interviewer at ${rubric.name}.
Generate ${questionCount} realistic, high-caliber interview questions for a ${seniority || 'Senior'} ${role || 'Software Engineer'} candidate applying for the ${track || 'Behavioral & Technical Architecture'} track.

Candidate Profile Context:
- Name: ${userProfile.name || userProfile.full_name || 'Candidate'}
- Background: ${userProfile.headline || userProfile.title || 'Technical Specialist'}
- Key Skills: ${userProfile.skills || 'System Architecture, Leadership, Product Delivery'}

Format as valid JSON:
{
  "interviewerPersona": {
    "name": "Alex Chen",
    "title": "Principal Bar Raiser & Director of Engineering",
    "avatarTone": "Professional, encouraging, rigorous"
  },
  "rubricOverview": "Evaluation based on ${rubric.culture}",
  "questions": [
    {
      "id": "q1",
      "topic": "Domain / Competency Topic",
      "question": "The exact wording of the interview question.",
      "guidance": "What the interviewer is specifically evaluating (STAR points, metrics, pitfalls).",
      "hints": ["Hint 1 on structuring the answer", "Hint 2 on key points to highlight"]
    }
  ]
}`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        },
        { timeout: 12000 }
      );

      const jsonStr = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.questions && parsed.questions.length > 0) {
          return {
            status: 'success',
            company: rubric.name,
            role: role || 'Senior Specialist',
            track: track || 'Behavioral (STAR)',
            seniority: seniority || 'Senior',
            interviewer: parsed.interviewerPersona || { name: 'Alex Chen', title: `Lead Interviewer at ${rubric.name}` },
            questions: parsed.questions.slice(0, questionCount)
          };
        }
      }
    } catch (e) {
      console.warn('[Interview Engine] Gemini dynamic question generation fallback:', e.message);
    }
  }

  // Deterministic Default Question Generator
  const baseQuestions = rubric.sampleQuestions || [
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
 * Evaluate a Single Turn Answer with STAR Breakdown & Delivery Analysis
 */
export async function evaluateTurnResponse({ company, role, question, answer, turnIndex = 1, totalTurns = 3 }) {
  const words = (answer || '').trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Speech & Delivery Analytics (Filler words & WPM)
  const fillerKeywords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'sort of', 'kind of', 'literally'];
  const fillerOccurrences = [];
  const lowerAnswer = (answer || '').toLowerCase();
  
  fillerKeywords.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = lowerAnswer.match(regex);
    if (matches) {
      fillerOccurrences.push({ word: f, count: matches.length });
    }
  });
  const totalFillers = fillerOccurrences.reduce((acc, curr) => acc + curr.count, 0);

  // Approximate WPM assuming 45s speaking duration or average rate
  const estSpeakingSec = Math.max(15, Math.round(wordCount / 2.3));
  const wpm = Math.round((wordCount / (estSpeakingSec / 60))) || 135;

  // If Gemini API is available, perform deep LLM STAR evaluation
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && wordCount >= 10) {
    try {
      const prompt = `You are an executive interviewer evaluating a candidate's answer for a ${role} position at ${company}.
Question: "${question}"
Candidate Answer: "${answer}"

Analyze the answer rigorously using the STAR method (Situation, Task, Action, Result).
Return JSON with this exact schema:
{
  "score": 88,
  "starBreakdown": {
    "situation": { "score": 90, "feedback": "Clear context and background established." },
    "task": { "score": 85, "feedback": "Defined clear ownership of the challenge." },
    "action": { "score": 88, "feedback": "Specific technical actions articulated." },
    "result": { "score": 82, "feedback": "Quantifiable impact and metrics included." }
  },
  "strengths": ["Strong structural framing", "Good focus on technical leadership"],
  "improvements": ["Could quantify the exact revenue or latency improvement percentage"],
  "followUpQuestion": "That was insightful. How did you ensure this solution scaled when traffic doubled?",
  "goldenAnswer": "A high-impact 10/10 model answer illustrating the ideal STAR response for this question."
}`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        },
        { timeout: 10000 }
      );

      const jsonStr = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        return {
          status: 'success',
          score: parsed.score || 88,
          starBreakdown: parsed.starBreakdown,
          strengths: parsed.strengths || ['Clear STAR methodology', 'Direct response to question prompt'],
          improvements: parsed.improvements || ['Include additional quantified business ROI metrics'],
          followUpQuestion: parsed.followUpQuestion || 'How would you evolve this approach given 10x higher scale?',
          goldenAnswer: parsed.goldenAnswer || `In my previous role leading systems architecture, we faced critical latency degradation during peak traffic. I audited the database queries, introduced Redis caching, and optimized our indexing pipeline, reducing latency by 45% within two sprints.`,
          deliveryMetrics: {
            wordCount,
            wpm,
            totalFillers,
            fillerOccurrences,
            clarityScore: totalFillers > 5 ? 75 : totalFillers > 2 ? 88 : 95,
            pacing: wpm > 175 ? 'Fast' : wpm < 110 ? 'Deliberate' : 'Optimal (120-160 WPM)'
          }
        };
      }
    } catch (e) {
      console.warn('[Interview Turn Eval] Gemini fallback:', e.message);
    }
  }

  // Deterministic Heuristic Evaluation
  const hasSituation = /at my|when I|in my previous|during|we had|the challenge/i.test(answer);
  const hasTask = /my goal|my role|responsible for|objective|needed to/i.test(answer);
  const hasAction = /I built|I designed|I audited|I implemented|I led|I optimized|I created/i.test(answer);
  const hasResult = /result|increased|reduced|saved|improved|metric|percent|%|delivered|growth/i.test(answer);

  let calculatedScore = 70;
  if (hasSituation) calculatedScore += 7;
  if (hasTask) calculatedScore += 7;
  if (hasAction) calculatedScore += 8;
  if (hasResult) calculatedScore += 8;
  if (wordCount > 60) calculatedScore += 4;
  if (totalFillers <= 2) calculatedScore += 4;
  calculatedScore = Math.min(96, Math.max(65, calculatedScore));

  return {
    status: 'success',
    score: calculatedScore,
    starBreakdown: {
      situation: {
        score: hasSituation ? 92 : 75,
        feedback: hasSituation ? 'Strong, concise project context established.' : 'Context could be established more clearly up front.'
      },
      task: {
        score: hasTask ? 90 : 78,
        feedback: hasTask ? 'Clear articulation of your personal responsibility.' : 'Explicitly state your individual ownership role.'
      },
      action: {
        score: hasAction ? 94 : 80,
        feedback: hasAction ? 'Specific, actionable technical initiatives detailed.' : 'Describe the exact steps and tools you personally used.'
      },
      result: {
        score: hasResult ? 95 : 72,
        feedback: hasResult ? 'Excellent emphasis on measurable outcome and metrics.' : 'Add quantifiable metrics (e.g. % saved, latency reduction, user growth).'
      }
    },
    strengths: [
      hasAction ? 'Solid technical leadership and clear action orientation' : 'Good conversational engagement',
      hasResult ? 'Direct connection between engineering work and business impact' : 'Professional, structured tone'
    ],
    improvements: [
      !hasResult ? 'Highlight concrete metrics and measurable percentages in your result phase' : 'Elaborate slightly on edge cases encountered',
      totalFillers > 3 ? `Reduce filler words (detected ${totalFillers} instances)` : 'Maintain this steady delivery pace'
    ],
    followUpQuestion: turnIndex < totalTurns 
      ? `That was very clear. If you had to redesign that solution today with zero budget constraints, what is the first architectural change you would introduce?`
      : `Great response. What was the single biggest lesson your team learned from that outcome?`,
    goldenAnswer: `When leading the platform architecture at our company, our team experienced recurring 500ms database bottlenecks during peak traffic. As the Lead Engineer, my objective was to stabilize latency under 100ms without increasing cloud compute costs. I redesigned our query cache layer using Redis clusters, refactored N+1 database queries, and implemented rate-limiting middleware. Within 3 weeks, peak latency dropped by 64%, system uptime reached 99.99%, and we saved $35,000 in monthly infrastructure expenses.`,
    deliveryMetrics: {
      wordCount,
      wpm,
      totalFillers,
      fillerOccurrences,
      clarityScore: totalFillers > 4 ? 78 : 94,
      pacing: wpm > 170 ? 'Fast' : wpm < 110 ? 'Deliberate' : 'Optimal (120-160 WPM)'
    }
  };
}

/**
 * Finalize Complete Interview Session & Generate Holistic Scorecard
 */
export async function finalizeInterviewSession({ company, role, track, answers = [], userProfile = {} }) {
  const scores = answers.map(a => a.score || 85);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));

  let verdict = 'Strong Hire';
  let badgeColor = '#10B981'; // emerald
  if (avgScore < 75) {
    verdict = 'Needs Development';
    badgeColor = '#EF4444';
  } else if (avgScore < 85) {
    verdict = 'Lean Hire';
    badgeColor = '#F59E0B';
  }

  const totalWords = answers.reduce((sum, a) => sum + (a.deliveryMetrics?.wordCount || 0), 0);
  const totalFillers = answers.reduce((sum, a) => sum + (a.deliveryMetrics?.totalFillers || 0), 0);
  const avgWpm = Math.round(answers.reduce((sum, a) => sum + (a.deliveryMetrics?.wpm || 135), 0) / (answers.length || 1));

  return {
    status: 'success',
    sessionId: 'int_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
    company,
    role,
    track,
    overallScore: avgScore,
    verdict,
    verdictColor: badgeColor,
    completedAt: new Date().toISOString(),
    competencies: [
      { name: 'STAR Methodology', score: Math.min(100, avgScore + 2) },
      { name: 'Technical Depth & Architecture', score: Math.min(100, avgScore - 1) },
      { name: 'Quantifiable Business Impact', score: Math.min(100, avgScore - 3) },
      { name: 'Executive Presence & Delivery', score: totalFillers > 6 ? 80 : 94 },
      { name: `${company} Culture & Principles`, score: Math.min(100, avgScore + 4) }
    ],
    deliverySummary: {
      totalWords,
      totalFillers,
      avgWpm,
      pacingEvaluation: avgWpm >= 120 && avgWpm <= 165 ? 'Ideal conversational pace' : 'Slightly rapid cadence',
      fillerEvaluation: totalFillers <= 3 ? 'Excellent speech fluency' : 'Opportunity to pause instead of using fillers'
    },
    keyTakeaways: [
      `Demonstrated consistent, structured problem solving aligned with ${company} standards.`,
      `Strong ability to articulate technical execution steps and cross-functional leadership.`,
      `For future final-round interviews, practice leading immediately with top-line quantitative metrics.`
    ]
  };
}

export default {
  COMPANY_RUBRICS,
  generateInterviewSession,
  evaluateTurnResponse,
  finalizeInterviewSession
};

import axios from 'axios';

/**
 * High-Precision Text & STAR Methodology Semantic Analyzer
 * Evaluates candidate responses with rigorous linguistic intent parsing.
 */

// Intent / Answer Classifications
export const ANSWER_TYPES = {
  GREETING: 'greeting',
  REPEAT_REQUEST: 'repeat_request',
  HINT_REQUEST: 'hint_request',
  UNCERTAIN_ADMISSION: 'uncertain_admission',
  CLARIFYING_QUESTION: 'clarifying_question',
  INCOMPLETE: 'incomplete',
  OFF_TOPIC: 'off_topic',
  SUBSTANTIAL_STAR: 'substantial_star'
};

/**
 * Classify candidate input intent precisely
 */
export function classifyCandidateInput(text = '') {
  const clean = text.trim().toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) return { type: ANSWER_TYPES.INCOMPLETE, wordCount: 0 };

  // 0. Repeat Requests
  if (
    /\b(repeat|can you repeat|could you repeat|say that again|say again|what was the question|pardon|come again|what did you ask|rephrase|can't hear|missed that|say it again)\b/i.test(clean)
  ) {
    return { type: ANSWER_TYPES.REPEAT_REQUEST, wordCount };
  }

  // 1. Hint Requests
  if (
    /\b(hint|give me a hint|need a hint|any hints|help me out|can you help|where should i start|what should i focus on|guide me|point me in the right direction)\b/i.test(clean)
  ) {
    return { type: ANSWER_TYPES.HINT_REQUEST, wordCount };
  }

  // 2. Uncertain / "I don't know" Admissions
  if (
    /\b(i don't know|i do not know|idk|i am not sure|i'm not sure|not sure|haven't worked with|never done (this|that)|no idea|not familiar|i have no clue|can't remember)\b/i.test(clean)
  ) {
    return { type: ANSWER_TYPES.UNCERTAIN_ADMISSION, wordCount };
  }

  // 3. Clarifying Questions
  if (
    /\b(do you mean|should i focus on|are we talking about|is this for|can i assume|what is the scale|what language|should i consider)\b/i.test(clean) ||
    (clean.endsWith('?') && wordCount <= 12 && !/^(hello|hi)/i.test(clean))
  ) {
    return { type: ANSWER_TYPES.CLARIFYING_QUESTION, wordCount };
  }

  // 4. Greetings
  const greetingRegex = /^(hello|hi|hey|good morning|good afternoon|good evening|howdy|sup|greetings|can you hear me|is this working|testing)[!?.,\s]*$/i;
  if (greetingRegex.test(clean) || (wordCount <= 3 && /^(hello|hi|hey|test|good day)/i.test(clean))) {
    return { type: ANSWER_TYPES.GREETING, wordCount };
  }

  // 5. Incomplete / 1-word remarks
  if (wordCount < 10 && /^(yes|no|ok|okay|sure|fine|maybe|nothing|not really|cool|yep|nope)[.!?]*$/i.test(clean)) {
    return { type: ANSWER_TYPES.INCOMPLETE, wordCount };
  }

  if (wordCount < 18) {
    return { type: ANSWER_TYPES.INCOMPLETE, wordCount };
  }

  return { type: ANSWER_TYPES.SUBSTANTIAL_STAR, wordCount };
}

/**
 * Deep Linguistic & STAR Analysis
 */
export function analyzeAnswerDeterministically({ question = '', answer = '', company = 'Global Enterprise', role = 'Specialist' }) {
  const { type, wordCount } = classifyCandidateInput(answer);
  const cleanAnswer = (answer || '').trim();
  const lowerAnswer = cleanAnswer.toLowerCase();

  // 1. Hint Request
  if (type === ANSWER_TYPES.HINT_REQUEST) {
    return {
      status: 'success',
      score: 40,
      classification: 'Hint Request',
      starBreakdown: {
        situation: { score: 40, feedback: 'Candidate requested guidance.' },
        task: { score: 40, feedback: 'Guided toward task ownership.' },
        action: { score: 40, feedback: 'Awaiting technical action.' },
        result: { score: 40, feedback: 'Awaiting quantified outcome.' }
      },
      strengths: ['Active self-awareness and proactive communication'],
      improvements: ['Use the hint to structure your full STAR answer with a concrete past project.'],
      followUpQuestion: `Sure! Think about how you would balance data consistency vs latency. Focus on the specific architectural decision YOU made and the measurable outcome. Take your time.`,
      goldenAnswer: `In my previous role, our payment service faced concurrency deadlocks during holiday traffic. As lead architect, I redesigned the ledger using Redis distributed locks and Raft consensus, reducing latency by 65% and achieving 99.999% transaction reliability.`,
      deliveryMetrics: { wordCount, wpm: 120, totalFillers: 0, fillerOccurrences: [], clarityScore: 100, pacing: 'Coaching Turn' }
    };
  }

  // 2. Uncertain / "I don't know"
  if (type === ANSWER_TYPES.UNCERTAIN_ADMISSION) {
    return {
      status: 'success',
      score: 35,
      classification: 'Uncertainty / Bridge Turn',
      starBreakdown: {
        situation: { score: 35, feedback: 'Acknowledged lack of direct experience in this specific scenario.' },
        task: { score: 35, feedback: 'Bridged to related foundational knowledge.' },
        action: { score: 35, feedback: 'Encouraged to explain analogous problem solving.' },
        result: { score: 35, feedback: 'Awaiting relevant metric in an adjacent domain.' }
      },
      strengths: ['Honesty and intellectual humility under pressure'],
      improvements: ['When you haven\'t encountered an exact scenario, explain how you would reason through it from first principles or share an analogous challenge.'],
      followUpQuestion: `That's completely fine. If you haven't faced that exact scenario, tell me about any complex problem you had to debug where the root cause was initially unknown?`,
      goldenAnswer: `While I hadn't managed a multi-region Cassandra cluster before, I applied first-principles debugging to a similar distributed locking bug in PostgreSQL by analyzing slow query logs and thread contention, resolving the 500 errors within 4 hours.`,
      deliveryMetrics: { wordCount, wpm: 115, totalFillers: 0, fillerOccurrences: [], clarityScore: 90, pacing: 'Brief' }
    };
  }

  // 3. Clarifying Question
  if (type === ANSWER_TYPES.CLARIFYING_QUESTION) {
    return {
      status: 'success',
      score: 55,
      classification: 'Clarifying Question',
      starBreakdown: {
        situation: { score: 60, feedback: 'Good scoping question to establish requirements.' },
        task: { score: 55, feedback: 'Clarifying parameters before executing.' },
        action: { score: 50, feedback: 'Awaiting execution plan.' },
        result: { score: 50, feedback: 'Awaiting outcome.' }
      },
      strengths: ['Strong instinct to clarify ambiguity before jumping to solutions'],
      improvements: ['State your assumptions explicitly and proceed with your proposed approach.'],
      followUpQuestion: `Great clarifying question. Assume a high-throughput microservices architecture with 10k requests per second. How would you design the data pipeline?`,
      goldenAnswer: `Assuming a microservices environment handling 10k QPS, I would decouple ingress via Kafka and use Redis caching for sub-10ms read latency, backed by PostgreSQL with read replicas.`,
      deliveryMetrics: { wordCount, wpm: 120, totalFillers: 0, fillerOccurrences: [], clarityScore: 100, pacing: 'Inquisitive' }
    };
  }

  // 4. Greeting
  if (type === ANSWER_TYPES.GREETING) {
    return {
      status: 'success',
      score: 15,
      classification: 'Greeting / Non-Substantive',
      starBreakdown: {
        situation: { score: 10, feedback: 'No project context or situation provided (greeting only).' },
        task: { score: 10, feedback: 'No role responsibility or challenge specified.' },
        action: { score: 10, feedback: 'No concrete technical or leadership actions described.' },
        result: { score: 10, feedback: 'No measurable results or business outcomes included.' }
      },
      strengths: ['Polite conversational opening'],
      improvements: ['Please answer the question prompt with a real project example using the STAR method (Situation, Task, Action, Result).'],
      followUpQuestion: `Hello! Great to connect with you. When you're ready, please walk me through: "${question}"`,
      goldenAnswer: `In my role at a previous tech company, our team faced a 40% spike in transaction volume causing database latency. As lead engineer, I designed an asynchronous worker queue using Redis and optimized query indices, which restored latency to sub-50ms and saved $120k annually in cloud compute.`,
      deliveryMetrics: { wordCount, wpm: 120, totalFillers: 0, fillerOccurrences: [], clarityScore: 100, pacing: 'Brief' }
    };
  }

  // 5. Incomplete / Extremely Short (< 18 words)
  if (type === ANSWER_TYPES.INCOMPLETE) {
    return {
      status: 'success',
      score: 28,
      classification: 'Incomplete Response',
      starBreakdown: {
        situation: { score: 30, feedback: 'Context is very brief and lacks detail.' },
        task: { score: 25, feedback: 'Your specific responsibility is not explained.' },
        action: { score: 25, feedback: 'Need specific technical details on what you built or decided.' },
        result: { score: 20, feedback: 'Missing quantitative metrics and business impact.' }
      },
      strengths: ['Initial attempt to respond'],
      improvements: [`Expand your answer significantly. A strong response for ${role} should be 60-150 words with concrete actions and metrics.`],
      followUpQuestion: `Could you give me a specific real-world example from your past experience detailing what you did and the results?`,
      goldenAnswer: `When leading infrastructure modernization, our monolithic API caused deployment bottlenecks. I spearheaded the transition to containerized microservices on Kubernetes, reducing deploy time from 45 minutes to 4 minutes while maintaining 99.99% availability.`,
      deliveryMetrics: { wordCount, wpm: 110, totalFillers: 0, fillerOccurrences: [], clarityScore: 80, pacing: 'Too Brief (< 20 words)' }
    };
  }

  // 6. Substantive Answer: Rigorous Pattern & Keyword Extraction
  const situationMatches = [
    /\b(at my|in my (previous|last|former) (role|company|job)|when i was|during (my time|the)|we (faced|had|experienced|built)|the problem was|our team (was|needed)|challenge was)\b/i,
    /\b(fintech|startup|enterprise|client|production|platform|architecture|infrastructure|system|customer|scale)\b/i
  ];
  const hasSituation = situationMatches.some(r => r.test(lowerAnswer));

  const taskMatches = [
    /\b(my (role|goal|responsibility|objective|mandate|task) was|i was (responsible for|tasked with|hired to|leading)|needed to (ensure|deliver|design|reduce|scale))\b/i
  ];
  const hasTask = taskMatches.some(r => r.test(lowerAnswer));

  const actionMatches = [
    /\b(i (architected|built|designed|implemented|refactored|led|optimized|migrated|created|developed|spearheaded|deployed|automated|introduced|audited))\b/i,
    /\b(redis|kafka|kubernetes|docker|aws|gcp|postgres|sql|nosql|graphql|rest|microservices|pipeline|ci\/cd|react|node|typescript|python|go)\b/i
  ];
  const actionHits = (lowerAnswer.match(/\b(i (architected|built|designed|implemented|refactored|led|optimized|migrated|created|developed|spearheaded|deployed|automated))\b/gi) || []).length;
  const techHits = (lowerAnswer.match(/\b(redis|kafka|kubernetes|docker|aws|gcp|postgres|sql|nosql|graphql|rest|microservices|pipeline|react|node|python|go|concurrency|distributed|cache)\b/gi) || []).length;
  const hasAction = actionHits > 0 || techHits >= 2;

  const resultMatches = [
    /\b(\d+%\s*(reduction|increase|improvement|growth|boost|drop|decrease|faster|savings)?|\$[\d,.]+[km]?|sub-\d+ms|\d+x\s*(faster|speedup|scale)?|99\.\d+%|uptime|latency|throughput|roi|saved|delivered|processed)\b/i
  ];
  const hasResult = resultMatches.some(r => r.test(lowerAnswer));
  const hasQuantifiedMetric = /\b(\d+%\b|\$\d+|\d+x\b|\d+\s*(ms|seconds|minutes|hours|days|users|merchants|transactions))\b/i.test(lowerAnswer);

  const fillerKeywords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'sort of', 'kind of', 'literally'];
  const fillerOccurrences = [];
  fillerKeywords.forEach(f => {
    const reg = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = lowerAnswer.match(reg);
    if (matches) fillerOccurrences.push({ word: f, count: matches.length });
  });
  const totalFillers = fillerOccurrences.reduce((a, b) => a + b.count, 0);
  const wpm = Math.min(190, Math.max(105, Math.round((wordCount / (Math.max(15, wordCount / 2.4) / 60)))));

  let score = 40;
  if (hasSituation) score += 12;
  if (hasTask) score += 12;
  if (hasAction) score += 14;
  if (actionHits >= 2) score += 6;
  if (techHits >= 2) score += 6;
  if (hasResult) score += 8;
  if (hasQuantifiedMetric) score += 8;
  if (wordCount >= 60) score += 4;
  if (totalFillers <= 1) score += 3;
  if (totalFillers > 4) score -= 6;

  score = Math.min(97, Math.max(45, score));

  const strengths = [];
  if (hasAction) strengths.push('Strong articulation of personal technical ownership and execution');
  if (hasQuantifiedMetric) strengths.push('Excellent use of quantified metrics and business ROI data');
  if (hasSituation) strengths.push('Clear project background framing and business context');
  if (strengths.length === 0) strengths.push('Direct engagement with the interview question');

  const improvements = [];
  if (!hasQuantifiedMetric) improvements.push('In the Result stage, quantify your impact (e.g. latency dropped by 40%, throughput increased 3x)');
  if (!hasTask) improvements.push('Explicitly define what YOUR individual responsibility was vs the broader team');
  if (totalFillers > 2) improvements.push(`Reduce filler words (detected ${totalFillers} instances of "um/like/actually")`);
  if (wordCount < 45) improvements.push('Expand slightly on the technical trade-offs and alternative solutions you evaluated');

  let followUpQuestion = '';
  if (techHits > 0) {
    followUpQuestion = `That's very clear. When you deployed that architecture, how did you monitor failure recovery and data consistency under peak load at ${company}?`;
  } else if (hasResult) {
    followUpQuestion = `Great outcome. If you had to scale that solution to 10x current volume, what is the first bottleneck you would address?`;
  } else {
    followUpQuestion = `Can you elaborate on the specific technical trade-offs you considered before settling on that approach?`;
  }

  return {
    status: 'success',
    score,
    classification: score >= 85 ? 'Strong STAR' : score >= 70 ? 'Good STAR' : 'Developing STAR',
    starBreakdown: {
      situation: {
        score: hasSituation ? 92 : 62,
        feedback: hasSituation ? 'Solid business context and problem scope defined.' : 'Context could be clearer up front.'
      },
      task: {
        score: hasTask ? 90 : 64,
        feedback: hasTask ? 'Clear definition of your personal goal and ownership.' : 'Explicitly state what you personally were responsible for.'
      },
      action: {
        score: hasAction ? (actionHits > 1 ? 95 : 88) : 65,
        feedback: hasAction ? 'Detailed technical steps and architecture choices articulated.' : 'Detail the exact tools and decisions made.'
      },
      result: {
        score: hasQuantifiedMetric ? 96 : hasResult ? 82 : 58,
        feedback: hasQuantifiedMetric ? 'Outstanding quantified metrics and business outcome.' : 'Add hard numbers and measurable percentages.'
      }
    },
    strengths,
    improvements: improvements.slice(0, 2),
    followUpQuestion,
    goldenAnswer: `In my role at a high-throughput platform, we experienced critical latency spikes during peak load. As lead architect, I redesigned the query layer with Redis clustering and database connection pooling. This reduced 99th-percentile latency by 68% (from 220ms to 70ms) and supported a 3x traffic surge with zero downtime.`,
    deliveryMetrics: {
      wordCount,
      wpm,
      totalFillers,
      fillerOccurrences,
      clarityScore: totalFillers > 4 ? 74 : totalFillers > 1 ? 88 : 96,
      pacing: wpm > 170 ? 'Fast' : wpm < 115 ? 'Deliberate' : 'Optimal (120-160 WPM)'
    }
  };
}

/**
 * Full Precision Evaluator
 */
export async function evaluateAnswerPrecision({ company, role, question, answer, turnIndex = 1, totalTurns = 3 }) {
  const { type } = classifyCandidateInput(answer);

  // For non-standard answers (greetings, hints, uncertainty, clarifying questions, incomplete), evaluate deterministically
  if (type !== ANSWER_TYPES.SUBSTANTIAL_STAR) {
    return analyzeAnswerDeterministically({ question, answer, company, role });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const prompt = `You are a strict executive interviewer at ${company} evaluating ${role}.
Question: "${question}"
Candidate Answer: "${answer}"

Grade rigorously on STAR methodology (0-100).
Return JSON with score, starBreakdown (situation, task, action, result with score and feedback), strengths, improvements, followUpQuestion, goldenAnswer.`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        },
        { timeout: 10000 }
      );

      const jsonStr = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        const deterministic = analyzeAnswerDeterministically({ question, answer, company, role });
        return {
          status: 'success',
          score: parsed.score,
          starBreakdown: parsed.starBreakdown,
          strengths: parsed.strengths || deterministic.strengths,
          improvements: parsed.improvements || deterministic.improvements,
          followUpQuestion: parsed.followUpQuestion || deterministic.followUpQuestion,
          goldenAnswer: parsed.goldenAnswer || deterministic.goldenAnswer,
          deliveryMetrics: deterministic.deliveryMetrics
        };
      }
    } catch (err) {
      console.warn('[Gemini Precision Eval Warning]:', err.message);
    }
  }

  return analyzeAnswerDeterministically({ question, answer, company, role });
}

export default {
  ANSWER_TYPES,
  classifyCandidateInput,
  analyzeAnswerDeterministically,
  evaluateAnswerPrecision
};

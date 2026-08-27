import axios from 'axios';
import { classifyCandidateInput, analyzeAnswerDeterministically, ANSWER_TYPES } from './semanticAnswerAnalyzer.js';

/**
 * Handle a real-time conversational interview turn.
 * Dynamically handles hints, uncertainty ("I don't know"), clarifying questions, greetings, and technical STAR answers.
 */
export async function handleConversationalTurn({
  company = 'Stripe Worldwide',
  role = 'Staff Systems Engineer',
  persona = { name: 'Elena Rostova', title: 'Principal Bar Raiser', tone: 'Analytical, encouraging, deep probe' },
  conversationHistory = [],
  candidateMessage = '',
  track = 'behavioral'
}) {
  const cleanInput = (candidateMessage || '').trim();
  const { type, wordCount } = classifyCandidateInput(cleanInput);

  // 1. Precise Hint Request Handling
  if (type === ANSWER_TYPES.HINT_REQUEST) {
    return {
      status: 'success',
      spokenReply: `Sure, absolutely! Think about a time your system had high traffic or latency. Focus on the specific architectural decision YOU made, what tools you used, and what numbers changed. Take your time!`,
      quickFeedback: 'Candidate requested a strategic hint.',
      starScore: 40,
      classification: 'hint_request'
    };
  }

  // 2. Precise "I Don't Know" / Uncertainty Handling
  if (type === ANSWER_TYPES.UNCERTAIN_ADMISSION) {
    return {
      status: 'success',
      spokenReply: `No problem at all, that is completely fine! If you haven't faced that exact scenario, tell me about any complex technical challenge you had to debug from scratch?`,
      quickFeedback: 'Candidate indicated unfamiliarity; interviewer provided supportive bridge question.',
      starScore: 35,
      classification: 'uncertainty_bridge'
    };
  }

  // 3. Clarifying Question Handling
  if (type === ANSWER_TYPES.CLARIFYING_QUESTION) {
    return {
      status: 'success',
      spokenReply: `Great question to scope the requirements. Let's assume a distributed microservices setup handling 10,000 requests per second. How would you structure the solution?`,
      quickFeedback: 'Candidate clarified system constraints.',
      starScore: 55,
      classification: 'clarifying_question'
    };
  }

  // 4. Precise Greeting Handling
  if (type === ANSWER_TYPES.GREETING) {
    return {
      status: 'success',
      spokenReply: `Hello! Great to connect with you today. Whenever you're ready, let's get into the details—could you walk me through a complex project you architected and what technical trade-offs you made?`,
      quickFeedback: 'Candidate greeted interviewer.',
      starScore: 15,
      classification: 'greeting'
    };
  }

  // 5. Incomplete / Very Brief Handling
  if (type === ANSWER_TYPES.INCOMPLETE) {
    return {
      status: 'success',
      spokenReply: `Thanks. To give you a thorough evaluation for ${role}, I'd love you to go deeper. What was the specific technical problem, what steps did you personally take, and what was the outcome?`,
      quickFeedback: 'Response was too brief (< 18 words) to evaluate STAR pillars.',
      starScore: 28,
      classification: 'incomplete'
    };
  }

  // 6. Gemini LLM Dynamic Conversational Roleplay with Context
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const historyFormatted = conversationHistory
        .map(msg => `${msg.role === 'interviewer' ? persona.name : 'Candidate'}: ${msg.content}`)
        .join('\n');

      const prompt = `
You are ${persona.name}, ${persona.title} at ${company}.
Style: ${persona.tone}.
You are conducting a spoken video interview for ${role} on the ${track} track.

Conversation transcript so far:
${historyFormatted}

Candidate just said:
"${cleanInput}"

CRITICAL INSTRUCTIONS:
1. Analyze what the candidate actually said in their answer.
2. If they asked a question or asked for a hint, answer it constructively and naturally.
3. If they mentioned specific technical systems, tools, or metrics, explicitly refer to them in your spoken response.
4. Keep the spoken response between 25 and 45 words (2-3 spoken sentences). Professional, sharp, and natural.
5. Grade their answer objectively on a scale of 0 to 100 based strictly on STAR methodology.

Return JSON:
{
  "spokenReply": "Spoken sentence 1 acknowledging their points. Spoken sentence 2 with sharp follow-up probing question.",
  "quickFeedback": "Brief note on answer strengths and missing elements",
  "starScore": 85
}
`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 200,
            responseMimeType: 'application/json'
          }
        },
        { timeout: 10000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed.spokenReply) {
          return {
            status: 'success',
            spokenReply: parsed.spokenReply,
            quickFeedback: parsed.quickFeedback || 'Evaluated answer.',
            starScore: parsed.starScore || 80,
            classification: 'substantive'
          };
        }
      }
    } catch (err) {
      console.warn('[Gemini Conversational Notice]:', err.message);
    }
  }

  // 7. Deterministic Semantic NLP Engine
  const analysis = analyzeAnswerDeterministically({
    question: conversationHistory[conversationHistory.length - 2]?.content || 'Describe a project you led.',
    answer: cleanInput,
    company,
    role
  });

  const lower = cleanInput.toLowerCase();
  let spokenReply = '';

  if (lower.includes('redis') || lower.includes('cache') || lower.includes('database') || lower.includes('sql') || lower.includes('postgres')) {
    spokenReply = `That's a very clear breakdown of your data architecture choices. When you introduced that caching layer, how did you handle cache invalidation and database replication lag at ${company}?`;
  } else if (lower.includes('kafka') || lower.includes('event') || lower.includes('queue') || lower.includes('stream')) {
    spokenReply = `Good detail on the asynchronous message flow. How did you ensure idempotency and prevent message duplication during network partitions?`;
  } else if (lower.includes('latency') || lower.includes('throughput') || lower.includes('%') || lower.includes('ms')) {
    spokenReply = `Strong emphasis on quantitative metrics. Looking back, what was the biggest operational bottleneck you uncovered while achieving those numbers?`;
  } else if (lower.includes('team') || lower.includes('disagree') || lower.includes('conflict') || lower.includes('stakeholder')) {
    spokenReply = `Navigating team alignment under pressure is essential. How did you balance rapid delivery against long-term architectural debt when reaching that consensus?`;
  } else {
    spokenReply = `Thank you for explaining that context. Can you dive deeper into the specific technical trade-offs you personally made and the final business outcome?`;
  }

  return {
    status: 'success',
    spokenReply,
    quickFeedback: analysis.improvements[0] || 'Structured answer.',
    starScore: analysis.score,
    classification: analysis.classification
  };
}

export default {
  handleConversationalTurn
};

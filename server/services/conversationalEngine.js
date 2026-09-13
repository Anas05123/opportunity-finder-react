import axios from 'axios';
import { classifyCandidateInput, analyzeAnswerDeterministically, ANSWER_TYPES } from './semanticAnswerAnalyzer.js';

/**
 * Handle a real-time conversational interview turn.
 * Dynamically handles hints, uncertainty ("I don't know"), clarifying questions, greetings, and technical STAR answers.
 */
export async function handleConversationalTurn({
  company = 'Stripe Worldwide',
  role = 'Staff Systems Engineer',
  persona = { name: 'Elena Rostova', title: 'Principal Bar Raiser', tone: 'Analytical, encouraging, executive presence' },
  conversationHistory = [],
  candidateMessage = '',
  track = 'behavioral'
}) {
  const cleanInput = (candidateMessage || '').trim();
  const { type, wordCount } = classifyCandidateInput(cleanInput);

  // 1. Primary Handler: Gemini 2.0 Flash Dynamic Conversational AI
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const historyFormatted = conversationHistory.slice(-8)
        .map(msg => `${msg.role === 'interviewer' ? persona.name : 'Candidate'}: ${msg.content}`)
        .join('\n');

      const intentGuidance = type === ANSWER_TYPES.REPEAT_REQUEST
        ? `The candidate asked you to repeat or clarify the question, or indicated they did not catch it. Speak like a real senior interviewer: calmly, politely, and warmly repeat the core question in natural spoken words, and invite them to answer.`
        : type === ANSWER_TYPES.UNCERTAIN_ADMISSION
        ? `The candidate indicated they don't know or lack experience with the specific question. Acknowledge this with warmth and executive poise like a real senior human interviewer. Never repeat canned phrases. Offer a constructive bridge question or pivot to an adjacent technical scenario so they can demonstrate their strengths.`
        : type === ANSWER_TYPES.HINT_REQUEST
        ? `The candidate asked for a hint or guidance. Give a sharp, encouraging hint tailored to what was asked, then prompt them to take the first step.`
        : type === ANSWER_TYPES.CLARIFYING_QUESTION
        ? `The candidate asked a clarifying question. Answer it directly with realistic constraints for ${company}, then invite them to proceed.`
        : type === ANSWER_TYPES.GREETING
        ? `The candidate greeted you. Respond warmly, welcome them to the ${company} interview for ${role}, and transition directly into the first core question.`
        : type === ANSWER_TYPES.INCOMPLETE
        ? `The candidate's response was very brief. Encourage them warmly to elaborate with specific technical actions and outcomes.`
        : `The candidate provided a substantive answer. Acknowledge the key systems, metrics, or points they mentioned and ask a sharp, insightful follow-up probing question.`;

      const prompt = `
You are ${persona.name}, ${persona.title} at ${company}.
Your tone is: ${persona.tone}.
You are conducting a high-stakes, realistic spoken video interview with a candidate for the position of ${role} on the ${track} track.

Conversation transcript so far:
${historyFormatted}

Candidate just said:
"${cleanInput}"

INTENT CONTEXT:
${intentGuidance}

INSTRUCTIONS FOR SPOKEN RESPONSE:
1. Speak exactly like a real, experienced human interviewer sitting across from them. Be conversational, natural, engaging, and professional.
2. If they say "I don't know", NEVER repeat a canned phrase. Acknowledge smoothly (e.g. "That's completely fine, let's pivot...", "No worries at all, let's look at it from another angle...") and give an alternative or simpler scenario.
3. If they ask a question, answer it directly and authoritatively.
4. Keep the spoken response between 20 and 45 words (2 to 3 natural spoken sentences). Do not use bullet points or markdown in spokenReply.
5. Grade their contribution objectively from 0 to 100 based on communication, technical depth, and STAR structure.

Return valid JSON strictly matching this schema:
{
  "spokenReply": "Your natural spoken response here (2-3 conversational sentences).",
  "quickFeedback": "Brief objective assessment of the turn.",
  "starScore": 75,
  "classification": "${type}"
}
`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
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
            replyText: parsed.spokenReply,
            quickFeedback: parsed.quickFeedback || 'Evaluated conversational turn.',
            starScore: typeof parsed.starScore === 'number' ? parsed.starScore : 75,
            classification: parsed.classification || type
          };
        }
      }
    } catch (err) {
      console.warn('[Gemini Conversational Notice]:', err.message);
    }
  }

  // 2. High-Variety Dynamic Fallback Engine (when offline)
  const analysis = analyzeAnswerDeterministically({
    question: conversationHistory[conversationHistory.length - 2]?.content || 'Describe a project you led.',
    answer: cleanInput,
    company,
    role
  });

  const turnIndex = conversationHistory.filter(m => m.role === 'candidate').length;

  if (type === ANSWER_TYPES.REPEAT_REQUEST) {
    const lastQuestion = conversationHistory.slice().reverse().find(m => m.role === 'interviewer')?.content
      || 'Could you walk me through a major technical project you led and the key trade-offs you made?';
    const repText = `Of course! Let me repeat the question: ${lastQuestion}`;
    return {
      status: 'success',
      spokenReply: repText,
      replyText: repText,
      quickFeedback: 'Interviewer repeated the prompt upon candidate request.',
      starScore: 50,
      classification: 'repeat_request'
    };
  }

  if (type === ANSWER_TYPES.UNCERTAIN_ADMISSION) {
    const uncertaintyPool = [
      `No worries at all, that's completely understandable. Let's pivot: can you tell me about a time you had to quickly learn a new technology or debug a system you had zero familiarity with?`,
      `That's totally fine, not every engineer has hit that exact corner case. Let's look at it from a higher level: how do you typically approach architectural trade-offs when requirements are ambiguous?`,
      `No problem whatsoever, I appreciate the honesty. Let's shift gears: walk me through a major engineering success you're particularly proud of from your recent work.`,
      `That's completely fine. How about we break the problem down together? What's the very first hypothesis you would test if latency suddenly doubled?`
    ];
    return {
      status: 'success',
      spokenReply: uncertaintyPool[turnIndex % uncertaintyPool.length],
      replyText: uncertaintyPool[turnIndex % uncertaintyPool.length],
      quickFeedback: 'Candidate acknowledged unfamiliarity; interviewer adapted with an alternative scenario.',
      starScore: 40,
      classification: 'uncertainty_bridge'
    };
  }

  if (type === ANSWER_TYPES.HINT_REQUEST) {
    const hintPool = [
      `Happy to give a pointer. Think about how you'd decouple the read and write paths, or how an asynchronous queue might prevent request bottlenecks under heavy spikes. What comes to mind?`,
      `Sure thing! Consider the data persistence layer first. If you couldn't scale the database vertically, how would you distribute the load across multiple nodes?`,
      `Let's frame it this way: what metric would degrade first under load, and what is the simplest caching or load-balancing mechanism you'd put in place?`
    ];
    return {
      status: 'success',
      spokenReply: hintPool[turnIndex % hintPool.length],
      replyText: hintPool[turnIndex % hintPool.length],
      quickFeedback: 'Candidate requested contextual guidance.',
      starScore: 45,
      classification: 'hint_request'
    };
  }

  if (type === ANSWER_TYPES.CLARIFYING_QUESTION) {
    return {
      status: 'success',
      spokenReply: `Great scoping question. For our scenario at ${company}, assume we are operating across three AWS regions with an average latency budget of under 50 milliseconds. How would you design the architecture with those constraints?`,
      quickFeedback: 'Candidate asked an effective scoping question.',
      starScore: 65,
      classification: 'clarifying_question'
    };
  }

  if (type === ANSWER_TYPES.GREETING) {
    return {
      status: 'success',
      spokenReply: `Hello! Wonderful to connect with you. I'm excited to dive into your background for the ${role} position at ${company}. Whenever you're ready, let's get started with your background.`,
      quickFeedback: 'Introductory greeting.',
      starScore: 20,
      classification: 'greeting'
    };
  }

  const lower = cleanInput.toLowerCase();
  let spokenReply = '';

  if (lower.includes('redis') || lower.includes('cache') || lower.includes('database') || lower.includes('sql') || lower.includes('postgres')) {
    spokenReply = `That's a very clear breakdown of your data tier. When you implemented that caching strategy, how did you handle cache invalidation and potential replication lag at ${company}?`;
  } else if (lower.includes('kafka') || lower.includes('queue') || lower.includes('stream') || lower.includes('event')) {
    spokenReply = `Good detail on the asynchronous event flow. How did you ensure idempotency and handle poison-pill messages during network partitions?`;
  } else if (lower.includes('latency') || lower.includes('throughput') || lower.includes('%') || lower.includes('ms')) {
    spokenReply = `Excellent focus on measurable outcomes. Looking back at that implementation, what was the hardest bottleneck you had to diagnose?`;
  } else if (lower.includes('team') || lower.includes('conflict') || lower.includes('stakeholder') || lower.includes('disagree')) {
    spokenReply = `Cross-functional alignment is critical. When the stakeholders pushed back on technical complexity, how did you communicate the trade-offs to reach alignment?`;
  } else {
    spokenReply = `That gives me solid context on your approach. Could you walk me through the key technical trade-offs you personally weighed, and what you would do differently in hindsight?`;
  }

  return {
    status: 'success',
    spokenReply,
    quickFeedback: analysis.improvements[0] || 'Structured STAR response.',
    starScore: analysis.score,
    classification: analysis.classification
  };
}

export default {
  handleConversationalTurn
};

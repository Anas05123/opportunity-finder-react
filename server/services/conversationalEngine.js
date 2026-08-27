import axios from 'axios';

/**
 * Handle a real-time conversational interview turn.
 * Responds naturally like an executive human interviewer with industry-specific probing.
 */
export async function handleConversationalTurn({
  company = 'Stripe Worldwide',
  role = 'Staff Systems Engineer',
  persona = { name: 'Elena Rostova', title: 'Principal Bar Raiser', tone: 'Analytical, encouraging, deep probe' },
  conversationHistory = [],
  candidateMessage = '',
  track = 'behavioral'
}) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const historyFormatted = conversationHistory
        .map(msg => `${msg.role === 'interviewer' ? persona.name : 'Candidate'}: ${msg.content}`)
        .join('\n');

      const prompt = `
You are ${persona.name}, ${persona.title} at ${company}.
Your interviewing style is ${persona.tone}.
You are conducting a live, spoken video interview for the position of ${role} on the ${track} track.

Recent conversation transcript:
${historyFormatted}

Candidate just said:
"${candidateMessage}"

CRITICAL INSTRUCTIONS FOR SPOKEN REAL-TIME CONVERSATION:
1. Respond directly and conversationally as ${persona.name} in 2 to 3 natural spoken sentences (maximum 50 words).
2. React authentically to what the candidate specifically stated (e.g. acknowledge their technical decision, metric, or trade-off).
3. Ask ONE sharp, insightful follow-up question or probe deeper into the STAR Result/Action, OR naturally transition if they answered thoroughly.
4. Keep the tone professional, realistic, and conversational—exactly like a real senior interviewer on a video call. Do NOT output markdown, bullet points, or robotic score headers. Just the spoken words.

Return JSON in this format:
{
  "spokenReply": "Conversational reply spoken aloud by the interviewer...",
  "quickFeedback": "Brief internal note on candidate's answer strength",
  "starScore": 88
}
`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            responseMimeType: 'application/json'
          }
        },
        { timeout: 10000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed.spokenReply) return parsed;
      }
    } catch (err) {
      console.warn('[Gemini Conversational Turn Notice]:', err.message);
    }
  }

  // High-fidelity fallback conversational engine
  return generateConversationalFallback({ company, role, persona, candidateMessage, conversationHistory });
}

function generateConversationalFallback({ company, role, persona, candidateMessage = '', conversationHistory = [] }) {
  const lower = candidateMessage.toLowerCase();
  let spokenReply = '';
  let starScore = 85;

  if (lower.includes('metric') || lower.includes('%') || lower.includes('latency') || lower.includes('throughput') || lower.includes('scale')) {
    spokenReply = `That's a very solid breakdown of the technical metrics. I'm curious though—when you pushed that change to production, how did you handle rollbacks or canary verification to protect customer traffic at ${company}?`;
    starScore = 92;
  } else if (lower.includes('disagree') || lower.includes('team') || lower.includes('conflict') || lower.includes('product manager')) {
    spokenReply = `Navigating team alignment under pressure is critical here. Looking back at that disagreement, what is one thing you would do differently to build consensus even faster?`;
    starScore = 88;
  } else if (lower.includes('outage') || lower.includes('risk') || lower.includes('failure') || lower.includes('incident')) {
    spokenReply = `Great composure during the incident. How did you structure the post-mortem to ensure that class of failure could never happen again?`;
    starScore = 90;
  } else {
    spokenReply = `Thanks for explaining that context. Can you walk me deeper into your specific individual contribution and the key technical trade-off you had to make?`;
    starScore = 84;
  }

  return {
    spokenReply,
    quickFeedback: 'Structured response with clear context.',
    starScore
  };
}

export default {
  handleConversationalTurn
};

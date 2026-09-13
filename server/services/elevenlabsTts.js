import axios from 'axios';

/**
 * Verified Premium ElevenLabs Voice IDs (Tested & Approved on Active Account)
 */
export const ELEVENLABS_VOICES = {
  bella: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella / Elena (Executive, Reassuring & Articulate Female)', gender: 'female', accent: 'American' },
  adam: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam / Marcus (Resonant, Confident Tech Director Male)', gender: 'male', accent: 'American' },
  antoni: { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni / David (Calm, Analytical System Architect Male)', gender: 'male', accent: 'American' },
  arnold: { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Deep & Authoritative Senior Manager Male)', gender: 'male', accent: 'American' },
  roger: { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Conversational American Male)', gender: 'male', accent: 'American' },
  george: { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Warm & Captivating British Male)', gender: 'male', accent: 'British' }
};

/**
 * Humanize spoken text with natural conversational breath pauses and acronym expansion
 */
export function humanizeSpeechText(text = '') {
  let spoken = text.trim();
  spoken = spoken.replace(/[*_#`]/g, '');
  
  // Conversational openings with natural breath commas
  spoken = spoken.replace(/^(Hello|Hi|Hey|Good morning|Good afternoon|Got it|Understood|Thanks|Thank you|Great)\b(?![,\.])/gi, '$1,');
  
  // Proper tech acronym pronunciation
  spoken = spoken.replace(/\b(API)\b/g, 'A-P-I');
  spoken = spoken.replace(/\b(APIs)\b/g, 'A-P-Is');
  spoken = spoken.replace(/\b(AWS)\b/g, 'A-W-S');
  spoken = spoken.replace(/\b(GCP)\b/g, 'G-C-P');
  spoken = spoken.replace(/\b(CI\/CD)\b/g, 'C-I C-D');
  spoken = spoken.replace(/\b(ROI)\b/g, 'R-O-I');
  spoken = spoken.replace(/\b(SQL)\b/g, 'Sequel');
  spoken = spoken.replace(/\b(NoSQL)\b/g, 'No-Sequel');
  spoken = spoken.replace(/\b(PostgreSQL|Postgres)\b/gi, 'Post-gres');
  spoken = spoken.replace(/\b(K8s)\b/gi, 'Kubernetes');
  spoken = spoken.replace(/\b(QPS|RPS)\b/g, 'requests per second');
  spoken = spoken.replace(/\b(ms)\b/g, 'milliseconds');
  spoken = spoken.replace(/\b(sub-50ms)\b/gi, 'sub 50 milliseconds');
  spoken = spoken.replace(/\s+/g, ' ').trim();
  return spoken;
}

/**
 * Synthesize ultra-realistic human speech using ElevenLabs
 */
export async function synthesizeElevenLabsVoice({ text, voiceKey = 'bella', customApiKey = null }) {
  const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY;
  const normKey = (voiceKey || 'bella').toLowerCase();
  
  // Resolve to a verified working voice ID
  let targetVoice = ELEVENLABS_VOICES.bella;
  if (normKey.includes('adam') || normKey.includes('marcus') || normKey.includes('male')) targetVoice = ELEVENLABS_VOICES.adam;
  if (normKey.includes('bella') || normKey.includes('elena') || normKey.includes('sarah') || normKey.includes('female')) targetVoice = ELEVENLABS_VOICES.bella;
  if (normKey.includes('antoni') || normKey.includes('david')) targetVoice = ELEVENLABS_VOICES.antoni;
  if (normKey.includes('arnold')) targetVoice = ELEVENLABS_VOICES.arnold;
  if (normKey.includes('roger')) targetVoice = ELEVENLABS_VOICES.roger;
  if (normKey.includes('george')) targetVoice = ELEVENLABS_VOICES.george;

  const formattedText = humanizeSpeechText(text);

  if (apiKey && apiKey !== 'your_elevenlabs_api_key_here') {
    // Verified working voice IDs pool for automatic fallback
    const voiceCandidates = [targetVoice, ELEVENLABS_VOICES.bella, ELEVENLABS_VOICES.adam];

    for (const v of voiceCandidates) {
      try {
        const response = await axios.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${v.id}`,
          {
            text: formattedText,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.38,         // Human inflection and pitch dynamic movement
              similarity_boost: 0.82,  // Rich clarity & presence
              style: 0.25,             // Conversational warmth
              use_speaker_boost: true
            }
          },
          {
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            responseType: 'arraybuffer',
            timeout: 15000
          }
        );

        const base64Audio = Buffer.from(response.data).toString('base64');
        return {
          status: 'success',
          source: 'elevenlabs',
          voiceKey: v === ELEVENLABS_VOICES.adam ? 'adam' : 'bella',
          voiceName: v.name,
          audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`
        };
      } catch (err) {
        console.warn(`[ElevenLabs Voice ${v.name} Notice]:`, err.response?.data ? err.response.data.toString() : err.message);
      }
    }
  }

  // Fallback metadata for browser speech synthesis only if ElevenLabs API is completely unreachable
  return {
    status: 'fallback',
    source: 'browser_tts',
    voiceName: targetVoice.name,
    gender: targetVoice.gender,
    text: formattedText
  };
}

export default {
  ELEVENLABS_VOICES,
  humanizeSpeechText,
  synthesizeElevenLabsVoice
};

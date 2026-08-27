import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const ELEVENLABS_VOICES = {
  rachel: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Calm & Professional)', gender: 'female' },
  elena: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella / Elena (Executive & Articulate)', gender: 'female' },
  marcus: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam / Marcus (Deep & Authoritative)', gender: 'male' },
  sophia: { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi / Sophia (Warm & Engaging)', gender: 'female' },
  david: { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni / David (Technical Lead)', gender: 'male' }
};

/**
 * Synthesize speech using ElevenLabs API or return natural audio metadata
 */
export async function synthesizeElevenLabsVoice({ text, voiceKey = 'rachel', customApiKey = null }) {
  const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY;
  const voice = ELEVENLABS_VOICES[voiceKey] || ELEVENLABS_VOICES.rachel;

  if (apiKey && apiKey !== 'your_elevenlabs_api_key_here') {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
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
        voiceName: voice.name,
        audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`
      };
    } catch (err) {
      console.warn('[ElevenLabs API Error]:', err.response?.data ? err.response.data.toString() : err.message);
    }
  }

  // Return fallback metadata for natural browser neural speech synthesis
  return {
    status: 'fallback',
    source: 'browser_tts',
    voiceName: voice.name,
    gender: voice.gender,
    text
  };
}

export default {
  ELEVENLABS_VOICES,
  synthesizeElevenLabsVoice
};

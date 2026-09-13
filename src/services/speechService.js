import { API_BASE_URL } from '../config/api.js';

/**
 * Speech Recognition & Audio Synthesis Service
 * Provides hands-free conversational voice interaction and ElevenLabs audio streaming.
 */

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const isSpeechSynthesisSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis);
};

/**
 * Helper to convert Base64 data URL to Blob Object URL for fast, CSP-safe audio playback
 */
function base64ToBlobUrl(dataUrl) {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1] || 'audio/mpeg';
    const b64 = parts[1] || parts[0];
    const byteCharacters = atob(b64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const blob = new Blob(byteArrays, { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    return dataUrl;
  }
}

/**
 * Continuous Web Speech Recognition with Automatic Silence Pause Detection
 */
export function createSpeechRecognizer({ 
  onResult, 
  onSpeechStart,
  onStart,
  onSpeechEnd,
  onEnd,
  onSilenceTimeout,
  onError, 
  continuous = true,
  silenceThresholdMs = 2000 
}) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = continuous;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let silenceTimer = null;
  let hasSpokenWords = false;

  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    if (hasSpokenWords && onSilenceTimeout) {
      silenceTimer = setTimeout(() => {
        onSilenceTimeout();
      }, silenceThresholdMs);
    }
  };

  recognition.onstart = () => {
    if (onSpeechStart) onSpeechStart();
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const currentText = (finalTranscript + ' ' + interimTranscript).trim();
    if (currentText.length > 3) {
      hasSpokenWords = true;
      resetSilenceTimer();
    }

    if (onResult) {
      onResult(finalTranscript.trim(), interimTranscript.trim(), {
        final: finalTranscript.trim(),
        interim: interimTranscript.trim(),
        full: currentText
      });
    }
  };

  recognition.onerror = (event) => {
    if (event.error !== 'no-speech' && onError) {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    if (onSpeechEnd) onSpeechEnd();
    if (onEnd) onEnd();
  };

  return {
    instance: recognition,
    start: () => {
      hasSpokenWords = false;
      try { recognition.start(); } catch(e){}
    },
    stop: () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      try { recognition.stop(); } catch(e){}
    }
  };
}

let activeAudioElement = null;
let activeBlobUrl = null;

/**
 * Play AI Voice using ElevenLabs Studio Voice API
 */
export async function playAiVoice({ 
  text, 
  voiceKey = 'bella', 
  elevenLabsApiKey = null,
  onStart, 
  onEnd, 
  onWaveUpdate 
}) {
  stopSpeaking();

  try {
    const res = await fetch(`${API_BASE_URL}/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceKey,
        apiKey: elevenLabsApiKey || localStorage.getItem('careerly_elevenlabs_key') || null
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.audioDataUrl) {
        console.log(`[ElevenLabs Audio Engine]: Playing authentic voice (${data.voiceName}) via ElevenLabs...`);
        
        // Convert to Blob Object URL
        const blobUrl = base64ToBlobUrl(data.audioDataUrl);
        activeBlobUrl = blobUrl;
        const audio = new Audio(blobUrl);
        activeAudioElement = audio;

        let waveInterval = null;
        if (onWaveUpdate) {
          waveInterval = setInterval(() => {
            onWaveUpdate(Math.floor(Math.random() * 65) + 35);
          }, 100);
        }

        audio.onplay = () => {
          if (onStart) onStart();
        };

        audio.onended = () => {
          if (waveInterval) clearInterval(waveInterval);
          if (onWaveUpdate) onWaveUpdate(0);
          if (onEnd) onEnd();
          if (activeBlobUrl) {
            URL.revokeObjectURL(activeBlobUrl);
            activeBlobUrl = null;
          }
        };

        audio.onerror = (e) => {
          console.error('[ElevenLabs Audio Play Error]:', e);
          if (waveInterval) clearInterval(waveInterval);
          if (onWaveUpdate) onWaveUpdate(0);
          if (onEnd) onEnd();
        };

        try {
          await audio.play();
        } catch (playErr) {
          if (playErr.name === 'AbortError') {
            return;
          }
          console.warn('[Audio Play Warning]:', playErr.message);
          if (waveInterval) clearInterval(waveInterval);
          if (onWaveUpdate) onWaveUpdate(0);
          if (onEnd) onEnd();
          return;
        }
      }
    }
  } catch (err) {
    console.error('[ElevenLabs Fetch Error]:', err.message);
  }

  // Fallback only if server completely unreachable
  speakBrowserFallback(text, { onStart, onEnd, onWaveUpdate, voiceKey });
}

function speakBrowserFallback(text, { onStart, onEnd, onWaveUpdate, voiceKey }) {
  if (!isSpeechSynthesisSupported()) {
    if (onStart) onStart();
    setTimeout(() => { if (onEnd) onEnd(); }, 3500);
    return;
  }

  window.speechSynthesis.cancel();
  const cleanText = text.replace(/[*_#`]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const isMale = voiceKey === 'adam' || voiceKey === 'roger' || voiceKey === 'antoni' || voiceKey === 'george';
  
  const preferredVoice = voices.find(v => 
    v.lang.startsWith('en') && (
      (isMale && (
        v.name.includes('Natural') ||
        v.name.includes('Guy') ||
        v.name.includes('David') ||
        v.name.includes('George') ||
        v.name.includes('Mark') ||
        v.name.includes('Google US English')
      )) ||
      (!isMale && (
        v.name.includes('Natural') ||
        v.name.includes('Jenny') ||
        v.name.includes('Aria') ||
        v.name.includes('Samantha') ||
        v.name.includes('Victoria') ||
        v.name.includes('Zira') ||
        v.name.includes('Google US English')
      ))
    )
  ) || voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural'))
    || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  let waveInterval = null;
  utterance.onstart = () => {
    if (onWaveUpdate) {
      waveInterval = setInterval(() => onWaveUpdate(Math.floor(Math.random() * 60) + 40), 100);
    }
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (waveInterval) clearInterval(waveInterval);
    if (onWaveUpdate) onWaveUpdate(0);
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (waveInterval) clearInterval(waveInterval);
    if (onWaveUpdate) onWaveUpdate(0);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch(e){}
    activeAudioElement = null;
  }

  if (activeBlobUrl) {
    try { URL.revokeObjectURL(activeBlobUrl); } catch(e){}
    activeBlobUrl = null;
  }

  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Real-Time Web Audio Level Visualizer
 */
export function attachAudioVisualizer(mediaStream, onVolumeChange) {
  if (!mediaStream || typeof window === 'undefined') return () => {};

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return () => {};

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animId = null;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedVolume = Math.min(100, Math.round((avg / 128) * 100));

      if (onVolumeChange) onVolumeChange(normalizedVolume);
      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      try {
        source.disconnect();
        analyser.disconnect();
        audioCtx.close();
      } catch (e) {}
    };
  } catch (err) {
    console.warn('[Audio Visualizer Init Warning]:', err);
    return () => {};
  }
}

/**
 * Filler Words & Speech Cadence Parser
 */
export function detectFillerWords(text) {
  const fillers = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'sort of', 'kind of', 'literally'];
  const occurrences = [];
  const lower = (text || '').toLowerCase();

  fillers.forEach(f => {
    const reg = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = lower.match(reg);
    if (matches) {
      occurrences.push({ word: f, count: matches.length });
    }
  });

  const total = occurrences.reduce((a, b) => a + b.count, 0);
  return { total, occurrences };
}

export default {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognizer,
  playAiVoice,
  stopSpeaking,
  attachAudioVisualizer,
  detectFillerWords
};

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
 * Continuous Web Speech Recognition with Automatic Silence Pause Detection
 */
export function createSpeechRecognizer({ 
  onResult, 
  onSpeechStart,
  onSpeechEnd,
  onSilenceTimeout,
  onError, 
  continuous = true,
  silenceThresholdMs = 2800 
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
    if (currentText.length > 5) {
      hasSpokenWords = true;
      resetSilenceTimer();
    }

    if (onResult) {
      onResult({
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

/**
 * Play AI Voice using ElevenLabs Studio Voice API or Natural SpeechSynthesis
 */
export async function playAiVoice({ 
  text, 
  voiceKey = 'elena', 
  elevenLabsApiKey = null,
  onStart, 
  onEnd, 
  onWaveUpdate 
}) {
  stopSpeaking();

  // Try ElevenLabs backend TTS
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
        const audio = new Audio(data.audioDataUrl);
        activeAudioElement = audio;

        let waveInterval = null;
        if (onWaveUpdate) {
          waveInterval = setInterval(() => {
            onWaveUpdate(Math.floor(Math.random() * 65) + 35);
          }, 120);
        }

        audio.onplay = () => {
          if (onStart) onStart();
        };

        audio.onended = () => {
          if (waveInterval) clearInterval(waveInterval);
          if (onWaveUpdate) onWaveUpdate(0);
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          if (waveInterval) clearInterval(waveInterval);
          if (onWaveUpdate) onWaveUpdate(0);
          speakBrowserFallback(text, { onStart, onEnd, onWaveUpdate, voiceKey });
        };

        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.warn('[ElevenLabs Play Notice]: Using natural neural browser voice fallback:', err.message);
  }

  // Browser SpeechSynthesis Fallback
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

  utterance.rate = 1.0;
  utterance.pitch = 1.02;

  const voices = window.speechSynthesis.getVoices();
  const isMale = voiceKey === 'marcus' || voiceKey === 'david';
  
  const preferredVoice = voices.find(v => 
    v.lang.startsWith('en') && (
      (isMale && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('George') || v.name.includes('Guy'))) ||
      (!isMale && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Victoria') || v.name.includes('Google US English')))
    )
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  let waveInterval = null;
  utterance.onstart = () => {
    if (onWaveUpdate) {
      waveInterval = setInterval(() => onWaveUpdate(Math.floor(Math.random() * 60) + 40), 120);
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

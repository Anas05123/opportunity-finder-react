/**
 * Speech Recognition & Audio Synthesis Service
 * Provides hands-free voice interaction and audio frequency analysis.
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
 * Initialize Web Speech Recognition
 */
export function createSpeechRecognizer({ onResult, onEnd, onError, continuous = true }) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = continuous;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

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

    if (onResult) {
      onResult({
        final: finalTranscript.trim(),
        interim: interimTranscript.trim(),
        full: (finalTranscript + ' ' + interimTranscript).trim()
      });
    }
  };

  recognition.onerror = (event) => {
    if (event.error !== 'no-speech' && onError) {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

/**
 * Synthesize Natural Voice Output via Web SpeechSynthesis
 */
export function speakText(text, { onStart, onEnd, onBoundary, rate = 1.0, pitch = 1.0 } = {}) {
  if (!isSpeechSynthesisSupported()) {
    if (onStart) onStart();
    setTimeout(() => { if (onEnd) onEnd(); }, 3000);
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanText = text.replace(/[*_#`]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  utterance.rate = rate;
  utterance.pitch = pitch;

  // Pick natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Premium'))
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onBoundary) utterance.onboundary = onBoundary;

  utterance.onerror = (err) => {
    console.warn('[SpeechSynthesis Notice]:', err);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
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
  speakText,
  stopSpeaking,
  attachAudioVisualizer,
  detectFillerWords
};

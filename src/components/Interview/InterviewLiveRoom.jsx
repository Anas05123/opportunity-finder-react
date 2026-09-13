import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Volume2, Sparkles, 
  Send, RefreshCw, Clock, PhoneOff, Settings, 
  MessageSquare, X, Check
} from 'lucide-react';
import { 
  createSpeechRecognizer, 
  playAiVoice, 
  stopSpeaking, 
  attachAudioVisualizer, 
  isSpeechRecognitionSupported
} from '../../services/speechService.js';
import { API_BASE_URL } from '../../config/api.js';

const VOICE_ROSTER = [
  { id: 'bella', name: 'Elena Rostova', title: 'Principal Bar Raiser', initials: 'ER', color: '#6366F1' },
  { id: 'adam', name: 'Marcus Vance', title: 'VP of Systems Architecture', initials: 'MV', color: '#0EA5E9' },
  { id: 'antoni', name: 'David Chen', title: 'Lead Distributed Architect', initials: 'DC', color: '#10B981' },
  { id: 'roger', name: 'Sarah Sterling', title: 'Senior Engineering Director', initials: 'SS', color: '#EC4899' },
  { id: 'george', name: 'Alexander Hamilton', title: 'Managing Partner', initials: 'AH', color: '#8B5CF6' }
];

export default function InterviewLiveRoom({ 
  sessionConfig, 
  userProfile, 
  triggerToast, 
  onCompleteSession,
  _onCancel 
}) {
  const { company, role, track, persona } = sessionConfig;
  
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      role: 'interviewer',
      content: `Hello! Welcome to your executive interview for the ${role} position at ${company}. I am ${persona?.name || 'Elena Rostova'}. To start off, could you walk me through a major project you led and the key technical trade-offs you made?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [candidateLiveText, setCandidateLiveText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiWaveLevel, setAiWaveLevel] = useState(0);

  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('careerly_elevenlabs_key') || '');

  const candidateVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognizerObjRef = useRef(null);
  const chatScrollRef = useRef(null);
  const isAiSpeakingRef = useRef(false);
  const liveTextRef = useRef('');
  const micActiveRef = useRef(micActive);
  micActiveRef.current = micActive;

  isAiSpeakingRef.current = isAiSpeaking;
  liveTextRef.current = candidateLiveText;

  const [activeVoice, setActiveVoice] = useState(() => (persona?.id || 'bella').toLowerCase());
  const voiceKey = activeVoice;

  // 1. Initialize WebRTC Camera & Mic Stream
  useEffect(() => {
    let stream = null;
    let cleanupAudio = () => {};

    async function initMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, 
          audio: true 
        });
        mediaStreamRef.current = stream;

        if (candidateVideoRef.current) {
          candidateVideoRef.current.srcObject = stream;
        }

        cleanupAudio = attachAudioVisualizer(stream, (vol) => {
          if (micActiveRef.current) {
            setAudioVolume(vol);
          } else {
            setAudioVolume(0);
          }
        });
      } catch (err) {
        console.warn('[Camera Init Notice]:', err);
        setCameraActive(false);
      }
    }

    initMedia();

    return () => {
      cleanupAudio();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 2. Timer Loop
  useEffect(() => {
    const interval = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Initial Greeting AI Speech on Mount
  useEffect(() => {
    const initialGreeting = messages[0].content;
    setIsAiSpeaking(true);

    playAiVoice({
      text: initialGreeting,
      voiceKey,
      elevenLabsApiKey: elevenLabsKey,
      onStart: () => setIsAiSpeaking(true),
      onEnd: () => {
        setIsAiSpeaking(false);
        setAiWaveLevel(0);
        startContinuousListening();
      },
      onWaveUpdate: (lvl) => setAiWaveLevel(lvl)
    });

    return () => stopSpeaking();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, candidateLiveText, interimText]);

  // 4. Start Continuous Speech Recognizer
  const startContinuousListening = () => {
    if (!micActiveRef.current) return;
    if (isAiSpeakingRef.current) return;

    if (!isSpeechRecognitionSupported()) {
      console.log('[Speech Rec]: Not supported, using text input.');
      return;
    }

    if (recognizerObjRef.current) {
      try { recognizerObjRef.current.stop(); } catch(_e){}
    }

    const rec = createSpeechRecognizer({
      continuous: true,
      interimResults: true,
      onResult: (finalTranscript, interimTranscript) => {
        if (!micActiveRef.current) return;
        if (finalTranscript) {
          setCandidateLiveText(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript).trim());
        }
        setInterimText(interimTranscript);
      },
      onStart: () => setIsRecording(true),
      onEnd: () => {
        setIsRecording(false);
        if (micActiveRef.current && !isAiSpeakingRef.current) {
          try {
            if (liveTextRef.current && liveTextRef.current.trim().length > 0) {
              handleSendCandidateTurn(liveTextRef.current.trim());
            }
          } catch (err) {
            console.error('[Speech Rec auto-restart error]:', err);
          }
        }
      },
      onError: (err) => {
        console.warn('[Speech Recognizer Warning]:', err);
        setIsRecording(false);
      }
    });

    recognizerObjRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.warn('[Recognizer start notice]:', e);
    }
  };

  // Hardware Mic Toggle
  const handleToggleMic = () => {
    const nextState = !micActive;
    setMicActive(nextState);
    micActiveRef.current = nextState;

    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = nextState;
      }
    }

    if (!nextState) {
      if (recognizerObjRef.current) {
        try { recognizerObjRef.current.stop(); } catch (_e) {}
      }
      setIsRecording(false);
      setAudioVolume(0);
      setInterimText('');
      if (triggerToast) triggerToast('Microphone hardware muted');
    } else {
      if (triggerToast) triggerToast('Microphone unmuted and listening');
      if (!isAiSpeakingRef.current) {
        startContinuousListening();
      }
    }
  };

  const handleToggleCamera = () => {
    const nextState = !cameraActive;
    setCameraActive(nextState);
    if (mediaStreamRef.current) {
      const vTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (vTrack) vTrack.enabled = nextState;
    }
  };

  // 5. Send Candidate Response
  const handleSendCandidateTurn = async (forcedText) => {
    const rawAnswer = (typeof forcedText === 'string' ? forcedText : candidateLiveText).trim();
    if (!rawAnswer) return;

    if (recognizerObjRef.current) {
      try { recognizerObjRef.current.stop(); } catch (_e) {}
    }
    setIsRecording(false);
    setCandidateLiveText('');
    setInterimText('');

    const userTurn = {
      id: 'm_' + Date.now(),
      role: 'candidate',
      content: rawAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userTurn]);
    setIsAiThinking(true);

    try {
      const historyPayload = messages.concat(userTurn).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${API_BASE_URL}/ai/interview/conversational-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyPayload,
          company,
          role,
          track,
          persona: persona?.name || 'Elena Rostova',
          candidateAnswer: rawAnswer
        })
      });

      const data = await res.json();
      const aiReplyText = data.replyText || "Thank you. Let us proceed to the next technical aspect.";

      const aiMsg = {
        id: 'm_ai_' + Date.now(),
        role: 'interviewer',
        content: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsAiThinking(false);
      setIsAiSpeaking(true);

      playAiVoice({
        text: aiReplyText,
        voiceKey,
        elevenLabsApiKey: elevenLabsKey,
        onStart: () => setIsAiSpeaking(true),
        onEnd: () => {
          setIsAiSpeaking(false);
          setAiWaveLevel(0);
          startContinuousListening();
        },
        onWaveUpdate: (lvl) => setAiWaveLevel(lvl)
      });
    } catch (err) {
      console.error('[Conversational Turn Error]:', err);
      setIsAiThinking(false);
      startContinuousListening();
    }
  };

  // 6. Wrap Up Session
  const handleWrapUpSession = () => {
    stopSpeaking();
    if (recognizerObjRef.current) {
      try { recognizerObjRef.current.stop(); } catch(_e){}
    }

    const candidateTurns = messages
      .filter(m => m.role === 'candidate')
      .map((m, idx) => {
        const prevAiMsg = messages[messages.indexOf(m) - 1];
        return {
          questionIndex: idx,
          question: prevAiMsg?.content || 'Interview Question Prompt',
          candidateAnswer: m.content
        };
      });

    onCompleteSession({
      company,
      role,
      track,
      answers: candidateTurns.length > 0 ? candidateTurns : [
        {
          question: messages[0]?.content || 'Interview Question',
          candidateAnswer: candidateLiveText.trim() || ''
        }
      ],
      durationSeconds: timerSeconds
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn pb-24">
      
      {/* Top Telepresence Broadcast Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/80 px-6 py-3.5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-bold text-sm text-white shadow-sm"
            style={{ backgroundColor: persona?.color || '#2563EB' }}
          >
            {persona?.initials || company?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground font-display">{company}</span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {track}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-sans">{role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Studio Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs font-semibold text-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px]">Studio Live</span>
          </div>

          {/* Voice Settings Dropdown Trigger */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all cursor-pointer"
            title="ElevenLabs Voice Settings"
          >
            <Sparkles size={13} className="text-amber-500" />
            <span className="hidden md:inline">Interviewer Voice</span>
            <Settings size={13} className="text-muted-foreground" />
          </button>

          {/* Live Call Duration Clock */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground bg-secondary/80 px-3.5 py-2 rounded-xl border border-border/60">
            <Clock size={13} className="text-primary animate-pulse" />
            <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
          </div>

          {/* Conclude Session / View Scorecard */}
          <button
            onClick={handleWrapUpSession}
            id="end-interview-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <PhoneOff size={13} />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* ElevenLabs Studio Voice Modal */}
      {showSettings && (
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4 animate-slideUp">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">Interviewer Voice Identity</h3>
            </div>
            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {VOICE_ROSTER.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  setActiveVoice(v.id);
                  if (triggerToast) triggerToast(`Switched voice identity to ${v.name}`);
                  playAiVoice({
                    text: `Hello, I am ${v.name}. Let us proceed with your assessment.`,
                    voiceKey: v.id,
                    elevenLabsApiKey: elevenLabsKey
                  });
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[90px] cursor-pointer ${
                  activeVoice === v.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/25'
                    : 'border-border/80 bg-secondary/30 hover:bg-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white"
                    style={{ backgroundColor: v.color }}
                  >
                    {v.initials}
                  </div>
                  {activeVoice === v.id && <Check size={14} className="text-primary" />}
                </div>
                <div className="pt-2">
                  <p className="text-xs font-bold text-foreground truncate">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{v.title}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Custom ElevenLabs API Key (Optional):</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <input 
                type="password"
                placeholder="xi-api-key..."
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                className="bg-secondary/60 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary font-mono w-full sm:w-48"
              />
              <button
                onClick={() => {
                  localStorage.setItem('careerly_elevenlabs_key', elevenLabsKey);
                  if (triggerToast) triggerToast('ElevenLabs key saved!');
                  setShowSettings(false);
                }}
                className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl hover:opacity-95 cursor-pointer shrink-0"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Arena: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Dominant Dual Broadcast Arena (65% width / 8 cols or full if HUD collapsed) */}
        <div className={isHudCollapsed ? "lg:col-span-12 space-y-4" : "lg:col-span-8 space-y-4"}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tile 1: AI Interviewer Video Avatar */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl overflow-hidden border border-border/80 shadow-md flex flex-col justify-between p-5 text-white">
              
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs">
                  <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-emerald-400 animate-ping' : isAiThinking ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'}`} />
                  <span className="font-semibold">{persona?.name || 'Elena Rostova'}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300">
                  <Sparkles size={11} className="text-amber-400" />
                  <span>AI Evaluator</span>
                </div>
              </div>

              {/* Center Talking Avatar with Dynamic Pulse Ring */}
              <div className="my-auto flex flex-col items-center justify-center text-center space-y-3 z-10">
                <div className="relative">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-mono font-bold text-2xl sm:text-3xl text-white shadow-2xl transition-all duration-300 border border-white/20 ${
                    isAiSpeaking 
                      ? 'ring-4 ring-blue-500/80 scale-105 shadow-blue-500/40 bg-gradient-to-br from-blue-600 to-indigo-700' 
                      : isAiThinking 
                      ? 'ring-4 ring-amber-500/80 animate-pulse bg-gradient-to-br from-amber-600 to-amber-800'
                      : 'ring-2 ring-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
                  }`}>
                    {persona?.initials || 'AI'}
                  </div>

                  {/* Dynamic Audio Waves */}
                  {isAiSpeaking && (
                    <div className="absolute -bottom-2.5 inset-x-0 flex justify-center gap-1">
                      {[35, 70, 95, 60, 30].map((h, i) => (
                        <span 
                          key={i} 
                          className="w-1 bg-blue-400 rounded-full animate-bounce" 
                          style={{ height: `${(h * aiWaveLevel) / 100 + 6}px`, animationDelay: `${i * 70}ms` }} 
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium text-slate-200 flex items-center gap-2 border border-white/10">
                  {isAiSpeaking ? (
                    <>
                      <Volume2 size={13} className="text-blue-400 animate-pulse" />
                      <span>Interviewer Speaking...</span>
                    </>
                  ) : isAiThinking ? (
                    <>
                      <RefreshCw size={13} className="text-amber-400 animate-spin" />
                      <span>Synthesizing Query Probe...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={13} className="text-emerald-400 animate-pulse" />
                      <span>Listening attentively...</span>
                    </>
                  )}
                </div>
              </div>

              {/* Subtitle Caption of Current Prompt */}
              <div className="z-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-xs text-slate-100 leading-relaxed shadow-lg">
                <p className="font-semibold text-blue-300 text-[10px] uppercase tracking-wider mb-0.5">Live Teleprompter</p>
                <p className="line-clamp-2 italic">
                  "{messages[messages.length - 1]?.content}"
                </p>
              </div>

            </div>

            {/* Tile 2: Candidate Live Camera Broadcast */}
            <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-border/80 shadow-md flex flex-col justify-between p-5 text-white">
              
              {cameraActive ? (
                <video 
                  ref={candidateVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <VideoOff size={36} />
                  <p className="text-xs">Camera Stream Paused</p>
                </div>
              )}

              {/* Broadcast Framing Crosshairs & Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs">
                  <span className={`w-2 h-2 rounded-full ${micActive && isRecording ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
                  <span className="font-semibold">{userProfile?.name || 'Candidate (You)'}</span>
                </div>

                {!micActive ? (
                  <div className="flex items-center gap-1.5 bg-red-600 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm animate-pulse">
                    <MicOff size={12} />
                    <span>Hardware Muted</span>
                  </div>
                ) : isRecording ? (
                  <div className="flex items-center gap-1.5 bg-emerald-600 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm">
                    <Mic size={12} />
                    <span>Live Audio</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-slate-300">
                    <Mic size={12} />
                    <span>Standby</span>
                  </div>
                )}
              </div>

              {/* Candidate Bottom Media Bar */}
              <div className="flex items-center justify-between z-10 mt-auto bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Mic size={14} className={micActive && audioVolume > 5 ? 'text-emerald-400' : 'text-slate-400'} />
                  <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: micActive ? `${Math.min(100, audioVolume * 1.8)}%` : '0%' }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                  <span>1080p WebRTC</span>
                </div>
              </div>

            </div>

          </div>

          {/* Quick Conversational Prompt Chips */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Quick Conversational Prompts (Natural Steering):
              </span>
              <span className="text-[10px] text-muted-foreground">Click to speak or type naturally</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Request Hint', text: 'Could you give me a small hint or steer me in the right direction on this point?' },
                { label: 'Clarify Scope', text: 'Could you clarify the scale and performance constraints for this scenario?' },
                { label: 'I am Uncertain', text: 'I am not completely certain about this specific detail. Could you provide a pointer?' },
                { label: 'Need a Moment', text: 'Please give me 10 seconds to organize my thoughts on this problem.' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendCandidateTurn(chip.text)}
                  disabled={isAiSpeaking || isAiThinking}
                  className="px-3 py-1.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary text-xs font-semibold text-foreground transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Collapsible Meeting Dialogue HUD (35% width / 4 cols) */}
        <div className={isHudCollapsed ? "hidden" : "lg:col-span-4 space-y-3"}>
          <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col h-[520px]">
            
            <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Meeting Dialogue HUD
                </h3>
              </div>
              <button
                onClick={() => setIsHudCollapsed(true)}
                title="Collapse sidebar"
                className="text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
              >
                Hide
              </button>
            </div>

            {/* Scrollable Dialogue List */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-3 pr-1"
            >
              {messages.map((m) => {
                const isAI = m.role === 'interviewer';
                return (
                  <div 
                    key={m.id} 
                    className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                      <span className="font-bold">{isAI ? persona?.name || 'Elena Rostova' : 'You'}</span>
                      <span>·</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed max-w-[92%] shadow-sm ${
                      isAI 
                        ? 'bg-secondary/40 border border-border/70 text-foreground rounded-tl-none' 
                        : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      <p>{m.content}</p>
                    </div>
                  </div>
                );
              })}

              {/* Real-Time Live Transcribing Bubble */}
              {(candidateLiveText || interimText) && (
                <div className="flex flex-col items-end animate-fadeIn">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live Transcribing...</span>
                  </div>
                  <div className="rounded-2xl rounded-tr-none p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-foreground max-w-[92%]">
                    <p className="italic">{candidateLiveText} {interimText}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fallback Text Input */}
            <div className="pt-2 border-t border-border/60 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (candidateLiveText.trim()) handleSendCandidateTurn();
                }}
                className="flex items-center gap-2"
              >
                <input 
                  type="text"
                  placeholder={micActive ? "Speak or type your response..." : "Mic is muted. Type here to reply..."}
                  value={candidateLiveText}
                  onChange={(e) => setCandidateLiveText(e.target.value)}
                  className="flex-1 bg-secondary/50 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!candidateLiveText.trim() || isAiThinking || isAiSpeaking}
                  className="p-2 bg-primary text-white rounded-xl hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>

      {/* Floating Studio Island Dock (Bottom Pill) */}
      <div className="fixed bottom-5 inset-x-0 flex justify-center z-50 pointer-events-none px-4">
        <div className="pointer-events-auto bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-3">
          
          {/* Mic Button */}
          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              micActive 
                ? 'bg-secondary text-foreground hover:bg-secondary/80' 
                : 'bg-red-600 text-white shadow-md hover:bg-red-700'
            }`}
          >
            {micActive ? <Mic size={15} className="text-emerald-500" /> : <MicOff size={15} />}
            <span>{micActive ? 'Mute' : 'Unmute'}</span>
          </button>

          {/* Camera Button */}
          <button
            onClick={handleToggleCamera}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              cameraActive 
                ? 'bg-secondary text-foreground hover:bg-secondary/80' 
                : 'bg-red-600 text-white shadow-md hover:bg-red-700'
            }`}
          >
            {cameraActive ? <Video size={15} className="text-emerald-500" /> : <VideoOff size={15} />}
            <span>{cameraActive ? 'Camera' : 'Cam Off'}</span>
          </button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Voice Switcher Trigger */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer"
            title="Interviewer Voice"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span className="hidden sm:inline">Voice</span>
          </button>

          {/* Toggle HUD button */}
          <button
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer"
            title="Toggle Transcript HUD"
          >
            <MessageSquare size={14} className="text-primary" />
            <span className="hidden sm:inline">{isHudCollapsed ? 'Open HUD' : 'Hide HUD'}</span>
          </button>

          {/* End Call Button */}
          <button
            onClick={handleWrapUpSession}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer ml-1"
          >
            <PhoneOff size={14} />
            <span>End Call</span>
          </button>

        </div>
      </div>

    </div>
  );
}

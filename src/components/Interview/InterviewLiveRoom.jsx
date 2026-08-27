import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Volume2, VolumeX, Sparkles, 
  Send, RefreshCw, HelpCircle, ChevronRight, CheckCircle2, 
  Clock, Award, ArrowRight, X, Play, RotateCcw, AlertTriangle,
  Flame, Target, ShieldCheck, MessageSquare, Maximize2
} from 'lucide-react';
import { 
  createSpeechRecognizer, 
  speakText, 
  stopSpeaking, 
  attachAudioVisualizer, 
  detectFillerWords,
  isSpeechRecognitionSupported
} from '../../services/speechService.js';
import { API_BASE_URL } from '../../config/api.js';

export default function InterviewLiveRoom({ 
  sessionConfig, 
  userProfile, 
  triggerToast, 
  onCompleteSession,
  onExitSession 
}) {
  const { company, role, track, interviewer, questions = [] } = sessionConfig;
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Media Devices
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0);
  const [aiWaveLevel, setAiWaveLevel] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Turn Evaluation Modal
  const [turnFeedback, setTurnFeedback] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);

  // Session Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const candidateVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognizerRef = useRef(null);

  const currentQuestionObj = questions[currentQIndex] || {
    question: "Walk me through a complex architectural project you led.",
    guidance: "Evaluate STAR methodology, system trade-offs, and metrics.",
    hints: ["Highlight the business context", "Explain the technical trade-offs", "Quantify the outcome"]
  };

  // 1. Initialize Camera & Mic MediaStream
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
          if (micActive) setAudioVolume(vol);
        });
      } catch (err) {
        console.warn('[Camera Init Notice]:', err);
        setCameraActive(false);
      }
    }

    initMedia();

    return () => {
      cleanupAudio();
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 2. Timer Loop
  useEffect(() => {
    const interval = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Question Auto-Speech on Index Change
  useEffect(() => {
    setCandidateAnswer('');
    setInterimTranscript('');
    setTurnFeedback(null);
    setShowHint(false);

    // Speak question aloud using natural TTS
    setIsAiSpeaking(true);
    let waveInterval = setInterval(() => {
      setAiWaveLevel(Math.floor(Math.random() * 70) + 30);
    }, 150);

    speakText(currentQuestionObj.question, {
      onStart: () => setIsAiSpeaking(true),
      onEnd: () => {
        setIsAiSpeaking(false);
        setAiWaveLevel(0);
        clearInterval(waveInterval);
      }
    });

    return () => {
      stopSpeaking();
      clearInterval(waveInterval);
    };
  }, [currentQIndex]);

  // 4. Toggle Voice Speech Recognition
  const toggleRecording = () => {
    if (isRecording) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch(e){}
      }
      setIsRecording(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        if (triggerToast) triggerToast("Web Speech is not supported in this browser. You can type your answer in the pad.");
        return;
      }

      const recognizer = createSpeechRecognizer({
        onResult: ({ final, interim, full }) => {
          setInterimTranscript(interim);
          if (final) {
            setCandidateAnswer(prev => (prev ? prev + ' ' + final : final).trim());
            setInterimTranscript('');
          }
        },
        onError: (err) => console.warn('[Speech Recognition Error]:', err),
        onEnd: () => {
          if (isRecording) {
            try { recognizer.start(); } catch(e){}
          }
        }
      });

      if (recognizer) {
        try {
          recognizer.start();
          recognizerRef.current = recognizer;
          setIsRecording(true);
        } catch (e) {
          console.warn('[Recognizer start err]:', e);
        }
      }
    }
  };

  // 5. Submit & Grade Turn Answer
  const handleSubmitTurn = async () => {
    const finalAnswer = (candidateAnswer + ' ' + interimTranscript).trim();
    if (!finalAnswer) {
      if (triggerToast) triggerToast("Please speak or type your answer before submitting.");
      return;
    }

    if (isRecording) toggleRecording();
    stopSpeaking();
    setIsEvaluating(true);

    try {
      const token = localStorage.getItem('careerly_token');
      const res = await fetch(`${API_BASE_URL}/ai/interview/evaluate-turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          company,
          role,
          question: currentQuestionObj.question,
          answer: finalAnswer,
          turnIndex: currentQIndex + 1,
          totalTurns: questions.length
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        const turnRecord = {
          questionIndex: currentQIndex,
          question: currentQuestionObj.question,
          candidateAnswer: finalAnswer,
          ...data
        };

        const updatedAnswers = [...completedAnswers, turnRecord];
        setCompletedAnswers(updatedAnswers);
        setTurnFeedback(data);

        // Speak interviewer feedback intro
        speakText(`Thank you. Score: ${data.score} out of 100. ${data.strengths[0] || 'Good response.'}`, {
          onStart: () => setIsAiSpeaking(true),
          onEnd: () => setIsAiSpeaking(false)
        });
      }
    } catch (err) {
      console.error('[Evaluation Error]:', err);
      if (triggerToast) triggerToast("Could not grade answer: " + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 6. Advance to Next Question or Finalize
  const handleProceedNext = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Finalize entire interview session
      onCompleteSession({
        company,
        role,
        track,
        answers: completedAnswers,
        durationSeconds: timerSeconds
      });
    }
  };

  const detectedFillers = detectFillerWords(candidateAnswer + ' ' + interimTranscript);

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fadeIn">
      
      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border px-5 py-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-base">
            🏢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-foreground">{company}</span>
              <span className="text-[10px] font-semibold bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">
                {track}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{role}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Question Progress Tracker */}
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-foreground bg-secondary/80 px-3 py-1.5 rounded-xl">
            <span className="text-primary font-mono">Q{currentQIndex + 1}</span>
            <span className="text-muted-foreground">/ {questions.length}</span>
          </div>

          {/* Live Timer */}
          <div className="flex items-center gap-1.5 text-[12px] font-mono font-bold text-foreground bg-secondary/80 px-3 py-1.5 rounded-xl">
            <Clock size={13} className="text-primary animate-pulse" />
            <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
          </div>

          {/* Exit Room */}
          <button 
            onClick={onExitSession}
            className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-secondary transition-all"
            title="Exit Interview Room"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Dual Video Grid (Google Meet / Zoom Split Simulation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Tile: AI Interviewer Video Avatar */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl overflow-hidden border border-border shadow-md flex flex-col justify-between p-4 text-white">
          
          {/* AI Header Overlay */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'}`} />
              <span className="font-semibold">{interviewer?.name || 'Elena Rostova'}</span>
              <span className="text-[10px] text-slate-400">· {interviewer?.title || 'Principal Interviewer'}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-300">
              <Sparkles size={11} className="text-amber-400" />
              <span>AI Bar Raiser</span>
            </div>
          </div>

          {/* Center: Dynamic Talking Avatar Graphic */}
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-3 z-10">
            <div className="relative">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-2xl transition-all duration-300 ${
                isAiSpeaking 
                  ? 'ring-4 ring-blue-500/80 scale-105 shadow-blue-500/30' 
                  : 'ring-2 ring-slate-700 bg-slate-800'
              }`}>
                👩‍💼
              </div>

              {/* Dynamic Audio Waves */}
              {isAiSpeaking && (
                <div className="absolute -bottom-2 inset-x-0 flex justify-center gap-1">
                  {[40, 70, 90, 60, 30].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-blue-400 rounded-full animate-bounce" 
                      style={{ height: `${(h * aiWaveLevel) / 100 + 6}px`, animationDelay: `${i * 80}ms` }} 
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-medium text-slate-200">
              {isAiSpeaking ? '🎙️ Speaking question...' : isEvaluating ? '🧠 Analyzing STAR framework...' : '👂 Listening to candidate...'}
            </div>
          </div>

          {/* Subtitle Caption Box */}
          <div className="z-10 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-3 text-[12px] text-slate-100 leading-relaxed">
            <p className="font-semibold text-blue-300 text-[10px] uppercase tracking-wider mb-0.5">Question Prompt</p>
            <p className="line-clamp-2">"{currentQuestionObj.question}"</p>
          </div>

        </div>

        {/* Right Tile: Candidate Live Facecam Stream */}
        <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-border shadow-md flex flex-col justify-between p-4 text-white">
          
          {/* Real Live Video Feed */}
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
              <p className="text-[12px]">Camera Stream Paused</p>
            </div>
          )}

          {/* Candidate Header Overlay */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="font-semibold">{userProfile?.name || 'You (Candidate)'}</span>
            </div>

            {/* Filler Words Live Counter (Inspired by Yoodli) */}
            {detectedFillers.total > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-black animate-fadeIn">
                <span>⚠️ {detectedFillers.total} Fillers Detected</span>
              </div>
            )}
          </div>

          {/* Candidate Bottom Media Controls */}
          <div className="flex items-center justify-between z-10 mt-auto bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
            {/* Audio Volume Wave Indicator */}
            <div className="flex items-center gap-1.5">
              <Mic size={14} className={micActive && audioVolume > 5 ? 'text-emerald-400' : 'text-slate-400'} />
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, audioVolume * 1.5)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCameraActive(!cameraActive)}
                className={`p-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  cameraActive ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
                }`}
                title={cameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {cameraActive ? <Video size={14} /> : <VideoOff size={14} />}
              </button>

              <button
                onClick={() => setMicActive(!micActive)}
                className={`p-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  micActive ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
                }`}
                title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {micActive ? <Mic size={14} /> : <MicOff size={14} />}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Answer Workspace & Speech Pad */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Candidate Response Transcript (STAR Method)
            </span>
            {isRecording && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Live Transcribing Speech...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Hint Button */}
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-all"
            >
              <HelpCircle size={12} />
              <span>{showHint ? 'Hide Strategic Hints' : 'Strategic Hints'}</span>
            </button>

            {/* Repeat Question Audio */}
            <button
              onClick={() => speakText(currentQuestionObj.question)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-all"
            >
              <Volume2 size={12} />
              <span>Replay Audio</span>
            </button>
          </div>
        </div>

        {/* Hints Accordion */}
        {showHint && currentQuestionObj.hints && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[12px] text-foreground space-y-1 animate-fadeIn">
            <p className="font-bold text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider">Strategic STAR Talking Points:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
              {currentQuestionObj.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Live Answer Textarea */}
        <textarea id="interview-answer-pad"
          rows={4}
          value={candidateAnswer + (interimTranscript ? ` [${interimTranscript}]` : '')}
          onChange={(e) => setCandidateAnswer(e.target.value)}
          placeholder="Speak into your microphone or type your response here... (Structure: Situation, Task, Action, Result)"
          className="w-full bg-secondary/50 border border-border rounded-xl p-3.5 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all resize-none leading-relaxed font-sans"
        />

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Voice Input Button */}
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all shadow-sm ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            <Mic size={14} />
            <span>{isRecording ? 'Stop Recording' : '🎙️ Start Voice Answering'}</span>
          </button>

          {/* Submit & Next Button */}
          <button
            onClick={handleSubmitTurn}
            disabled={isEvaluating || (!candidateAnswer.trim() && !interimTranscript.trim())}
            id="submit-answer-btn"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[13px] font-bold hover:opacity-95 transition-all disabled:opacity-50 shadow-md"
          >
            {isEvaluating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Evaluating STAR Metrics...</span>
              </>
            ) : (
              <>
                <span>Grade & Submit Response</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Turn Evaluation Modal / Drawer (Displays immediately after response submission) */}
      {turnFeedback && (
        <div className="bg-card border-2 border-primary/40 rounded-2xl p-6 shadow-xl space-y-4 animate-slideUp">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-foreground">Turn Score: {turnFeedback.score}/100</h3>
                <p className="text-[11px] text-muted-foreground">STAR Methodology Evaluation</p>
              </div>
            </div>

            <button
              onClick={handleProceedNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-xl hover:opacity-95 shadow-sm"
            >
              <span>{currentQIndex + 1 < questions.length ? 'Next Question' : 'View Full Scorecard'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* STAR 4-Pillar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'situation', label: 'Situation', data: turnFeedback.starBreakdown?.situation },
              { key: 'task', label: 'Task', data: turnFeedback.starBreakdown?.task },
              { key: 'action', label: 'Action', data: turnFeedback.starBreakdown?.action },
              { key: 'result', label: 'Result', data: turnFeedback.starBreakdown?.result }
            ].map(({ key, label, data }) => (
              <div key={key} className="p-3 bg-secondary/60 rounded-xl border border-border space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase">{label}</span>
                  <span className="font-mono text-primary">{data?.score || 85}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">{data?.feedback}</p>
              </div>
            ))}
          </div>

          {/* Follow-Up Probing Question from AI */}
          {turnFeedback.followUpQuestion && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Interviewer Probing Follow-Up:
              </p>
              <p className="text-[12px] font-medium text-foreground italic">
                "{turnFeedback.followUpQuestion}"
              </p>
            </div>
          )}

          {/* Delivery & Filler Analytics */}
          {turnFeedback.deliveryMetrics && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
              <span className="px-2.5 py-1 bg-secondary rounded-lg font-medium">
                Pacing: <strong className="text-foreground">{turnFeedback.deliveryMetrics.pacing}</strong> ({turnFeedback.deliveryMetrics.wpm} WPM)
              </span>
              <span className="px-2.5 py-1 bg-secondary rounded-lg font-medium">
                Filler Words: <strong className="text-foreground">{turnFeedback.deliveryMetrics.totalFillers}</strong>
              </span>
              <span className="px-2.5 py-1 bg-secondary rounded-lg font-medium">
                Clarity: <strong className="text-foreground">{turnFeedback.deliveryMetrics.clarityScore}%</strong>
              </span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

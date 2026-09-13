import React, { useState, useEffect } from 'react';
import InterviewSetupView from './Interview/InterviewSetupView.jsx';
import { API_BASE_URL } from '../config/api.js';

export default function InterviewCoach({ userProfile, triggerToast }) {
  const [isLoading, setIsLoading] = useState(false);

  // 1. Launch Interview Session & Navigate to Dedicated Private URL
  const handleStartSession = async (config) => {
    console.log("[InterviewCoach] Initializing private session for:", config.company);
    setIsLoading(true);
    if (triggerToast) triggerToast(`🔒 Initializing private ${config.company} interview room...`);

    try {
      const token = localStorage.getItem('careerly_token');
      const res = await fetch(`${API_BASE_URL}/ai/interview/create-live-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          company: config.company,
          role: config.role,
          track: config.track,
          seniority: config.seniority,
          persona: config.persona,
          questionCount: config.questionCount,
          userProfile: userProfile || {}
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.sessionId) {
        window.location.href = `/interview/session/${data.sessionId}`;
        return;
      }
    } catch (err) {
      console.warn('[Session Start Fallback]:', err);
      const fallbackId = 'iv_sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      window.location.href = `/interview/session/${fallbackId}`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1240px] mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
      <InterviewSetupView 
        userProfile={userProfile}
        onStartSession={handleStartSession}
        isLoading={isLoading}
      />
    </div>
  );
}

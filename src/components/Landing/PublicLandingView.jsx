import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from './HighFidelityLanding.tsx';

export default function PublicLandingView({ 
  onOpenAuth, 
  sampleOpportunities = [], 
  onSelectOpportunity, 
  onPrepareKit, 
  onSaveOpportunity,
  isSaved, 
  triggerToast 
}) {
  const navigate = useNavigate();

  const handleNav = (screen) => {
    if (screen === 'signin' || screen === 'login') {
      navigate('/login');
      return;
    }
    if (screen === 'signup' || screen === 'register') {
      navigate('/register');
      return;
    }

    const routeMap = {
      landing: '/',
      discovery: '/opportunities',
      details: '/opportunities',
      crm: '/applications',
      saved: '/saved',
      cv: '/cv-studio',
      coach: '/interview-coach',
      calendar: '/calendar',
      profile: '/profile',
      dashboard: '/dashboard',
      settings: '/settings'
    };

    const targetRoute = routeMap[screen] || '/opportunities';
    navigate(targetRoute);
  };

  return (
    <LandingPage nav={handleNav} />
  );
}

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
    if (screen === 'signin') {
      if (typeof onOpenAuth === 'function') {
        onOpenAuth('login');
      } else {
        navigate('/login');
      }
      return;
    }

    const routeMap = {
      landing: '/',
      discovery: '/opportunities',
      details: '/opportunities',
      crm: '/applications',
      saved: '/saved',
      cv: '/cv-studio',
      coach: '/interview',
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

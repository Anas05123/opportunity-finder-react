import React from 'react';
import LandingPage from './LandingPage.jsx';

export default function PublicLandingView({ 
  onOpenAuth, 
  sampleOpportunities = [], 
  onSelectOpportunity, 
  onPrepareKit, 
  onSaveOpportunity,
  isSaved, 
  triggerToast 
}) {
  return (
    <LandingPage 
      onOpenAuth={() => {
        if (typeof onOpenAuth === 'function') onOpenAuth('login');
      }}
      onExplorePlatform={() => {
        if (typeof onOpenAuth === 'function') {
          // If public user clicks explore, navigate to opportunities or prompt registration
          const token = localStorage.getItem('careerly_token');
          if (!token) {
            onOpenAuth('register');
          }
        }
      }}
    />
  );
}

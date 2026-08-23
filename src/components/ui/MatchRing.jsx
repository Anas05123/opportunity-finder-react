import React from 'react';

export default function MatchRing({ score = 85, size = 44, dark = false }) {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = score >= 85 ? '#2457FF' : score >= 70 ? '#4F7CFF' : '#F59E0B';
  const trackColor = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(36, 87, 255, 0.10)';
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div 
      className="relative flex-shrink-0" 
      style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke={trackColor} 
          strokeWidth="3.5" 
        />
        {/* Animated Fill Circle */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      {/* Centered Score Label */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--careerly-font-mono)',
          fontWeight: '700',
          fontSize: `${size * 0.24}px`,
          color: strokeColor
        }}
      >
        {score}%
      </div>
    </div>
  );
}

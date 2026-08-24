import React from 'react';

export default function CareerlyLogo({ 
  size = 28, 
  showText = false, 
  textSize = "text-[15px]", 
  textColor = "text-foreground",
  className = "",
  animate = false
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img 
        src="/careerly-logo.png" 
        alt="Careerly Logo" 
        width={size} 
        height={size}
        className={`object-contain flex-shrink-0 ${animate ? 'animate-pulse' : ''}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      {showText && (
        <span className={`font-semibold tracking-tight ${textSize} ${textColor}`}>
          Careerly
        </span>
      )}
    </div>
  );
}

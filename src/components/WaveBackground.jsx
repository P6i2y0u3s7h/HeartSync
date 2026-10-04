import React from 'react';

export const WaveBackground = ({ className = '', variant = 'onboarding' }) => {
  if (variant === 'login') {
    // Elegant sweeping curve divider for login
    return (
      <div className={`wave-decoration wave-login ${className}`} aria-hidden="true">
        <svg viewBox="0 0 500 120" preserveAspectRatio="none" className="wave-svg">
          <path
            d="M0,40 C150,110 350,0 500,60 L500,120 L0,120 Z"
            fill="#880e4f"
            opacity="0.2"
          />
          <path
            d="M0,60 C180,120 320,20 500,80 L500,120 L0,120 Z"
            fill="#ad1457"
          />
        </svg>
      </div>
    );
  }

  // Multi-layered soft romantic bottom waves for Onboarding & Splash
  return (
    <div className={`wave-decoration ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 500 160"
        preserveAspectRatio="none"
        className="wave-svg"
      >
        <defs>
          <linearGradient id="waveGradDeep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec407a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d81b60" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="waveGradMid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f48fb1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f06292" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="waveGradLight" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f8bbd0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff80ab" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Layer 1: Back Light Wave */}
        <path
          d="M0,90 C120,40 220,130 360,70 C430,40 470,60 500,75 L500,160 L0,160 Z"
          fill="url(#waveGradLight)"
        />

        {/* Layer 2: Mid-Tone Flowing Wave */}
        <path
          d="M0,110 C140,70 260,140 380,95 C440,75 480,90 500,105 L500,160 L0,160 Z"
          fill="url(#waveGradMid)"
        />

        {/* Layer 3: Foreground Deep Vibrant Wave */}
        <path
          d="M0,130 C150,95 280,150 400,115 C455,100 485,110 500,120 L500,160 L0,160 Z"
          fill="url(#waveGradDeep)"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;

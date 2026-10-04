import React from 'react';

export const HeartSyncLogo = ({
  size = 'medium', // 'small' | 'medium' | 'large'
  layout = 'horizontal', // 'horizontal' | 'vertical'
  className = '',
  showTagline = false
}) => {
  const iconSizes = {
    small: { w: 32, h: 28 },
    medium: { w: 46, h: 40 },
    large: { w: 64, h: 56 }
  };

  const fontSizes = {
    small: '1.4rem',
    medium: '1.9rem',
    large: '2.5rem'
  };

  const currentIcon = iconSizes[size] || iconSizes.medium;
  const currentFont = fontSizes[size] || fontSizes.medium;

  return (
    <div
      className={`heartsync-brand-logo ${layout === 'vertical' ? 'layout-vertical' : 'layout-horizontal'} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: layout === 'vertical' ? '6px' : '10px'
      }}
    >
      {/* Textured Heart Icon */}
      <svg
        width={currentIcon.w}
        height={currentIcon.h}
        viewBox="0 0 100 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(194, 24, 91, 0.25))', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="heartGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4081" />
            <stop offset="50%" stopColor="#e91e63" />
            <stop offset="100%" stopColor="#ad1457" />
          </linearGradient>
          <linearGradient id="heartGradSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f48fb1" />
            <stop offset="100%" stopColor="#ec407a" />
          </linearGradient>
          <pattern id="heartSparkle" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="rgba(255,255,255,0.7)" />
            <circle cx="8" cy="7" r="1.1" fill="rgba(255,255,255,0.9)" />
            <circle cx="5" cy="10" r="0.6" fill="rgba(255,255,255,0.5)" />
          </pattern>
        </defs>

        {/* Back Heart (Secondary Pink) */}
        <path
          d="M 68 8 C 58 8 52 16 50 20 C 48 16 42 8 32 8 C 18 8 8 20 8 36 C 8 56 32 72 50 82 C 68 72 92 56 92 36 C 92 20 82 8 68 8 Z"
          fill="url(#heartGradSecondary)"
          transform="translate(14, -4) scale(0.85)"
          opacity="0.85"
        />

        {/* Front Heart (Deep Ruby/Magenta) */}
        <path
          d="M 62 8 C 52 8 46 16 44 20 C 42 16 36 8 26 8 C 12 8 2 20 2 36 C 2 56 26 72 44 82 C 62 72 86 56 86 36 C 86 20 76 8 62 8 Z"
          fill="url(#heartGradPrimary)"
        />

        {/* Sparkle Texture Overlay */}
        <path
          d="M 62 8 C 52 8 46 16 44 20 C 42 16 36 8 26 8 C 12 8 2 20 2 36 C 2 56 26 72 44 82 C 62 72 86 56 86 36 C 86 20 76 8 62 8 Z"
          fill="url(#heartSparkle)"
        />

        {/* Gloss highlight arc */}
        <path
          d="M 12 28 C 12 18 20 12 28 12"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Cursive Brand Wordmark */}
      <span
        style={{
          fontFamily: "'Dancing Script', cursive, sans-serif",
          fontSize: currentFont,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #ad1457 0%, #c2185b 50%, #880e4f 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px',
          lineHeight: 1,
          display: 'inline-block'
        }}
      >
        HeartSync
      </span>
      {showTagline && (
        <span
          style={{
            display: 'block',
            fontSize: '11px',
            color: '#880e4f',
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: '1px',
            fontWeight: 500
          }}
        >
          Find Your Perfect Match
        </span>
      )}
    </div>
  );
};

export default HeartSyncLogo;

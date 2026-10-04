import React from 'react';

export const HeartBackground = ({ showClouds = false, className = '' }) => {
  return (
    <div className={`hearts-bg-wrapper ${className}`} aria-hidden="true">
      {showClouds && (
        <div
          className="cloud-hearts-texture"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/assets/cloud-hearts.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.85,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}
      <div className="hearts-particles">
        <div className="heart-float hf-1"></div>
        <div className="heart-float hf-2"></div>
        <div className="heart-float hf-3"></div>
        <div className="heart-float hf-4"></div>
        <div className="heart-float hf-5"></div>
        <div className="heart-float hf-6"></div>
      </div>
    </div>
  );
};

export default HeartBackground;

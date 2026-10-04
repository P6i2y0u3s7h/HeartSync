import React from 'react';

export const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="heart-pulse-spinner">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="#C2185B">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      {text && <p className="loading-spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

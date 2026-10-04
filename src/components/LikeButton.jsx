import React from 'react';
import { X, Heart, Sparkles } from 'lucide-react';

export const LikeButton = ({ type = 'like', onClick, disabled = false, size = 'default' }) => {
  if (type === 'pass') {
    return (
      <button
        id="btn-card-pass"
        className={`card-action-btn action-pass ${size === 'small' ? 'btn-action-sm' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Pass profile"
      >
        <X size={size === 'small' ? 18 : 26} strokeWidth={2.5} />
      </button>
    );
  }

  if (type === 'interested') {
    return (
      <button
        id="btn-card-interested"
        className={`card-action-btn action-interested ${size === 'small' ? 'btn-action-sm' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Super like / interested"
      >
        <Sparkles size={size === 'small' ? 16 : 22} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <button
      id="btn-card-like"
      className={`card-action-btn action-like ${size === 'small' ? 'btn-action-sm' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Like profile"
    >
      <Heart size={size === 'small' ? 20 : 28} fill="currentColor" strokeWidth={0} />
    </button>
  );
};

export default LikeButton;

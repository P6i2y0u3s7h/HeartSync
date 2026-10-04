import React from 'react';

export const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost'
  loading = false,
  disabled = false,
  fullWidth = true,
  className = '',
  id
}) => {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn-heartsync btn-${variant} ${fullWidth ? 'btn-full' : ''} ${className}`}
    >
      {loading ? (
        <span className="btn-spinner-content">
          <span className="btn-mini-spinner"></span>
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default PrimaryButton;

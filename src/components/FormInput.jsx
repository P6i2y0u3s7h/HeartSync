import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const FormInput = ({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  required = false,
  autoComplete
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="form-group-hs">
      {label && (
        <label htmlFor={id} className="form-label-hs">
          {label} {required && <span className="req-star">*</span>}
        </label>
      )}
      <div className={`input-wrapper-hs ${error ? 'has-error' : ''}`}>
        {Icon && <span className="input-icon-hs"><Icon size={18} /></span>}
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          autoComplete={autoComplete}
          className="form-control-hs"
        />
        {isPassword && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};

export default FormInput;

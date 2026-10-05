import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone } from 'lucide-react';
import HeartSyncLogo from '../components/HeartSyncLogo';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (formData.mobileNumber.trim() && !phoneRegex.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError('');
    setLoading(true);

    try {
      await register(formData.email.trim(), formData.password, {
        username: formData.username.trim(),
        phoneNumber: formData.mobileNumber.trim(),
        displayName: formData.username.trim()
      });
      // Direct navigation to Onboarding (New user flow: Register -> Onboarding -> Profile Setup -> Home)
      navigate('/onboarding');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setServerError('');
    setSocialLoading(true);
    try {
      const res = await googleSignIn();
      const user = res.user || res;
      const isNewUser = !!res.isNewUser;
      const profile = res.profile || await getUserProfile(user?.uid);
      const isProfileDone = profile?.profileCompleted || localStorage.getItem(`heartsync_profile_completed_${user?.uid}`);

      if (isNewUser) {
        // Brand-new Google user: Show onboarding screens
        navigate('/onboarding');
      } else {
        // Existing Google user: NEVER show onboarding!
        if (!isProfileDone) {
          navigate('/profile-setup');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setServerError(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="mobile-app-shell">
      <div className="auth-screen-layout register-style-screen">
        {/* Top Header with Clouds & Logo */}
        <div className="auth-top-header-panel">
          <div className="auth-top-clouds-bg" />
          <div className="auth-logo-center-box animate-pop-in">
            <HeartSyncLogo size="medium" layout="horizontal" />
          </div>
        </div>

        {/* Sweeping Curve Divider */}
        <div className="auth-wave-divider">
          <svg viewBox="0 0 500 90" preserveAspectRatio="none" className="auth-wave-svg">
            <path
              d="M0,60 C160,110 340,10 500,50 L500,90 L0,90 Z"
              fill="#9a1147"
            />
          </svg>
        </div>

        {/* Deep Magenta Curved Card Container */}
        <div className="auth-bottom-curved-card animate-slide-up">
          <h1 className="auth-screen-heading-script">Create Account</h1>

          {serverError && (
            <div className="alert-box-error-pill">
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-card-form-body">
            {/* Username */}
            <div className="form-group-romantic">
              <label htmlFor="reg-username" className="form-label-romantic">Username</label>
              <div className="input-pill-wrapper">
                <span className="input-pill-icon"><User size={18} /></span>
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input-pill-control"
                />
              </div>
              {errors.username && <span className="input-pill-error">{errors.username}</span>}
            </div>

            {/* Email */}
            <div className="form-group-romantic">
              <label htmlFor="reg-email" className="form-label-romantic">Email Address</label>
              <div className="input-pill-wrapper">
                <span className="input-pill-icon"><Mail size={18} /></span>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="input-pill-control"
                />
              </div>
              {errors.email && <span className="input-pill-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group-romantic">
              <label htmlFor="reg-password" className="form-label-romantic">Password</label>
              <div className="input-pill-wrapper">
                <span className="input-pill-icon"><Lock size={18} /></span>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="input-pill-control"
                />
              </div>
              {errors.password && <span className="input-pill-error">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group-romantic">
              <label htmlFor="reg-confirm-password" className="form-label-romantic">Confirm Password</label>
              <div className="input-pill-wrapper">
                <span className="input-pill-icon"><Lock size={18} /></span>
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="input-pill-control"
                />
              </div>
              {errors.confirmPassword && <span className="input-pill-error">{errors.confirmPassword}</span>}
            </div>

            {/* Optional Mobile Number (Profile info only - No OTP) */}
            <div className="form-group-romantic">
              <label htmlFor="reg-mobile" className="form-label-romantic">Mobile Number (Optional)</label>
              <div className="input-pill-wrapper">
                <span className="input-pill-icon"><Phone size={18} /></span>
                <input
                  id="reg-mobile"
                  name="mobileNumber"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="input-pill-control"
                />
              </div>
              {errors.mobileNumber && <span className="input-pill-error">{errors.mobileNumber}</span>}
            </div>

            {/* Create Account Primary Pill Button */}
            <button
              id="btn-register-submit"
              type="submit"
              disabled={loading}
              className="btn-luminous-pill"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Prompt */}
          <div className="auth-prompt-center">
            <span className="auth-prompt-text">Already have an account? </span>
            <Link to="/login" className="auth-prompt-link">
              Sign In
            </Link>
          </div>

          {/* Social Sign In Row */}
          <div className="social-signin-section">
            <span className="social-signin-label">or sign up with</span>
            <div className="social-icons-row">
              <button
                id="btn-google-signup"
                type="button"
                onClick={handleGoogleLogin}
                disabled={socialLoading}
                className="social-circle-btn"
                title="Sign up with Google"
              >
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 6.9 9.2 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
                  <path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L2.2 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-2.8 0-5.2-1.9-6.1-4.5L2.2 16.6C4 20.2 7.7 23 12 23z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

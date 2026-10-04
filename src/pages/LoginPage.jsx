import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import HeartSyncLogo from '../components/HeartSyncLogo';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { login, googleSignIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/home';

  const routeUserAfterAuth = async (uid) => {
    try {
      const profile = await getUserProfile(uid);
      const isProfileDone = profile?.profileCompleted || localStorage.getItem(`heartsync_profile_completed_${uid}`);
      const isOnboardingDone = profile?.onboardingCompleted || localStorage.getItem(`heartsync_onboarding_completed_${uid}`);

      if (!isOnboardingDone) {
        navigate('/onboarding', { replace: true });
      } else if (!isProfileDone) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate(from === '/login' ? '/home' : from, { replace: true });
      }
    } catch {
      navigate('/home', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      await routeUserAfterAuth(user.uid);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSocialLoading(true);
    try {
      const user = await googleSignIn();
      await routeUserAfterAuth(user.uid);
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to reset your password.');
      return;
    }
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Could not send reset email.');
    }
  };

  return (
    <div className="mobile-app-shell">
      <div className="auth-screen-layout login-style-screen">
        {/* Top Section with Cloud Texture & HeartSync Logo */}
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
          <h1 className="auth-screen-heading-script">Sign in</h1>

          {errorMsg && (
            <div className="alert-box-error-pill">
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSent && (
            <div className="alert-box-success-pill">
              <span>Password reset email sent! Check your inbox.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-card-form-body">
            {/* Username / Email field */}
            <div className="form-group-romantic">
              <label htmlFor="login-email" className="form-label-romantic">Username</label>
              <div className="input-pill-wrapper">
                <span className="input-pill-icon"><User size={18} /></span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="Enter email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="input-pill-control"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="form-group-romantic">
              <label htmlFor="login-password" className="form-label-romantic">Password</label>
              <div className="input-pill-wrapper">
                <span className="input-pill-icon"><Lock size={18} /></span>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input-pill-control"
                />
              </div>
              <div className="forgot-password-row">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Sign In Primary Pill Button */}
            <button
              id="btn-sign-in"
              type="submit"
              disabled={loading}
              className="btn-luminous-pill"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Register Prompt */}
          <div className="auth-prompt-center">
            <span className="auth-prompt-text">Don't have an account? </span>
            <Link to="/register" className="auth-prompt-link">
              Register
            </Link>
          </div>

          {/* Social Sign In Row */}
          <div className="social-signin-section">
            <span className="social-signin-label">sign in with</span>
            <div className="social-icons-row">
              <button
                id="btn-google-login"
                type="button"
                onClick={handleGoogleLogin}
                disabled={socialLoading}
                className="social-circle-btn"
                title="Sign in with Google"
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

export default LoginPage;

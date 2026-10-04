import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeartBackground from '../components/HeartBackground';
import HeartSyncLogo from '../components/HeartSyncLogo';
import { useAuth } from '../context/AuthContext';

export const SplashPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        if (currentUser) {
          navigate('/home', { replace: true });
        } else {
          const seenOnboarding = localStorage.getItem('heartsync_seen_onboarding');
          if (seenOnboarding) {
            navigate('/login', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        }
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigate, currentUser, loading]);

  return (
    <div className="mobile-app-shell">
      <div className="splash-screen-screen">
        <HeartBackground showClouds={true} />

        <div className="splash-center-content animate-pop-in">
          <HeartSyncLogo size="large" layout="horizontal" />
        </div>

        <div className="splash-loading-indicator">
          <div className="splash-pulse-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;

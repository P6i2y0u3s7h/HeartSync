import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SlidersHorizontal, Bell, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { getDeterministicChatId } from '../services/chatService';
import { getUserMatches } from '../services/matchService';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';

export const MatchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { currentUser, userProfile } = useAuth();
  const { unreadCount } = useNotifications();

  // Matched pair states
  const [user1Data, setUser1Data] = useState(null);
  const [user2Data, setUser2Data] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolveMatchUsers = async () => {
      setLoading(true);
      const state = location.state || {};

      // 1. If passed directly via router state (e.g. from Discover / Home / Likes)
      if (state.user2) {
        const u1 = state.user1 || userProfile || {
          uid: currentUser?.uid || 'me',
          displayName: userProfile?.displayName || currentUser?.displayName || 'You',
          profilePhoto: userProfile?.profilePhoto || '/assets/profile-user.jpg'
        };
        const u2 = state.user2;

        if (isMounted) {
          setUser1Data(u1);
          setUser2Data(u2);
          setLoading(false);
        }
        return;
      }

      // 2. If matchId passed in URL or state
      const targetMatchId = params.matchId || state.matchId;
      const currentUid = currentUser?.uid;

      if (currentUid) {
        try {
          const matches = await getUserMatches(currentUid);
          if (matches && matches.length > 0) {
            let matchedDoc = null;
            if (targetMatchId) {
              matchedDoc = matches.find(m => m.id === targetMatchId || m.matchId === targetMatchId);
            }
            if (!matchedDoc) {
              // Take latest match
              matchedDoc = matches[0];
            }

            if (matchedDoc && isMounted) {
              const isUser1 = (matchedDoc.user1?.uid === currentUid);
              setUser1Data(isUser1 ? matchedDoc.user1 : matchedDoc.user2);
              setUser2Data(isUser1 ? matchedDoc.user2 : matchedDoc.user1);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Could not load matches from Firestore:', err);
        }
      }

      // 3. Fallback: match with first seed profile (e.g. Aditya) for display
      if (isMounted) {
        const fallbackOther = initialProfiles[0];
        setUser1Data(userProfile || {
          uid: currentUser?.uid || 'me',
          displayName: userProfile?.displayName || currentUser?.displayName || 'You',
          profilePhoto: userProfile?.profilePhoto || '/assets/profile-user.jpg'
        });
        setUser2Data(fallbackOther);
        setLoading(false);
      }
    };

    resolveMatchUsers();

    return () => {
      isMounted = false;
    };
  }, [location.state, params.matchId, currentUser, userProfile]);

  // Derived user values
  const photo1 =
    (user1Data?.profilePhoto && !user1Data.profilePhoto.includes('logo-heart'))
      ? user1Data.profilePhoto
      : (userProfile?.profilePhoto && !userProfile.profilePhoto.includes('logo-heart'))
      ? userProfile.profilePhoto
      : '/assets/profile-ryan.jpg';

  const name1 =
    user1Data?.displayName ||
    user1Data?.name ||
    userProfile?.displayName ||
    'You';

  const photo2 =
    (user2Data?.profilePhoto && !user2Data.profilePhoto.includes('logo-heart'))
      ? user2Data.profilePhoto
      : user2Data?.photos?.[0] ||
        user2Data?.image ||
        '/assets/profile-user.jpg';

  const name2 =
    user2Data?.displayName ||
    user2Data?.name ||
    'Your Match';

  const targetUid = user2Data?.uid || user2Data?.id || 'seed_aditya28';
  const myUid = user1Data?.uid || currentUser?.uid || 'me';

  const handleSendMessage = () => {
    const chatId = getDeterministicChatId(myUid, targetUid);
    navigate(`/chat/${chatId}`);
  };

  const handleKeepSwiping = () => {
    navigate('/discover');
  };

  return (
    <div className="app-page-wrapper match-screen-page">
      {/* Top Header Bar */}
      <header className="app-header-hs match-header-hs">
        <div className="header-left" onClick={() => navigate('/home')} role="button" tabIndex={0}>
          <div className="header-logo-container">
            <img src="/assets/logo-heart.jpg" alt="HeartSync" className="header-logo-img" />
            <span className="brand-wordmark">HeartSync</span>
          </div>
        </div>

        <div className="header-right-actions">
          <button
            id="btn-match-filter"
            className="icon-action-btn"
            onClick={() => navigate('/discover')}
            aria-label="Filter"
            title="Filter"
          >
            <SlidersHorizontal size={20} color="#b81454" />
          </button>

          <button
            id="btn-match-notifs"
            className="icon-action-btn relative-badge"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} color="#b81454" fill="#b81454" />
            {unreadCount > 0 && <span className="notification-bubble-badge">{unreadCount}</span>}
          </button>

          <div
            id="match-user-avatar"
            className="header-avatar-circle"
            onClick={() => navigate('/profile')}
            title="My Profile"
          >
            <img
              src={photo1}
              alt={name1}
              className="header-avatar-img"
            />
          </div>
        </div>
      </header>

      {/* Main Responsive Body */}
      <main className="match-screen-main">
        {/* Centered Heading */}
        <div className="match-heading-wrap">
          <h1 className="match-heading-script">It's a Match</h1>
        </div>

        {/* Photos & Overlapping Heart Visual */}
        <div className="match-visual-stage" aria-label="Matched Users">
          {/* Decorative Pink Heart Outline behind photos */}
          <div className="match-decor-heart-wrap" aria-hidden="true">
            {/* Top-Left Outline Heart Lobe */}
            <svg
              className="match-decor-heart-tl"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M75 80 C40 80, 15 55, 15 32 C15 15, 30 10, 45 20 C60 30, 75 55, 80 65"
                stroke="#e85d88"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>

            {/* Bottom-Right Outline Heart Lobe */}
            <svg
              className="match-decor-heart-br"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 25 C45 45, 80 50, 85 70 C90 85, 75 95, 60 90 C45 85, 30 65, 25 45"
                stroke="#e85d88"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* User 1 Photo (Left) */}
          <div className="match-photo-frame match-photo-left" title={name1}>
            <img
              src={photo1}
              alt={name1}
              className="match-photo-img"
              loading="eager"
            />
          </div>

          {/* User 2 Photo (Right, overlapping) */}
          <div className="match-photo-frame match-photo-right" title={name2}>
            <img
              src={photo2}
              alt={name2}
              className="match-photo-img"
              loading="eager"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="match-actions-group">
          {/* 1. Send Message Button */}
          <button
            id="btn-match-send-message"
            className="match-btn-send"
            onClick={handleSendMessage}
            aria-label={`Send message to ${name2}`}
          >
            <Send size={18} strokeWidth={2.4} className="match-btn-send-icon" />
            <span className="match-btn-send-text">Send Message</span>
          </button>

          {/* 2. Keep Swiping Button */}
          <button
            id="btn-match-keep-swiping"
            className="match-btn-swiping"
            onClick={handleKeepSwiping}
            aria-label="Keep Swiping on Discover"
          >
            <svg
              className="match-btn-swiping-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Hand swipe gesture icon */}
              <path d="M13 8V5a2.5 2.5 0 0 0-5 0v6" />
              <path d="M8 12V9a2 2 0 0 0-4 0v5c0 4.2 3.4 7.5 7.5 7.5h1c4 0 7-3 7-7v-3.5a2 2 0 0 0-4 0v2" />
              <path d="M12 2.5a5 5 0 0 1 5 4.5" />
            </svg>
            <span className="match-btn-swiping-text">Keep Swiping</span>
          </button>
        </div>
      </main>

      {/* Pink Wave Decoration at Bottom */}
      <div className="match-bottom-wave-layer" aria-hidden="true">
        <svg
          className="match-bottom-wave-svg"
          viewBox="0 0 400 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="hsWaveDeepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f06292" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#e91e63" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#c2185b" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="hsWaveSoftGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fce4ec" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#f8bbd0" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f48fb1" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="hsWaveGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f48fb1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background gentle wave */}
          <path
            d="M0 60 C100 20, 220 85, 400 30 L400 120 L0 120 Z"
            fill="url(#hsWaveSoftGrad)"
          />
          {/* Mid deep wave */}
          <path
            d="M0 75 C115 35, 240 90, 400 48 L400 120 L0 120 Z"
            fill="url(#hsWaveDeepGrad)"
          />
          {/* Foreground glowing wave */}
          <path
            d="M0 88 C90 58, 215 95, 400 68 L400 120 L0 120 Z"
            fill="url(#hsWaveDeepGrad)"
          />
          {/* Subtle curved top sheen */}
          <path
            d="M0 60 C100 20, 220 85, 400 30"
            stroke="url(#hsWaveGlow)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

export default MatchPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Heart, X, MessageCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import MatchModal from '../components/MatchModal';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';
import { sendLike } from '../services/likeService';
import { useAuth } from '../context/AuthContext';
import { getDeterministicChatId } from '../services/chatService';

export const UserProfileViewPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      // Check seed data
      const seed = initialProfiles.find(p => p.uid === userId || p.username === userId);
      if (seed) {
        setProfile(seed);
        setLoading(false);
        return;
      }
      try {
        const docUser = await getUserProfile(userId);
        setProfile(docUser || initialProfiles[0]);
      } catch (e) {
        console.warn('Fetch user profile view error:', e);
        setProfile(initialProfiles[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleLike = async () => {
    if (!profile) return;
    try {
      const res = await sendLike(userProfile || { uid: currentUser?.uid, displayName: 'You' }, profile);
      if (res && res.isMatch) {
        setMatchData({
          user1: userProfile || { displayName: 'You', profilePhoto: '/assets/logo-heart.jpg' },
          user2: profile
        });
        setShowMatchModal(true);
      } else {
        navigate('/home');
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleStartChat = () => {
    const uidA = currentUser?.uid || 'me';
    const uidB = profile?.uid || profile?.id || userId;
    const chatId = getDeterministicChatId(uidA, uidB);
    navigate(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <div className="fullscreen-loading">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  if (!profile) return null;

  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : [profile.profilePhoto || profile.image || '/assets/logo-heart.jpg'];

  return (
    <div className="user-view-profile-page">
      {/* Media carousel header */}
      <div className="user-view-media-header">
        <img
          src={photos[activePhotoIdx]}
          alt={profile.displayName || profile.name}
          className="user-view-hero-image"
        />

        {/* Back button */}
        <button
          className="user-view-back-fab"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Photo indicators */}
        {photos.length > 1 && (
          <div className="user-view-photo-dots">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={`photo-dot ${idx === activePhotoIdx ? 'active' : ''}`}
                onClick={() => setActivePhotoIdx(idx)}
              ></span>
            ))}
          </div>
        )}
      </div>

      {/* Profile info sheet */}
      <div className="user-view-details-sheet">
        <div className="user-view-title-row">
          <div>
            <h1 className="user-view-name">
              {profile.displayName || profile.name}, <span className="age-span">{profile.age}</span>
            </h1>
            <p className="user-view-location">
              <MapPin size={15} /> {profile.city}{profile.country ? `, ${profile.country}` : ''}
              {profile.distance && <span className="distance-bullet"> • {profile.distance}</span>}
            </p>
          </div>
          {profile.isVerified && (
            <span className="badge-verified-large">
              <Check size={14} strokeWidth={3} /> Verified
            </span>
          )}
        </div>

        {/* About */}
        <div className="user-view-block">
          <h3 className="user-view-heading">About</h3>
          <p className="user-view-text">{profile.bio || profile.about || "Looking for meaningful connections on HeartSync."}</p>
        </div>

        {/* Intentions */}
        {profile.relationshipIntentions && (
          <div className="user-view-block">
            <h3 className="user-view-heading">Looking For</h3>
            <span className="intention-badge-pink">{profile.relationshipIntentions}</span>
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="user-view-block">
            <h3 className="user-view-heading">Interests</h3>
            <div className="profile-interests-cloud">
              {profile.interests.map((item, idx) => (
                <span key={idx} className="profile-interest-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Floating Bar */}
        <div className="user-view-actions-bar">
          <button
            className="user-view-action-circle pass-circle"
            onClick={() => navigate(-1)}
            aria-label="Pass"
          >
            <X size={26} strokeWidth={2.5} />
          </button>

          <button
            className="user-view-chat-btn"
            onClick={handleStartChat}
          >
            <MessageCircle size={18} /> Chat
          </button>

          <button
            className="user-view-action-circle like-circle"
            onClick={handleLike}
            aria-label="Like"
          >
            <Heart size={26} fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      </div>

      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        user1={matchData?.user1}
        user2={matchData?.user2}
      />
    </div>
  );
};

export default UserProfileViewPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  MapPin,
  Heart,
  Bookmark,
  X,
  MessageCircle,
  ShieldAlert,
  UserX,
  MoreVertical
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import MatchModal from '../components/MatchModal';
import ConfirmModal from '../components/ConfirmModal';
import ReportModal from '../components/ReportModal';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';
import { sendLike } from '../services/likeService';
import { useAuth } from '../context/AuthContext';
import { getDeterministicChatId } from '../services/chatService';
import { recordProfileView } from '../services/visitorService';
import ProfilePostsGrid from '../components/ProfilePostsGrid';
import { useUserPosts } from '../hooks/usePosts';
import { blockUser } from '../services/blockService';

export const UserProfileViewPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // User Posts
  const {
    userPosts,
    loading: postsLoading,
    handleToggleLike,
    handleDeletePost
  } = useUserPosts(userId, currentUser?.uid);

  // Safety modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Record profile visitor on mount
  useEffect(() => {
    if (currentUser?.uid && userId && userId !== currentUser.uid) {
      recordProfileView(userProfile || { uid: currentUser.uid, displayName: 'You' }, userId);
    }
  }, [currentUser?.uid, userId, userProfile]);

  // Check initial favorite status
  useEffect(() => {
    if (currentUser?.uid && userId) {
      checkIsFavorite(currentUser.uid, userId).then(setIsFavorite);
    }
  }, [currentUser?.uid, userId]);

  const handleToggleFavorite = async () => {
    if (!currentUser?.uid || !profile || savingFav) return;
    setSavingFav(true);
    try {
      const newState = await toggleFavorite(currentUser.uid, profile);
      setIsFavorite(newState);
    } catch (e) {
      console.warn('Favorite toggle error:', e);
    } finally {
      setSavingFav(false);
    }
  };

  const handleLike = async () => {
    if (!profile) return;
    try {
      const myUser = userProfile || {
        uid: currentUser?.uid || 'me',
        displayName: userProfile?.displayName || currentUser?.displayName || 'You',
        profilePhoto: userProfile?.profilePhoto || '/assets/logo-heart.jpg'
      };
      const res = await sendLike(myUser, profile);
      if (res && res.isMatch) {
        setMatchData({
          user1: myUser,
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

  const handleConfirmBlock = async () => {
    if (!currentUser?.uid || !userId) return;
    setActionLoading(true);
    try {
      await blockUser(currentUser.uid, userId, profile);
      setShowBlockModal(false);
      navigate('/discover');
    } catch (err) {
      console.error('Error blocking user:', err);
    } finally {
      setActionLoading(false);
    }
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

  const displayName = profile.displayName || profile.name || 'Member';

  return (
    <div className="user-view-profile-page" onClick={() => setShowMenu(false)}>
      {/* Media carousel header */}
      <div className="user-view-media-header">
        <img
          src={photos[activePhotoIdx]}
          alt={displayName}
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

        {/* Top-Right Actions */}
        <div className="user-view-top-actions" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className={`user-view-fav-fab ${isFavorite ? 'active-fav' : ''}`}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? 'Remove from Saved' : 'Save Profile'}
            title={isFavorite ? 'Saved Profile' : 'Save Profile'}
          >
            <Bookmark size={20} fill={isFavorite ? '#ED417A' : 'none'} color={isFavorite ? '#ED417A' : '#ffffff'} />
          </button>

          <div className="user-view-menu-wrap">
            <button
              type="button"
              className="user-view-more-fab"
              onClick={() => setShowMenu(prev => !prev)}
              aria-label="More options"
            >
              <MoreVertical size={20} color="#ffffff" />
            </button>

            {showMenu && (
              <div className="user-view-dropdown animate-fade-in">
                <button
                  type="button"
                  className="dropdown-action-item text-danger"
                  onClick={() => {
                    setShowMenu(false);
                    setShowBlockModal(true);
                  }}
                >
                  <UserX size={16} /> Block User
                </button>
                <button
                  type="button"
                  className="dropdown-action-item text-danger"
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                >
                  <ShieldAlert size={16} /> Report User
                </button>
              </div>
            )}
          </div>
        </div>

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
              {displayName}, <span className="age-span">{profile.age}</span>
            </h1>
            <p className="user-view-location">
              <MapPin size={15} /> {profile.city}{profile.country ? `, ${profile.country}` : ''}
              {profile.distance && <span className="distance-bullet"> • {profile.distance}</span>}
              {profile.isOnline && <span className="online-badge-text"> • Active now</span>}
            </p>
          </div>
          {profile.isVerified && (
            <span className="badge-verified-large">
              <Check size={14} strokeWidth={3} /> Verified
            </span>
          )}
        </div>

        {/* Save profile badge pill */}
        <div className="user-view-save-pill-row">
          <button
            type="button"
            className={`save-profile-pill-btn ${isFavorite ? 'saved' : ''}`}
            onClick={handleToggleFavorite}
          >
            <Bookmark size={15} fill={isFavorite ? '#ED417A' : 'none'} color="#ED417A" />
            <span>{isFavorite ? '❤️ Saved in Favorites' : '❤️ Save Profile'}</span>
          </button>
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

        {/* Photo Posts by this user */}
        <div className="user-view-block user-view-posts-block">
          <h3 className="user-view-heading">
            Photo Posts {userPosts.length > 0 ? `(${userPosts.length})` : ''}
          </h3>
          <ProfilePostsGrid
            posts={userPosts}
            loading={postsLoading}
            isOwnProfile={userId === currentUser?.uid}
            currentUser={currentUser}
            userProfile={userProfile}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
          />
        </div>

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

      {/* Block Confirmation Modal */}
      <ConfirmModal
        isOpen={showBlockModal}
        title={`Block ${displayName}?`}
        message={`${displayName} will no longer appear on your Discover, Likes, or Matches, and will not be able to message you.`}
        confirmText="Block User"
        cancelText="Cancel"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleConfirmBlock}
        onCancel={() => setShowBlockModal(false)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reporterId={currentUser?.uid}
        reportedUser={profile || { uid: userId }}
      />
    </div>
  );
};

export default UserProfileViewPage;

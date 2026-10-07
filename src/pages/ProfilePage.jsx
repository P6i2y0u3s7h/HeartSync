import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  MapPin,
  Edit3,
  Settings as SettingsIcon,
  LogOut,
  Camera,
  Heart,
  Bookmark,
  Eye,
  Sparkles,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  User as UserIcon,
  Share2,
  Grid,
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import HeartBackground from '../components/HeartBackground';
import ProfilePostsGrid from '../components/ProfilePostsGrid';
import CreatePostModal from '../components/CreatePostModal';
import VerificationModal from '../components/VerificationModal';
import { useAuth } from '../context/AuthContext';
import { useUserPosts } from '../hooks/usePosts';
import { createPost } from '../services/postService';
import { getLikesReceived } from '../services/likeService';
import { subscribeToUserMatches } from '../services/matchService';
import { calculateProfileCompletion } from '../utils/profileCompletion';
import { getProfileVisitors } from '../services/visitorService';

export const ProfilePage = () => {
  const { userProfile, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [profileTab, setProfileTab] = useState('posts');
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [shareTooltip, setShareTooltip] = useState('');
  const [matchesCount, setMatchesCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  const {
    userPosts,
    loading: postsLoading,
    handleToggleLike,
    handleToggleSave,
    handleDeletePost,
    handleEditCaption
  } = useUserPosts(currentUser?.uid, currentUser?.uid);

  const completion = calculateProfileCompletion(userProfile);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToUserMatches(currentUser.uid, (matches) => {
      setMatchesCount(matches.length);
    });
    return () => { if (unsub) unsub(); };
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    getLikesReceived(currentUser.uid)
      .then((ids) => setLikesCount(ids.length))
      .catch(() => setLikesCount(0));
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser?.uid) {
      getProfileVisitors(currentUser.uid)
        .then((list) => { setVisitors(list); setLoadingVisitors(false); })
        .catch(() => setLoadingVisitors(false));
    } else {
      setLoadingVisitors(false);
    }
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${currentUser?.uid}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on HeartSync`, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        setShareTooltip('Link copied!');
        setTimeout(() => setShareTooltip(''), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(profileUrl);
        setShareTooltip('Link copied!');
        setTimeout(() => setShareTooltip(''), 2500);
      } catch {
        setShareTooltip('Share unavailable');
        setTimeout(() => setShareTooltip(''), 2500);
      }
    }
  };

  const handleCreatePost = async ({ file, caption, privacy, onProgress }) => {
    if (!currentUser?.uid) return;
    await createPost({
      userId: currentUser.uid,
      userDisplayName: userProfile?.displayName || userProfile?.firstName || currentUser?.displayName || 'Member',
      userProfilePhoto: userProfile?.profilePhoto || currentUser?.photoURL || '/assets/logo-heart.jpg',
      file,
      caption,
      privacy,
      onProgress
    });
  };

  const name = userProfile?.displayName || userProfile?.firstName || currentUser?.displayName || 'HeartSync Member';
  const rawAge = userProfile?.age || (userProfile?.dob ? new Date().getFullYear() - new Date(userProfile.dob).getFullYear() : null);
  const age = rawAge && rawAge > 0 && rawAge < 120 ? rawAge : null;
  const photo = userProfile?.profilePhoto || userProfile?.photos?.[0] || currentUser?.photoURL || '/assets/logo-heart.jpg';
  const cityParts = [userProfile?.city, userProfile?.country].filter(Boolean);
  const location = cityParts.length > 0 ? cityParts.join(', ') : null;
  const bio = userProfile?.bio || null;
  const interests = userProfile?.interests && userProfile.interests.length > 0 ? userProfile.interests : [];
  const isVerified = Boolean(userProfile?.isVerified || userProfile?.verificationStatus === 'verified');
  const isIdVerified = userProfile?.identityVerificationStatus === 'verified';
  const isPendingVerification = userProfile?.verificationStatus === 'pending' || userProfile?.identityVerificationStatus === 'pending';

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} />

      <main className="main-content-scrollable profile-page-layout">

        {/* Instagram-style Profile Header */}
        <div className="ig-profile-header-card">

          {/* Top row: Photo + Stats */}
          <div className="ig-profile-top-row">
            <div className="ig-profile-photo-wrap">
              <img
                src={photo}
                alt={name}
                className="ig-profile-photo"
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo-heart.jpg'; }}
              />
              <button
                className="ig-profile-photo-edit-fab"
                onClick={() => navigate('/profile-setup')}
                title="Edit Profile Photo"
                aria-label="Edit Profile Photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="ig-profile-stats-row">
              <div className="ig-stat-col">
                <span className="ig-stat-number">{userPosts.length}</span>
                <span className="ig-stat-label">Posts</span>
              </div>
              <div className="ig-stat-col" onClick={() => navigate('/likes')} role="button" tabIndex={0}>
                <span className="ig-stat-number">{likesCount}</span>
                <span className="ig-stat-label">Likes</span>
              </div>
              <div className="ig-stat-col" onClick={() => navigate('/matches')} role="button" tabIndex={0}>
                <span className="ig-stat-number">{matchesCount}</span>
                <span className="ig-stat-label">Matches</span>
              </div>
            </div>
          </div>

          {/* Name + Age + Verified */}
          <div className="ig-profile-name-row">
            <span className="ig-profile-name">{name}</span>
            {age && <span className="ig-profile-age">{age}</span>}
            {isVerified && (
              <span className="ig-verified-badge" title="Photo Verified">
                <Check size={11} strokeWidth={3} /> Verified
              </span>
            )}
            {isIdVerified && (
              <span className="ig-id-verified-badge" title="Government ID Verified">
                <ShieldCheck size={12} strokeWidth={2.5} /> ID Verified
              </span>
            )}
            {!isVerified && !isIdVerified && isPendingVerification && (
              <span className="ig-pending-badge" title="Verification Pending">
                <Clock size={11} /> Verification pending
              </span>
            )}
          </div>

          {location && (
            <p className="ig-profile-location">
              <MapPin size={13} />
              <span>{location}</span>
            </p>
          )}

          {bio && <p className="ig-profile-bio">{bio}</p>}

          {completion.percentage < 80 && (
            <button className="ig-profile-complete-nudge" onClick={() => navigate('/profile-setup')}>
              <Sparkles size={13} />
              <span>Profile {completion.percentage}% — complete it to get more matches!</span>
              <ChevronRight size={13} />
            </button>
          )}

          {/* Action Buttons */}
          <div className="ig-profile-action-btns">
            <button id="btn-edit-profile" className="ig-action-btn ig-action-btn-secondary" onClick={() => navigate('/profile-setup')}>
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>

            <button id="btn-verify-profile" className="ig-action-btn ig-action-btn-secondary" onClick={() => setVerificationModalOpen(true)}>
              <ShieldCheck size={15} color="#e91e63" />
              <span>{isVerified ? 'Verified' : isPendingVerification ? 'Pending' : 'Verify'}</span>
            </button>

            <div className="ig-share-btn-wrap">
              <button id="btn-share-profile" className="ig-action-btn ig-action-btn-secondary" onClick={handleShareProfile}>
                <Share2 size={15} />
                <span>Share</span>
              </button>
              {shareTooltip && <span className="ig-share-tooltip">{shareTooltip}</span>}
            </div>

            <button id="btn-create-post-profile" className="ig-action-btn ig-action-btn-primary" onClick={() => setCreatePostModalOpen(true)}>
              <Plus size={15} />
              <span>Post</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="ig-profile-tabs-wrap">
          <button
            id="tab-profile-posts"
            type="button"
            className={`ig-tab-btn ${profileTab === 'posts' ? 'active' : ''}`}
            onClick={() => setProfileTab('posts')}
          >
            <Grid size={18} />
            <span>Posts</span>
            {userPosts.length > 0 && <span className="ig-tab-count">{userPosts.length}</span>}
          </button>

          <button
            id="tab-profile-about"
            type="button"
            className={`ig-tab-btn ${profileTab === 'about' ? 'active' : ''}`}
            onClick={() => setProfileTab('about')}
          >
            <UserIcon size={18} />
            <span>About</span>
          </button>
        </div>

        {/* Posts Grid Tab */}
        {profileTab === 'posts' && (
          <div className="ig-posts-section animate-fade-in">
            {userPosts.length === 0 && !postsLoading && (
              <div className="ig-posts-empty-cta">
                <div className="ig-posts-empty-icon">
                  <Camera size={36} color="#C2185B" />
                </div>
                <h4 className="ig-posts-empty-title">No Posts Yet</h4>
                <p className="ig-posts-empty-desc">
                  Share photos and videos with your matches and the HeartSync community!
                </p>
                <button type="button" className="ig-posts-first-post-btn" onClick={() => setCreatePostModalOpen(true)}>
                  <Plus size={16} />
                  <span>Create First Post</span>
                </button>
              </div>
            )}

            {(postsLoading || userPosts.length > 0) && (
              <ProfilePostsGrid
                posts={userPosts}
                loading={postsLoading}
                isOwnProfile={true}
                onOpenCreatePost={() => setCreatePostModalOpen(true)}
                currentUser={currentUser}
                userProfile={userProfile}
                onToggleLike={handleToggleLike}
                onToggleSave={handleToggleSave}
                onDeletePost={handleDeletePost}
                onEditCaption={handleEditCaption}
              />
            )}
          </div>
        )}

        {/* About Tab */}
        {profileTab === 'about' && (
          <div className="ig-about-section animate-fade-in">

            <div className="profile-section-card profile-completion-card">
              <div className="completion-header-row">
                <div className="completion-title-group">
                  <Sparkles size={18} color="#ED417A" />
                  <h3 className="section-card-title completion-title">
                    Profile {completion.percentage}% complete
                  </h3>
                </div>
                <span className="completion-score-badge">{completion.percentage}%</span>
              </div>
              <div className="completion-bar-track">
                <div className="completion-bar-fill" style={{ width: `${completion.percentage}%` }} />
              </div>
              {(completion?.missingTips || completion?.missingItems || []).length > 0 ? (
                <div className="completion-tips-box">
                  <p className="completion-tip-text">
                    {String.fromCodePoint(0x1F4A1)} {(completion?.missingTips || completion?.missingItems || [])[0]}
                  </p>
                  <button type="button" className="btn-complete-profile-action" onClick={() => navigate('/profile-setup')}>
                    Complete Profile <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <p className="completion-all-done-text">
                  {String.fromCodePoint(0x1F389)} Your profile looks fantastic and complete!
                </p>
              )}
            </div>

            <div className="profile-section-card profile-visitors-card">
              <div className="visitors-header-row">
                <div className="visitors-title-group">
                  <Eye size={18} color="#ED417A" />
                  <h3 className="section-card-title visitors-title">Who Viewed Your Profile</h3>
                </div>
                <span className="visitors-count-pill">{visitors.length}</span>
              </div>
              {loadingVisitors ? (
                <p className="visitors-status-text">Checking visitors...</p>
              ) : visitors.length > 0 ? (
                <div className="visitors-scroll-row">
                  {visitors.map((v) => {
                    const vp = v.visitor || {};
                    const vPhoto = vp.profilePhoto || '/assets/logo-heart.jpg';
                    const vName = vp.displayName || vp.firstName || 'Member';
                    return (
                      <div key={v.id || v.visitorId} className="visitor-avatar-item" onClick={() => navigate(`/profile/${v.visitorId}`)}>
                        <div className="visitor-avatar-circle">
                          <img src={vPhoto} alt={vName} className="visitor-avatar-img"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo-heart.jpg'; }} />
                        </div>
                        <span className="visitor-name-label">{vName.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="visitors-empty-text">No recent visitors yet. Keep your profile active to get noticed!</p>
              )}
            </div>

            {bio && (
              <div className="profile-section-card">
                <h3 className="section-card-title">About Me</h3>
                <p className="profile-bio-text">{bio}</p>
              </div>
            )}

            {interests.length > 0 && (
              <div className="profile-section-card">
                <h3 className="section-card-title">Interests &amp; Vibes</h3>
                <div className="profile-interests-cloud">
                  {interests.map((interest, idx) => (
                    <span key={idx} className="profile-interest-chip">{interest}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-actions-stack">
              <button id="btn-edit-profile-about" className="profile-menu-btn" onClick={() => navigate('/profile-setup')}>
                <div className="menu-btn-left"><Edit3 size={18} className="menu-icon-pink" /><span>Edit Profile &amp; Photos</span></div>
                <span className="menu-arrow">&#x203A;</span>
              </button>
              <button id="btn-get-verified-menu" className="profile-menu-btn" onClick={() => setVerificationModalOpen(true)}>
                <div className="menu-btn-left"><ShieldCheck size={18} className="menu-icon-pink" /><span>Photo &amp; ID Verification</span></div>
                <span className="menu-arrow">{isVerified ? 'Verified ✓' : isPendingVerification ? 'Pending ⏳' : 'Get Verified ›'}</span>
              </button>
              <button id="btn-saved-profiles" className="profile-menu-btn" onClick={() => navigate('/favorites')}>
                <div className="menu-btn-left"><Bookmark size={18} className="menu-icon-pink" /><span>Saved Profiles / Favorites</span></div>
                <span className="menu-arrow">&#x203A;</span>
              </button>
              <button id="btn-profile-settings" className="profile-menu-btn" onClick={() => navigate('/settings')}>
                <div className="menu-btn-left"><SettingsIcon size={18} className="menu-icon-pink" /><span>Preferences &amp; Settings</span></div>
                <span className="menu-arrow">&#x203A;</span>
              </button>
              <button id="btn-logout" className="profile-menu-btn logout-danger-btn" onClick={handleLogout} disabled={loggingOut}>
                <div className="menu-btn-left"><LogOut size={18} className="menu-icon-red" /><span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span></div>
              </button>
            </div>
          </div>
        )}
      </main>

      <CreatePostModal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onCreatePost={handleCreatePost}
      />

      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
      />

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;

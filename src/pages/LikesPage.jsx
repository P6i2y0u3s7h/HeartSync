import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import ProfileGrid from '../components/ProfileGrid';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useLikes } from '../hooks/useLikes';
import { useAuth } from '../context/AuthContext';

export const LikesPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { peopleWhoLikedMe, loading, likeBack, passIncoming } = useLikes();

  const handleLikeUser = async (targetUser) => {
    const result = await likeBack(targetUser);
    if (result && result.isMatch) {
      navigate('/match', {
        state: {
          user1: userProfile || {
            uid: currentUser?.uid || 'me',
            displayName: userProfile?.displayName || currentUser?.displayName || 'You',
            profilePhoto: userProfile?.profilePhoto || '/assets/profile-user.jpg'
          },
          user2: targetUser,
          matchData: result.matchData
        }
      });
    }
  };

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} />

      <main className="main-content-scrollable likes-content-layout">
        {/* Tab switch between Likes and People I Like */}
        <div className="likes-tab-switcher">
          <button className="tab-pill active">
            Liked You ({peopleWhoLikedMe.length})
          </button>
          <button
            className="tab-pill inactive"
            onClick={() => navigate('/people-i-like')}
          >
            People I Like
          </button>
        </div>

        {/* Section title & count */}
        <div className="likes-heading-meta">
          <p className="likes-subtitle">
            People who are interested in connecting with you. Like them back to match!
          </p>
        </div>

        {loading ? (
          <LoadingSpinner text="Checking your likes..." />
        ) : peopleWhoLikedMe.length > 0 ? (
          <ProfileGrid
            profiles={peopleWhoLikedMe}
            onLike={handleLikeUser}
            onPass={(u) => passIncoming(u)}
          />
        ) : (
          <EmptyState
            type="likes"
            title="No likes yet"
            message="When someone likes your profile, they will appear right here."
            actionText="Discover People"
            onAction={() => navigate('/home')}
          />
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default LikesPage;

import React, { useState } from 'react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import StoryAvatar from '../components/StoryAvatar';
import ProfileCard from '../components/ProfileCard';
import FilterModal from '../components/FilterModal';
import MatchModal from '../components/MatchModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useProfiles } from '../hooks/useProfiles';
import { useChats } from '../hooks/useChats';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const {
    profiles,
    currentProfile,
    currentIndex,
    loading,
    filters,
    setFilters,
    handleLike,
    handlePass,
    matchData,
    showMatchModal,
    closeMatchModal,
    refreshProfiles
  } = useProfiles();

  const { activeUsers } = useChats();
  const navigate = useNavigate();

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header onOpenFilter={() => setFilterModalOpen(true)} />

      <main className="main-content-scrollable home-content-layout">
        {/* Story avatars row */}
        <section className="stories-section" aria-label="Stories & Active Users">
          <div className="stories-horizontal-scroll">
            <StoryAvatar isAddStory={true} onAddStory={() => navigate('/profile')} />
            {activeUsers.map((user) => (
              <StoryAvatar key={user.uid || user.id} profile={user} />
            ))}
          </div>
        </section>

        {/* Swipe Card Deck */}
        <section className="card-deck-section">
          {loading ? (
            <div className="card-loading-state">
              <LoadingSpinner text="Finding people who match your vibe..." />
            </div>
          ) : currentProfile ? (
            <div className="swipe-card-stage animate-fade-in">
              <ProfileCard
                profile={currentProfile}
                onLike={() => handleLike(currentProfile)}
                onPass={() => handlePass(currentProfile)}
                onInterested={() => handleLike(currentProfile)}
                onCardClick={() => navigate(`/profile/${currentProfile.uid || currentProfile.id}`)}
              />
            </div>
          ) : (
            <EmptyState
              type="search"
              title="You've seen everyone nearby!"
              message="Adjust your age, distance, or city filters to discover more genuine matches."
              actionText="Reset Filters"
              onAction={() => {
                setFilters({ preferredGender: 'All', minAge: 18, maxAge: 50 });
                refreshProfiles();
              }}
            />
          )}
        </section>
      </main>

      {/* Modals */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      <MatchModal
        isOpen={showMatchModal}
        onClose={closeMatchModal}
        user1={matchData?.user1}
        user2={matchData?.user2}
      />

      <BottomNavigation />
    </div>
  );
};

export default HomePage;

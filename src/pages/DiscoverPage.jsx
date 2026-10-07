import React, { useState, useMemo } from 'react';
import { Layers, LayoutGrid } from 'lucide-react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import SearchBar from '../components/SearchBar';
import SwipeDeck from '../components/SwipeDeck';
import ProfileGrid from '../components/ProfileGrid';
import FilterModal from '../components/FilterModal';
import MatchModal from '../components/MatchModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import HeartBackground from '../components/HeartBackground';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../hooks/useProfiles';

export const DiscoverPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('swipe'); // 'swipe' | 'grid'

  const {
    profiles,
    loading,
    filters,
    setFilters,
    handleLike,
    handlePass,
    handleUndo,
    refreshProfiles,
    matchData,
    showMatchModal,
    closeMatchModal
  } = useProfiles();

  const filteredProfiles = useMemo(() => {
    if (!searchTerm.trim()) return profiles;
    const term = searchTerm.toLowerCase();
    return profiles.filter((p) => {
      const nameMatch = (p.displayName || p.name || p.firstName || '').toLowerCase().includes(term);
      const userMatch = (p.username || '').toLowerCase().includes(term);
      const cityMatch = (p.city || '').toLowerCase().includes(term);
      return nameMatch || userMatch || cityMatch;
    });
  }, [profiles, searchTerm]);

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header onOpenFilter={() => setFilterModalOpen(true)} />

      <main className="main-content-scrollable discover-content-layout">
        {/* Top Control Bar: Search + View Switcher */}
        <section className="discover-top-controls-section">
          <div className="discover-search-flex">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name or city..."
            />
          </div>

          <div className="discover-view-toggle-pills" role="radiogroup" aria-label="View Mode">
            <button
              type="button"
              className={`view-toggle-pill ${viewMode === 'swipe' ? 'active' : ''}`}
              onClick={() => setViewMode('swipe')}
              title="Tinder Swipe Deck view"
              aria-checked={viewMode === 'swipe'}
              role="radio"
            >
              <Layers size={16} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={`view-toggle-pill ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Browse all grid view"
              aria-checked={viewMode === 'grid'}
              role="radio"
            >
              <LayoutGrid size={16} />
              <span>Grid</span>
            </button>
          </div>
        </section>

        {/* 1. Tinder-Style Swipe Deck Mode */}
        {viewMode === 'swipe' && (
          <section className="discover-swipe-deck-section">
            <SwipeDeck
              profiles={filteredProfiles}
              loading={loading}
              onLike={(p, isSuper) => handleLike(p, isSuper)}
              onPass={(p) => handlePass(p)}
              onUndo={(type, p) => handleUndo(type, p)}
              onRefresh={refreshProfiles}
              currentUser={currentUser}
            />
          </section>
        )}

        {/* 2. Grid View Mode */}
        {viewMode === 'grid' && (
          <section className="discover-grid-section">
            {loading ? (
              <LoadingSpinner text="Loading profiles..." />
            ) : filteredProfiles.length > 0 ? (
              <ProfileGrid
                profiles={filteredProfiles}
                onLike={(p) => handleLike(p)}
                onPass={(p) => handlePass(p)}
              />
            ) : (
              <EmptyState
                type="search"
                title="No people found"
                message={`No profiles matched "${searchTerm}". Try another search or adjust filters.`}
                actionText="Clear Search"
                onAction={() => setSearchTerm('')}
              />
            )}
          </section>
        )}
      </main>

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />

      {/* In-Place "It's a Match!" Celebration Modal */}
      <MatchModal
        isOpen={showMatchModal}
        onClose={closeMatchModal}
        user1={matchData?.user1 || userProfile || currentUser}
        user2={matchData?.user2}
      />

      <BottomNavigation />
    </div>
  );
};

export default DiscoverPage;

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import SearchBar from '../components/SearchBar';
import ProfileGrid from '../components/ProfileGrid';
import FilterModal from '../components/FilterModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import HeartBackground from '../components/HeartBackground';
import { useProfiles } from '../hooks/useProfiles';

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const {
    profiles,
    loading,
    filters,
    setFilters,
    handleLike,
    handlePass,
    refreshProfiles
  } = useProfiles();

  const handleProfileLike = async (profile) => {
    const res = await handleLike(profile);
    if (res && res.isMatch) {
      navigate('/match', {
        state: {
          user1: res.user1,
          user2: res.user2,
          matchData: res.matchData
        }
      });
    }
  };

  const filteredProfiles = useMemo(() => {
    if (!searchTerm.trim()) return profiles;
    const term = searchTerm.toLowerCase();
    return profiles.filter((p) => {
      const nameMatch = (p.displayName || p.name || '').toLowerCase().includes(term);
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
        {/* Search Bar */}
        <section className="discover-search-section">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, username or city..."
          />
        </section>

        {/* Profiles Grid */}
        <section className="discover-grid-section">
          {loading ? (
            <LoadingSpinner text="Loading profiles..." />
          ) : filteredProfiles.length > 0 ? (
            <ProfileGrid
              profiles={filteredProfiles}
              onLike={(p) => handleProfileLike(p)}
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
      </main>

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />

      <BottomNavigation />
    </div>
  );
};

export default DiscoverPage;

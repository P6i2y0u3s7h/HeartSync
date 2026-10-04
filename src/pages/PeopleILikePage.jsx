import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import SearchBar from '../components/SearchBar';
import ProfileGrid from '../components/ProfileGrid';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useLikes } from '../hooks/useLikes';

export const PeopleILikePage = () => {
  const navigate = useNavigate();
  const { peopleILiked, loading } = useLikes();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return peopleILiked;
    const term = searchTerm.toLowerCase();
    return peopleILiked.filter(p =>
      (p.displayName || p.name || '').toLowerCase().includes(term) ||
      (p.city || '').toLowerCase().includes(term)
    );
  }, [peopleILiked, searchTerm]);

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} title="People Whom I Like" />

      <main className="main-content-scrollable likes-content-layout">
        {/* Tab switch */}
        <div className="likes-tab-switcher">
          <button
            className="tab-pill inactive"
            onClick={() => navigate('/likes')}
          >
            Liked You
          </button>
          <button className="tab-pill active">
            People Whom I Like ({peopleILiked.length})
          </button>
        </div>

        <section className="discover-search-section">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search profiles you liked..."
          />
        </section>

        {loading ? (
          <LoadingSpinner text="Loading profiles you liked..." />
        ) : filtered.length > 0 ? (
          <ProfileGrid
            profiles={filtered}
            showActions={false}
          />
        ) : (
          <EmptyState
            type="likes"
            title="No liked profiles found"
            message={searchTerm ? `No results for "${searchTerm}"` : "You haven't liked any profiles yet. Start swiping on the home screen!"}
            actionText="Start Swiping"
            onAction={() => navigate('/home')}
          />
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default PeopleILikePage;

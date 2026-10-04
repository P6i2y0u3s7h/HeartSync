import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDiscoverProfiles } from '../services/userService';
import { sendLike } from '../services/likeService';

export const useProfiles = (initialFilters = {}) => {
  const { currentUser, userProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [matchData, setMatchData] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDiscoverProfiles(currentUser?.uid || 'guest', filters);
      setProfiles(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching discovery profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const currentProfile = profiles[currentIndex] || null;

  const handleLike = async (profile) => {
    const target = profile || currentProfile;
    if (!target) return;

    // Advance card
    setCurrentIndex(prev => prev + 1);

    try {
      const result = await sendLike(userProfile || { uid: currentUser?.uid, displayName: 'You' }, target);
      if (result.isMatch) {
        setMatchData({
          user1: userProfile || { uid: currentUser?.uid, displayName: 'You', profilePhoto: '/assets/logo-heart.jpg' },
          user2: target
        });
        setShowMatchModal(true);
      }
      return result;
    } catch (err) {
      console.error('Error sending like:', err);
    }
  };

  const handlePass = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchData(null);
  };

  return {
    profiles,
    currentProfile,
    currentIndex,
    loading,
    filters,
    setFilters,
    refreshProfiles: fetchProfiles,
    handleLike,
    handlePass,
    matchData,
    showMatchModal,
    closeMatchModal
  };
};

export default useProfiles;

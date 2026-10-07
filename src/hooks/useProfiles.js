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
    if (!target) return null;

    // Advance card
    setCurrentIndex(prev => prev + 1);

    try {
      const myUser = userProfile || {
        uid: currentUser?.uid || 'me',
        displayName: userProfile?.displayName || currentUser?.displayName || 'You',
        profilePhoto: userProfile?.profilePhoto || '/assets/logo-heart.jpg'
      };
      const result = await sendLike(myUser, target);
      if (result && result.isMatch) {
        const u1 = myUser;
        const u2 = target;
        setMatchData({
          user1: u1,
          user2: u2,
          matchData: result.matchData
        });
        setShowMatchModal(true);
        return { ...result, user1: u1, user2: u2 };
      }
      return result;
    } catch (err) {
      console.error('Error sending like:', err);
      return { isMatch: false };
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

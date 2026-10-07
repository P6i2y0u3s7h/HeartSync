import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDiscoverProfiles } from '../services/userService';
import { sendLike, passUser, undoLike, undoPass } from '../services/likeService';

export const useProfiles = (initialFilters = {}) => {
  const { currentUser, userProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [matchData, setMatchData] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDiscoverProfiles(currentUser?.uid || 'guest', filters);
      setProfiles(data);
    } catch (err) {
      console.error('Error fetching discovery profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleLike = async (profile, isSuperLike = false) => {
    if (!profile) return null;

    try {
      const myUser = userProfile || {
        uid: currentUser?.uid || 'me',
        displayName: userProfile?.displayName || currentUser?.displayName || 'You',
        profilePhoto: userProfile?.profilePhoto || '/assets/logo-heart.jpg'
      };

      const result = await sendLike(myUser, profile, isSuperLike);

      if (result && result.isMatch) {
        setMatchData({
          user1: myUser,
          user2: profile,
          matchData: result.matchData
        });
        setShowMatchModal(true);
        return { ...result, user1: myUser, user2: profile };
      }
      return result;
    } catch (err) {
      console.error('Error sending like:', err);
      return { isMatch: false };
    }
  };

  const handlePass = async (profile) => {
    if (!profile || !currentUser?.uid) return;
    try {
      const targetUid = profile.uid || profile.id;
      await passUser(currentUser.uid, targetUid);
    } catch (err) {
      console.error('Error passing profile:', err);
    }
  };

  const handleUndo = async (type, profile) => {
    if (!profile || !currentUser?.uid) return;
    const targetUid = profile.uid || profile.id;

    try {
      if (type === 'like' || type === 'superlike') {
        await undoLike(currentUser.uid, targetUid);
      } else if (type === 'pass') {
        await undoPass(currentUser.uid, targetUid);
      }
    } catch (err) {
      console.error('Error undoing swipe action:', err);
    }
  };

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchData(null);
  };

  return {
    profiles,
    loading,
    filters,
    setFilters,
    refreshProfiles: fetchProfiles,
    handleLike,
    handlePass,
    handleUndo,
    matchData,
    showMatchModal,
    closeMatchModal
  };
};

export default useProfiles;

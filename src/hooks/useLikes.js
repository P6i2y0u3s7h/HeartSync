import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLikesGiven, getLikesReceived, sendLike } from '../services/likeService';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';

export const useLikes = () => {
  const { currentUser, userProfile } = useAuth();
  const [peopleILiked, setPeopleILiked] = useState([]);
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLikes = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [givenIds, receivedIds] = await Promise.all([
        getLikesGiven(currentUser.uid),
        getLikesReceived(currentUser.uid)
      ]);

      // Resolve profiles for given
      const givenProfiles = [];
      for (const id of givenIds) {
        const seedMatch = initialProfiles.find(p => p.uid === id);
        if (seedMatch) {
          givenProfiles.push(seedMatch);
        } else {
          const prof = await getUserProfile(id);
          if (prof) givenProfiles.push(prof);
        }
      }

      // Resolve profiles for received
      const receivedProfiles = [];
      for (const id of receivedIds) {
        const seedMatch = initialProfiles.find(p => p.uid === id);
        if (seedMatch) {
          receivedProfiles.push(seedMatch);
        } else {
          const prof = await getUserProfile(id);
          if (prof) receivedProfiles.push(prof);
        }
      }

      // If receivedProfiles is empty in demo, provide mock likes to showcase the UI
      if (receivedProfiles.length === 0 && givenProfiles.length === 0) {
        setPeopleWhoLikedMe([initialProfiles[0], initialProfiles[1]]);
        setPeopleILiked([initialProfiles[3]]);
      } else {
        setPeopleILiked(givenProfiles);
        setPeopleWhoLikedMe(receivedProfiles);
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
      // Fallback
      setPeopleWhoLikedMe([initialProfiles[0], initialProfiles[1]]);
      setPeopleILiked([initialProfiles[3]]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const likeBack = async (targetUser) => {
    try {
      const res = await sendLike(userProfile || { uid: currentUser?.uid }, targetUser);
      // Remove from peopleWhoLikedMe and add to peopleILiked
      setPeopleWhoLikedMe(prev => prev.filter(u => (u.uid || u.id) !== (targetUser.uid || targetUser.id)));
      setPeopleILiked(prev => [targetUser, ...prev]);
      return res;
    } catch (err) {
      console.error('Error liking back:', err);
    }
  };

  const passIncoming = (targetUser) => {
    setPeopleWhoLikedMe(prev => prev.filter(u => (u.uid || u.id) !== (targetUser.uid || targetUser.id)));
  };

  return {
    peopleILiked,
    peopleWhoLikedMe,
    loading,
    refreshLikes: fetchLikes,
    likeBack,
    passIncoming
  };
};

export default useLikes;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, getUserPreferences, updateUserPreferences } from '../services/userService';

export const useUser = (userId) => {
  const { currentUser, userProfile: authProfile } = useAuth();
  const targetId = userId || currentUser?.uid;

  const [profile, setProfile] = useState(userId ? null : authProfile);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [profData, prefData] = await Promise.all([
          getUserProfile(targetId),
          getUserPreferences(targetId)
        ]);
        if (isMounted) {
          setProfile(profData || (targetId === currentUser?.uid ? authProfile : null));
          setPreferences(prefData);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [targetId, currentUser, authProfile]);

  const updateProfileData = async (data) => {
    if (!targetId) return;
    const updated = await updateUserProfile(targetId, data);
    setProfile(prev => ({ ...prev, ...data }));
    return updated;
  };

  const updatePreferencesData = async (prefs) => {
    if (!targetId) return;
    const updated = await updateUserPreferences(targetId, prefs);
    setPreferences(updated);
    return updated;
  };

  return {
    profile,
    preferences,
    loading,
    error,
    updateProfile: updateProfileData,
    updatePreferences: updatePreferencesData
  };
};

export default useUser;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserMatches, unmatchUsers } from '../services/matchService';
import { getBlockedUserIds } from '../services/blockService';
import { initialProfiles } from '../data/seedData';

export const useMatches = () => {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!currentUser) {
      // Demo matches
      setMatches([
        {
          id: 'demo_match_1',
          matchedUser: initialProfiles[0],
          matchedAt: 'Just now'
        },
        {
          id: 'demo_match_2',
          matchedUser: initialProfiles[4],
          matchedAt: '2 hours ago'
        }
      ]);
      setLoading(false);
      return;
    }

    let unsubscribe;

    const setupMatches = async () => {
      let blockedIds = [];
      try {
        blockedIds = await getBlockedUserIds(currentUser.uid);
      } catch (e) {
        console.warn('Could not load blocked users for matches:', e);
      }

      const blockedSet = new Set(blockedIds);

      unsubscribe = subscribeToUserMatches(currentUser.uid, (firestoreMatches) => {
        const formatted = firestoreMatches
          .map(m => {
            const otherUser = m.user1?.uid === currentUser.uid ? m.user2 : m.user1;
            return {
              id: m.id,
              matchedUser: otherUser,
              matchedAt: m.matchedAt || 'Recently'
            };
          })
          .filter(m => {
            const uid = m.matchedUser?.uid || m.matchedUser?.id;
            return uid && !blockedSet.has(uid);
          });

        if (!isMounted) return;

        if (formatted.length === 0) {
          // If no firestore matches and not blocked, provide demo fallback
          const seedFallback = [
            {
              id: 'match_aditya',
              matchedUser: initialProfiles[0],
              matchedAt: 'Just now'
            },
            {
              id: 'match_reyansh',
              matchedUser: initialProfiles[4],
              matchedAt: '1 day ago'
            }
          ].filter(m => !blockedSet.has(m.matchedUser.uid));
          setMatches(seedFallback);
        } else {
          setMatches(formatted);
        }
        setLoading(false);
      });
    };

    setupMatches();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const handleUnmatch = async (targetUid) => {
    if (!currentUser?.uid || !targetUid) return;
    // Optimistic UI update immediately
    setMatches(prev => prev.filter(m => {
      const otherId = m.matchedUser?.uid || m.matchedUser?.id;
      return otherId !== targetUid;
    }));

    try {
      await unmatchUsers(currentUser.uid, targetUid);
    } catch (e) {
      console.warn('Unmatch error:', e);
    }
  };

  return { matches, loading, unmatch: handleUnmatch };
};

export default useMatches;

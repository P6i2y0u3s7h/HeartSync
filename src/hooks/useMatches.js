import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserMatches } from '../services/matchService';
import { initialProfiles } from '../data/seedData';

export const useMatches = () => {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const unsubscribe = subscribeToUserMatches(currentUser.uid, (firestoreMatches) => {
      const formatted = firestoreMatches.map(m => {
        const otherUser = m.user1?.uid === currentUser.uid ? m.user2 : m.user1;
        return {
          id: m.id,
          matchedUser: otherUser,
          matchedAt: m.matchedAt || 'Recently'
        };
      });

      if (formatted.length === 0) {
        // Fallback for new accounts so the user has immediate interactive experience
        setMatches([
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
        ]);
      } else {
        setMatches(formatted);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { matches, loading };
};

export default useMatches;

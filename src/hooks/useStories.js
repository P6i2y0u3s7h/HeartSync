import { useState, useEffect, useMemo } from 'react';
import { subscribeToActiveStories } from '../services/storyService';
import { subscribeToUserMatches } from '../services/matchService';

/**
 * Hook to manage active stories and categorize into My Stories and Other Users' Stories
 */
export const useStories = (currentUser) => {
  const [stories, setStories] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to matches to check "matches only" privacy
  useEffect(() => {
    if (!currentUser?.uid) {
      setMatches([]);
      return;
    }
    const unsubscribeMatches = subscribeToUserMatches(currentUser.uid, (userMatches) => {
      setMatches(userMatches || []);
    });
    return () => {
      if (unsubscribeMatches) unsubscribeMatches();
    };
  }, [currentUser?.uid]);

  // Subscribe to active stories
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToActiveStories((activeStories) => {
      setStories(activeStories || []);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Set of matched user IDs for quick privacy lookup
  const matchedUserIds = useMemo(() => {
    const set = new Set();
    if (!currentUser?.uid || !matches) return set;
    matches.forEach((m) => {
      if (Array.isArray(m.userIds)) {
        m.userIds.forEach((id) => {
          if (id !== currentUser.uid) set.add(id);
        });
      }
    });
    return set;
  }, [currentUser?.uid, matches]);

  // Separate stories into myStories and others
  const { myStories, otherUsersWithStories } = useMemo(() => {
    const currentUid = currentUser?.uid;
    const mine = [];
    const othersGrouped = new Map();

    const now = Date.now();

    stories.forEach((story) => {
      // Client-side verification of 24h expiration
      const exp = story.expiresAtMillis || (story.expiresAt?.toMillis ? story.expiresAt.toMillis() : null);
      if (exp && exp <= now) return;

      if (currentUid && story.userId === currentUid) {
        mine.push(story);
      } else {
        // Privacy check: if 'matches', user must be matched with story author
        if (story.storyVisibility === 'matches' && !matchedUserIds.has(story.userId)) {
          return;
        }

        if (!othersGrouped.has(story.userId)) {
          othersGrouped.set(story.userId, {
            userId: story.userId,
            userDisplayName: story.userDisplayName || 'HeartSync Member',
            userProfilePhoto: story.userProfilePhoto || '/assets/logo-heart.jpg',
            stories: []
          });
        }
        othersGrouped.get(story.userId).stories.push(story);
      }
    });

    // Sort each user's stories chronologically (oldest first for sequential viewing)
    mine.sort((a, b) => (a.createdAtMillis || 0) - (b.createdAtMillis || 0));
    othersGrouped.forEach((group) => {
      group.stories.sort((a, b) => (a.createdAtMillis || 0) - (b.createdAtMillis || 0));
    });

    return {
      myStories: mine,
      otherUsersWithStories: Array.from(othersGrouped.values())
    };
  }, [stories, currentUser?.uid, matchedUserIds]);

  return {
    allStories: stories,
    myStories,
    otherUsersWithStories,
    loading
  };
};

export default useStories;

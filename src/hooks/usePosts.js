import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToFeed,
  subscribeToUserPosts,
  createPost,
  togglePostLike,
  toggleSavePost,
  addPostComment,
  deletePostComment,
  updatePostCaption,
  deletePost,
  reportPost,
  sharePostToChat
} from '../services/postService';

/**
 * Hook for consuming the community feed.
 */
export const useFeedPosts = (currentUser) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFeed({ limitCount: 40 }, (fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  const handleCreatePost = useCallback(
    async ({ file, caption, privacy, onProgress }) => {
      if (!currentUser?.uid) throw new Error('User not authenticated');
      return await createPost({
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Member',
        userProfilePhoto: currentUser.photoURL || '/assets/logo-heart.jpg',
        file,
        caption,
        privacy,
        onProgress
      });
    },
    [currentUser]
  );

  const handleToggleLike = useCallback(
    async (postId, currentlyLiked) => {
      if (!currentUser?.uid || !postId) return;

      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId || p.postId === postId) {
            const likedBy = p.likedBy || [];
            const isNowLiked = !currentlyLiked;
            const newLikedBy = isNowLiked
              ? [...likedBy, currentUser.uid]
              : likedBy.filter((id) => id !== currentUser.uid);
            return {
              ...p,
              likedBy: newLikedBy,
              likesCount: Math.max(0, (p.likesCount || 0) + (isNowLiked ? 1 : -1))
            };
          }
          return p;
        })
      );

      try {
        await togglePostLike(postId, currentUser.uid, currentlyLiked);
      } catch (err) {
        console.warn('Like toggle failed, reverting:', err);
      }
    },
    [currentUser?.uid]
  );

  const handleToggleSave = useCallback(
    async (postId, currentlySaved, postData = {}) => {
      if (!currentUser?.uid || !postId) return;

      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId || p.postId === postId) {
            const savedBy = p.savedBy || [];
            const isNowSaved = !currentlySaved;
            const newSavedBy = isNowSaved
              ? [...savedBy, currentUser.uid]
              : savedBy.filter((id) => id !== currentUser.uid);
            return {
              ...p,
              savedBy: newSavedBy
            };
          }
          return p;
        })
      );

      try {
        await toggleSavePost(postId, currentUser.uid, currentlySaved, postData);
      } catch (err) {
        console.warn('Save toggle failed:', err);
      }
    },
    [currentUser?.uid]
  );

  const handleDeletePost = useCallback(
    async (postId, storagePath) => {
      if (!currentUser?.uid || !postId) return;

      // Optimistic removal
      setPosts((prev) => prev.filter((p) => p.id !== postId && p.postId !== postId));

      try {
        await deletePost(postId, currentUser.uid, storagePath);
      } catch (err) {
        console.error('Delete post error:', err);
        throw err;
      }
    },
    [currentUser?.uid]
  );

  const handleEditCaption = useCallback(
    async (postId, newCaption) => {
      if (!currentUser?.uid || !postId) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId || p.postId === postId ? { ...p, caption: newCaption } : p
        )
      );

      try {
        await updatePostCaption(postId, currentUser.uid, newCaption);
      } catch (err) {
        console.error('Edit caption error:', err);
        throw err;
      }
    },
    [currentUser?.uid]
  );

  return {
    posts,
    loading,
    error,
    handleCreatePost,
    handleToggleLike,
    handleToggleSave,
    handleDeletePost,
    handleEditCaption
  };
};

/**
 * Hook for consuming posts belonging to a specific user.
 */
export const useUserPosts = (targetUserId, currentUserId) => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) {
      setUserPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserPosts(targetUserId, (posts) => {
      setUserPosts(posts);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [targetUserId]);

  const handleToggleLike = useCallback(
    async (postId, currentlyLiked) => {
      if (!currentUserId || !postId) return;

      setUserPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId || p.postId === postId) {
            const likedBy = p.likedBy || [];
            const isNowLiked = !currentlyLiked;
            const newLikedBy = isNowLiked
              ? [...likedBy, currentUserId]
              : likedBy.filter((id) => id !== currentUserId);
            return {
              ...p,
              likedBy: newLikedBy,
              likesCount: Math.max(0, (p.likesCount || 0) + (isNowLiked ? 1 : -1))
            };
          }
          return p;
        })
      );

      try {
        await togglePostLike(postId, currentUserId, currentlyLiked);
      } catch (err) {
        console.warn('Like toggle failed:', err);
      }
    },
    [currentUserId]
  );

  const handleToggleSave = useCallback(
    async (postId, currentlySaved, postData = {}) => {
      if (!currentUserId || !postId) return;

      setUserPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId || p.postId === postId) {
            const savedBy = p.savedBy || [];
            const isNowSaved = !currentlySaved;
            const newSavedBy = isNowSaved
              ? [...savedBy, currentUserId]
              : savedBy.filter((id) => id !== currentUserId);
            return {
              ...p,
              savedBy: newSavedBy
            };
          }
          return p;
        })
      );

      try {
        await toggleSavePost(postId, currentUserId, currentlySaved, postData);
      } catch (err) {
        console.warn('Save toggle failed:', err);
      }
    },
    [currentUserId]
  );

  const handleEditCaption = useCallback(
    async (postId, newCaption) => {
      if (!currentUserId || !postId) return;

      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === postId || p.postId === postId ? { ...p, caption: newCaption } : p
        )
      );

      try {
        await updatePostCaption(postId, currentUserId, newCaption);
      } catch (err) {
        console.error('Edit caption error:', err);
        throw err;
      }
    },
    [currentUserId]
  );

  /**
   * Deletes a post owned by the current user.
   * Optimistically removes it from local state, then deletes from Firestore + Storage.
   * Will throw if the user does not own the post.
   */
  const handleDeletePost = useCallback(
    async (postId, storagePath) => {
      if (!currentUserId || !postId) return;

      // Optimistic removal from local list
      setUserPosts((prev) => prev.filter((p) => p.id !== postId && p.postId !== postId));

      try {
        await deletePost(postId, currentUserId, storagePath);
      } catch (err) {
        console.error('Delete post error:', err);
        throw err;
      }
    },
    [currentUserId]
  );

  return {
    userPosts,
    loading,
    handleToggleLike,
    handleToggleSave,
    handleDeletePost,
    handleEditCaption
  };
};


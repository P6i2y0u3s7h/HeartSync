import { db, storage } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage } from './storageService';
import { sendMessage } from './messageService';

/**
 * Uploads a photo or video to Firebase Storage.
 * Supports image formats (JPG, PNG, WEBP) and video formats (MP4, WebM).
 * Gracefully falls back to local Object URL / Data URL if Firebase Storage is unreachable.
 */
export const uploadPostMedia = async (userId, file, onProgress) => {
  if (!userId || !file) throw new Error('Missing userId or file for post upload');

  const isVideo = file.type?.startsWith('video/');
  const mediaType = isVideo ? 'video' : 'image';
  const timestamp = Date.now();

  let uploadBlob = file;
  let fileExt = file.name?.split('.').pop() || (isVideo ? 'mp4' : 'jpg');

  if (!isVideo) {
    // Compress image to max width 1080px with 0.88 quality
    uploadBlob = await compressImage(file, 1080, 0.88);
    fileExt = 'jpg';
  }

  const storagePath = `posts/${userId}/${mediaType}_${timestamp}.${fileExt}`;

  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, uploadBlob, {
      contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg')
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          }
        },
        (error) => {
          console.warn('Storage upload failed, falling back to local URL:', error);
          if (isVideo) {
            const videoUrl = URL.createObjectURL(file);
            resolve({
              mediaUrl: videoUrl,
              imageUrl: videoUrl,
              mediaType: 'video',
              storagePath: ''
            });
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                mediaUrl: reader.result,
                imageUrl: reader.result,
                mediaType: 'image',
                storagePath: ''
              });
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(uploadBlob);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              mediaUrl: downloadUrl,
              imageUrl: downloadUrl,
              mediaType,
              storagePath
            });
          } catch (e) {
            console.warn('Error fetching download URL, using local fallback:', e);
            const fallbackUrl = URL.createObjectURL(file);
            resolve({
              mediaUrl: fallbackUrl,
              imageUrl: fallbackUrl,
              mediaType,
              storagePath: ''
            });
          }
        }
      );
    });
  } catch (err) {
    console.warn('Direct upload error, generating local fallback URL:', err);
    return new Promise((resolve) => {
      const fallbackUrl = URL.createObjectURL(file);
      resolve({
        mediaUrl: fallbackUrl,
        imageUrl: fallbackUrl,
        mediaType,
        storagePath: ''
      });
    });
  }
};

/**
 * Backwards compatible helper for uploadPostImage
 */
export const uploadPostImage = uploadPostMedia;

/**
 * Creates a new photo or video post in Firestore posts collection.
 */
export const createPost = async ({
  userId,
  userDisplayName,
  userProfilePhoto,
  file,
  caption = '',
  privacy = 'public', // 'public' | 'matches'
  onProgress
}) => {
  if (!userId) throw new Error('User must be authenticated to create a post');
  if (!file) throw new Error('A photo or video is required to create a post');

  // 1. Upload media (photo or video)
  const { mediaUrl, imageUrl, mediaType, storagePath } = await uploadPostMedia(
    userId,
    file,
    onProgress
  );

  // 2. Write metadata to Firestore
  const postsRef = collection(db, 'posts');
  const postData = {
    userId,
    userDisplayName: userDisplayName || 'Member',
    userProfilePhoto: userProfilePhoto || '/assets/logo-heart.jpg',
    mediaUrl: mediaUrl || imageUrl,
    imageUrl: imageUrl || mediaUrl,
    mediaType: mediaType || 'image',
    storagePath: storagePath || '',
    caption: caption ? caption.trim() : '',
    privacy: privacy === 'matches' ? 'matches' : 'public',
    likesCount: 0,
    commentsCount: 0,
    likedBy: [],
    savedBy: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(postsRef, postData);
  return {
    id: docRef.id,
    postId: docRef.id,
    ...postData,
    createdAt: new Date().toISOString()
  };
};

/**
 * Subscribes in real time to the community post feed.
 */
export const subscribeToFeed = ({ limitCount = 40 } = {}, callback) => {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const posts = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        posts.push({
          id: docSnap.id,
          postId: docSnap.id,
          ...data,
          mediaUrl: data.mediaUrl || data.imageUrl,
          mediaType: data.mediaType || 'image'
        });
      });
      callback(posts);
    },
    (error) => {
      console.warn('subscribeToFeed error (attempting fallback query):', error);
      const fallbackQuery = query(postsRef, limit(limitCount));
      onSnapshot(fallbackQuery, (snapshot) => {
        const posts = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          posts.push({
            id: docSnap.id,
            postId: docSnap.id,
            ...data,
            mediaUrl: data.mediaUrl || data.imageUrl,
            mediaType: data.mediaType || 'image'
          });
        });
        posts.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        callback(posts);
      });
    }
  );

  return unsubscribe;
};

/**
 * Subscribes in real time to posts by a specific user (for profile view).
 */
export const subscribeToUserPosts = (targetUserId, callback) => {
  if (!targetUserId) {
    callback([]);
    return () => {};
  }

  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    where('userId', '==', targetUserId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const posts = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        posts.push({
          id: docSnap.id,
          postId: docSnap.id,
          ...data,
          mediaUrl: data.mediaUrl || data.imageUrl,
          mediaType: data.mediaType || 'image'
        });
      });
      callback(posts);
    },
    (error) => {
      console.warn('subscribeToUserPosts fallback query:', error);
      const fallbackQuery = query(postsRef, where('userId', '==', targetUserId), limit(50));
      onSnapshot(fallbackQuery, (snapshot) => {
        const posts = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          posts.push({
            id: docSnap.id,
            postId: docSnap.id,
            ...data,
            mediaUrl: data.mediaUrl || data.imageUrl,
            mediaType: data.mediaType || 'image'
          });
        });
        posts.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        callback(posts);
      });
    }
  );

  return unsubscribe;
};

/**
 * Toggles like / unlike on a post.
 * Updates likedBy array and likesCount atomically.
 */
export const togglePostLike = async (postId, userId, currentlyLiked) => {
  if (!postId || !userId) return;

  const postRef = doc(db, 'posts', postId);
  const isLiking = !currentlyLiked;

  try {
    await updateDoc(postRef, {
      likedBy: isLiking ? arrayUnion(userId) : arrayRemove(userId),
      likesCount: increment(isLiking ? 1 : -1)
    });
  } catch (error) {
    console.error('togglePostLike error:', error);
    throw error;
  }
};

/**
 * Toggles save / unsave on a post.
 * Persists in user's saved_posts subcollection AND post's savedBy array.
 */
export const toggleSavePost = async (postId, userId, currentlySaved, postData = {}) => {
  if (!postId || !userId) return;

  const isSaving = !currentlySaved;
  const postRef = doc(db, 'posts', postId);
  const userSavedRef = doc(db, 'users', userId, 'saved_posts', postId);

  try {
    if (isSaving) {
      await setDoc(userSavedRef, {
        postId,
        savedAt: serverTimestamp(),
        userId: postData.userId || '',
        mediaUrl: postData.mediaUrl || postData.imageUrl || '',
        caption: postData.caption || ''
      });
      await updateDoc(postRef, {
        savedBy: arrayUnion(userId)
      }).catch(() => {});
    } else {
      await deleteDoc(userSavedRef);
      await updateDoc(postRef, {
        savedBy: arrayRemove(userId)
      }).catch(() => {});
    }
  } catch (error) {
    console.error('toggleSavePost error:', error);
    throw error;
  }
};

/**
 * Subscribes in real time to comments for a specific post.
 */
export const subscribeToPostComments = (postId, callback) => {
  if (!postId) {
    callback([]);
    return () => {};
  }

  const commentsRef = collection(db, 'posts', postId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'), limit(100));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const comments = [];
      snapshot.forEach((docSnap) => {
        comments.push({
          id: docSnap.id,
          commentId: docSnap.id,
          ...docSnap.data()
        });
      });
      callback(comments);
    },
    (error) => {
      console.warn('subscribeToPostComments fallback query:', error);
      const fallbackQuery = query(commentsRef, limit(100));
      onSnapshot(fallbackQuery, (snapshot) => {
        const comments = [];
        snapshot.forEach((docSnap) => {
          comments.push({
            id: docSnap.id,
            commentId: docSnap.id,
            ...docSnap.data()
          });
        });
        comments.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeA - timeB;
        });
        callback(comments);
      });
    }
  );

  return unsubscribe;
};

/**
 * Adds a comment to a post.
 */
export const addPostComment = async (postId, { userId, userDisplayName, userProfilePhoto, text }) => {
  if (!postId || !userId || !text?.trim()) {
    throw new Error('Missing required comment fields');
  }

  const postRef = doc(db, 'posts', postId);
  const commentsRef = collection(db, 'posts', postId, 'comments');

  const commentData = {
    postId,
    userId,
    userDisplayName: userDisplayName || 'Member',
    userProfilePhoto: userProfilePhoto || '/assets/logo-heart.jpg',
    text: text.trim(),
    createdAt: serverTimestamp()
  };

  const commentDoc = await addDoc(commentsRef, commentData);

  try {
    await updateDoc(postRef, {
      commentsCount: increment(1)
    });
  } catch (e) {
    console.warn('Could not increment commentsCount:', e);
  }

  return {
    id: commentDoc.id,
    commentId: commentDoc.id,
    ...commentData
  };
};

/**
 * Deletes a comment from a post.
 */
export const deletePostComment = async (postId, commentId) => {
  if (!postId || !commentId) return;

  const postRef = doc(db, 'posts', postId);
  const commentRef = doc(db, 'posts', postId, 'comments', commentId);

  await deleteDoc(commentRef);

  try {
    await updateDoc(postRef, {
      commentsCount: increment(-1)
    });
  } catch (e) {
    console.warn('Could not decrement commentsCount:', e);
  }
};

/**
 * Updates a post's caption (only allowed for the post owner).
 */
export const updatePostCaption = async (postId, userId, newCaption) => {
  if (!postId || !userId) throw new Error('Missing postId or userId');

  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    throw new Error('Post does not exist');
  }

  if (postSnap.data().userId !== userId) {
    throw new Error('Unauthorized: Only the post owner can edit this caption');
  }

  await updateDoc(postRef, {
    caption: newCaption ? newCaption.trim() : '',
    updatedAt: serverTimestamp()
  });
};

/**
 * Deletes a post completely:
 * 1. Deletes the post document from Firestore
 * 2. Deletes all comments in subcollection
 * 3. Deletes media from Firebase Storage
 */
export const deletePost = async (postId, userId, storagePath) => {
  if (!postId || !userId) throw new Error('Missing postId or userId');

  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);

  if (postSnap.exists() && postSnap.data().userId !== userId) {
    throw new Error('Unauthorized: Only the post owner can delete this post');
  }

  // Delete all comments
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const commentsSnap = await getDocs(commentsRef);
    const deletePromises = commentsSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (e) {
    console.warn('Error deleting post comments subcollection:', e);
  }

  // Delete post doc
  await deleteDoc(postRef);

  // Delete media from Storage if path is known
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (e) {
      console.warn('Error deleting post media from storage:', e);
    }
  }
};

/**
 * Reports an inappropriate post.
 */
export const reportPost = async ({
  reporterUid,
  postId,
  postOwnerUid,
  reason,
  description = ''
}) => {
  if (!reporterUid || !postId || !reason) {
    throw new Error('Missing required report parameters');
  }

  const reportsRef = collection(db, 'post_reports');
  const reportData = {
    reporterUid,
    postId,
    postOwnerUid: postOwnerUid || '',
    reason,
    description: description.trim(),
    createdAt: serverTimestamp(),
    status: 'pending'
  };

  const docRef = await addDoc(reportsRef, reportData);
  return { id: docRef.id, ...reportData };
};

/**
 * Shares a post directly into a chat conversation.
 */
export const sharePostToChat = async (chatId, currentUserId, post, optionalNote = '') => {
  if (!chatId || !currentUserId || !post) {
    throw new Error('Missing parameters for sharing post to chat');
  }

  const isVideo = post.mediaType === 'video';
  const postCaption = post.caption ? `"${post.caption}"` : (isVideo ? 'a video' : 'a photo');
  const textMsg = optionalNote.trim()
    ? `${optionalNote.trim()}\n📸 Shared ${post.userDisplayName || 'User'}'s post: ${postCaption}`
    : `📸 Shared ${post.userDisplayName || 'User'}'s post: ${postCaption}`;

  await sendMessage(chatId, {
    senderId: currentUserId,
    message: textMsg,
    type: 'post_share',
    imageUrl: post.mediaUrl || post.imageUrl || '',
    sharedPostId: post.id || post.postId,
    sharedPostAuthor: post.userDisplayName || 'Member',
    sharedPostCaption: post.caption || ''
  });
};

/**
 * Formats relative time (e.g. "Just now", "5m ago", "2h ago", "3d ago").
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';

  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'Just now';
  }

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffSec) || diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

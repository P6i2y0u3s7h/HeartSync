import { db, storage } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { compressImage } from './storageService';

const STORIES_COLLECTION = 'stories';

/**
 * Uploads media file to Firebase Storage under stories/{userId}/{storyId}
 */
export const uploadStoryMedia = async (userId, storyId, file, onProgress) => {
  try {
    let uploadFile = file;
    const isImage = file.type.startsWith('image/');

    // Compress image if applicable
    if (isImage) {
      uploadFile = await compressImage(file, 1200, 0.85);
    }

    const fileExt = file.name ? file.name.split('.').pop() : (isImage ? 'jpg' : 'mp4');
    const storagePath = `stories/${userId}/${storyId}_${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, uploadFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          }
        },
        (error) => {
          console.warn('Storage upload error for story, using data URL fallback:', error);
          // Fallback to local Data URL if Firebase Storage is blocked/unconfigured
          const reader = new FileReader();
          reader.onload = () => resolve({ downloadURL: reader.result, storagePath: null });
          reader.onerror = () => reject(error);
          reader.readAsDataURL(uploadFile);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadURL, storagePath });
          } catch (err) {
            console.warn('Could not get download URL, using data URL fallback:', err);
            const reader = new FileReader();
            reader.onload = () => resolve({ downloadURL: reader.result, storagePath });
            reader.readAsDataURL(uploadFile);
          }
        }
      );
    });
  } catch (err) {
    console.error('Error uploading story media:', err);
    throw err;
  }
};

/**
 * Creates a story document in Firestore
 */
export const createStory = async ({
  userId,
  userProfile,
  mediaUrl,
  storagePath,
  mediaType = 'image',
  storyVisibility = 'everyone'
}) => {
  if (!userId || !mediaUrl) {
    throw new Error('userId and mediaUrl are required');
  }

  try {
    const storiesRef = collection(db, STORIES_COLLECTION);
    const newDocRef = doc(storiesRef);
    const storyId = newDocRef.id;

    const now = Date.now();
    // Expiration: exactly 24 hours from creation
    const expiresAtMillis = now + 24 * 60 * 60 * 1000;

    const storyData = {
      storyId,
      userId,
      userDisplayName: userProfile?.firstName || userProfile?.displayName?.split(' ')[0] || 'HeartSync Member',
      userProfilePhoto: userProfile?.profilePhoto || '/assets/logo-heart.jpg',
      mediaUrl,
      storagePath: storagePath || null,
      mediaType: mediaType || 'image',
      createdAt: serverTimestamp(),
      createdAtMillis: now,
      expiresAt: Timestamp.fromMillis(expiresAtMillis),
      expiresAtMillis,
      storyVisibility: storyVisibility || 'everyone', // 'everyone' | 'matches'
      viewCount: 0
    };

    await setDoc(newDocRef, storyData);
    return { ...storyData, id: storyId };
  } catch (error) {
    console.error('Error creating story document:', error);
    throw error;
  }
};

/**
 * Subscribes to all active stories in real-time
 * Filters out expired stories (expiresAt > now)
 */
export const subscribeToActiveStories = (callback) => {
  const storiesRef = collection(db, STORIES_COLLECTION);
  const nowTimestamp = Timestamp.now();

  // Primary query: only active stories where expiresAt > now
  const q = query(
    storiesRef,
    where('expiresAt', '>', nowTimestamp),
    orderBy('expiresAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const currentTime = Date.now();
      const stories = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const expiresAtMillis = data.expiresAtMillis || (data.expiresAt?.toMillis ? data.expiresAt.toMillis() : null);
        // Ensure strictly not expired client-side
        if (!expiresAtMillis || expiresAtMillis > currentTime) {
          stories.push({
            id: docSnap.id,
            ...data
          });
        }
      });
      callback(stories);
    },
    (error) => {
      console.warn('Stories subscription index fallback:', error);
      // Fallback query without complex order/index if index is missing
      const fallbackQuery = query(storiesRef);
      return onSnapshot(
        fallbackQuery,
        (snapshot) => {
          const currentTime = Date.now();
          const stories = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const expiresAtMillis = data.expiresAtMillis || (data.expiresAt?.toMillis ? data.expiresAt.toMillis() : null);
            if (!expiresAtMillis || expiresAtMillis > currentTime) {
              stories.push({
                id: docSnap.id,
                ...data
              });
            }
          });
          callback(stories);
        },
        (err) => {
          console.error('Stories fallback subscription error:', err);
          callback([]);
        }
      );
    }
  );
};

/**
 * Deletes a story: removes document from Firestore and media from Storage
 */
export const deleteStory = async (storyId, userId, storagePath) => {
  if (!storyId || !userId) return;

  try {
    // 1. Delete document
    const storyDocRef = doc(db, STORIES_COLLECTION, storyId);
    await deleteDoc(storyDocRef);

    // 2. Delete media from Storage if path exists
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Storage file deletion skipped or failed:', err);
      }
    }
    return true;
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

/**
 * Records a story view by another user
 */
export const recordStoryView = async (storyId, viewerUid, viewerProfile) => {
  if (!storyId || !viewerUid) return;

  try {
    const viewDocRef = doc(db, STORIES_COLLECTION, storyId, 'views', viewerUid);
    const existing = await getDoc(viewDocRef);

    if (!existing.exists()) {
      await setDoc(viewDocRef, {
        viewerUid,
        viewerDisplayName: viewerProfile?.firstName || viewerProfile?.displayName || 'HeartSync Member',
        viewerProfilePhoto: viewerProfile?.profilePhoto || '/assets/logo-heart.jpg',
        viewedAt: serverTimestamp(),
        viewedAtMillis: Date.now()
      });

      // Increment view count on parent story
      const storyDocRef = doc(db, STORIES_COLLECTION, storyId);
      await setDoc(storyDocRef, { viewCount: increment(1) }, { merge: true });
    }
  } catch (err) {
    console.warn('Error recording story view:', err);
  }
};

/**
 * Fetches all views for a specific story (only accessible by story owner)
 */
export const getStoryViews = async (storyId) => {
  if (!storyId) return [];

  try {
    const viewsRef = collection(db, STORIES_COLLECTION, storyId, 'views');
    const snapshot = await getDocs(viewsRef);
    const views = [];
    snapshot.forEach((d) => {
      views.push({ id: d.id, ...d.data() });
    });
    return views;
  } catch (error) {
    console.warn('Error fetching story views:', error);
    return [];
  }
};

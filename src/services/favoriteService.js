import { db } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export const toggleFavorite = async (userId, targetProfile) => {
  const targetId = targetProfile.uid || targetProfile.id;
  if (!userId || !targetId) return false;

  const favDocId = `${userId}_${targetId}`;
  const favRef = doc(db, 'favorites', favDocId);
  const snap = await getDoc(favRef);

  if (snap.exists()) {
    await deleteDoc(favRef);
    return false; // Removed
  } else {
    await setDoc(favRef, {
      userId,
      targetId,
      profile: {
        uid: targetId,
        id: targetId,
        displayName: targetProfile.displayName || targetProfile.name || 'Member',
        age: targetProfile.age || 24,
        city: targetProfile.city || '',
        profilePhoto: targetProfile.profilePhoto || targetProfile.image || '/assets/logo-heart.jpg',
        bio: targetProfile.bio || '',
        interests: targetProfile.interests || [],
        isVerified: !!targetProfile.isVerified
      },
      createdAt: serverTimestamp()
    });
    return true; // Added
  }
};

export const checkIsFavorite = async (userId, targetId) => {
  if (!userId || !targetId) return false;
  try {
    const favRef = doc(db, 'favorites', `${userId}_${targetId}`);
    const snap = await getDoc(favRef);
    return snap.exists();
  } catch (e) {
    return false;
  }
};

export const getUserFavorites = async (userId, blockedIds = []) => {
  if (!userId) return [];
  try {
    const favRef = collection(db, 'favorites');
    const q = query(favRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const blockedSet = new Set(blockedIds);
    const list = [];
    snap.forEach((d) => {
      const data = d.data();
      if (!blockedSet.has(data.targetId)) {
        list.push({ id: d.id, ...data.profile });
      }
    });
    return list;
  } catch (e) {
    console.error('Error fetching favorites:', e);
    return [];
  }
};

export const subscribeToFavorites = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }
  const favRef = collection(db, 'favorites');
  const q = query(favRef, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach(d => {
      const data = d.data();
      list.push({ id: d.id, ...data.profile });
    });
    callback(list);
  }, (err) => {
    console.error('Favorites subscription error:', err);
    callback([]);
  });
};

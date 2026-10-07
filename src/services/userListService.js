import { db } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export const PREDEFINED_LISTS = [
  'Favorites',
  'Close Friends',
  'Important',
  'Work',
  'Other'
];

export const getUserListsForTarget = async (currentUid, targetUid) => {
  if (!currentUid || !targetUid) return [];
  try {
    const listRef = doc(db, 'users', currentUid, 'userLists', targetUid);
    const snap = await getDoc(listRef);
    if (snap.exists()) {
      return snap.data().lists || [];
    }
    return [];
  } catch (err) {
    console.warn('Error fetching user list membership:', err);
    return [];
  }
};

export const updateUserListMembership = async (currentUid, targetUid, targetProfile, listNames) => {
  if (!currentUid || !targetUid) return;
  try {
    const listRef = doc(db, 'users', currentUid, 'userLists', targetUid);
    await setDoc(listRef, {
      targetUid,
      targetUser: {
        displayName: targetProfile?.displayName || targetProfile?.name || 'Member',
        profilePhoto: targetProfile?.profilePhoto || targetProfile?.image || '/assets/logo-heart.jpg'
      },
      lists: listNames,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Error updating user lists:', err);
    throw err;
  }
};

export const subscribeToTargetUserLists = (currentUid, targetUid, callback) => {
  if (!currentUid || !targetUid) {
    callback([]);
    return () => {};
  }
  const listRef = doc(db, 'users', currentUid, 'userLists', targetUid);
  return onSnapshot(listRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data().lists || []);
    } else {
      callback([]);
    }
  }, (err) => {
    console.warn('Error subscribing to target user lists:', err);
    callback([]);
  });
};

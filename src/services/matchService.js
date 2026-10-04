import { db } from '../firebase/firebaseConfig';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { getOrCreateChat } from './chatService';

export const getMatchId = (uidA, uidB) => {
  return [uidA, uidB].sort().join('_');
};

export const createMatch = async (user1, user2) => {
  const uid1 = user1.uid || user1.id;
  const uid2 = user2.uid || user2.id;
  const matchId = getMatchId(uid1, uid2);
  const matchRef = doc(db, 'matches', matchId);

  const matchData = {
    matchId,
    userIds: [uid1, uid2],
    user1: {
      uid: uid1,
      displayName: user1.displayName || 'HeartSync Member',
      profilePhoto: user1.profilePhoto || '/assets/logo-heart.jpg',
      city: user1.city || ''
    },
    user2: {
      uid: uid2,
      displayName: user2.displayName || 'HeartSync Member',
      profilePhoto: user2.profilePhoto || '/assets/logo-heart.jpg',
      city: user2.city || ''
    },
    createdAt: serverTimestamp(),
    matchedAt: new Date().toISOString(),
    isActive: true
  };

  await setDoc(matchRef, matchData, { merge: true });

  // Pre-initialize chat thread for the matched pair
  try {
    await getOrCreateChat(uid1, uid2);
  } catch (e) {
    console.warn('Could not auto-create chat for match:', e);
  }

  return matchData;
};

export const getUserMatches = async (currentUid) => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('userIds', 'array-contains', currentUid));
    const snap = await getDocs(q);
    const matches = [];
    snap.forEach(d => matches.push({ id: d.id, ...d.data() }));
    return matches;
  } catch (error) {
    console.error('Error getting user matches:', error);
    return [];
  }
};

export const subscribeToUserMatches = (currentUid, callback) => {
  const matchesRef = collection(db, 'matches');
  const q = query(matchesRef, where('userIds', 'array-contains', currentUid));
  return onSnapshot(q, (snapshot) => {
    const matches = [];
    snapshot.forEach(d => matches.push({ id: d.id, ...d.data() }));
    callback(matches);
  }, (error) => {
    console.error('Match subscription error:', error);
  });
};

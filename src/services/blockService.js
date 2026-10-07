import { db } from '../firebase/firebaseConfig';
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export const blockUser = async (currentUid, targetUid, targetProfile = {}) => {
  if (!currentUid || !targetUid || currentUid === targetUid) return;

  const blockDocId = `${currentUid}_${targetUid}`;
  const blockRef = doc(db, 'blocks', blockDocId);

  await setDoc(blockRef, {
    blockerId: currentUid,
    blockedId: targetUid,
    blockedUser: {
      uid: targetUid,
      displayName: targetProfile.displayName || targetProfile.name || 'User',
      profilePhoto: targetProfile.profilePhoto || targetProfile.image || '/assets/logo-heart.jpg'
    },
    createdAt: serverTimestamp()
  });

  // Automatically remove any existing like documents between them
  try {
    const like1Ref = doc(db, 'likes', `${currentUid}_${targetUid}`);
    const like2Ref = doc(db, 'likes', `${targetUid}_${currentUid}`);
    await Promise.all([deleteDoc(like1Ref).catch(() => {}), deleteDoc(like2Ref).catch(() => {})]);
  } catch (e) {
    console.warn('Could not clean up likes during block:', e);
  }

  // Automatically remove any match document between them
  try {
    const matchId = [currentUid, targetUid].sort().join('_');
    const matchRef = doc(db, 'matches', matchId);
    await deleteDoc(matchRef).catch(() => {});
  } catch (e) {
    console.warn('Could not clean up match during block:', e);
  }
};

export const unblockUser = async (currentUid, targetUid) => {
  if (!currentUid || !targetUid) return;
  const blockDocId = `${currentUid}_${targetUid}`;
  const blockRef = doc(db, 'blocks', blockDocId);
  await deleteDoc(blockRef);
};

export const getBlockedUserIds = async (currentUid) => {
  if (!currentUid) return [];
  try {
    const blocksRef = collection(db, 'blocks');
    const [snap1, snap2] = await Promise.all([
      getDocs(query(blocksRef, where('blockerId', '==', currentUid))),
      getDocs(query(blocksRef, where('blockedId', '==', currentUid)))
    ]);
    const blocked = new Set();
    snap1.forEach(d => {
      const data = d.data();
      if (data.blockedId) blocked.add(data.blockedId);
    });
    snap2.forEach(d => {
      const data = d.data();
      if (data.blockerId) blocked.add(data.blockerId);
    });
    return Array.from(blocked);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }
};

export const subscribeToBlockedUsers = (currentUid, callback) => {
  if (!currentUid) {
    callback([]);
    return () => {};
  }
  const blocksRef = collection(db, 'blocks');
  const q = query(blocksRef, where('blockerId', '==', currentUid));
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to blocked users:', err);
    callback([]);
  });
};

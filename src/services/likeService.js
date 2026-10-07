import { db } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { createMatch } from './matchService';
import { createNotification } from './notificationService';
import { getUserProfile } from './userService';

export const sendLike = async (fromUser, toUser) => {
  const fromUserId = typeof fromUser === 'string' ? fromUser : (fromUser.uid || fromUser.id);
  const toUserId = typeof toUser === 'string' ? toUser : (toUser.uid || toUser.id);

  if (!fromUserId || !toUserId || fromUserId === toUserId) {
    return { isMatch: false, alreadyLiked: true };
  }

  const likeDocId = `${fromUserId}_${toUserId}`;
  const likeRef = doc(db, 'likes', likeDocId);

  // Check if like already exists
  const existingSnap = await getDoc(likeRef);
  if (existingSnap.exists()) {
    const reciprocalDocId = `${toUserId}_${fromUserId}`;
    const reciprocalRef = doc(db, 'likes', reciprocalDocId);
    const reciprocalSnap = await getDoc(reciprocalRef);
    if (reciprocalSnap.exists()) {
      const fromProfile = typeof fromUser === 'object' ? fromUser : await getUserProfile(fromUserId);
      const toProfile = typeof toUser === 'object' ? toUser : await getUserProfile(toUserId);
      const matchData = await createMatch(fromProfile || { uid: fromUserId }, toProfile || { uid: toUserId });
      return { isMatch: true, matchData, alreadyLiked: true };
    }
    return { isMatch: false, alreadyLiked: true };
  }

  // Create like document
  await setDoc(likeRef, {
    fromUserId,
    toUserId,
    createdAt: serverTimestamp()
  });

  // Notify the target user
  try {
    const senderProfile = typeof fromUser === 'object' && fromUser.displayName ? fromUser : await getUserProfile(fromUserId);
    await createNotification({
      userId: toUserId,
      type: 'like',
      title: 'New Like! ❤️',
      message: `${senderProfile?.displayName || 'Someone'} liked your profile!`,
      senderId: fromUserId
    });
  } catch (e) {
    console.warn('Could not send like notification:', e);
  }

  // Check for reciprocal like
  const reciprocalDocId = `${toUserId}_${fromUserId}`;
  const reciprocalRef = doc(db, 'likes', reciprocalDocId);
  const reciprocalSnap = await getDoc(reciprocalRef);

  let isMatch = false;
  let matchData = null;

  // Mutual match if reciprocal like exists in Firestore,
  // or if toUserId is one of the incoming likers in demo (seed_aditya28, seed_ryan_kapoor)
  const isIncomingSeed = toUserId === 'seed_aditya28' || toUserId === 'seed_ryan_kapoor';

  if (reciprocalSnap.exists() || isIncomingSeed) {
    // Both users liked each other! Create match!
    const fromProfile = typeof fromUser === 'object' ? fromUser : await getUserProfile(fromUserId);
    const toProfile = typeof toUser === 'object' ? toUser : await getUserProfile(toUserId);

    if (!reciprocalSnap.exists() && isIncomingSeed) {
      try {
        await setDoc(reciprocalRef, {
          fromUserId: toUserId,
          toUserId: fromUserId,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('Could not write seed reciprocal like:', e);
      }
    }

    matchData = await createMatch(fromProfile || { uid: fromUserId }, toProfile || { uid: toUserId });
    isMatch = true;

    // Send Match notifications
    try {
      await createNotification({
        userId: toUserId,
        type: 'match',
        title: "It's a Match! 🎉",
        message: `You and ${fromProfile?.displayName || 'someone'} matched! Say hello!`,
        senderId: fromUserId
      });
      await createNotification({
        userId: fromUserId,
        type: 'match',
        title: "It's a Match! 🎉",
        message: `You and ${toProfile?.displayName || 'someone'} matched! Say hello!`,
        senderId: toUserId
      });
    } catch (e) {
      console.warn('Could not send match notification:', e);
    }
  }

  return { isMatch, matchData, alreadyLiked: false };
};

export const getLikesGiven = async (currentUid) => {
  try {
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('fromUserId', '==', currentUid));
    const snap = await getDocs(q);
    const targetUserIds = [];
    snap.forEach(d => targetUserIds.push(d.data().toUserId));
    return targetUserIds;
  } catch (error) {
    console.error('Error fetching likes given:', error);
    return [];
  }
};

export const getLikesReceived = async (currentUid) => {
  try {
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('toUserId', '==', currentUid));
    const snap = await getDocs(q);
    const fromUserIds = [];
    snap.forEach(d => fromUserIds.push(d.data().fromUserId));
    return fromUserIds;
  } catch (error) {
    console.error('Error fetching likes received:', error);
    return [];
  }
};

export const passUser = async (fromUserId, toUserId) => {
  // Pass action can optionally record a pass or simply be client-side swipe pass
  return { passed: true };
};

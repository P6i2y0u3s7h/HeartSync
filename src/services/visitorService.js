import { db } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore';

export const recordProfileView = async (viewerUser, viewedUserId) => {
  const viewerUid = viewerUser?.uid || viewerUser?.id;
  if (!viewerUid || !viewedUserId || viewerUid === viewedUserId) return;

  // Use date-bucketed id to avoid multiple duplicate records on same day
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const viewDocId = `${viewerUid}_${viewedUserId}_${todayDateStr}`;
  const viewRef = doc(db, 'profile_views', viewDocId);

  try {
    await setDoc(viewRef, {
      viewerId: viewerUid,
      viewedUserId,
      viewerName: viewerUser.displayName || viewerUser.name || 'Someone',
      viewerPhoto: viewerUser.profilePhoto || viewerUser.image || '/assets/logo-heart.jpg',
      viewerCity: viewerUser.city || '',
      viewerAge: viewerUser.age || 24,
      viewedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not record profile view:', err);
  }
};

export const getProfileVisitors = async (currentUid, blockedUserIds = []) => {
  if (!currentUid) return [];
  try {
    const viewsRef = collection(db, 'profile_views');
    const q = query(
      viewsRef,
      where('viewedUserId', '==', currentUid),
      limit(25)
    );
    const snap = await getDocs(q);
    const visitors = [];
    const blockedSet = new Set(blockedUserIds);

    snap.forEach((d) => {
      const data = d.data();
      if (!blockedSet.has(data.viewerId)) {
        visitors.push({ id: d.id, ...data });
      }
    });

    // Sort descending by viewedAt
    visitors.sort((a, b) => new Date(b.viewedAt || 0) - new Date(a.viewedAt || 0));
    return visitors;
  } catch (error) {
    console.warn('Error getting profile visitors:', error);
    return [];
  }
};

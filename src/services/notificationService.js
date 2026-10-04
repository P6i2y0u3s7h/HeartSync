import { db } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

export const createNotification = async ({ userId, type, title, message, senderId }) => {
  if (!userId) return;
  try {
    const notifsRef = collection(db, 'notifications');
    return await addDoc(notifsRef, {
      userId,
      type: type || 'system',
      title: title || 'Notification',
      message: message || '',
      senderId: senderId || '',
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};

  const notifsRef = collection(db, 'notifications');
  const q = query(notifsRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const notifs = [];
    snapshot.forEach(d => notifs.push({ id: d.id, ...d.data() }));
    // Client-side sort descending by createdAt
    notifs.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    callback(notifs);
  }, (error) => {
    console.error('Notification subscription error:', error);
  });
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { isRead: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, where('userId', '==', userId), where('isRead', '==', false));
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

import { db } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { initialProfiles } from '../data/seedData';

export const sendMessage = async (chatId, { senderId, receiverId, message, type = 'text', imageUrl = '' }) => {
  if (!chatId || !senderId) throw new Error('Missing chatId or senderId');

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messageData = {
    senderId,
    receiverId: receiverId || '',
    message,
    type,
    imageUrl: imageUrl || '',
    isRead: false,
    createdAt: serverTimestamp()
  };

  const newDocRef = await addDoc(messagesRef, messageData);

  // Compute participants for the conversation record
  const participants = [senderId];
  if (receiverId && !participants.includes(receiverId)) {
    participants.push(receiverId);
  }
  if (participants.length < 2 && chatId) {
    if (chatId.startsWith(senderId + '_')) {
      const other = chatId.substring((senderId + '_').length);
      if (other && !participants.includes(other)) participants.push(other);
    } else if (chatId.endsWith('_' + senderId)) {
      const other = chatId.substring(0, chatId.length - ('_' + senderId).length);
      if (other && !participants.includes(other)) participants.push(other);
    } else if (chatId.startsWith('chat_')) {
      const seedName = chatId.replace('chat_', '');
      const seed = initialProfiles.find(
        p => p.username === seedName || p.uid.includes(seedName) || p.firstName?.toLowerCase() === seedName.toLowerCase()
      );
      if (seed && !participants.includes(seed.uid)) participants.push(seed.uid);
    }
  }

  // Update or create chat document
  const chatRef = doc(db, 'chats', chatId);
  let existingData = {};
  try {
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      existingData = chatSnap.data();
    }
  } catch (err) {
    console.warn('Could not read existing chat doc:', err);
  }

  const allParticipants = Array.from(new Set([
    ...(existingData.participants || []),
    ...participants
  ]));

  const existingUnread = existingData.unreadCounts || {};
  const currentUnreadForReceiver = receiverId ? (existingUnread[receiverId] || 0) : 0;
  const newUnreadCounts = {
    ...existingUnread,
    [senderId]: 0
  };
  if (receiverId) {
    newUnreadCounts[receiverId] = currentUnreadForReceiver + 1;
  }

  const previewText = type === 'image' ? '📷 Photo' : (type === 'emoji' ? message : message);
  const nowIso = new Date().toISOString();

  await setDoc(chatRef, {
    chatId,
    participants: allParticipants,
    lastMessage: previewText,
    lastMessageAt: nowIso,
    lastSenderId: senderId,
    unreadCounts: newUnreadCounts,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return { id: newDocRef.id, ...messageData };
};

export const subscribeToMessages = (chatId, callback) => {
  if (!chatId) return () => {};

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((d) => {
      messages.push({ id: d.id, ...d.data() });
    });
    callback(messages);
  }, (error) => {
    console.error('Messages subscription error:', error);
  });
};

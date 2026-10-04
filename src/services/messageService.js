import { db } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

export const sendMessage = async (chatId, { senderId, receiverId, message, type = 'text', imageUrl = '' }) => {
  if (!chatId || !senderId) throw new Error('Missing chatId or senderId');

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messageData = {
    senderId,
    receiverId,
    message,
    type,
    imageUrl: imageUrl || '',
    isRead: false,
    createdAt: serverTimestamp()
  };

  const newDocRef = await addDoc(messagesRef, messageData);

  // Update chat document lastMessage
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(chatRef, {
    lastMessage: type === 'image' ? '📷 Photo' : (type === 'emoji' ? message : message),
    lastMessageAt: new Date().toISOString(),
    lastSenderId: senderId,
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

import { db } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export const getDeterministicChatId = (uidA, uidB) => {
  return [uidA, uidB].sort().join('_');
};

export const getOrCreateChat = async (uidA, uidB) => {
  const chatId = getDeterministicChatId(uidA, uidB);
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    const newChat = {
      chatId,
      participants: [uidA, uidB],
      lastMessage: 'Started a new conversation',
      lastMessageAt: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    await setDoc(chatRef, newChat);
    return newChat;
  }
  return { id: chatSnap.id, ...chatSnap.data() };
};

export const subscribeToUserChats = (currentUid, callback) => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', currentUid));
  
  return onSnapshot(q, (snapshot) => {
    const chats = [];
    snapshot.forEach(d => {
      chats.push({ id: d.id, ...d.data() });
    });
    // Sort client-side by lastMessageAt descending
    chats.sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || 0).getTime();
      return timeB - timeA;
    });
    callback(chats);
  }, (error) => {
    console.error('Chats subscription error:', error);
  });
};

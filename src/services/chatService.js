import { db } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { initialProfiles } from '../data/seedData';

export const getDeterministicChatId = (uidA, uidB) => {
  const a = String(uidA || 'userA');
  const b = String(uidB || 'userB');
  return [a, b].sort().join('_');
};
export const extractOtherUid = (chatId, currentUid) => {
  if (!chatId) return '';
  const currentStr = String(currentUid || '');
  if (currentStr) {
    if (chatId.startsWith(currentStr + '_')) {
      return chatId.substring((currentStr + '_').length);
    }
    if (chatId.endsWith('_' + currentStr)) {
      return chatId.substring(0, chatId.length - ('_' + currentStr).length);
    }
  }
  if (chatId.startsWith('chat_')) {
    const raw = chatId.replace('chat_', '');
    const seed = initialProfiles.find(
      p => p.uid === raw || p.username === raw || p.firstName?.toLowerCase() === raw.toLowerCase()
    );
    if (seed) return seed.uid;
    return raw;
  }
  const matchedSeed = initialProfiles.find(p => chatId.includes(p.uid));
  if (matchedSeed && matchedSeed.uid !== currentStr) {
    return matchedSeed.uid;
  }
  const parts = chatId.split('_');
  return parts.find(id => id !== currentStr) || parts[0];
};

export const formatChatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return typeof timestamp === 'string' ? timestamp : '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const getOrCreateChat = async (uidA, uidB) => {
  const chatId = getDeterministicChatId(uidA, uidB);
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    const newChat = {
      chatId,
      participants: [uidA, uidB],
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      unreadCounts: { [uidA]: 0, [uidB]: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(chatRef, newChat);
    return { id: chatId, ...newChat };
  }
  return { id: chatSnap.id, ...chatSnap.data() };
};

export const markChatAsRead = async (chatId, currentUid) => {
  if (!chatId || !currentUid) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) return;

    const existing = chatSnap.data();
    const unreadCounts = { ...(existing.unreadCounts || {}) };
    unreadCounts[currentUid] = 0;

    await setDoc(chatRef, {
      unreadCounts
    }, { merge: true });
  } catch (err) {
    console.warn('Error marking chat as read:', err);
  }
};

export const subscribeToUserChats = (currentUid, callback) => {
  if (!currentUid) {
    callback([]);
    return () => {};
  }

  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', currentUid));

  return onSnapshot(q, (snapshot) => {
    const chats = [];
    snapshot.forEach(d => {
      chats.push({ id: d.id, ...d.data() });
    });
    // Sort client-side by lastMessageAt descending
    chats.sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.updatedAt?.toDate?.() || 0).getTime();
      const timeB = new Date(b.lastMessageAt || b.updatedAt?.toDate?.() || 0).getTime();
      return timeB - timeA;
    });
    callback(chats);
  }, (error) => {
    console.error('Chats subscription error:', error);
    callback([]);
  });
};

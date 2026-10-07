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

export const clearChat = async (chatId, currentUid) => {
  if (!chatId || !currentUid) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    const nowIso = new Date().toISOString();
    const otherUid = extractOtherUid(chatId, currentUid);
    const participants = otherUid ? [currentUid, otherUid] : [currentUid];
    await setDoc(chatRef, {
      clearedAt: {
        [currentUid]: nowIso
      },
      [`clearedAt.${currentUid}`]: nowIso,
      participants
    }, { merge: true });
  } catch (err) {
    console.error('Error clearing chat:', err);
    throw err;
  }
};

export const deleteChat = async (chatId, currentUid) => {
  if (!chatId || !currentUid) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    const nowIso = new Date().toISOString();
    const otherUid = extractOtherUid(chatId, currentUid);
    const participants = otherUid ? [currentUid, otherUid] : [currentUid];

    let allParticipants = participants;
    let existingDeletedBy = {};
    let existingClearedAt = {};

    try {
      const snap = await getDoc(chatRef);
      if (snap.exists()) {
        const existingData = snap.data();
        allParticipants = Array.from(new Set([
          ...(existingData.participants || []),
          ...participants
        ]));
        existingDeletedBy = existingData.deletedBy || {};
        existingClearedAt = existingData.clearedAt || {};
      }
    } catch (e) {
      console.warn('Could not read existing chat doc before deletion:', e);
    }

    await setDoc(chatRef, {
      deletedBy: {
        ...existingDeletedBy,
        [currentUid]: nowIso
      },
      clearedAt: {
        ...existingClearedAt,
        [currentUid]: nowIso
      },
      [`deletedBy.${currentUid}`]: nowIso,
      [`clearedAt.${currentUid}`]: nowIso,
      participants: allParticipants
    }, { merge: true });
  } catch (err) {
    console.error('Error deleting chat:', err);
    throw err;
  }
};

export const setDisappearingMessages = async (chatId, durationInSeconds, currentUid) => {
  if (!chatId) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    const otherUid = currentUid ? extractOtherUid(chatId, currentUid) : '';
    const participants = currentUid && otherUid ? [currentUid, otherUid] : (currentUid ? [currentUid] : []);
    const payload = {
      disappearingDuration: Number(durationInSeconds || 0)
    };
    if (participants.length > 0) {
      payload.participants = participants;
    }
    await setDoc(chatRef, payload, { merge: true });
  } catch (err) {
    console.error('Error setting disappearing messages:', err);
    throw err;
  }
};

export const subscribeToChatDoc = (chatId, callback) => {
  if (!chatId) return () => {};
  const chatRef = doc(db, 'chats', chatId);
  return onSnapshot(chatRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('Error subscribing to chat doc:', err);
  });
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
      const data = d.data();
      const deletedVal = (data.deletedBy && data.deletedBy[currentUid]) || data[`deletedBy.${currentUid}`];
      if (deletedVal) {
        let deletedTime = 0;
        if (typeof deletedVal === 'number') {
          deletedTime = deletedVal;
        } else if (typeof deletedVal === 'string') {
          deletedTime = new Date(deletedVal).getTime();
        } else if (deletedVal?.toDate) {
          deletedTime = deletedVal.toDate().getTime();
        } else if (deletedVal?.seconds) {
          deletedTime = deletedVal.seconds * 1000;
        } else if (deletedVal === true) {
          deletedTime = Date.now();
        }

        let lastMsgTime = 0;
        const rawMsgTime = data.lastMessageAt || data.updatedAt;
        if (rawMsgTime) {
          if (typeof rawMsgTime === 'number') {
            lastMsgTime = rawMsgTime;
          } else if (typeof rawMsgTime === 'string') {
            lastMsgTime = new Date(rawMsgTime).getTime();
          } else if (rawMsgTime?.toDate) {
            lastMsgTime = rawMsgTime.toDate().getTime();
          } else if (rawMsgTime?.seconds) {
            lastMsgTime = rawMsgTime.seconds * 1000;
          }
        }

        // If chat was deleted by current user and no new message arrived after deletion, hide it
        if (!lastMsgTime || isNaN(lastMsgTime) || (deletedTime && !isNaN(deletedTime) && lastMsgTime <= deletedTime)) {
          return;
        }
      }
      chats.push({ id: d.id, ...data });
    });
    // Sort client-side by lastMessageAt descending
    chats.sort((a, b) => {
      const getMs = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return new Date(val).getTime() || 0;
        if (val?.toDate) return val.toDate().getTime() || 0;
        if (val?.seconds) return val.seconds * 1000;
        return 0;
      };
      const timeA = getMs(a.lastMessageAt) || getMs(a.updatedAt);
      const timeB = getMs(b.lastMessageAt) || getMs(b.updatedAt);
      return timeB - timeA;
    });
    callback(chats);
  }, (error) => {
    console.error('Chats subscription error:', error);
    callback([]);
  });
};

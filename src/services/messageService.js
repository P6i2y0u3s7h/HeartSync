import { db } from '../firebase/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  where,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { initialProfiles } from '../data/seedData';

export const sendMessage = async (chatId, { senderId, receiverId, message, type = 'text', imageUrl = '' }) => {
  if (!chatId || !senderId) throw new Error('Missing chatId or senderId');

  // Check chat settings for disappearing messages duration
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

  // If disappearing messages enabled, set expiration timestamp
  const durationSec = Number(existingData.disappearingDuration || 0);
  if (durationSec > 0) {
    messageData.expiresAt = Date.now() + (durationSec * 1000);
  }

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

  // If sender previously deleted the chat, restore visibility for them on sending a new message
  const updatedDeletedBy = { ...(existingData.deletedBy || {}) };
  if (updatedDeletedBy[senderId]) {
    delete updatedDeletedBy[senderId];
  }

  await setDoc(chatRef, {
    chatId,
    participants: allParticipants,
    lastMessage: previewText,
    lastMessageAt: nowIso,
    lastSenderId: senderId,
    unreadCounts: newUnreadCounts,
    deletedBy: updatedDeletedBy,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return { id: newDocRef.id, ...messageData };
};

export const subscribeToMessages = (chatId, currentUid, callback) => {
  if (!chatId) return () => {};

  // If called without currentUid (legacy signature fallback)
  if (typeof currentUid === 'function') {
    const cb = currentUid;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((d) => {
        messages.push({ id: d.id, ...d.data() });
      });
      cb(messages);
    });
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  // Also subscribe to chat doc to reactively reflect clearedAt
  const chatRef = doc(db, 'chats', chatId);
  let clearedAtTime = 0;

  const unsubChat = onSnapshot(chatRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const clearedVal = (data.clearedAt && data.clearedAt[currentUid]) || data[`clearedAt.${currentUid}`];
      if (clearedVal) {
        if (typeof clearedVal === 'number') {
          clearedAtTime = clearedVal;
        } else if (typeof clearedVal === 'string') {
          clearedAtTime = new Date(clearedVal).getTime();
        } else if (clearedVal?.toDate) {
          clearedAtTime = clearedVal.toDate().getTime();
        } else if (clearedVal?.seconds) {
          clearedAtTime = clearedVal.seconds * 1000;
        }
      }
    }
  }, () => {});

  const unsubMessages = onSnapshot(q, (snapshot) => {
    const rawMessages = [];
    const now = Date.now();

    snapshot.forEach((d) => {
      const data = d.data();
      // 1. Filter out if hidden/deleted for current user
      if (currentUid && data.deletedFor?.[currentUid] === true) {
        return;
      }

      // 2. Filter out if created before clearedAt timestamp
      if (clearedAtTime > 0) {
        const msgTime = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : 0;
        if (msgTime > 0 && msgTime <= clearedAtTime) {
          return;
        }
      }

      // 3. Filter out if expired (disappearing messages)
      if (data.expiresAt && data.expiresAt < now) {
        return;
      }

      rawMessages.push({ id: d.id, ...data });
    });

    callback(rawMessages);
  }, (error) => {
    console.error('Messages subscription error:', error);
  });

  return () => {
    unsubChat();
    unsubMessages();
  };
};

export const deleteMessageForMe = async (chatId, messageId, currentUid) => {
  if (!chatId || !messageId || !currentUid) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(msgRef, {
      [`deletedFor.${currentUid}`]: true
    });
  } catch (err) {
    console.error('Error deleting message for me:', err);
    throw err;
  }
};

export const deleteMessageForEveryone = async (chatId, messageId, currentUid) => {
  if (!chatId || !messageId || !currentUid) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.senderId !== currentUid) {
      throw new Error('Only the sender can delete a message for everyone.');
    }

    await updateDoc(msgRef, {
      isDeletedForEveryone: true,
      message: 'This message was deleted.',
      imageUrl: '',
      type: 'text'
    });
  } catch (err) {
    console.error('Error deleting message for everyone:', err);
    throw err;
  }
};

export const toggleStarMessage = async (chatId, messageId, currentUid) => {
  if (!chatId || !messageId || !currentUid) return false;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return false;

    const data = snap.data();
    const currentStars = data.starredBy || {};
    const isStarred = !!currentStars[currentUid];

    await updateDoc(msgRef, {
      [`starredBy.${currentUid}`]: !isStarred
    });

    return !isStarred;
  } catch (err) {
    console.error('Error toggling star message:', err);
    throw err;
  }
};

export const reactToMessage = async (chatId, messageId, emoji, currentUid) => {
  if (!chatId || !messageId || !currentUid) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const currentReactions = { ...(data.reactions || {}) };

    if (currentReactions[currentUid] === emoji) {
      delete currentReactions[currentUid]; // Toggle off
    } else {
      currentReactions[currentUid] = emoji;
    }

    await updateDoc(msgRef, { reactions: currentReactions });
  } catch (err) {
    console.warn('Error updating message reaction:', err);
  }
};

export const setTypingStatus = async (chatId, currentUid, isTyping) => {
  if (!chatId || !currentUid) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      [`typing.${currentUid}`]: isTyping ? Date.now() : 0
    }, { merge: true });
  } catch (err) {
    // Fail silently
  }
};

export const subscribeToTypingStatus = (chatId, currentUid, callback) => {
  if (!chatId || !currentUid) return () => {};
  const chatRef = doc(db, 'chats', chatId);
  return onSnapshot(chatRef, (snap) => {
    if (!snap.exists()) {
      callback(false);
      return;
    }
    const data = snap.data();
    const typingMap = data.typing || {};
    const now = Date.now();
    let isOtherTyping = false;

    Object.keys(typingMap).forEach(uid => {
      if (uid !== currentUid) {
        const timestamp = typingMap[uid];
        if (timestamp && (now - timestamp) < 4000) {
          isOtherTyping = true;
        }
      }
    });
    callback(isOtherTyping);
  }, () => {
    callback(false);
  });
};

export const markMessagesInChatAsRead = async (chatId, currentUid) => {
  if (!chatId || !currentUid) return;
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('receiverId', '==', currentUid), where('isRead', '==', false));
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(updates);
  } catch (err) {
    console.warn('Error marking messages as read in chat:', err);
  }
};

// Legacy alias for compatibility
export const deleteMessage = async (chatId, messageId) => {
  if (!chatId || !messageId) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(msgRef);
  } catch (err) {
    console.error('Error deleting message:', err);
    throw err;
  }
};

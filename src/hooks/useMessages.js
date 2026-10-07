import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToMessages,
  sendMessage,
  deleteMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  toggleStarMessage,
  reactToMessage,
  markMessagesInChatAsRead
} from '../services/messageService';
import { uploadChatImage } from '../services/storageService';
import { markChatAsRead, extractOtherUid } from '../services/chatService';
import { initialProfiles } from '../data/seedData';

export const useMessages = (chatId, receiverId) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Resolved other user ID
  const resolvedReceiverId = receiverId || extractOtherUid(chatId, currentUser?.uid);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time messages filtered by user and disappearing expiration
    const unsubscribe = subscribeToMessages(chatId, currentUser?.uid, (newMessages) => {
      // If legacy demo chat_aditya with no messages in Firestore, fallback to sample messages
      if (newMessages.length === 0 && chatId === 'chat_aditya') {
        const sampleMessages = [
          {
            id: 'ref_m1',
            senderId: resolvedReceiverId || 'seed_aditya28',
            receiverId: currentUser?.uid || 'current_user',
            message: 'Hello, How are you?',
            type: 'text',
            createdAt: { toDate: () => new Date(Date.now() - 3600000) }
          },
          {
            id: 'ref_m2',
            senderId: currentUser?.uid || 'current_user',
            receiverId: resolvedReceiverId || 'seed_aditya28',
            message: "I'm good, thanks for asking!",
            type: 'text',
            createdAt: { toDate: () => new Date(Date.now() - 2400000) }
          },
          {
            id: 'ref_m3',
            senderId: currentUser?.uid || 'current_user',
            receiverId: resolvedReceiverId || 'seed_aditya28',
            message: 'How about you',
            type: 'text',
            createdAt: { toDate: () => new Date(Date.now() - 1800000) }
          },
          {
            id: 'ref_m4',
            senderId: resolvedReceiverId || 'seed_aditya28',
            receiverId: currentUser?.uid || 'current_user',
            message: 'Good ❤️',
            type: 'text',
            createdAt: { toDate: () => new Date(Date.now() - 1200000) }
          },
          {
            id: 'ref_m5',
            senderId: resolvedReceiverId || 'seed_aditya28',
            receiverId: currentUser?.uid || 'current_user',
            message: 'How is your day ?',
            type: 'text',
            createdAt: { toDate: () => new Date(Date.now() - 600000) }
          }
        ];
        setMessages(sampleMessages);
      } else {
        setMessages(newMessages);
      }
      setLoading(false);
    });

    // Mark conversation and individual messages as read when opened
    if (chatId && currentUser?.uid) {
      markChatAsRead(chatId, currentUser.uid);
      markMessagesInChatAsRead(chatId, currentUser.uid);
    }

    return () => unsubscribe();
  }, [chatId, resolvedReceiverId, currentUser?.uid]);

  // Helper to trigger automated reply for seed profiles (like Aditya)
  const triggerAutoReplyIfApplicable = (userMessage) => {
    if (!resolvedReceiverId || !currentUser?.uid || !chatId) return;
    const seed = initialProfiles.find(
      p => p.uid === resolvedReceiverId || p.username === resolvedReceiverId || p.firstName?.toLowerCase() === resolvedReceiverId?.toLowerCase()
    );
    if (!seed) return;

    setTimeout(async () => {
      try {
        const lower = (userMessage || '').toLowerCase();
        let reply = "Hey! Great to hear from you 😊";
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
          reply = "Hello! How are you doing today? 😊";
        } else if (lower.includes('how are you') || lower.includes('how r u')) {
          reply = "I'm doing great, thanks for asking! How about you?";
        } else if (lower.includes('day') || lower.includes('good')) {
          reply = "Glad to hear that! Are you having a busy week? ✨";
        }

        await sendMessage(chatId, {
          senderId: seed.uid,
          receiverId: currentUser.uid,
          message: reply,
          type: 'text'
        });
      } catch (err) {
        console.warn('Auto reply error:', err);
      }
    }, 2800);
  };

  // Expose manual test helper on window
  if (typeof window !== 'undefined') {
    window.simulateIncomingMessage = async (customText = "Hey! This is a test message from Aditya.") => {
      if (!chatId || !currentUser?.uid) {
        console.error('Cannot simulate message: missing chatId or currentUser');
        return;
      }
      const targetSender = resolvedReceiverId || 'seed_aditya28';
      await sendMessage(chatId, {
        senderId: targetSender,
        receiverId: currentUser.uid,
        message: customText,
        type: 'text'
      });
      console.log('Simulated incoming message sent:', customText);
    };
  }

  const sendTextMessage = async (text) => {
    if (!text || !text.trim() || sending) return;
    setSending(true);

    const targetReceiver = resolvedReceiverId || 'other_user';
    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: currentUser?.uid || 'current_user',
      receiverId: targetReceiver,
      message: text.trim(),
      type: 'text',
      createdAt: { toDate: () => new Date() }
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await sendMessage(chatId, {
        senderId: currentUser?.uid || 'current_user',
        receiverId: targetReceiver,
        message: text.trim(),
        type: 'text'
      });

      triggerAutoReplyIfApplicable(text.trim());
    } catch (e) {
      console.warn('Firestore message send fallback:', e);
    } finally {
      setSending(false);
    }
  };

  const sendEmojiMessage = async (emoji) => {
    if (!emoji || sending) return;
    setSending(true);

    const targetReceiver = resolvedReceiverId || 'other_user';
    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: currentUser?.uid || 'current_user',
      receiverId: targetReceiver,
      message: emoji,
      type: 'emoji',
      createdAt: { toDate: () => new Date() }
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await sendMessage(chatId, {
        senderId: currentUser?.uid || 'current_user',
        receiverId: targetReceiver,
        message: emoji,
        type: 'emoji'
      });

      triggerAutoReplyIfApplicable(emoji);
    } catch (e) {
      console.warn('Firestore emoji send fallback:', e);
    } finally {
      setSending(false);
    }
  };

  const sendImageAttachment = async (file) => {
    if (!file || sending) return;
    setSending(true);
    const messageId = `msg_${Date.now()}`;
    const targetReceiver = resolvedReceiverId || 'other_user';

    try {
      const downloadURL = await uploadChatImage(chatId, messageId, file);
      const tempMessage = {
        id: messageId,
        senderId: currentUser?.uid || 'current_user',
        receiverId: targetReceiver,
        message: '📷 Photo',
        type: 'image',
        imageUrl: downloadURL,
        createdAt: { toDate: () => new Date() }
      };
      setMessages(prev => [...prev, tempMessage]);

      await sendMessage(chatId, {
        senderId: currentUser?.uid || 'current_user',
        receiverId: targetReceiver,
        message: '📷 Photo',
        type: 'image',
        imageUrl: downloadURL
      });
    } catch (e) {
      console.error('Error sending image:', e);
    } finally {
      setSending(false);
    }
  };

  const deleteMessageById = async (messageId) => {
    if (!chatId || !messageId) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await deleteMessage(chatId, messageId);
    } catch (err) {
      console.warn('Failed to delete message in firestore:', err);
    }
  };

  const deleteForMe = async (messageId) => {
    if (!chatId || !messageId || !currentUser?.uid) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await deleteMessageForMe(chatId, messageId, currentUser.uid);
    } catch (err) {
      console.warn('Failed to delete message for me:', err);
    }
  };

  const deleteForEveryone = async (messageId) => {
    if (!chatId || !messageId || !currentUser?.uid) return;
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, isDeletedForEveryone: true, message: 'This message was deleted.', imageUrl: '' };
      }
      return m;
    }));
    try {
      await deleteMessageForEveryone(chatId, messageId, currentUser.uid);
    } catch (err) {
      console.warn('Failed to delete message for everyone:', err);
    }
  };

  const deleteMultiple = async (messageIds, type = 'forMe') => {
    if (!chatId || !messageIds || messageIds.length === 0 || !currentUser?.uid) return;
    if (type === 'forMe') {
      setMessages(prev => prev.filter(m => !messageIds.includes(m.id)));
      for (const id of messageIds) {
        await deleteMessageForMe(chatId, id, currentUser.uid).catch(() => {});
      }
    } else {
      setMessages(prev => prev.map(m => {
        if (messageIds.includes(m.id) && (m.senderId === currentUser.uid || m.senderId === 'current_user')) {
          return { ...m, isDeletedForEveryone: true, message: 'This message was deleted.', imageUrl: '' };
        }
        return m;
      }));
      for (const id of messageIds) {
        await deleteMessageForEveryone(chatId, id, currentUser.uid).catch(() => {});
      }
    }
  };

  const toggleStar = async (messageId) => {
    if (!chatId || !messageId || !currentUser?.uid) return false;
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const currentStars = m.starredBy || {};
        const isStarred = !currentStars[currentUser.uid];
        return { ...m, starredBy: { ...currentStars, [currentUser.uid]: isStarred } };
      }
      return m;
    }));
    try {
      return await toggleStarMessage(chatId, messageId, currentUser.uid);
    } catch (err) {
      console.warn('Failed to star message:', err);
      return false;
    }
  };

  const reactToMessageById = async (messageId, emoji) => {
    if (!chatId || !messageId || !currentUser?.uid) return;
    try {
      await reactToMessage(chatId, messageId, emoji, currentUser.uid);
    } catch (err) {
      console.warn('Failed to react to message:', err);
    }
  };

  return {
    messages,
    loading,
    sending,
    sendTextMessage,
    sendEmojiMessage,
    sendImageAttachment,
    deleteMessageById,
    deleteForMe,
    deleteForEveryone,
    deleteMultiple,
    toggleStar,
    reactToMessageById
  };
};

export default useMessages;

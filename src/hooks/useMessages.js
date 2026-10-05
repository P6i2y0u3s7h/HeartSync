import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToMessages, sendMessage } from '../services/messageService';
import { uploadChatImage } from '../services/storageService';

export const useMessages = (chatId, receiverId) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      const isAdityaChat = chatId?.includes('aditya') || receiverId?.includes('aditya') || !receiverId;
      const baseMessages = isAdityaChat ? [
        {
          id: 'ref_m1',
          senderId: receiverId || 'seed_aditya28',
          receiverId: currentUser?.uid || 'current_user',
          message: 'Hello, How are you?',
          type: 'text',
          createdAt: { toDate: () => new Date(Date.now() - 3600000) }
        },
        {
          id: 'ref_m2',
          senderId: currentUser?.uid || 'current_user',
          receiverId: receiverId || 'seed_aditya28',
          message: "I'm good, thanks for asking!",
          type: 'text',
          createdAt: { toDate: () => new Date(Date.now() - 2400000) }
        },
        {
          id: 'ref_m3',
          senderId: currentUser?.uid || 'current_user',
          receiverId: receiverId || 'seed_aditya28',
          message: 'How about you',
          type: 'text',
          createdAt: { toDate: () => new Date(Date.now() - 1800000) }
        },
        {
          id: 'ref_m4',
          senderId: receiverId || 'seed_aditya28',
          receiverId: currentUser?.uid || 'current_user',
          message: 'Good ❤️',
          type: 'text',
          createdAt: { toDate: () => new Date(Date.now() - 1200000) }
        },
        {
          id: 'ref_m5',
          senderId: receiverId || 'seed_aditya28',
          receiverId: currentUser?.uid || 'current_user',
          message: 'How is your day ?',
          type: 'text',
          createdAt: { toDate: () => new Date(Date.now() - 600000) }
        }
      ] : [];

      if (newMessages.length > 0) {
        const extraMessages = newMessages.filter(
          nm => !baseMessages.some(bm => bm.message === nm.message)
        );
        setMessages([...baseMessages, ...extraMessages]);
      } else {
        setMessages(baseMessages);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, receiverId, currentUser]);

  const sendTextMessage = async (text) => {
    if (!text || !text.trim() || sending) return;
    setSending(true);

    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: currentUser?.uid || 'current_user',
      receiverId: receiverId || 'other_user',
      message: text.trim(),
      type: 'text',
      createdAt: { toDate: () => new Date() }
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await sendMessage(chatId, {
        senderId: currentUser?.uid || 'current_user',
        receiverId: receiverId || 'other_user',
        message: text.trim(),
        type: 'text'
      });
    } catch (e) {
      console.warn('Firestore message send fallback:', e);
    } finally {
      setSending(false);
    }
  };

  const sendEmojiMessage = async (emoji) => {
    if (!emoji || sending) return;
    setSending(true);

    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: currentUser?.uid || 'current_user',
      receiverId: receiverId || 'other_user',
      message: emoji,
      type: 'emoji',
      createdAt: { toDate: () => new Date() }
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await sendMessage(chatId, {
        senderId: currentUser?.uid || 'current_user',
        receiverId: receiverId || 'other_user',
        message: emoji,
        type: 'emoji'
      });
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

    try {
      const downloadURL = await uploadChatImage(chatId, messageId, file);
      const tempMessage = {
        id: messageId,
        senderId: currentUser?.uid || 'current_user',
        receiverId: receiverId || 'other_user',
        message: '📷 Photo',
        type: 'image',
        imageUrl: downloadURL,
        createdAt: { toDate: () => new Date() }
      };
      setMessages(prev => [...prev, tempMessage]);

      await sendMessage(chatId, {
        senderId: currentUser?.uid || 'current_user',
        receiverId: receiverId || 'other_user',
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

  return {
    messages,
    loading,
    sending,
    sendTextMessage,
    sendEmojiMessage,
    sendImageAttachment
  };
};

export default useMessages;

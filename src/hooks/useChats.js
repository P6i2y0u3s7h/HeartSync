import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';

export const useChats = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Active users from seed
    setActiveUsers(initialProfiles.filter(p => p.isOnline));

    if (!currentUser) {
      // Demo chat list
      setChats([
        {
          id: 'chat_aditya',
          otherUser: initialProfiles[0],
          lastMessage: 'Hey! How are you doing today? 😊',
          lastMessageAt: '12:45 PM',
          unreadCount: 2
        },
        {
          id: 'chat_ryan',
          otherUser: initialProfiles[1],
          lastMessage: 'Let’s check out that coffee spot!',
          lastMessageAt: 'Yesterday',
          unreadCount: 0
        },
        {
          id: 'chat_reyansh',
          otherUser: initialProfiles[4],
          lastMessage: 'Nice pictures! That sunset looked amazing.',
          lastMessageAt: '2 days ago',
          unreadCount: 0
        }
      ]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserChats(currentUser.uid, async (chatDocs) => {
      if (chatDocs.length === 0) {
        // Fallback demo chats so the UI looks active
        setChats([
          {
            id: `chat_${currentUser.uid}_${initialProfiles[0].uid}`,
            otherUser: initialProfiles[0],
            lastMessage: 'Hey! How are you doing today? 😊',
            lastMessageAt: '12:45 PM',
            unreadCount: 2
          },
          {
            id: `chat_${currentUser.uid}_${initialProfiles[1].uid}`,
            otherUser: initialProfiles[1],
            lastMessage: 'Let’s check out that coffee spot!',
            lastMessageAt: 'Yesterday',
            unreadCount: 0
          }
        ]);
        setLoading(false);
        return;
      }

      const enrichedChats = await Promise.all(
        chatDocs.map(async (c) => {
          const otherUid = c.participants.find(p => p !== currentUser.uid);
          let otherUser = initialProfiles.find(p => p.uid === otherUid);
          if (!otherUser && otherUid) {
            try {
              otherUser = await getUserProfile(otherUid);
            } catch (e) {
              console.warn('Could not fetch other user profile:', e);
            }
          }
          return {
            id: c.id || c.chatId,
            otherUser: otherUser || { displayName: 'HeartSync Member', profilePhoto: '/assets/logo-heart.jpg' },
            lastMessage: c.lastMessage || 'New message',
            lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: c.lastSenderId && c.lastSenderId !== currentUser.uid ? 1 : 0
          };
        })
      );

      setChats(enrichedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { chats, activeUsers, loading };
};

export default useChats;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';

export const DEFAULT_CHATS = [
  {
    id: 'chat_aditya',
    otherUser: {
      uid: 'seed_aditya28',
      displayName: 'Aditya',
      name: 'Aditya',
      profilePhoto: '/assets/profile-aditya.jpg',
      isOnline: true
    },
    lastMessage: 'Hi! How is your day?',
    lastMessageAt: '20:00',
    unreadCount: 1
  },
  {
    id: 'chat_arjun',
    otherUser: {
      uid: 'seed_arjun_m',
      displayName: 'Arjun Malhotra',
      name: 'Arjun Malhotra',
      profilePhoto: '/assets/profile-arjun.jpg',
      isOnline: true
    },
    lastMessage: 'Hi! ❤️',
    lastMessageAt: '10:00',
    unreadCount: 0
  },
  {
    id: 'chat_reyansh',
    otherUser: {
      uid: 'seed_reyansh_s',
      displayName: 'Reyansh Suri',
      name: 'Reyansh Suri',
      profilePhoto: '/assets/profile-reyansh.jpg',
      isOnline: false
    },
    lastMessage: 'Hello! Just confirming',
    lastMessageAt: '00:40',
    unreadCount: 2
  },
  {
    id: 'chat_vivaan',
    otherUser: {
      uid: 'seed_vivaan_a',
      displayName: 'Vivaan Arora',
      name: 'Vivaan Arora',
      profilePhoto: '/assets/profile-vivaan.jpg',
      isOnline: false
    },
    lastMessage: 'document I sent earlier?',
    lastMessageAt: '11:09',
    unreadCount: 0
  },
  {
    id: 'chat_advik',
    otherUser: {
      uid: 'seed_advik_r',
      displayName: 'advik rana',
      name: 'advik rana',
      profilePhoto: '/assets/profile-ryan.jpg',
      isOnline: true
    },
    lastMessage: 'Hello 👋',
    lastMessageAt: '11:40',
    unreadCount: 0
  },
  {
    id: 'chat_surya',
    otherUser: {
      uid: 'seed_surya_k',
      displayName: 'surya',
      name: 'surya',
      profilePhoto: '/assets/profile-aditya.jpg',
      isOnline: false
    },
    lastMessage: 'Hi!',
    lastMessageAt: '03:40',
    unreadCount: 0
  },
  {
    id: 'chat_ishaan',
    otherUser: {
      uid: 'seed_ishaan_g',
      displayName: 'ishaan gupta',
      name: 'ishaan gupta',
      profilePhoto: '/assets/profile-ishaan.jpg',
      isOnline: true
    },
    lastMessage: 'Looking forward to meeting up!',
    lastMessageAt: 'Yesterday',
    unreadCount: 0
  }
];

export const useChats = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Active users from seed
    setActiveUsers(initialProfiles.filter(p => p.isOnline));

    if (!currentUser) {
      setChats(DEFAULT_CHATS);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserChats(currentUser.uid, async (chatDocs) => {
      if (chatDocs.length === 0) {
        // Fallback demo chats so the UI looks active and populated
        setChats(DEFAULT_CHATS);
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

      // Merge user chats with default chats if only 1 exists
      setChats(enrichedChats.length > 0 ? enrichedChats : DEFAULT_CHATS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { chats, activeUsers, loading };
};

export default useChats;

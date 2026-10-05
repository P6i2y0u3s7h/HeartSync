import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats, extractOtherUid, formatChatTimestamp } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';

// User profile cache to avoid redundant network calls
const profileCache = new Map();

export const useChats = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Active users from seed profiles for the top horizontal carousel
    setActiveUsers(initialProfiles.filter(p => p.isOnline));

    if (!currentUser) {
      setChats([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserChats(currentUser.uid, async (chatDocs) => {
      if (!chatDocs || chatDocs.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const enrichedChats = await Promise.all(
        chatDocs.map(async (c) => {
          const otherUid = c.participants?.find(p => p !== currentUser.uid) ||
            extractOtherUid(c.id || c.chatId, currentUser.uid);

          let otherUser = profileCache.get(otherUid) ||
            initialProfiles.find(p => p.uid === otherUid || p.username === otherUid || p.firstName?.toLowerCase() === otherUid?.toLowerCase());

          if (!otherUser && otherUid) {
            try {
              otherUser = await getUserProfile(otherUid);
              if (otherUser) {
                profileCache.set(otherUid, otherUser);
              }
            } catch (e) {
              console.warn('Could not fetch other user profile:', e);
            }
          }

          // Compute unread count for current user
          let unread = 0;
          if (c.lastSenderId && c.lastSenderId !== currentUser.uid) {
            if (c.unreadCounts && typeof c.unreadCounts[currentUser.uid] === 'number') {
              unread = c.unreadCounts[currentUser.uid];
            } else {
              unread = 1;
            }
          }

          const rawTime = c.lastMessageAt || (c.updatedAt?.toDate?.() ? c.updatedAt.toDate().toISOString() : '');

          return {
            id: c.id || c.chatId,
            chatId: c.chatId || c.id,
            otherUser: otherUser || {
              uid: otherUid,
              displayName: 'HeartSync Member',
              firstName: 'Member',
              profilePhoto: '/assets/logo-heart.jpg',
              isOnline: false
            },
            lastMessage: c.lastMessage || 'Started a conversation',
            lastMessageAt: formatChatTimestamp(c.lastMessageAt || c.updatedAt),
            rawTimestamp: rawTime,
            unreadCount: unread,
            lastSenderId: c.lastSenderId
          };
        })
      );

      // Order conversations by latest message descending
      enrichedChats.sort((a, b) => {
        const timeA = new Date(a.rawTimestamp || 0).getTime();
        const timeB = new Date(b.rawTimestamp || 0).getTime();
        return timeB - timeA;
      });

      setChats(enrichedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { chats, activeUsers, loading };
};

export default useChats;

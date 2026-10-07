import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats, extractOtherUid, formatChatTimestamp } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { getBlockedUserIds } from '../services/blockService';
import { initialProfiles } from '../data/seedData';

// User profile cache to avoid redundant network calls
const profileCache = new Map();

export const useChats = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const setupChats = async () => {
      let blockedIds = [];
      if (currentUser?.uid) {
        try {
          blockedIds = await getBlockedUserIds(currentUser.uid);
        } catch (e) {
          console.warn('Could not load blocked users for chats:', e);
        }
      }

      if (!isMounted) return;

      const blockedSet = new Set(blockedIds);

      // Active users from seed profiles for the top horizontal carousel, excluding blocked users
      setActiveUsers(initialProfiles.filter(p => p.isOnline && !blockedSet.has(p.uid) && !blockedSet.has(p.username)));

      if (!currentUser) {
        setChats([]);
        setLoading(false);
        return;
      }

      const unsubscribe = subscribeToUserChats(currentUser.uid, async (chatDocs) => {
        if (!chatDocs || chatDocs.length === 0) {
          if (isMounted) {
            setChats([]);
            setLoading(false);
          }
          return;
        }

        // Re-check blocked users to stay fresh
        let currentBlocked = blockedSet;
        try {
          const freshBlocked = await getBlockedUserIds(currentUser.uid);
          currentBlocked = new Set(freshBlocked);
        } catch (e) {}

        // Filter out any conversation that was deleted by current user
        const nonDeletedChatDocs = chatDocs.filter((c) => {
          const deletedVal = (c.deletedBy && c.deletedBy[currentUser.uid]) || c[`deletedBy.${currentUser.uid}`];
          if (!deletedVal) return true;

          let deletedTime = 0;
          if (typeof deletedVal === 'number') deletedTime = deletedVal;
          else if (typeof deletedVal === 'string') deletedTime = new Date(deletedVal).getTime();
          else if (deletedVal?.toDate) deletedTime = deletedVal.toDate().getTime();
          else if (deletedVal?.seconds) deletedTime = deletedVal.seconds * 1000;
          else if (deletedVal === true) deletedTime = Date.now();

          let lastMsgTime = 0;
          const rawMsgTime = c.lastMessageAt || c.updatedAt;
          if (rawMsgTime) {
            if (typeof rawMsgTime === 'number') lastMsgTime = rawMsgTime;
            else if (typeof rawMsgTime === 'string') lastMsgTime = new Date(rawMsgTime).getTime();
            else if (rawMsgTime?.toDate) lastMsgTime = rawMsgTime.toDate().getTime();
            else if (rawMsgTime?.seconds) lastMsgTime = rawMsgTime.seconds * 1000;
          }

          if (!lastMsgTime || isNaN(lastMsgTime) || (deletedTime && !isNaN(deletedTime) && lastMsgTime <= deletedTime)) {
            return false;
          }
          return true;
        });

        const enrichedChats = await Promise.all(
          nonDeletedChatDocs.map(async (c) => {
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

      // Filter out any conversation involving a blocked user
      const visibleChats = enrichedChats.filter(chat => {
        const otherId = chat.otherUser?.uid || chat.otherUser?.id;
        return !currentBlocked.has(otherId);
      });

      // Order conversations by latest message descending
      visibleChats.sort((a, b) => {
        const timeA = new Date(a.rawTimestamp || 0).getTime();
        const timeB = new Date(b.rawTimestamp || 0).getTime();
        return timeB - timeA;
      });

      if (isMounted) {
        setChats(visibleChats);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  };

  let cleanupFn;
  setupChats().then(cleanup => {
    cleanupFn = cleanup;
  });

  return () => {
    isMounted = false;
    if (cleanupFn) cleanupFn();
  };
}, [currentUser]);

  return { chats, activeUsers, loading };
};

export default useChats;

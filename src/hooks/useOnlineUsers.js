import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getBlockedUserIds } from '../services/blockService';

// Module-level throttle timestamp to prevent spamming writes
let _lastOnlineWrite = 0;

/**
 * Marks current user as isOnline=true in Firestore.
 * Throttled to once every 2 minutes for heartbeats.
 */
export const markOnline = async (uid, force = false) => {
  if (!uid) return;
  const now = Date.now();
  if (!force && now - _lastOnlineWrite < 120_000) return;
  _lastOnlineWrite = now;

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        isOnline: true,
        lastSeen: new Date().toISOString(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    // Non-blocking catch
  }
};

/**
 * Marks current user as isOnline=false in Firestore.
 * Unthrottled.
 */
export const markOffline = async (uid) => {
  if (!uid) return;
  _lastOnlineWrite = 0;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        isOnline: false,
        lastSeen: new Date().toISOString(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    // Non-blocking catch
  }
};

/**
 * Helper to safely extract user photo
 */
export const extractProfilePhoto = (user) => {
  if (!user) return '/assets/logo-heart.jpg';
  const photo =
    user.profilePhoto ||
    (Array.isArray(user.photos) && user.photos[0]) ||
    user.photoURL ||
    user.image;
  return photo && typeof photo === 'string' ? photo : '/assets/logo-heart.jpg';
};

/**
 * Helper to safely extract user display name
 */
export const extractDisplayName = (user) => {
  if (!user) return 'Member';
  const raw =
    user.firstName ||
    user.displayName ||
    user.fullName ||
    user.name ||
    'Member';
  return String(raw).trim().split(' ')[0] || 'Member';
};

/**
 * useOnlineUsers
 *
 * Real-time hook for discovering active registered users in Firestore.
 * - Filters out current user
 * - Filters out blocked users
 * - Maintains presence heartbeat
 * - Updates instantly when users come online or go offline
 */
export const useOnlineUsers = (currentUser) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef(null);

  uidRef.current = currentUser?.uid || null;

  // 1. Presence lifecycle (online on mount/visibility, offline on tab close / hide)
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    // Mark online immediately
    markOnline(uid, true);

    // Heartbeat every 90 seconds
    const heartbeatId = setInterval(() => {
      if (uidRef.current) markOnline(uidRef.current, false);
    }, 90 * 1000);

    // Visibility handling: mark offline when backgrounded, online when foregrounded
    const handleVisibilityChange = () => {
      const u = uidRef.current;
      if (!u) return;
      if (document.visibilityState === 'hidden') {
        markOffline(u);
      } else if (document.visibilityState === 'visible') {
        markOnline(u, true);
      }
    };

    // Before unload handling: mark offline when closing tab
    const handleBeforeUnload = () => {
      const u = uidRef.current;
      if (u) {
        markOffline(u);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // NOTE: Do not call markOffline here so in-app page navigation does not flicker presence!
    };
  }, [currentUser?.uid]);

  // 2. Real-time Firestore query for online users
  useEffect(() => {
    const currentUid = currentUser?.uid;
    setLoading(true);

    let blockedIds = new Set();
    const loadBlocks = async () => {
      if (currentUid) {
        try {
          const list = await getBlockedUserIds(currentUid);
          blockedIds = new Set(list || []);
        } catch (e) {
          // ignore
        }
      }
    };
    loadBlocks();

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isOnline', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id;

          // Exclude self and blocked users
          if (docId !== currentUid && !blockedIds.has(docId)) {
            const formattedUser = {
              id: docId,
              uid: docId,
              ...data,
              displayName: data.displayName || data.firstName || 'Member',
              firstName: extractDisplayName(data),
              profilePhoto: extractProfilePhoto(data)
            };
            users.push(formattedUser);
          }
        });

        setOnlineUsers(users);
        setLoading(false);
      },
      (error) => {
        console.warn('useOnlineUsers: Firestore subscription warning:', error);
        setOnlineUsers([]);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { onlineUsers, loading };
};

export default useOnlineUsers;

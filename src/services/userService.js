import { db } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { initialProfiles } from '../data/seedData';
import { getBlockedUserIds } from './blockService';

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("FIRESTORE DEBUG", {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    console.log("navigator.onLine:", navigator.onLine);
    console.warn('Notice: Firestore user profile read error code:', error?.code || 'none');
    console.warn('Notice: Firestore user profile read error message:', error?.message || error);
    return null;
  }
};

export const updateUserProfile = async (uid, data) => {
  try {
    const docRef = doc(db, 'users', uid);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, updateData, { merge: true });
    return updateData;
  } catch (error) {
    console.error("FIRESTORE DEBUG", {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    console.log("navigator.onLine:", navigator.onLine);
    throw error;
  }
};

export const getUserPreferences = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid, 'preferences', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {
      minAge: 18,
      maxAge: 35,
      maxDistance: 50,
      preferredGender: 'All',
      relationshipIntentions: 'All',
      interests: [],
      verifiedOnly: false,
      preferredCity: '',
      preferredCountry: 'India'
    };
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }
};

export const updateUserPreferences = async (uid, preferences) => {
  try {
    const docRef = doc(db, 'users', uid, 'preferences', 'main');
    await setDoc(docRef, { ...preferences, updatedAt: serverTimestamp() }, { merge: true });
    return preferences;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

let lastPresenceUpdate = 0;
export const updateOnlinePresence = async (uid, isOnline = true) => {
  if (!uid) return;
  const now = Date.now();
  // Throttle updates: do not write to Firestore more than once every 3 minutes unless going offline
  if (isOnline && (now - lastPresenceUpdate) < 180000) {
    return;
  }
  lastPresenceUpdate = now;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      isOnline,
      lastSeen: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    // Fail silently in offline or restricted environments
  }
};

export const getDiscoverProfiles = async (currentUid, preferences = {}) => {
  try {
    // Fetch blocked user IDs so blocked profiles never appear in Discover
    let blockedIds = [];
    if (currentUid) {
      try {
        blockedIds = await getBlockedUserIds(currentUid);
      } catch (err) {
        console.warn('Could not load blocked IDs:', err);
      }
    }
    const blockedSet = new Set(blockedIds);

    let firestoreUsers = [];
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(30));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((d) => {
        if (d.id !== currentUid && !blockedSet.has(d.id)) {
          firestoreUsers.push({ id: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn('Firestore fetch fallback to seed:', e);
    }

    // Merge with seed profiles to ensure there are always rich profiles to swipe/browse
    const combined = [...firestoreUsers];
    const existingIds = new Set(combined.map(u => u.uid || u.id));

    initialProfiles.forEach(seed => {
      if (seed.uid !== currentUid && !existingIds.has(seed.uid) && !blockedSet.has(seed.uid)) {
        combined.push({ id: seed.uid, ...seed });
      }
    });

    // Apply filtering
    return combined.filter(profile => {
      // Exclude blocked
      if (blockedSet.has(profile.uid || profile.id)) return false;

      // Gender filter
      if (preferences.preferredGender && preferences.preferredGender !== 'All') {
        if (profile.gender && profile.gender.toLowerCase() !== preferences.preferredGender.toLowerCase()) {
          return false;
        }
      }

      // Age range filter
      if (preferences.minAge && profile.age < preferences.minAge) return false;
      if (preferences.maxAge && profile.age > preferences.maxAge) return false;

      // Verified only
      if (preferences.verifiedOnly && !profile.isVerified) return false;

      // Online now filter
      if (preferences.onlineOnly && !profile.isOnline) return false;

      // City filter
      if (preferences.city && preferences.city.trim() !== '') {
        if (!profile.city || !profile.city.toLowerCase().includes(preferences.city.toLowerCase().trim())) {
          return false;
        }
      }

      // Interests filter
      if (preferences.interests && preferences.interests.length > 0) {
        const profileInterests = (profile.interests || []).map(i => i.toLowerCase());
        const hasMatchingInterest = preferences.interests.some(wanted =>
          profileInterests.includes(wanted.toLowerCase())
        );
        if (!hasMatchingInterest) return false;
      }

      return true;
    });
  } catch (error) {
    console.error('Error in getDiscoverProfiles:', error);
    return initialProfiles.filter(p => p.uid !== currentUid);
  }
};

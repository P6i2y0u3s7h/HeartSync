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

export const getDiscoverProfiles = async (currentUid, preferences = {}) => {
  try {
    let firestoreUsers = [];
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(30));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((d) => {
        if (d.id !== currentUid) {
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
      if (seed.uid !== currentUid && !existingIds.has(seed.uid)) {
        combined.push({ id: seed.uid, ...seed });
      }
    });

    // Apply filtering
    return combined.filter(profile => {
      if (preferences.preferredGender && preferences.preferredGender !== 'All') {
        if (profile.gender && profile.gender.toLowerCase() !== preferences.preferredGender.toLowerCase()) {
          return false;
        }
      }
      if (preferences.minAge && profile.age < preferences.minAge) return false;
      if (preferences.maxAge && profile.age > preferences.maxAge) return false;
      if (preferences.verifiedOnly && !profile.isVerified) return false;
      if (preferences.city && preferences.city.trim() !== '') {
        if (!profile.city || !profile.city.toLowerCase().includes(preferences.city.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  } catch (error) {
    console.error('Error in getDiscoverProfiles:', error);
    return initialProfiles.filter(p => p.uid !== currentUid);
  }
};

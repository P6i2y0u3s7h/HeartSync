import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db, firebaseConfig } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Friendly error message converter with specific Firestore error code distinction
export const getFriendlyAuthErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  // Differentiate Firestore specific error codes accurately
  switch (code) {
    case 'permission-denied':
      return 'Firestore Permission Denied: Security rules blocked access to this document.';
    case 'not-found':
      return 'Firestore Not Found: The database or requested document was not found.';
    case 'failed-precondition':
      return 'Firestore Failed Precondition: Operation cannot be performed in the current system state.';
    case 'unauthenticated':
      return 'Firestore Unauthenticated: Request does not have valid authentication credentials.';
    case 'unavailable':
      return 'Firestore Service Unavailable: The service is currently unable to handle the request.';
    default:
      break;
  }

  if (message.includes('client is offline')) {
    return 'Firestore connection is offline. Please make sure Cloud Firestore is enabled in your Firebase Console.';
  }

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid mobile number.';
    case 'auth/missing-phone-number':
      return 'Please enter your mobile number.';
    case 'auth/too-many-requests':
      return 'Too many OTP requests. Please try again later.';
    case 'auth/quota-exceeded':
      return 'SMS quota has been exceeded. Please try again later.';
    case 'auth/captcha-check-failed':
      return 'Security verification failed. Please try again.';
    case 'auth/invalid-verification-code':
      return 'Incorrect OTP. Please check and try again.';
    case 'auth/code-expired':
      return 'This OTP has expired. Please request a new OTP.';
    case 'auth/operation-not-allowed':
      return 'Phone authentication is currently unavailable.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Only one popup request allowed at a time.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by the browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return message || 'Authentication error. Please try again.';
  }
};

// Part 6: Format mobile number to E.164
export const normalizePhoneNumber = (rawPhone, defaultCountryCode = '+91') => {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `${defaultCountryCode}${cleaned}`;
};

export const registerWithEmail = async (email, password, additionalData = {}) => {
  // Part 10: Normalize email safely before submitting
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }

  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  } catch (error) {
    console.error('Registration error code:', error?.code);
    console.error('Registration error message:', error?.message);
    console.error('Firebase error:', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    });

    // Part 8: Handle auth errors with explicit user-friendly messages
    if (error?.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    if (error?.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (error?.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    }

    throw new Error(getFriendlyAuthErrorMessage(error));
  }

  const user = userCredential.user;

  try {
    const displayName = additionalData.displayName || additionalData.username || normalizedEmail.split('@')[0];
    await updateProfile(user, { displayName });
  } catch (profErr) {
    console.warn('Could not update Auth displayName:', profErr);
  }

  const userProfile = {
    uid: user.uid,
    username: additionalData.username || normalizedEmail.split('@')[0],
    email: user.email || normalizedEmail,
    displayName: additionalData.displayName || additionalData.username || normalizedEmail.split('@')[0],
    firstName: additionalData.firstName || additionalData.username || 'Member',
    lastName: additionalData.lastName || '',
    dateOfBirth: additionalData.dateOfBirth || '',
    age: additionalData.age || 24,
    gender: additionalData.gender || 'Not specified',
    phoneNumber: additionalData.phoneNumber || '',
    country: additionalData.country || 'India',
    city: additionalData.city || 'Mumbai',
    bio: additionalData.bio || 'Hello! I am new to HeartSync.',
    profilePhoto: additionalData.profilePhoto || '/assets/logo-heart.jpg',
    photos: additionalData.photos || ['/assets/logo-heart.jpg'],
    isVerified: false,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Part 17: Check users/{uid} and create profile with Auth UID
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, userProfile);
    }
  } catch (fsErr) {
    console.error("FIRESTORE DEBUG", {
      code: fsErr?.code,
      message: fsErr?.message,
      name: fsErr?.name,
      stack: fsErr?.stack
    });
    console.log("navigator.onLine:", navigator.onLine);
    // Do not fail registration completely if Firestore is offline
  }

  return { user, profile: userProfile };
};

export const loginWithEmail = async (email, password) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;
    
    // Update online status in Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        isOnline: true,
        lastSeen: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (fsErr) {
      console.error("FIRESTORE DEBUG", {
        code: fsErr?.code,
        message: fsErr?.message,
        name: fsErr?.name,
        stack: fsErr?.stack
      });
      console.log("navigator.onLine:", navigator.onLine);
    }
    
    return user;
  } catch (error) {
    console.error('Firebase error:', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    });
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

// Run completely independent Firestore test using the exact exported db
export async function testFirestoreConnection() {
  const testRef = doc(db, "_debug", "connection-test");
  try {
    console.log("navigator.onLine:", navigator.onLine);
    console.log("FIRESTORE TEST START");

    await setDoc(testRef, {
      test: true,
      timestamp: serverTimestamp()
    });

    console.log("FIRESTORE WRITE SUCCESS");

    const result = await getDoc(testRef);

    console.log(
      "FIRESTORE READ SUCCESS",
      result.exists(),
      result.data()
    );
    return { success: true, exists: result.exists(), data: result.data() };
  } catch (error) {
    console.error("FIRESTORE REAL ERROR", {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    console.log("navigator.onLine:", navigator.onLine);
    return { success: false, error };
  }
}

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    if (!user || !user.uid) {
      throw new Error('Google authentication did not return a valid user.');
    }

    // Safe debugging logs (no tokens or credentials)
    console.log('Google authentication successful:', user.uid);
    console.log('Firestore project:', firebaseConfig.projectId);
    console.log('Firestore user UID:', user.uid);

    // Run connection test
    await testFirestoreConnection();

    const userRef = doc(db, 'users', user.uid);
    
    let userSnap;
    try {
      userSnap = await getDoc(userRef);
    } catch (readErr) {
      console.error("FIRESTORE DEBUG", {
        code: readErr?.code,
        message: readErr?.message,
        name: readErr?.name,
        stack: readErr?.stack
      });
      console.log("navigator.onLine:", navigator.onLine);
      throw readErr;
    }

    if (!userSnap.exists()) {
      const [firstName = '', lastName = ''] = (user.displayName || '').split(' ');
      const newProfileData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'HeartSync Member',
        firstName: firstName || user.displayName || 'Member',
        lastName: lastName || '',
        profilePhoto: user.photoURL || '/assets/logo-heart.jpg',
        photos: [user.photoURL || '/assets/logo-heart.jpg'],
        isVerified: user.emailVerified || false,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      try {
        await setDoc(userRef, newProfileData);
      } catch (writeErr) {
        console.error("FIRESTORE DEBUG", {
          code: writeErr?.code,
          message: writeErr?.message,
          name: writeErr?.name,
          stack: writeErr?.stack
        });
        console.log("navigator.onLine:", navigator.onLine);
        throw writeErr;
      }
    } else {
      try {
        await setDoc(userRef, {
          isOnline: true,
          lastSeen: new Date().toISOString(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (updateErr) {
        console.error("FIRESTORE FULL ERROR", {
          name: updateErr?.name,
          code: updateErr?.code,
          message: updateErr?.message,
          stack: updateErr?.stack,
          customData: updateErr?.customData
        });
        throw updateErr;
      }
    }

    return user;
  } catch (error) {
    console.error('Google login error:', error);
    console.error('Firebase error:', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    });
    console.error('Firestore error code:', error?.code || 'none');
    console.error('Firestore error message:', error?.message || error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

export const logoutUser = async () => {
  try {
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          isOnline: false,
          lastSeen: new Date().toISOString(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not update offline status:', e);
      }
    }
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

import { db, storage } from '../firebase/firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressImage } from './storageService';

/**
 * Uploads a verification file (selfie or ID document) securely to Firebase Storage
 * Stored under isolated verification/{userId}/{type}/ path
 */
export const uploadVerificationFile = async (userId, file, type = 'selfie', onProgress) => {
  if (!userId || !file) throw new Error('User ID and file are required');

  try {
    const isImage = file.type && file.type.startsWith('image/');
    const fileToUpload = isImage ? await compressImage(file, 1200, 0.88) : file;

    const extension = file.name ? file.name.split('.').pop() : (isImage ? 'jpg' : 'pdf');
    const storagePath = `verification/${userId}/${type}/${type}_${Date.now()}.${extension}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Verification upload error:', error);
          // Fallback to local Data URL if Firebase Storage is unavailable/mocked
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(error);
          reader.readAsDataURL(fileToUpload);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  } catch (err) {
    console.error('Error preparing verification upload:', err);
    throw err;
  }
};

/**
 * Submit Photo Verification request
 * Status becomes 'pending'
 */
export const submitPhotoVerification = async ({ userId, selfieFile, onProgress }) => {
  if (!userId) throw new Error('User must be logged in to verify');
  if (!selfieFile) throw new Error('Verification selfie is required');

  // 1. Upload selfie to verification storage
  const selfieUrl = await uploadVerificationFile(userId, selfieFile, 'selfie', onProgress);

  // 2. Create document in verificationRequests
  const requestData = {
    userId,
    verificationType: 'photo',
    selfieUrl,
    status: 'pending',
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'verificationRequests'), requestData);

  // 3. Update user profile verificationStatus to pending
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    verificationStatus: 'pending',
    verificationRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  return {
    requestId: docRef.id,
    ...requestData,
    selfieUrl
  };
};

/**
 * Submit ID + Photo Identity Verification request
 * Status becomes 'pending'
 */
export const submitIdentityVerification = async ({ userId, idFile, selfieFile, onProgress }) => {
  if (!userId) throw new Error('User must be logged in to verify identity');
  if (!idFile) throw new Error('Government ID document is required');
  if (!selfieFile) throw new Error('Verification selfie is required');

  // Progress split: 50% for ID, 50% for Selfie
  const idProgress = (p) => onProgress && onProgress(p * 0.5);
  const selfieProgress = (p) => onProgress && onProgress(50 + p * 0.5);

  // 1. Upload ID document
  const idDocumentUrl = await uploadVerificationFile(userId, idFile, 'id', idProgress);

  // 2. Upload verification selfie
  const selfieUrl = await uploadVerificationFile(userId, selfieFile, 'selfie', selfieProgress);

  // 3. Create document in identityVerificationRequests
  const requestData = {
    userId,
    idDocumentUrl,
    selfieUrl,
    status: 'pending',
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'identityVerificationRequests'), requestData);

  // 4. Update user profile identityVerificationStatus to pending
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    identityVerificationStatus: 'pending',
    identityVerificationRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  return {
    requestId: docRef.id,
    ...requestData
  };
};

/**
 * Fetch current verification status for a user
 */
export const getVerificationStatus = async (userId) => {
  if (!userId) return { verificationStatus: 'none', identityVerificationStatus: 'none', isVerified: false };

  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        verificationStatus: data.verificationStatus || (data.isVerified ? 'verified' : 'none'),
        identityVerificationStatus: data.identityVerificationStatus || 'none',
        isVerified: Boolean(data.isVerified || data.verificationStatus === 'verified'),
        isIdVerified: data.identityVerificationStatus === 'verified'
      };
    }
  } catch (err) {
    console.warn('Error fetching verification status:', err);
  }

  return { verificationStatus: 'none', identityVerificationStatus: 'none', isVerified: false };
};

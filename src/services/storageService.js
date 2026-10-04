import { storage } from '../firebase/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Compresses an image file client-side using Canvas before uploading
 */
export const compressImage = (file, maxWidth = 1000, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Uploads a profile image to users/{userId}/profile/profile.jpg
 */
export const uploadProfileImage = async (userId, file, onProgress) => {
  try {
    const compressed = await compressImage(file, 800, 0.85);
    const storageRef = ref(storage, `users/${userId}/profile/profile.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, compressed);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('STORAGE DEBUG', {
            code: error?.code,
            message: error?.message,
            name: error?.name,
            serverResponse: error?.serverResponse
          });
          console.warn('Storage upload error, using local data URL fallback:', error);
          // Fallback to local Data URL if Firebase Storage is uninitialized/unreachable
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(compressed);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    throw error;
  }
};

/**
 * Uploads a gallery photo to users/{userId}/photos/photo{index}.jpg
 */
export const uploadGalleryPhoto = async (userId, file, index = 1, onProgress) => {
  try {
    const compressed = await compressImage(file, 1000, 0.85);
    const storageRef = ref(storage, `users/${userId}/photos/photo${index}.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, compressed);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('STORAGE DEBUG', {
            code: error?.code,
            message: error?.message,
            name: error?.name,
            serverResponse: error?.serverResponse
          });
          console.warn('Storage upload error, using local data URL fallback:', error);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(compressed);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Upload gallery photo error:', error);
    throw error;
  }
};

/**
 * Uploads a chat image to chat/{chatId}/{messageId}.jpg
 */
export const uploadChatImage = async (chatId, messageId, file, onProgress) => {
  try {
    const compressed = await compressImage(file, 1200, 0.8);
    const storageRef = ref(storage, `chat/${chatId}/${messageId}.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, compressed);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.warn('Chat image upload error, using data URL fallback:', error);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(compressed);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Upload chat image error:', error);
    throw error;
  }
};

/**
 * Deletes a file from storage
 */
export const deleteStorageFile = async (path) => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Delete storage file error:', error);
  }
};

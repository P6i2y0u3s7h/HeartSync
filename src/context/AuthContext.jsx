import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  resetPassword
} from '../services/authService';
import { getUserProfile, updateUserProfile } from '../services/userService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile || {
            uid: user.uid,
            displayName: user.displayName || 'HeartSync Member',
            email: user.email,
            profilePhoto: user.photoURL || '/assets/logo-heart.jpg',
            age: 24,
            city: 'Mumbai',
            isVerified: false
          });
        } catch (err) {
          console.warn('Error fetching user profile:', err);
          setUserProfile({
            uid: user.uid,
            displayName: user.displayName || 'HeartSync Member',
            email: user.email,
            profilePhoto: user.photoURL || '/assets/logo-heart.jpg'
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const user = await loginWithEmail(email, password);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email, password, additionalData) => {
    setError(null);
    try {
      const res = await registerWithEmail(email, password, additionalData);
      setUserProfile(res.profile);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const googleSignIn = async () => {
    setError(null);
    try {
      const res = await loginWithGoogle();
      if (res?.profile) {
        setUserProfile(res.profile);
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (data) => {
    if (!currentUser) return;
    try {
      const updated = await updateUserProfile(currentUser.uid, data);
      setUserProfile(prev => ({ ...prev, ...data }));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    register,
    googleSignIn,
    logout,
    resetPassword,
    updateProfile,
    setUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

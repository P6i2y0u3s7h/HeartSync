import { getUserProfile, updateUserProfile, updateUserPreferences, getUserPreferences } from './userService';

export const profileService = {
  getProfile: getUserProfile,
  updateProfile: updateUserProfile,
  getPreferences: getUserPreferences,
  updatePreferences: updateUserPreferences
};

export default profileService;

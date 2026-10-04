import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Upload, Calendar, MapPin, User } from 'lucide-react';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import HeartBackground from '../components/HeartBackground';
import WaveBackground from '../components/WaveBackground';
import HeartSyncLogo from '../components/HeartSyncLogo';
import { useAuth } from '../context/AuthContext';
import { uploadProfileImage, uploadGalleryPhoto } from '../services/storageService';

export const ProfileSetupPage = () => {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(userProfile?.displayName || userProfile?.firstName || '');
  const [dateOfBirth, setDateOfBirth] = useState(userProfile?.dateOfBirth || '1998-05-15');
  const [gender, setGender] = useState(userProfile?.gender || 'Male');
  const [country, setCountry] = useState(userProfile?.country || 'India');
  const [city, setCity] = useState(userProfile?.city || 'Mumbai');
  const [bio, setBio] = useState(userProfile?.bio || '');
  
  // Photos (up to 3)
  const [photos, setPhotos] = useState(
    userProfile?.photos && userProfile.photos.length > 0
      ? userProfile.photos
      : ['/assets/logo-heart.jpg']
  );
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(0);

  const calculateAge = (dobString) => {
    if (!dobString) return 24;
    const birthDate = new Date(dobString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handlePhotoSlotClick = (index) => {
    setActiveSlot(index);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdx(activeSlot);
    setErrorMsg('');

    try {
      const uid = currentUser?.uid || 'temp_user';
      let downloadURL;
      if (activeSlot === 0) {
        downloadURL = await uploadProfileImage(uid, file);
      } else {
        downloadURL = await uploadGalleryPhoto(uid, file, activeSlot);
      }

      setPhotos(prev => {
        const updated = [...prev];
        updated[activeSlot] = downloadURL;
        return updated;
      });
    } catch (err) {
      console.error('Photo upload error:', err);
      // Fallback preview
      const localUrl = URL.createObjectURL(file);
      setPhotos(prev => {
        const updated = [...prev];
        updated[activeSlot] = localUrl;
        return updated;
      });
    } finally {
      setUploadingIdx(null);
    }
  };

  const removePhoto = (e, index) => {
    e.stopPropagation();
    if (photos.length <= 1) return;
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const calculatedAge = calculateAge(dateOfBirth);
      const primaryPhoto = photos[0] || '/assets/logo-heart.jpg';
      const [firstName = '', lastName = ''] = name.trim().split(' ');

      await updateProfile({
        displayName: name.trim(),
        firstName,
        lastName,
        dateOfBirth,
        age: calculatedAge,
        gender,
        country,
        city,
        bio: bio.trim(),
        profilePhoto: primaryPhoto,
        photos: photos.filter(Boolean),
        isVerified: true
      });

      navigate('/home');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-app-shell">
      <div className="auth-page-container profile-setup-page">
        <HeartBackground />

        <div className="auth-card-wrapper profile-setup-wrapper animate-slide-up">
          <div className="auth-header-block">
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <HeartSyncLogo size="small" layout="horizontal" />
            </div>
            <h1 className="auth-main-title">Profile Info</h1>
            <p className="auth-sub-title">Complete your profile to get matched with great people</p>
          </div>

        {errorMsg && (
          <div className="alert-box-error">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* 3 Photos row */}
        <div className="profile-photos-upload-row">
          <label className="form-label-hs">Photos (Up to 3)</label>
          <div className="photo-slots-grid">
            {[0, 1, 2].map((slotIdx) => {
              const photo = photos[slotIdx];
              const isPrimary = slotIdx === 0;
              const isUploading = uploadingIdx === slotIdx;

              return (
                <div
                  key={slotIdx}
                  className={`photo-slot-card ${isPrimary ? 'primary-slot' : ''} ${photo ? 'has-photo' : 'empty-slot'}`}
                  onClick={() => handlePhotoSlotClick(slotIdx)}
                >
                  {isUploading ? (
                    <div className="slot-uploading-overlay">
                      <div className="btn-mini-spinner"></div>
                    </div>
                  ) : photo ? (
                    <>
                      <img src={photo} alt={`Photo ${slotIdx + 1}`} className="slot-img-preview" />
                      {isPrimary && <span className="slot-primary-badge">Main</span>}
                      {photos.length > 1 && (
                        <button
                          type="button"
                          className="slot-remove-btn"
                          onClick={(e) => removePhoto(e, slotIdx)}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="slot-empty-content">
                      <Camera size={22} color="#ED417A" />
                      <span>Add</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <span className="photo-upload-hint">The first photo will be your main profile picture.</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-body">
          <FormInput
            id="setup-name"
            name="name"
            label="Full Name"
            placeholder="e.g. Aditya Arora"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={User}
            required
          />

          <FormInput
            id="setup-dob"
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            icon={Calendar}
            required
          />

          {/* Gender selection */}
          <div className="form-group-hs">
            <label className="form-label-hs">Gender</label>
            <div className="gender-pill-group">
              {['Male', 'Female', 'Others'].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`gender-pill-btn ${gender === g ? 'active' : ''}`}
                  onClick={() => setGender(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row-two-col">
            <FormInput
              id="setup-country"
              name="country"
              label="Country"
              placeholder="e.g. India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
            <FormInput
              id="setup-city"
              name="city"
              label="City"
              placeholder="e.g. Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              icon={MapPin}
              required
            />
          </div>

          <div className="form-group-hs">
            <label htmlFor="setup-bio" className="form-label-hs">Bio</label>
            <textarea
              id="setup-bio"
              rows={3}
              className="form-control-hs hs-textarea"
              placeholder="Tell others what you love, your passions, or what you're looking for..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <PrimaryButton
            id="btn-save-profile"
            type="submit"
            loading={loading}
            className="auth-submit-btn"
          >
            Save & Enter HeartSync
          </PrimaryButton>
        </form>
      </div>

      <WaveBackground />
      </div>
    </div>
  );
};

export default ProfileSetupPage;

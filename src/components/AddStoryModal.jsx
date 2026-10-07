import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video as VideoIcon, Camera, Upload, AlertCircle, CheckCircle2, Lock, Globe } from 'lucide-react';
import CameraModal from './CameraModal';
import { uploadStoryMedia, createStory } from '../services/storyService';

const MAX_IMAGE_SIZE_MB = 15;
const MAX_VIDEO_SIZE_MB = 35;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const AddStoryModal = ({ isOpen, onClose, currentUser, userProfile, onStoryCreated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [visibility, setVisibility] = useState('everyone'); // 'everyone' | 'matches'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const galleryPhotoInputRef = useRef(null);
  const galleryVideoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const resetForm = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType('image');
    setUploadProgress(0);
    setIsUploading(false);
    setErrorMsg('');
  };

  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const validateAndSelectFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrorMsg('Please upload a valid image file (JPEG, PNG, or WEBP).');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`Image exceeds maximum allowed size (${MAX_IMAGE_SIZE_MB}MB).`);
        return;
      }
      setMediaType('image');
    } else if (isVideo) {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        setErrorMsg('Please upload a valid video file (MP4 or WebM).');
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`Video exceeds maximum allowed size (${MAX_VIDEO_SIZE_MB}MB).`);
        return;
      }
      setMediaType('video');
    } else {
      setErrorMsg('Unsupported file type. Please choose a photo or video.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(localUrl);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    // Clear input value so same file can be re-selected if needed
    e.target.value = '';
  };

  const handlePostStory = async () => {
    if (!selectedFile || !currentUser?.uid) return;

    try {
      setIsUploading(true);
      setErrorMsg('');
      setUploadProgress(10);

      const storyId = `story_${Date.now()}`;

      // 1. Upload to Firebase Storage
      const { downloadURL, storagePath } = await uploadStoryMedia(
        currentUser.uid,
        storyId,
        selectedFile,
        (progress) => {
          setUploadProgress(Math.min(95, Math.round(progress)));
        }
      );

      setUploadProgress(98);

      // 2. Create Firestore story document
      const newStory = await createStory({
        userId: currentUser.uid,
        userProfile: userProfile || {
          displayName: currentUser.displayName,
          profilePhoto: currentUser.photoURL
        },
        mediaUrl: downloadURL,
        storagePath,
        mediaType,
        storyVisibility: visibility
      });

      setUploadProgress(100);

      if (onStoryCreated) {
        onStoryCreated(newStory);
      }

      setTimeout(() => {
        resetForm();
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to post story:', err);
      setErrorMsg(err.message || 'Failed to post story. Please check your connection and try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="add-story-modal-overlay" onClick={handleClose}>
      <div
        className="add-story-modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="add-story-header">
          <div className="add-story-header-title">
            <h3>Add to Story</h3>
            <p>Share a photo or video with matches (disappears in 24 hours)</p>
          </div>
          <button
            type="button"
            className="add-story-close-btn"
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={galleryPhotoInputRef}
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={galleryVideoInputRef}
          accept="video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Body Content */}
        <div className="add-story-body">
          {errorMsg && (
            <div className="add-story-error-banner animate-fade-in">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedFile ? (
            /* Choice Selection Screen */
            <div className="add-story-choice-grid">
              <button
                type="button"
                className="add-story-choice-card"
                onClick={() => galleryPhotoInputRef.current?.click()}
              >
                <div className="choice-icon-circle pink-glow">
                  <ImageIcon size={26} color="#E91E63" />
                </div>
                <span className="choice-label">Choose Photo</span>
                <span className="choice-sublabel">JPEG, PNG, WEBP</span>
              </button>

              <button
                type="button"
                className="add-story-choice-card"
                onClick={() => galleryVideoInputRef.current?.click()}
              >
                <div className="choice-icon-circle purple-glow">
                  <VideoIcon size={26} color="#9C27B0" />
                </div>
                <span className="choice-label">Choose Video</span>
                <span className="choice-sublabel">MP4, WebM up to 35MB</span>
              </button>

              <button
                type="button"
                id="btn-story-take-photo"
                className="add-story-choice-card"
                onClick={() => setCameraModalOpen(true)}
              >
                <div className="choice-icon-circle orange-glow">
                  <Camera size={26} color="#FF5722" />
                </div>
                <span className="choice-label">Take Photo</span>
                <span className="choice-sublabel">Use device camera</span>
              </button>
            </div>
          ) : (
            /* Media Preview & Options */
            <div className="add-story-preview-wrapper animate-fade-in">
              <div className="add-story-preview-box">
                {mediaType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="add-story-media-preview"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    className="add-story-media-preview"
                    controls
                    playsInline
                    autoPlay
                    muted
                  />
                )}
                <button
                  type="button"
                  className="add-story-change-media-btn"
                  onClick={() => {
                    if (!isUploading) {
                      resetForm();
                    }
                  }}
                  disabled={isUploading}
                  title="Choose different media"
                >
                  <X size={16} /> Change
                </button>
              </div>

              {/* Privacy Setting */}
              <div className="add-story-privacy-section">
                <label className="add-story-privacy-label">Story Visibility</label>
                <div className="add-story-privacy-options">
                  <button
                    type="button"
                    className={`privacy-opt-btn ${visibility === 'everyone' ? 'active' : ''}`}
                    onClick={() => setVisibility('everyone')}
                    disabled={isUploading}
                  >
                    <Globe size={16} />
                    <span>Everyone</span>
                  </button>
                  <button
                    type="button"
                    className={`privacy-opt-btn ${visibility === 'matches' ? 'active' : ''}`}
                    onClick={() => setVisibility('matches')}
                    disabled={isUploading}
                  >
                    <Lock size={16} />
                    <span>Matches Only</span>
                  </button>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="add-story-progress-container animate-fade-in">
                  <div className="progress-info-row">
                    <span>{uploadProgress < 98 ? 'Uploading media...' : 'Publishing story...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="add-story-footer">
          <button
            type="button"
            className="add-story-btn-cancel"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </button>

          {selectedFile && (
            <button
              type="button"
              className="add-story-btn-post"
              onClick={handlePostStory}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="spinner-mini"></span>
                  Posting...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Post Story
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(file) => {
          if (file) validateAndSelectFile(file);
        }}
        title="Take Story Photo"
        subtitle="Capture a live photo to share to your Story"
        initialFacingMode="user"
      />
    </div>
  );
};

export default AddStoryModal;

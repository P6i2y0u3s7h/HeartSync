import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Camera,
  Globe,
  Lock,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import CameraModal from './CameraModal';

export const CreatePostModal = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onCreatePost
}) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Body scroll lock and ESC key handling while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isUploading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isUploading]);

  if (!isOpen) return null;

  // Resolve REAL user profile name and photo
  const authorName =
    userProfile?.displayName ||
    userProfile?.firstName ||
    currentUser?.displayName ||
    userProfile?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'HeartSync Member');

  const authorPhoto =
    userProfile?.profilePhoto ||
    (Array.isArray(userProfile?.photos) && userProfile.photos[0]) ||
    currentUser?.photoURL ||
    userProfile?.photoURL ||
    '/assets/logo-heart.jpg';

  const isVideo = file?.type?.startsWith('video/');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const isImg = selected.type.startsWith('image/');
    const isVid = selected.type.startsWith('video/');

    if (!isImg && !isVid) {
      setErrorMsg('Please select a valid photo (JPG, PNG, WEBP) or video (MP4, WebM).');
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setErrorMsg('File size must be less than 50MB.');
      return;
    }

    setErrorMsg('');
    setFile(selected);

    // Create immediate local preview URL
    const localUrl = URL.createObjectURL(selected);
    setPreviewUrl(localUrl);
  };

  const handleCameraCapture = (capturedFile) => {
    if (!capturedFile) return;
    setFile(capturedFile);
    setErrorMsg('');
    const localUrl = URL.createObjectURL(capturedFile);
    setPreviewUrl(localUrl);
  };

  const handleRemovePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isUploading) return;
    handleRemovePhoto();
    setCaption('');
    setPrivacy('public');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a photo or video to share.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg('');

    try {
      await onCreatePost({
        file,
        caption: caption.trim(),
        privacy,
        onProgress: (p) => setUploadProgress(p)
      });
      handleClose();
    } catch (err) {
      console.error('Error creating post:', err);
      setErrorMsg(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="hs-modal-backdrop animate-fade-in" onClick={handleClose}>
      <div
        className="create-post-modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-post-title"
      >
        {/* Fixed Header */}
        <div className="create-post-header">
          <h2 id="create-post-title" className="create-post-title">
            Create Post
          </h2>
          <button
            type="button"
            className="create-post-close-btn"
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="create-post-form">
          {/* Scrollable Content Area */}
          <div className="create-post-body-scrollable">
            {/* User Meta Row */}
            <div className="create-post-user-row">
              <img
                src={authorPhoto}
                alt={authorName}
                className="create-post-user-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/logo-heart.jpg';
                }}
              />
              <div className="create-post-user-meta">
                <span className="create-post-user-name">{authorName}</span>
                {/* Privacy Selector */}
                <div className="create-post-privacy-pills">
                  <button
                    type="button"
                    className={`privacy-pill ${privacy === 'public' ? 'active' : ''}`}
                    onClick={() => setPrivacy('public')}
                  >
                    <Globe size={12} />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    className={`privacy-pill ${privacy === 'matches' ? 'active' : ''}`}
                    onClick={() => setPrivacy('matches')}
                  >
                    <Lock size={12} />
                    <span>Matches Only</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Media Selector / Preview Area */}
            <div className="create-post-media-stage">
              {previewUrl ? (
                <div className="create-post-preview-wrapper">
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      controls
                      playsInline
                      className="create-post-preview-video"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Post preview"
                      className="create-post-preview-img"
                    />
                  )}
                  <button
                    type="button"
                    className="create-post-remove-photo-btn"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                    title="Remove media"
                    aria-label="Remove media"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="create-post-dropzone">
                  <div className="dropzone-icon-circle">
                    <ImageIcon size={30} color="#C2185B" />
                  </div>
                  <p className="dropzone-hint">Share a photo or video with the HeartSync community</p>
                  <div className="dropzone-action-buttons">
                    <button
                      type="button"
                      className="dropzone-btn gallery-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={16} />
                      <span>Choose Media</span>
                    </button>

                    <button
                      type="button"
                      id="btn-create-post-open-camera"
                      className="dropzone-btn camera-btn"
                      onClick={() => setCameraModalOpen(true)}
                    >
                      <Camera size={16} />
                      <span>Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Caption Input */}
            <div className="create-post-caption-box">
              <textarea
                className="create-post-textarea"
                placeholder="Write a caption... (e.g. Exploring the city today! ✨)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={isUploading}
              />
              <div className="create-post-caption-footer">
                <span className="caption-char-count">{caption.length}/500</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="create-post-error-banner animate-fade-in">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="create-post-progress-box">
                <div className="create-post-progress-bar">
                  <div
                    className="create-post-progress-fill"
                    style={{ width: `${uploadProgress || 50}%` }}
                  ></div>
                </div>
                <span className="create-post-progress-text">
                  Publishing post... {uploadProgress ? `${uploadProgress}%` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Fixed Action Buttons Footer */}
          <div className="create-post-actions-footer">
            <button
              type="button"
              className="create-post-cancel-btn"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-post-submit-btn"
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="spinner-rotate" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  <span>{isVideo ? 'Post Video' : 'Post Photo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        title="Take Photo for Post"
        subtitle="Capture a live photo to share with HeartSync"
        initialFacingMode="environment"
      />
    </div>
  );
};

export default CreatePostModal;

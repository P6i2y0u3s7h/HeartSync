import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Loader2
} from 'lucide-react';

/**
 * CameraModal
 * Reusable modal for capturing real photos using navigator.mediaDevices.getUserMedia.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onCapture: (file: File) => void
 * - title: string (default: "Camera")
 * - subtitle: string
 * - initialFacingMode: "user" | "environment" (default: "user")
 * - isSelfieGuide: boolean (optional oval guide for selfies/verification)
 */
export const CameraModal = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Camera',
  subtitle = 'Take a photo with your device camera',
  initialFacingMode = 'user',
  isSelfieGuide = false
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState(initialFacingMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);

  // Stop all active tracks and reset video srcObject
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Track stop error:', e);
          }
        });
      } catch (err) {
        console.warn('Stream cleanup error:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Map camera errors to user-friendly messages
  const parseCameraError = (err) => {
    const errorName = err?.name || '';
    switch (errorName) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          code: 'NotAllowed',
          message: 'Camera permission is required to take a photo. Please allow camera access in your browser or system settings and click Try Again.'
        };
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          code: 'NotFound',
          message: 'No camera hardware found on this device. Please connect a webcam or use another device.'
        };
      case 'NotReadableError':
      case 'TrackStartError':
        return {
          code: 'NotReadable',
          message: 'Your camera is already in use by another application or browser tab. Please close other apps and try again.'
        };
      case 'OverconstrainedError':
        return {
          code: 'Overconstrained',
          message: 'The requested camera settings are not supported by this device.'
        };
      case 'SecurityError':
        return {
          code: 'Security',
          message: 'Camera access requires a secure connection (HTTPS or localhost). Please check your connection.'
        };
      default:
        return {
          code: 'Unknown',
          message: err?.message || 'Unable to start camera. Please check your permissions and try again.'
        };
    }
  };

  // Start camera stream with specified facingMode
  const startCameraStream = useCallback(async (targetMode) => {
    stopCameraStream();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError({
        code: 'NotSupported',
        message: 'Camera access is not supported by this browser. Please use Chrome, Safari, or Firefox on a secure connection.'
      });
      return;
    }

    setLoading(true);
    setError(null);

    const constraints = {
      video: {
        facingMode: targetMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
      setLoading(false);

      // Check available video devices
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        } catch (e) {
          setHasMultipleCameras(true);
        }
      }
    } catch (err) {
      console.warn('Initial camera constraint failed:', err);

      // If overconstrained or failed, retry with bare minimum video constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setLoading(false);
      } catch (fallbackErr) {
        console.error('Camera fallback error:', fallbackErr);
        setError(parseCameraError(fallbackErr));
        setLoading(false);
      }
    }
  }, [stopCameraStream]);

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCapturedFile(null);
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
        setCapturedPreviewUrl(null);
      }
      setFacingMode(initialFacingMode);
      startCameraStream(initialFacingMode);
    } else {
      stopCameraStream();
      document.body.style.overflow = '';
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
        setCapturedPreviewUrl(null);
      }
      setCapturedFile(null);
      setError(null);
    }

    return () => {
      stopCameraStream();
      document.body.style.overflow = '';
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [isOpen, initialFacingMode, startCameraStream, stopCameraStream]);

  // Switch between front and rear cameras
  const handleSwitchCamera = () => {
    if (loading) return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  // Capture photo from video frame
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    try {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Mirror horizontally if user is looking at front-facing camera
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError({ code: 'CaptureFailed', message: 'Failed to capture frame from camera.' });
            return;
          }

          const file = new File([blob], `heartsync_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          const previewUrl = URL.createObjectURL(blob);
          setCapturedFile(file);
          setCapturedPreviewUrl(previewUrl);

          // Stop camera stream right after capture as required
          stopCameraStream();
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('Error during photo capture:', err);
      setError({ code: 'CaptureError', message: 'Could not capture photo. Please try again.' });
    }
  };

  // Retake photo: clear captured preview and restart camera
  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
      setCapturedPreviewUrl(null);
    }
    setCapturedFile(null);
    setError(null);
    startCameraStream(facingMode);
  };

  // Use captured photo: send to parent callback and close modal
  const handleUsePhoto = () => {
    if (!capturedFile) return;
    onCapture(capturedFile);
    handleClose();
  };

  // Close and clean up
  const handleClose = () => {
    stopCameraStream();
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
      setCapturedPreviewUrl(null);
    }
    setCapturedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="camera-modal-title">
      <div className="camera-modal-container">
        {/* Header */}
        <div className="camera-modal-header">
          <div className="camera-header-info">
            <h3 id="camera-modal-title" className="camera-modal-title">
              <Camera size={20} className="camera-header-icon" />
              <span>{capturedPreviewUrl ? 'Photo Preview' : title}</span>
            </h3>
            <p className="camera-modal-subtitle">
              {capturedPreviewUrl ? 'Confirm your photo or retake' : subtitle}
            </p>
          </div>
          <button
            type="button"
            className="camera-close-btn"
            onClick={handleClose}
            aria-label="Close camera"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="camera-viewport-wrapper">
          {error ? (
            <div className="camera-error-state">
              <div className="camera-error-icon-box">
                <AlertCircle size={36} color="#e91e63" />
              </div>
              <h4 className="camera-error-heading">Camera Access Error</h4>
              <p className="camera-error-message">{error.message}</p>
              <div className="camera-error-actions">
                <button
                  type="button"
                  className="camera-retry-btn"
                  onClick={() => startCameraStream(facingMode)}
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  className="camera-cancel-link-btn"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : capturedPreviewUrl ? (
            /* Preview of Captured Photo */
            <div className="camera-preview-display">
              <img
                src={capturedPreviewUrl}
                alt="Captured"
                className="camera-captured-img"
              />
              <div className="camera-preview-badge">
                <Sparkles size={14} />
                <span>Photo Ready</span>
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <div className="camera-video-container">
              {loading && (
                <div className="camera-loading-overlay">
                  <Loader2 size={36} className="spinner-rotate" color="#e91e63" />
                  <span>Starting camera...</span>
                </div>
              )}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`camera-video-element ${facingMode === 'user' ? 'mirrored' : ''}`}
                onLoadedMetadata={() => setLoading(false)}
              />

              {/* Optional Selfie Oval Guide */}
              {isSelfieGuide && !loading && (
                <div className="camera-selfie-guide-overlay">
                  <div className="camera-selfie-oval">
                    <span className="selfie-guide-text">Position face inside oval</span>
                  </div>
                </div>
              )}

              {/* Live Badge */}
              {!loading && (
                <div className="camera-live-indicator">
                  <span className="live-dot" />
                  <span>LIVE</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="camera-controls-bar">
          {capturedPreviewUrl ? (
            /* Post-capture Controls */
            <div className="camera-preview-controls">
              <button
                type="button"
                id="btn-camera-retake"
                className="camera-action-btn camera-retake-btn"
                onClick={handleRetake}
              >
                <RotateCcw size={18} />
                <span>Retake</span>
              </button>

              <button
                type="button"
                id="btn-camera-use-photo"
                className="camera-action-btn camera-use-btn"
                onClick={handleUsePhoto}
              >
                <Check size={18} strokeWidth={2.5} />
                <span>Use Photo</span>
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="camera-live-controls">
              {/* Switch Camera */}
              {hasMultipleCameras ? (
                <button
                  type="button"
                  id="btn-switch-camera"
                  className="camera-switch-btn"
                  onClick={handleSwitchCamera}
                  disabled={loading || Boolean(error)}
                  title="Switch front/back camera"
                  aria-label="Switch Camera"
                >
                  <RefreshCw size={20} />
                  <span>Switch</span>
                </button>
              ) : (
                <div className="camera-control-spacer" />
              )}

              {/* Shutter / Capture Button */}
              <button
                type="button"
                id="btn-camera-shutter"
                className="camera-shutter-btn"
                onClick={handleCapturePhoto}
                disabled={loading || Boolean(error)}
                aria-label="Capture Photo"
              >
                <div className="shutter-inner-circle">
                  <Camera size={26} color="#ffffff" />
                </div>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                id="btn-camera-cancel"
                className="camera-cancel-btn"
                onClick={handleClose}
                aria-label="Cancel"
              >
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;

import React, { useState, useRef } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Clock,
  Loader2,
  Lock,
  Sparkles,
  FileText
} from 'lucide-react';
import CameraModal from './CameraModal';
import { submitPhotoVerification, submitIdentityVerification } from '../services/verificationService';

export const VerificationModal = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onStatusUpdated
}) => {
  const [activeTab, setActiveTab] = useState('photo'); // 'photo' | 'identity'

  // Photo Verification state
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  // Identity Verification state
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState('');
  const [idSelfieFile, setIdSelfieFile] = useState(null);
  const [idSelfiePreview, setIdSelfiePreview] = useState('');

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Camera Modal state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('photo'); // 'photo' | 'idSelfie'

  const selfieInputRef = useRef(null);
  const idDocInputRef = useRef(null);
  const idSelfieInputRef = useRef(null);

  const handleCameraCapture = (capturedFile) => {
    if (!capturedFile) return;
    setErrorMsg('');
    const preview = URL.createObjectURL(capturedFile);
    if (cameraTarget === 'photo') {
      setSelfieFile(capturedFile);
      setSelfiePreview(preview);
    } else if (cameraTarget === 'idSelfie') {
      setIdSelfieFile(capturedFile);
      setIdSelfiePreview(preview);
    }
  };

  if (!isOpen) return null;

  const currentPhotoStatus = userProfile?.verificationStatus || (userProfile?.isVerified ? 'verified' : 'none');
  const currentIdStatus = userProfile?.identityVerificationStatus || 'none';

  const handleSelfieChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file for your selfie.');
      return;
    }
    setErrorMsg('');
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const handleIdDocChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setIdFile(file);
    if (file.type.startsWith('image/')) {
      setIdPreview(URL.createObjectURL(file));
    } else {
      setIdPreview('doc_uploaded');
    }
  };

  const handleIdSelfieChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file for your selfie.');
      return;
    }
    setErrorMsg('');
    setIdSelfieFile(file);
    setIdSelfiePreview(URL.createObjectURL(file));
  };

  const handleSubmitPhotoVerification = async (e) => {
    e.preventDefault();
    if (!selfieFile) {
      setErrorMsg('Please upload or take a verification selfie first.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await submitPhotoVerification({
        userId: currentUser?.uid,
        selfieFile,
        onProgress: (p) => setProgress(Math.round(p))
      });

      setSuccessMsg('Your photo verification request has been submitted and is currently pending review.');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error('Error submitting photo verification:', err);
      setErrorMsg(err.message || 'Failed to submit verification request. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitIdentityVerification = async (e) => {
    e.preventDefault();
    if (!idFile) {
      setErrorMsg('Please upload your government-issued ID document.');
      return;
    }
    if (!idSelfieFile) {
      setErrorMsg('Please upload a verification selfie holding your ID.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await submitIdentityVerification({
        userId: currentUser?.uid,
        idFile,
        selfieFile: idSelfieFile,
        onProgress: (p) => setProgress(Math.round(p))
      });

      setSuccessMsg('Your identity verification request has been securely submitted and is pending review.');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error('Error submitting identity verification:', err);
      setErrorMsg(err.message || 'Failed to submit identity verification request. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="hs-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="hs-verification-modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="verification-modal-title"
      >
        {/* Header */}
        <div className="verification-modal-header">
          <div className="verification-title-group">
            <ShieldCheck size={22} color="#e91e63" />
            <h2 id="verification-modal-title">Get Verified on HeartSync</h2>
          </div>
          <button
            type="button"
            className="verification-close-btn"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="verification-tabs-bar">
          <button
            type="button"
            className={`verification-tab-btn ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('photo'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <Camera size={16} />
            <span>Photo Verification</span>
            {currentPhotoStatus === 'verified' && <span className="tab-status-chip verified">✓</span>}
            {currentPhotoStatus === 'pending' && <span className="tab-status-chip pending">⏳</span>}
          </button>

          <button
            type="button"
            className={`verification-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
            onClick={() => { setActiveTab('identity'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <Shield size={16} />
            <span>ID + Photo</span>
            {currentIdStatus === 'verified' && <span className="tab-status-chip verified">✓</span>}
            {currentIdStatus === 'pending' && <span className="tab-status-chip pending">⏳</span>}
          </button>
        </div>

        {/* Content Body */}
        <div className="verification-modal-body">
          {/* Messages */}
          {errorMsg && (
            <div className="verification-alert alert-error animate-fade-in">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="verification-alert alert-success animate-fade-in">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Photo Verification */}
          {activeTab === 'photo' && (
            <div className="verification-tab-content">
              {currentPhotoStatus === 'verified' ? (
                <div className="verification-already-card verified-card">
                  <div className="status-badge-circle green">
                    <Check size={28} strokeWidth={3} />
                  </div>
                  <h3>You are Photo Verified!</h3>
                  <p>Your profile displays the official HeartSync Verified badge to all other members.</p>
                </div>
              ) : currentPhotoStatus === 'pending' ? (
                <div className="verification-already-card pending-card">
                  <div className="status-badge-circle amber">
                    <Clock size={28} />
                  </div>
                  <h3>Photo Verification Pending</h3>
                  <p>Your selfie has been submitted and is currently being reviewed. Your Verified badge will be granted upon review.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitPhotoVerification} className="verification-form">
                  <div className="verification-info-card">
                    <h4>Why verify?</h4>
                    <p>
                      Photo verification proves that your profile photos are truly you. Verified profiles get up to <strong>3x more matches</strong> and higher trust from members.
                    </p>
                  </div>

                  <div className="verification-upload-stage">
                    {selfiePreview ? (
                      <div className="verification-preview-wrap">
                        <img src={selfiePreview} alt="Selfie preview" className="verification-preview-img" />
                        <button
                          type="button"
                          className="preview-remove-btn"
                          onClick={() => { setSelfieFile(null); setSelfiePreview(''); }}
                          disabled={uploading}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="verification-upload-dropzone"
                        onClick={() => {
                          setCameraTarget('photo');
                          setCameraModalOpen(true);
                        }}
                      >
                        <div className="upload-icon-circle">
                          <Camera size={28} color="#e91e63" />
                        </div>
                        <p className="upload-main-text">Take a Live Verification Selfie</p>
                        <p className="upload-sub-text">Look directly at the camera in good lighting</p>
                        <div className="verification-dropzone-actions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            type="button"
                            id="btn-open-photo-camera"
                            className="choose-file-btn"
                            style={{ background: 'linear-gradient(135deg, #e91e63, #c2185b)', color: '#ffffff', border: 'none' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCameraTarget('photo');
                              setCameraModalOpen(true);
                            }}
                          >
                            <Camera size={14} />
                            <span>Open Camera</span>
                          </button>
                          <button
                            type="button"
                            className="choose-file-btn"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              selfieInputRef.current?.click();
                            }}
                          >
                            <Upload size={14} />
                            <span>Upload File</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={selfieInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieChange}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {uploading && (
                    <div className="verification-progress-box">
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span>Submitting verification... {progress}%</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="verification-submit-btn"
                    disabled={!selfieFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="spinner-rotate" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Identity Verification */}
          {activeTab === 'identity' && (
            <div className="verification-tab-content">
              {currentIdStatus === 'verified' ? (
                <div className="verification-already-card verified-card">
                  <div className="status-badge-circle green">
                    <ShieldCheck size={28} />
                  </div>
                  <h3>You are ID Verified!</h3>
                  <p>Your profile displays the highest trust level badge: <strong>ID Verified</strong>.</p>
                </div>
              ) : currentIdStatus === 'pending' ? (
                <div className="verification-already-card pending-card">
                  <div className="status-badge-circle amber">
                    <Clock size={28} />
                  </div>
                  <h3>Identity Verification Pending</h3>
                  <p>Your government ID and verification selfie are currently being securely reviewed.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitIdentityVerification} className="verification-form">
                  <div className="verification-info-card">
                    <h4>Maximum Trust Badge</h4>
                    <p>
                      Upload a government-issued ID alongside a selfie to earn the <strong>ID Verified</strong> badge.
                    </p>
                    <div className="privacy-guarantee-note">
                      <Lock size={13} color="#059669" />
                      <span>Your ID is stored in encrypted, isolated storage and is NEVER visible to other users.</span>
                    </div>
                  </div>

                  {/* ID Upload */}
                  <div className="dual-upload-grid">
                    <div className="dual-upload-item">
                      <label className="upload-label">1. Government ID Document</label>
                      {idPreview ? (
                        <div className="verification-mini-preview">
                          {idPreview === 'doc_uploaded' ? (
                            <div className="doc-placeholder"><FileText size={32} /><span>Document Ready</span></div>
                          ) : (
                            <img src={idPreview} alt="ID preview" className="mini-preview-img" />
                          )}
                          <button type="button" className="preview-remove-btn" onClick={() => { setIdFile(null); setIdPreview(''); }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="mini-dropzone" onClick={() => idDocInputRef.current?.click()}>
                          <Upload size={20} color="#e91e63" />
                          <span>Upload ID (Driver's License / Passport)</span>
                        </div>
                      )}
                      <input
                        ref={idDocInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIdDocChange}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {/* Selfie Upload */}
                    <div className="dual-upload-item">
                      <label className="upload-label">2. Verification Selfie</label>
                      {idSelfiePreview ? (
                        <div className="verification-mini-preview">
                          <img src={idSelfiePreview} alt="Selfie preview" className="mini-preview-img" />
                          <button type="button" className="preview-remove-btn" onClick={() => { setIdSelfieFile(null); setIdSelfiePreview(''); }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="mini-dropzone"
                          id="btn-open-id-selfie-camera"
                          onClick={() => {
                            setCameraTarget('idSelfie');
                            setCameraModalOpen(true);
                          }}
                        >
                          <Camera size={20} color="#e91e63" />
                          <span>Take Live Verification Selfie</span>
                        </div>
                      )}
                      <input
                        ref={idSelfieInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleIdSelfieChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {uploading && (
                    <div className="verification-progress-box">
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span>Uploading encrypted documents... {progress}%</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="verification-submit-btn"
                    disabled={!idFile || !idSelfieFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="spinner-rotate" />
                        <span>Submitting Securely...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Submit for ID Verification</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        title={cameraTarget === 'idSelfie' ? 'ID Verification Selfie' : 'Photo Verification Selfie'}
        subtitle="Align your face clearly inside the oval guide in good lighting"
        initialFacingMode="user"
        isSelfieGuide={true}
      />
    </div>
  );
};

export default VerificationModal;

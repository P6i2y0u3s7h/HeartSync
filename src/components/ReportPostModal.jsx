import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { reportPost } from '../services/postService';

export const POST_REPORT_REASONS = [
  'Spam',
  'Inappropriate Content',
  'Harassment',
  'Fake Content',
  'Other'
];

export const ReportPostModal = ({
  isOpen,
  onClose,
  post,
  currentUser
}) => {
  const [selectedReason, setSelectedReason] = useState(POST_REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      await reportPost({
        reporterUid: currentUser.uid,
        postId: post.id || post.postId,
        postOwnerUid: post.userId || '',
        reason: selectedReason,
        description: description.trim()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Error reporting post:', err);
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hs-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="report-post-modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="report-post-title"
      >
        <div className="report-post-header">
          <div className="report-post-title-wrap">
            <ShieldAlert size={19} color="#D81B60" />
            <h3 id="report-post-title" className="report-post-title">
              Report Post
            </h3>
          </div>
          <button
            type="button"
            className="report-post-close-btn"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={19} />
          </button>
        </div>

        {isSuccess ? (
          <div className="report-post-success-view animate-fade-in">
            <CheckCircle2 size={44} color="#4CAF50" />
            <h4 className="report-success-title">Report Submitted</h4>
            <p className="report-success-desc">
              Thank you for keeping HeartSync safe. Our moderation team will review this post promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-post-form">
            <p className="report-post-prompt">
              Why are you reporting this post?
            </p>

            <div className="report-reasons-list">
              {POST_REPORT_REASONS.map((reason) => (
                <label key={reason} className="report-reason-item">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="report-radio-input"
                  />
                  <span className="report-reason-label">{reason}</span>
                </label>
              ))}
            </div>

            <div className="report-details-box">
              <label className="report-details-label">
                Additional Details (optional)
              </label>
              <textarea
                className="report-details-textarea"
                rows={3}
                placeholder="Provide any additional context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                disabled={submitting}
              />
            </div>

            {errorMsg && (
              <div className="report-post-error">
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="report-post-actions">
              <button
                type="button"
                className="report-cancel-btn"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="report-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spinner-rotate" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportPostModal;

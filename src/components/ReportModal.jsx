import React, { useState } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import { REPORT_REASONS, submitUserReport } from '../services/reportService';
import PrimaryButton from './PrimaryButton';

export const ReportModal = ({
  isOpen,
  onClose,
  reporterId,
  reportedUser = {},
  conversationId = ''
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedReason(REPORT_REASONS[0]);
    setDetails('');
    setSubmitted(false);
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reporterId || !reportedUser?.uid) {
      setErrorMsg('Cannot submit report: missing user identity.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await submitUserReport({
        reporterId,
        reportedUserId: reportedUser.uid,
        reason: selectedReason,
        details: details.trim(),
        conversationId,
        reportedUserProfile: {
          displayName: reportedUser.displayName || reportedUser.name || 'Member',
          profilePhoto: reportedUser.profilePhoto || reportedUser.image || ''
        }
      });
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      console.error('Report submission failed:', err);
      setErrorMsg('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-hs animate-fade-in" onClick={handleClose}>
      <div className="report-modal-card animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-with-icon">
            <ShieldAlert size={20} color="#ED417A" />
            <h3 className="modal-title">Report User</h3>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="report-success-view">
            <div className="report-success-icon-wrap">
              <Check size={32} color="#4caf50" strokeWidth={3} />
            </div>
            <h4>Report submitted successfully.</h4>
            <p>Thank you. Our safety team reviews all reports to keep HeartSync a safe community.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-modal-form">
            <p className="report-intro-text">
              Why are you reporting <strong>{reportedUser.displayName || reportedUser.name || 'this member'}</strong>?
            </p>

            {errorMsg && (
              <div className="alert-box-error">
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="report-reasons-list">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="report-reason-radio-label">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="report-radio-input"
                  />
                  <span className="report-radio-indicator"></span>
                  <span className="report-reason-text">{reason}</span>
                </label>
              ))}
            </div>

            <div className="report-details-group">
              <label className="report-details-label">Additional Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Help us understand the issue..."
                rows={3}
                className="report-details-textarea"
                maxLength={500}
              />
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="btn-cancel-modal"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <PrimaryButton
                type="submit"
                loading={submitting}
                className="btn-submit-report"
              >
                Submit Report
              </PrimaryButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

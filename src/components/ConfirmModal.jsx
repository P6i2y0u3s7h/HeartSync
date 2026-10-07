import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-hs animate-fade-in" onClick={onCancel}>
      <div className="confirm-modal-card animate-pop-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onCancel} aria-label="Close">
          <X size={18} />
        </button>

        <div className="confirm-modal-icon-wrap" style={{ background: isDestructive ? '#ffebee' : '#fce4ec' }}>
          <AlertTriangle size={28} color={isDestructive ? '#e53935' : '#ED417A'} />
        </div>

        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>

        <div className="confirm-modal-actions">
          <button
            type="button"
            id="btn-confirm-modal-cancel"
            className="btn-cancel-modal"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            id="btn-confirm-modal-submit"
            className={`btn-confirm-action ${isDestructive ? 'btn-confirm-danger' : 'btn-confirm-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

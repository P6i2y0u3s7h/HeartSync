import React, { useState } from 'react';
import { X, Edit3, Loader2 } from 'lucide-react';

export const EditPostCaptionModal = ({
  isOpen,
  onClose,
  post,
  onSaveCaption
}) => {
  const [caption, setCaption] = useState(post?.caption || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const postId = post.id || post.postId;
      await onSaveCaption(postId, caption.trim());
      onClose();
    } catch (err) {
      console.error('Error updating caption:', err);
      setErrorMsg(err.message || 'Failed to update caption.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hs-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="edit-caption-modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="edit-caption-title"
      >
        <div className="edit-caption-header">
          <div className="edit-caption-title-wrap">
            <Edit3 size={18} color="#C2185B" />
            <h3 id="edit-caption-title" className="edit-caption-title">
              Edit Caption
            </h3>
          </div>
          <button
            type="button"
            className="edit-caption-close-btn"
            onClick={onClose}
            disabled={saving}
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-caption-form">
          <textarea
            className="edit-caption-textarea"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Write an updated caption..."
            disabled={saving}
            autoFocus
          />

          <div className="edit-caption-counter">
            <span>{caption.length}/500</span>
          </div>

          {errorMsg && (
            <div className="edit-caption-error">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="edit-caption-actions">
            <button
              type="button"
              className="edit-caption-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-caption-save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spinner-rotate" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostCaptionModal;

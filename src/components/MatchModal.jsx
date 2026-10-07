import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const MatchModal = ({ isOpen, onClose, user1, user2 }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && user2) {
      navigate('/match', { state: { user1, user2 } });
      if (onClose) onClose();
    }
  }, [isOpen, user2, navigate, onClose, user1]);

  return null;
};

export default MatchModal;

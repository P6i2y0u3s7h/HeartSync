import React from 'react';
import { Navigate } from 'react-router-dom';

export const VerifyPage = () => {
  return <Navigate to="/profile-setup" replace />;
};

export default VerifyPage;

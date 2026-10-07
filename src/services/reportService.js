import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const REPORT_REASONS = [
  'Fake Profile',
  'Harassment',
  'Inappropriate Content',
  'Spam',
  'Other'
];

export const submitUserReport = async ({
  reporterId,
  reportedUserId,
  reportedUserName = '',
  reason,
  details = '',
  conversationId = ''
}) => {
  const actualReporter = reporterId;
  const actualReported = reportedUserId;

  if (!actualReporter || !actualReported || !reason) {
    throw new Error('Missing required report fields');
  }

  const reportsRef = collection(db, 'reports');
  const reportData = {
    reporterId: actualReporter,
    reporterUid: actualReporter,
    reportedUserId: actualReported,
    reportedUid: actualReported,
    reportedUserName,
    reason,
    description: details.trim(),
    details: details.trim(),
    conversationId: conversationId || '',
    createdAt: serverTimestamp(),
    status: 'pending'
  };

  const docRef = await addDoc(reportsRef, reportData);
  return { id: docRef.id, ...reportData };
};

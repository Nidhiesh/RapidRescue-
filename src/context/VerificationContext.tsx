import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  VerificationProfile,
  VerificationStatus,
  VerificationDocumentType,
  VerificationDocument,
  DocumentUploadPayload,
} from '../types';
import { verificationService } from '../services';
import { useAuth } from './AuthContext';
import { createInitialDocumentsMap } from '../constants';

import { isMockEnabled } from '../config/apiConfig';

interface VerificationContextValue {
  profile: VerificationProfile | null;
  status: VerificationStatus;
  documents: Record<VerificationDocumentType, VerificationDocument>;
  uploadedCount: number;
  totalCount: number;
  isAllUploaded: boolean;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  uploadDoc: (docType: VerificationDocumentType, payload: DocumentUploadPayload) => Promise<boolean>;
  removeDoc: (docType: VerificationDocumentType) => Promise<boolean>;
  submitReview: () => Promise<boolean>;
  resubmitReview: () => Promise<boolean>;
  setMockStatus: (
    status: VerificationStatus,
    rejectionReason?: string,
    rejectedDocType?: VerificationDocumentType
  ) => Promise<void>;
  clearError: () => void;
}

const VerificationContext = createContext<VerificationContextValue | undefined>(undefined);

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, status: authStatus } = useAuth();
  const driverId = session?.driverId || 'RR-DRV-1001';

  const [profile, setProfile] = useState<VerificationProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    // Verification documents profile is strictly for DRIVER users
    if (session?.role !== 'DRIVER') {
      return;
    }
    if (!isMockEnabled() && authStatus !== 'AUTHENTICATED') {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await verificationService.getVerificationProfile(driverId);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification profile.');
    } finally {
      setIsLoading(false);
    }
  }, [driverId, authStatus, session?.role]);

  useEffect(() => {
    if (session?.role === 'DRIVER' && (authStatus === 'AUTHENTICATED' || isMockEnabled())) {
      fetchProfile();
    } else if (authStatus === 'UNAUTHENTICATED' || session?.role === 'ADMIN') {
      setProfile(null);
      setError(null);
    }
  }, [authStatus, session?.role, fetchProfile]);

  const documents = profile?.documents || createInitialDocumentsMap();
  const status: VerificationStatus = profile?.status || 'NOT_SUBMITTED';

  const uploadedCount = Object.values(documents).filter(
    (doc) => doc.status === 'UPLOADED'
  ).length;

  const totalCount = 6;
  const isAllUploaded = uploadedCount === totalCount;

  const uploadDoc = async (
    docType: VerificationDocumentType,
    payload: DocumentUploadPayload
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await verificationService.uploadDocument(driverId, docType, payload);
      await fetchProfile();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeDoc = async (docType: VerificationDocumentType): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await verificationService.removeDocument(driverId, docType);
      await fetchProfile();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove document.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await verificationService.submitForReview(driverId);
      setProfile(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit documents for review.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resubmitReview = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await verificationService.resubmit(driverId);
      setProfile(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resubmit documents.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setMockStatus = async (
    newStatus: VerificationStatus,
    rejectionReason?: string,
    rejectedDocType?: VerificationDocumentType
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const updated = await verificationService.setMockVerificationStatus(
        driverId,
        newStatus,
        rejectionReason,
        rejectedDocType
      );
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update simulator state.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <VerificationContext.Provider
      value={{
        profile,
        status,
        documents,
        uploadedCount,
        totalCount,
        isAllUploaded,
        isLoading,
        error,
        refreshProfile: fetchProfile,
        uploadDoc,
        removeDoc,
        submitReview,
        resubmitReview,
        setMockStatus,
        clearError,
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = (): VerificationContextValue => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};

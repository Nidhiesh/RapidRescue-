/**
 * RapidRescue Driver Mobile App - Mock Verification Service
 * Multi-driver repository with full Admin Review & Driver synchronization capabilities.
 */

import {
  VerificationDocumentType,
  VerificationDocument,
  VerificationProfile,
  VerificationStatus,
  DocumentUploadPayload,
  VerificationSummaryStats,
  DriverVerificationSummary,
} from '../../types';
import { createInitialDocumentsMap } from '../../constants';

const delay = (ms: number = 400): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Pre-seeded sample image URLs
const SAMPLE_DOCS = {
  drivingLicense:
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
  govtId:
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
  selfie:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  rc:
    'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=600&q=80',
  permit:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
  insurance:
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
};

const populateCompleteDocuments = (
  isInsuranceExpired: boolean = false
): Record<VerificationDocumentType, VerificationDocument> => {
  const docs = createInitialDocumentsMap();

  docs.DRIVING_LICENSE = {
    ...docs.DRIVING_LICENSE,
    status: 'UPLOADED',
    uri: SAMPLE_DOCS.drivingLicense,
    fileName: 'commercial_driving_license.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 420,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  docs.GOVERNMENT_ID = {
    ...docs.GOVERNMENT_ID,
    status: 'UPLOADED',
    uri: SAMPLE_DOCS.govtId,
    fileName: 'national_id_proof.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 380,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  docs.DRIVER_SELFIE = {
    ...docs.DRIVER_SELFIE,
    status: 'UPLOADED',
    uri: SAMPLE_DOCS.selfie,
    fileName: 'responder_photo.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 250,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  docs.AMBULANCE_REGISTRATION = {
    ...docs.AMBULANCE_REGISTRATION,
    status: 'UPLOADED',
    uri: SAMPLE_DOCS.rc,
    fileName: 'ambulance_rc_book.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 890,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  docs.AMBULANCE_PERMIT = {
    ...docs.AMBULANCE_PERMIT,
    status: 'UPLOADED',
    uri: SAMPLE_DOCS.permit,
    fileName: 'emergency_vehicle_permit.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 510,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  docs.VEHICLE_INSURANCE = {
    ...docs.VEHICLE_INSURANCE,
    status: isInsuranceExpired ? 'REJECTED' : 'UPLOADED',
    uri: SAMPLE_DOCS.insurance,
    fileName: 'commercial_vehicle_insurance.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 670,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    rejectionReason: isInsuranceExpired
      ? 'Vehicle insurance policy has expired. Please upload an active commercial policy.'
      : undefined,
  };

  return docs;
};

// In-memory driver verification repository
const verificationProfiles: Record<string, VerificationProfile> = {
  // Driver A: Gokul (Default user driver - PENDING review with all 6 uploaded)
  'RR-DRV-1001': {
    driverId: 'RR-DRV-1001',
    driverName: 'Gokul (Driver)',
    mobileNumber: '9876543210',
    email: 'gokul.driver@rapidrescue.org',
    yearsOfExperience: 5,
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    documents: populateCompleteDocuments(false),
  },
  // Driver B: Rajesh Kumar (UNDER_REVIEW)
  'RR-DRV-1002': {
    driverId: 'RR-DRV-1002',
    driverName: 'Rajesh Kumar',
    mobileNumber: '9811223344',
    email: 'rajesh.k@rapidrescue.org',
    yearsOfExperience: 7,
    status: 'UNDER_REVIEW',
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    reviewedBy: 'RR-ADM-001',
    documents: populateCompleteDocuments(false),
  },
  // Driver C: Amit Sharma (VERIFIED)
  'RR-DRV-1003': {
    driverId: 'RR-DRV-1003',
    driverName: 'Amit Sharma',
    mobileNumber: '9822334455',
    email: 'amit.s@rapidrescue.org',
    yearsOfExperience: 4,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewedBy: 'RR-ADM-001',
    documents: populateCompleteDocuments(false),
  },
  // Driver D: Suresh Patel (REJECTED)
  'RR-DRV-1004': {
    driverId: 'RR-DRV-1004',
    driverName: 'Suresh Patel',
    mobileNumber: '9833445566',
    email: 'suresh.p@rapidrescue.org',
    yearsOfExperience: 6,
    status: 'REJECTED',
    submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    reviewedBy: 'RR-ADM-001',
    rejectionReason: 'Vehicle insurance document is expired.',
    rejectedDocumentType: 'VEHICLE_INSURANCE',
    documents: populateCompleteDocuments(true),
  },
};

const getOrCreateProfile = (driverId: string): VerificationProfile => {
  if (!verificationProfiles[driverId]) {
    verificationProfiles[driverId] = {
      driverId,
      status: 'NOT_SUBMITTED',
      documents: createInitialDocumentsMap(),
    };
  }
  return verificationProfiles[driverId];
};

export const mockVerificationService = {
  hasDriver(driverId: string): boolean {
    return Boolean(verificationProfiles[driverId]);
  },

  /**
   * Fetch current driver verification profile
   */
  async getVerificationProfile(driverId: string): Promise<VerificationProfile> {
    await delay(250);
    return JSON.parse(JSON.stringify(getOrCreateProfile(driverId)));
  },

  /**
   * Upload or replace a document locally
   */
  async uploadDocument(
    driverId: string,
    docType: VerificationDocumentType,
    payload: DocumentUploadPayload
  ): Promise<VerificationDocument> {
    await delay(400);
    const profile = getOrCreateProfile(driverId);
    const doc = profile.documents[docType];

    if (!doc) {
      throw new Error(`Invalid document type: ${docType}`);
    }

    doc.uri = payload.uri;
    doc.fileName = payload.fileName;
    doc.mimeType = payload.mimeType;
    doc.size = payload.size;
    doc.uploadedAt = new Date().toISOString();
    doc.status = 'UPLOADED';
    doc.rejectionReason = undefined;

    if (profile.rejectedDocumentType === docType) {
      profile.rejectedDocumentType = undefined;
    }

    return JSON.parse(JSON.stringify(doc));
  },

  /**
   * Remove an uploaded document
   */
  async removeDocument(
    driverId: string,
    docType: VerificationDocumentType
  ): Promise<VerificationDocument> {
    await delay(200);
    const profile = getOrCreateProfile(driverId);
    const doc = profile.documents[docType];

    if (!doc) {
      throw new Error(`Invalid document type: ${docType}`);
    }

    doc.uri = undefined;
    doc.fileName = undefined;
    doc.mimeType = undefined;
    doc.size = undefined;
    doc.uploadedAt = undefined;
    doc.status = 'NOT_UPLOADED';
    doc.rejectionReason = undefined;

    return JSON.parse(JSON.stringify(doc));
  },

  /**
   * Driver submits all required documents for review
   */
  async submitForReview(driverId: string): Promise<VerificationProfile> {
    await delay(500);
    const profile = getOrCreateProfile(driverId);

    const allUploaded = Object.values(profile.documents).every(
      (doc) => doc.status === 'UPLOADED'
    );

    if (!allUploaded) {
      throw new Error('All 6 required documents must be uploaded before submitting.');
    }

    profile.status = 'PENDING';
    profile.submittedAt = new Date().toISOString();
    profile.rejectionReason = undefined;
    profile.rejectedDocumentType = undefined;

    return JSON.parse(JSON.stringify(profile));
  },

  /**
   * Driver resubmits corrected documents after rejection
   */
  async resubmit(driverId: string): Promise<VerificationProfile> {
    await delay(500);
    const profile = getOrCreateProfile(driverId);

    profile.status = 'PENDING';
    profile.submittedAt = new Date().toISOString();
    profile.rejectionReason = undefined;
    profile.rejectedDocumentType = undefined;

    Object.values(profile.documents).forEach((doc) => {
      if (doc.status === 'REJECTED') {
        doc.status = 'UPLOADED';
        doc.rejectionReason = undefined;
      }
    });

    return JSON.parse(JSON.stringify(profile));
  },

  // ================= ADMIN OPERATIONS ================= //

  /**
   * Retrieve high-level count statistics for Admin Dashboard
   */
  async getVerificationSummaryStats(): Promise<VerificationSummaryStats> {
    await delay(200);
    const all = Object.values(verificationProfiles);

    return {
      pendingCount: all.filter((p) => p.status === 'PENDING').length,
      underReviewCount: all.filter((p) => p.status === 'UNDER_REVIEW').length,
      verifiedCount: all.filter((p) => p.status === 'VERIFIED').length,
      rejectedCount: all.filter((p) => p.status === 'REJECTED').length,
      totalDriversCount: all.length,
    };
  },

  /**
   * Retrieve list of drivers pending review for Admin
   */
  async getPendingDrivers(): Promise<DriverVerificationSummary[]> {
    await delay(300);
    const pendingList = Object.values(verificationProfiles)
      .filter((p) => p.status === 'PENDING' || p.status === 'UNDER_REVIEW')
      .map((p) => {
        const uploadedCount = Object.values(p.documents).filter(
          (d) => d.status === 'UPLOADED'
        ).length;

        return {
          driverId: p.driverId,
          driverName: p.driverName || 'Responder Driver',
          mobileNumber: p.mobileNumber || '9876543210',
          status: p.status,
          documentsCount: uploadedCount,
          totalRequired: 6,
          submittedAt: p.submittedAt,
          reviewedAt: p.reviewedAt,
          rejectionReason: p.rejectionReason,
        };
      });

    return JSON.parse(JSON.stringify(pendingList));
  },

  /**
   * Retrieve all drivers across all statuses for Admin
   */
  async getAllDrivers(): Promise<DriverVerificationSummary[]> {
    await delay(300);
    const list = Object.values(verificationProfiles).map((p) => {
      const uploadedCount = Object.values(p.documents).filter(
        (d) => d.status === 'UPLOADED'
      ).length;

      return {
        driverId: p.driverId,
        driverName: p.driverName || 'Responder Driver',
        mobileNumber: p.mobileNumber || '9876543210',
        status: p.status,
        documentsCount: uploadedCount,
        totalRequired: 6,
        submittedAt: p.submittedAt,
        reviewedAt: p.reviewedAt,
        rejectionReason: p.rejectionReason,
      };
    });

    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Admin starts review on a pending driver
   */
  async startReview(driverId: string, adminId: string): Promise<VerificationProfile> {
    await delay(350);
    const profile = getOrCreateProfile(driverId);

    if (profile.status === 'PENDING') {
      profile.status = 'UNDER_REVIEW';
      profile.reviewedBy = adminId;
    }

    return JSON.parse(JSON.stringify(profile));
  },

  /**
   * Admin approves driver verification
   */
  async approveDriver(driverId: string, adminId: string): Promise<VerificationProfile> {
    await delay(500);
    const profile = getOrCreateProfile(driverId);

    profile.status = 'VERIFIED';
    profile.reviewedAt = new Date().toISOString();
    profile.reviewedBy = adminId;
    profile.rejectionReason = undefined;
    profile.rejectedDocumentType = undefined;

    return JSON.parse(JSON.stringify(profile));
  },

  /**
   * Admin rejects driver verification with required reason
   */
  async rejectDriver(
    driverId: string,
    adminId: string,
    reason: string,
    rejectedDocType?: VerificationDocumentType
  ): Promise<VerificationProfile> {
    await delay(500);
    const profile = getOrCreateProfile(driverId);

    profile.status = 'REJECTED';
    profile.reviewedAt = new Date().toISOString();
    profile.reviewedBy = adminId;
    profile.rejectionReason = reason;
    profile.rejectedDocumentType = rejectedDocType || 'VEHICLE_INSURANCE';

    const target = profile.rejectedDocumentType;
    if (profile.documents[target]) {
      profile.documents[target].status = 'REJECTED';
      profile.documents[target].rejectionReason = reason;
    }

    return JSON.parse(JSON.stringify(profile));
  },

  /**
   * Development simulator fallback
   */
  async setMockVerificationStatus(
    driverId: string,
    status: VerificationStatus,
    rejectionReason?: string,
    rejectedDocType?: VerificationDocumentType
  ): Promise<VerificationProfile> {
    await delay(200);
    const profile = getOrCreateProfile(driverId);
    profile.status = status;

    if (status === 'VERIFIED') {
      profile.reviewedAt = new Date().toISOString();
      profile.rejectionReason = undefined;
      profile.rejectedDocumentType = undefined;
      Object.values(profile.documents).forEach((doc) => {
        doc.status = 'UPLOADED';
        if (!doc.uri) {
          doc.uri = SAMPLE_DOCS.selfie;
          doc.fileName = `${doc.type.toLowerCase()}_sample.jpg`;
          doc.mimeType = 'image/jpeg';
        }
      });
    } else if (status === 'REJECTED') {
      const target = rejectedDocType || 'VEHICLE_INSURANCE';
      profile.rejectionReason =
        rejectionReason || 'Vehicle Insurance policy is expired. Please replace.';
      profile.rejectedDocumentType = target;
      if (profile.documents[target]) {
        profile.documents[target].status = 'REJECTED';
        profile.documents[target].rejectionReason = profile.rejectionReason;
      }
    }

    return JSON.parse(JSON.stringify(profile));
  },
};

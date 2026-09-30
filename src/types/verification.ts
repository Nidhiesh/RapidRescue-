/**
 * RapidRescue Driver Mobile App - Verification Data Models
 */

export type VerificationDocumentType =
  | 'DRIVING_LICENSE'
  | 'GOVERNMENT_ID'
  | 'DRIVER_SELFIE'
  | 'AMBULANCE_REGISTRATION'
  | 'AMBULANCE_PERMIT'
  | 'VEHICLE_INSURANCE';

export type DocumentCategory = 'DRIVER' | 'AMBULANCE';

export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'REJECTED';

export type VerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export interface VerificationDocument {
  id: string;
  type: VerificationDocumentType;
  name: string;
  category: DocumentCategory;
  description: string;
  status: DocumentStatus;
  uri?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  rejectionReason?: string;
}

export interface VerificationProfile {
  driverId: string;
  driverName?: string;
  mobileNumber?: string;
  email?: string;
  yearsOfExperience?: number;
  status: VerificationStatus;
  documents: Record<VerificationDocumentType, VerificationDocument>;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  rejectedDocumentType?: VerificationDocumentType;
}

export interface DocumentUploadPayload {
  uri: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

export interface VerificationSummaryStats {
  pendingCount: number;
  underReviewCount: number;
  verifiedCount: number;
  rejectedCount: number;
  totalDriversCount: number;
}

export interface DriverVerificationSummary {
  driverId: string;
  driverName: string;
  mobileNumber: string;
  status: VerificationStatus;
  documentsCount: number;
  totalRequired: number;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

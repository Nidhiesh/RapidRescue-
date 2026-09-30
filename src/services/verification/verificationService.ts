/**
 * RapidRescue Driver Mobile App - Verification Service Abstraction Layer
 * Interfaces driver credentials and ambulance compliance records with central review.
 * Conforms to RapidRescue FastAPI verification and document upload contracts.
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
import { isMockEnabled, resolveBackendMediaUrl } from '../../config/apiConfig';
import { apiClient } from '../api/apiClient';
import { isApiError } from '../api/apiError';
import { tokenStorage } from '../auth/tokenStorage';
import { mockVerificationService } from './mockVerificationService';
import { driverService } from '../driver/driverService';
import { createInitialDocumentsMap } from '../../constants';

export interface IVerificationService {
  // Driver Operations
  getVerificationProfile(driverId: string): Promise<VerificationProfile>;
  uploadDocument(
    driverId: string,
    docType: VerificationDocumentType,
    payload: DocumentUploadPayload
  ): Promise<VerificationDocument>;
  removeDocument(driverId: string, docType: VerificationDocumentType): Promise<VerificationDocument>;
  submitForReview(driverId: string): Promise<VerificationProfile>;
  resubmit(driverId: string): Promise<VerificationProfile>;

  // Admin Review Operations
  getVerificationSummaryStats(): Promise<VerificationSummaryStats>;
  getPendingDrivers(): Promise<DriverVerificationSummary[]>;
  getAllDrivers(): Promise<DriverVerificationSummary[]>;
  startReview(driverId: string, adminId: string): Promise<VerificationProfile>;
  approveDriver(driverId: string, adminId: string): Promise<VerificationProfile>;
  rejectDriver(
    driverId: string,
    adminId: string,
    reason: string,
    rejectedDocType?: VerificationDocumentType
  ): Promise<VerificationProfile>;

  // Development simulator helper
  setMockVerificationStatus(
    driverId: string,
    status: VerificationStatus,
    rejectionReason?: string,
    rejectedDocType?: VerificationDocumentType
  ): Promise<VerificationProfile>;
}

class VerificationService implements IVerificationService {
  async getVerificationProfile(driverId: string): Promise<VerificationProfile> {
    const token = await tokenStorage.getToken();
    const isAdmin = token && token.startsWith('admin_session_');

    if (isMockEnabled() || isAdmin) {
      return mockVerificationService.getVerificationProfile(driverId);
    }

    const defaultDocs = createInitialDocumentsMap();

    try {
      // 1. Try GET /api/v1/drivers/me/verification
      const response = await apiClient.get<any>('/api/v1/drivers/me/verification');
      const data = response.data || {};

      const rawStatus = String(data?.verificationStatus || data?.status || '').toUpperCase();
      const status: VerificationStatus =
        rawStatus === 'VERIFIED' || rawStatus === 'PENDING' || rawStatus === 'UNDER_REVIEW' || rawStatus === 'REJECTED'
          ? (rawStatus as VerificationStatus)
          : data?.isVerified
          ? 'VERIFIED'
          : 'NOT_SUBMITTED';

      // Map backend documents (supports array or dictionary responses)
      const docs = { ...defaultDocs };
      const rawDocList: any[] = Array.isArray(data.documents)
        ? data.documents
        : data.documents && typeof data.documents === 'object'
        ? Object.values(data.documents)
        : [];

      rawDocList.forEach((d: any) => {
        const typeKey = String(d.documentType || d.document_type || d.type || '').toUpperCase() as VerificationDocumentType;
        if (typeKey && docs[typeKey]) {
          const rawUrl = d.fileUrl || d.file_url || d.url || d.uri;
          const isAmbulanceDoc = typeKey.startsWith('AMBULANCE') || typeKey === 'VEHICLE_INSURANCE';
          docs[typeKey] = {
            id: d.id || docs[typeKey].id,
            type: typeKey,
            name: d.fileName || d.file_name || docs[typeKey].name,
            category: (d.category as any) || (isAmbulanceDoc ? 'AMBULANCE' : 'DRIVER'),
            description: docs[typeKey].description,
            status: (String(d.status || 'UPLOADED').toUpperCase() as any),
            uri: rawUrl ? resolveBackendMediaUrl(rawUrl) : docs[typeKey].uri,
            fileName: d.fileName || d.file_name || docs[typeKey].fileName,
            mimeType: d.mimeType || d.mime_type || docs[typeKey].mimeType,
            size: d.fileSizeBytes ?? d.file_size_bytes ?? d.size ?? docs[typeKey].size,
            uploadedAt: d.uploadedAt || d.uploaded_at || docs[typeKey].uploadedAt,
            rejectionReason: d.rejectionReason || d.rejection_reason || undefined,
          };
        }
      });

      // Hydrate profile demographics
      let driverName = data?.fullName || data?.name || 'Ambulance Driver';
      let mobileNumber = data?.mobileNumber;
      let email = data?.email;
      let yearsOfExperience = data?.yearsOfExperience;

      try {
        const driverProfile = await driverService.getProfile(driverId);
        if (driverProfile) {
          driverName = driverProfile.fullName || driverName;
          mobileNumber = driverProfile.mobileNumber || mobileNumber;
          email = driverProfile.email || email;
          yearsOfExperience = driverProfile.yearsOfExperience ?? yearsOfExperience;
        }
      } catch {
        // Driver profile retrieval optional
      }

      return {
        driverId: data?.driverId || data?.id || driverId,
        driverName,
        mobileNumber,
        email,
        yearsOfExperience,
        status,
        documents: docs,
        submittedAt: data?.submittedAt || data?.submitted_at,
        reviewedAt: data?.reviewedAt || data?.reviewed_at,
        reviewedBy: data?.reviewedBy || data?.reviewed_by,
        rejectionReason: data?.rejectionReason || data?.rejection_reason,
        rejectedDocumentType: data?.rejectedDocumentType || data?.rejected_document_type,
      };
    } catch {
      // 2. Fall back to driverService.getProfile()
      try {
        const driverProfile = await driverService.getProfile(driverId);
        const status: VerificationStatus =
          driverProfile.verificationStatus || (driverProfile.isVerified ? 'VERIFIED' : 'NOT_SUBMITTED');

        return {
          driverId: driverProfile.id || driverId,
          driverName: driverProfile.fullName,
          mobileNumber: driverProfile.mobileNumber,
          email: driverProfile.email,
          yearsOfExperience: driverProfile.yearsOfExperience,
          status,
          documents: defaultDocs,
        };
      } catch (err: unknown) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to retrieve verification profile from dispatch server.'
        );
      }
    }
  }

  async uploadDocument(
    driverId: string,
    docType: VerificationDocumentType,
    payload: DocumentUploadPayload
  ): Promise<VerificationDocument> {
    if (isMockEnabled()) {
      return mockVerificationService.uploadDocument(driverId, docType, payload);
    }

    try {
      const formData = new FormData();
      formData.append('document_type', docType);

      const fileName = payload.fileName || `${docType.toLowerCase()}.jpg`;
      const mimeType = payload.mimeType || 'image/jpeg';

      if (payload.uri.startsWith('http://') || payload.uri.startsWith('https://')) {
        try {
          const resp = await fetch(payload.uri);
          const blob = await resp.blob();
          formData.append('file', blob, fileName);
        } catch {
          formData.append('file', {
            uri: payload.uri,
            name: fileName,
            type: mimeType,
          } as any);
        }
      } else {
        formData.append('file', {
          uri: payload.uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      const res = await apiClient.post<any>('/api/v1/drivers/me/documents', formData);
      const resData = res.data || {};

      const isAmbulanceDoc =
        docType.startsWith('AMBULANCE') || docType === 'VEHICLE_INSURANCE';

      const fileUrl = resData.fileUrl || resData.file_url;
      const resolvedUri = fileUrl ? resolveBackendMediaUrl(fileUrl) : payload.uri;

      return {
        id: resData.id || `DOC-${Date.now()}`,
        type: docType,
        name: resData.fileName || fileName,
        category: (resData.category as any) || (isAmbulanceDoc ? 'AMBULANCE' : 'DRIVER'),
        description: fileName,
        status: (String(resData.status || 'UPLOADED').toUpperCase() as any),
        uri: resolvedUri,
        fileName: resData.fileName || fileName,
        mimeType: resData.mimeType || mimeType,
        size: resData.fileSizeBytes ?? payload.size,
        uploadedAt: resData.uploadedAt || new Date().toISOString(),
      };
    } catch (err: unknown) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to upload document to dispatch server.'
      );
    }
  }

  async removeDocument(
    driverId: string,
    docType: VerificationDocumentType
  ): Promise<VerificationDocument> {
    if (isMockEnabled()) {
      return mockVerificationService.removeDocument(driverId, docType);
    }
    const defaultDocs = createInitialDocumentsMap();
    return defaultDocs[docType];
  }

  async submitForReview(driverId: string): Promise<VerificationProfile> {
    if (isMockEnabled()) {
      return mockVerificationService.submitForReview(driverId);
    }

    await apiClient.post('/api/v1/drivers/me/verification/submit');
    return this.getVerificationProfile(driverId);
  }

  async resubmit(driverId: string): Promise<VerificationProfile> {
    return this.submitForReview(driverId);
  }

  async getVerificationSummaryStats(): Promise<VerificationSummaryStats> {
    return mockVerificationService.getVerificationSummaryStats();
  }

  async getPendingDrivers(): Promise<DriverVerificationSummary[]> {
    return mockVerificationService.getPendingDrivers();
  }

  async getAllDrivers(): Promise<DriverVerificationSummary[]> {
    return mockVerificationService.getAllDrivers();
  }

  async startReview(driverId: string, adminId: string): Promise<VerificationProfile> {
    if (isMockEnabled()) {
      return mockVerificationService.startReview(driverId, adminId);
    }

    try {
      await apiClient.post(`/api/v1/admin/drivers/${driverId}/verification/start-review`);
    } catch (err: unknown) {
      if (isApiError(err) && err.status === 404 && mockVerificationService.hasDriver?.(driverId)) {
        return mockVerificationService.startReview(driverId, adminId);
      }
      throw err;
    }

    const mockProfile = await mockVerificationService.startReview(driverId, adminId);
    return {
      ...mockProfile,
      driverId,
      status: 'UNDER_REVIEW',
      reviewedBy: adminId,
    };
  }

  async approveDriver(driverId: string, adminId: string): Promise<VerificationProfile> {
    if (isMockEnabled()) {
      return mockVerificationService.approveDriver(driverId, adminId);
    }

    try {
      await apiClient.post(`/api/v1/admin/drivers/${driverId}/verification/approve`);
    } catch (err: unknown) {
      if (isApiError(err) && err.status === 404 && mockVerificationService.hasDriver?.(driverId)) {
        return mockVerificationService.approveDriver(driverId, adminId);
      }
      throw err;
    }

    const mockProfile = await mockVerificationService.approveDriver(driverId, adminId);
    return {
      ...mockProfile,
      driverId,
      status: 'VERIFIED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
    };
  }

  async rejectDriver(
    driverId: string,
    adminId: string,
    reason: string,
    rejectedDocType?: VerificationDocumentType
  ): Promise<VerificationProfile> {
    if (isMockEnabled()) {
      return mockVerificationService.rejectDriver(driverId, adminId, reason, rejectedDocType);
    }

    try {
      await apiClient.post(`/api/v1/admin/drivers/${driverId}/verification/reject`, {
        rejectionReason: reason,
        rejectedDocumentType: rejectedDocType || null,
      });
    } catch (err: unknown) {
      if (isApiError(err) && err.status === 404 && mockVerificationService.hasDriver?.(driverId)) {
        return mockVerificationService.rejectDriver(driverId, adminId, reason, rejectedDocType);
      }
      throw err;
    }

    const mockProfile = await mockVerificationService.rejectDriver(driverId, adminId, reason, rejectedDocType);
    return {
      ...mockProfile,
      driverId,
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedDocumentType: rejectedDocType,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
    };
  }

  async setMockVerificationStatus(
    driverId: string,
    status: VerificationStatus,
    rejectionReason?: string,
    rejectedDocType?: VerificationDocumentType
  ): Promise<VerificationProfile> {
    return mockVerificationService.setMockVerificationStatus(
      driverId,
      status,
      rejectionReason,
      rejectedDocType
    );
  }
}

export const verificationService: IVerificationService = new VerificationService();

export * from './mockVerificationService';

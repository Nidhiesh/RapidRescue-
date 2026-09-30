/**
 * RapidRescue Driver Mobile App - Document Verification Constants
 */

import { VerificationDocumentType, VerificationDocument } from '../types';

export const LEGAL_VERIFICATION_DISCLAIMER =
  'Document submission does not constitute official government verification. Verification is subject to review by authorized RapidRescue administrators.';

export const REQUIRED_DOCUMENT_DEFINITIONS: Record<
  VerificationDocumentType,
  {
    name: string;
    category: 'DRIVER' | 'AMBULANCE';
    description: string;
    allowedMimeTypes: string[];
    maxSizeBytes: number;
    allowCamera: boolean;
  }
> = {
  DRIVING_LICENSE: {
    name: 'Driving Licence',
    category: 'DRIVER',
    description:
      'Valid Commercial / Heavy Motor Vehicle (HMV) driving licence with emergency badge endorsement.',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowCamera: true,
  },
  GOVERNMENT_ID: {
    name: 'Government ID Proof',
    category: 'DRIVER',
    description:
      'Valid government-issued national identity document (Aadhaar, Voter ID, or Passport).',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    allowCamera: true,
  },
  DRIVER_SELFIE: {
    name: 'Driver Photo / Selfie',
    category: 'DRIVER',
    description:
      'Clear front-facing recent photograph or selfie in official ambulance responder uniform.',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 10 * 1024 * 1024,
    allowCamera: true,
  },
  AMBULANCE_REGISTRATION: {
    name: 'Ambulance Registration (RC)',
    category: 'AMBULANCE',
    description:
      'Official vehicle Registration Certificate showing emergency ambulance classification.',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    allowCamera: true,
  },
  AMBULANCE_PERMIT: {
    name: 'Ambulance Permit & Fitness',
    category: 'AMBULANCE',
    description:
      'Valid regional transport permit and roadworthiness fitness certificate for the ambulance.',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    allowCamera: true,
  },
  VEHICLE_INSURANCE: {
    name: 'Vehicle Insurance Policy',
    category: 'AMBULANCE',
    description:
      'Active commercial motor insurance policy covering third-party liabilities and passengers.',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024,
    allowCamera: true,
  },
};

export const createInitialDocumentsMap = (): Record<
  VerificationDocumentType,
  VerificationDocument
> => {
  const map: Partial<Record<VerificationDocumentType, VerificationDocument>> = {};

  (Object.keys(REQUIRED_DOCUMENT_DEFINITIONS) as VerificationDocumentType[]).forEach((type) => {
    const def = REQUIRED_DOCUMENT_DEFINITIONS[type];
    map[type] = {
      id: `doc_${type.toLowerCase()}`,
      type,
      name: def.name,
      category: def.category,
      description: def.description,
      status: 'NOT_UPLOADED',
    };
  });

  return map as Record<VerificationDocumentType, VerificationDocument>;
};

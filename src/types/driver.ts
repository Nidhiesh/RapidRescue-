/**
 * RapidRescue Driver Mobile App - Driver Profile & Registration Types
 */

export interface DriverRegistrationData {
  // Section 1: Personal Details
  fullName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;

  // Section 2: Account Security
  password: string;
  confirmPassword: string;

  // Section 3: Basic Driver Information
  driverIdPlaceholder: string;
  yearsOfExperience: string;
}

export interface DriverProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  yearsOfExperience: number;
  isVerified: boolean;
}

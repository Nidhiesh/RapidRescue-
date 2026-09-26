/**
 * RapidRescue Driver Mobile App - Color Tokens
 * Emergency Service Palette tailored for high-contrast visibility and fast cognitive recognition.
 */
export const Colors = {
  // Brand & Core
  primary: '#E11D48', // Emergency Red / Crimson
  primaryHover: '#BE123C',
  primaryMuted: 'rgba(225, 29, 72, 0.15)',

  secondary: '#0284C7', // EMS Blue
  secondaryMuted: 'rgba(2, 132, 199, 0.15)',

  // Background & Surfaces
  background: '#0B1120', // Deep Night Dark Background
  surface: '#131D31', // Card / Module Surface
  surfaceElevated: '#1E293B', // Floating cards / modals
  surfaceHighlight: '#273549', // Borders & active state fills

  // Typography
  text: '#F8FAFC', // High-contrast primary text
  textSecondary: '#94A3B8', // Supporting / subtitle text
  textMuted: '#64748B', // Captions, timestamps, disabled labels
  textInverse: '#0B1120', // Inverted text on bright buttons

  // Status & Emergency Semantics
  success: '#10B981', // Verified, On-duty, Accepted
  successMuted: 'rgba(16, 185, 129, 0.15)',

  warning: '#F59E0B', // Pending review, Arriving shortly
  warningMuted: 'rgba(245, 158, 11, 0.15)',

  error: '#EF4444', // Rejection, Validation failure
  errorMuted: 'rgba(239, 68, 68, 0.15)',

  critical: '#DC2626', // Critical SOS dispatch alert
  criticalMuted: 'rgba(220, 38, 38, 0.2)',

  // Borders & Dividers
  border: '#1E293B',
  borderLight: '#334155',
} as const;

export type ColorToken = keyof typeof Colors;

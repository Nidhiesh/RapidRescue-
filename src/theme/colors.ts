/**
 * RapidRescue Driver Mobile App - Color Tokens
 * High-Visibility White & Emergency Red Medical Theme.
 * Tailored for ambulance dispatch, maximum daylight contrast, and emergency response.
 */
export const Colors = {
  // Brand & Core - Bold Medical Emergency Red
  primary: '#DC2626', // Emergency Red / Crimson
  primaryHover: '#B91C1C', // Darker Red for pressed states
  primaryMuted: 'rgba(220, 38, 38, 0.08)', // Soft red tint for badges and highlights

  secondary: '#0284C7', // EMS Blue
  secondaryMuted: 'rgba(2, 132, 199, 0.08)',

  // Background & Surfaces - Crisp Sterile White & Off-White
  background: '#FFFFFF', // Clean Pure White Background
  surface: '#F8FAFC', // Ultra-clean light surface for cards & inputs
  surfaceElevated: '#FFFFFF', // Elevated white cards
  surfaceHighlight: '#F1F5F9', // Subtle gray hover / highlight state

  // Typography - High Contrast Dark Slate
  text: '#0F172A', // Deep Slate / Near-Black for high-contrast readability
  textSecondary: '#475569', // Supporting / subtitle text
  textMuted: '#64748B', // Captions, timestamps, disabled labels
  textInverse: '#FFFFFF', // Pure white text on red buttons and badges

  // Status & Emergency Semantics
  success: '#16A34A', // Verified, On-duty, Available
  successMuted: 'rgba(22, 163, 74, 0.1)',

  warning: '#D97706', // Pending review, Arriving shortly
  warningMuted: 'rgba(217, 119, 6, 0.1)',

  error: '#DC2626', // Rejection, Validation failure
  errorMuted: 'rgba(220, 38, 38, 0.1)',

  critical: '#DC2626', // Critical SOS dispatch alert
  criticalMuted: 'rgba(220, 38, 38, 0.12)',

  // Borders & Dividers
  border: '#E2E8F0', // Crisp light border
  borderLight: '#F1F5F9', // Soft divider
} as const;

export type ColorToken = keyof typeof Colors;

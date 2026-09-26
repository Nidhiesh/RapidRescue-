/**
 * RapidRescue Driver Mobile App - Form Validation Utilities
 */

/**
 * Validates 10-digit mobile number format (e.g., 9876543210)
 */
export const isValidMobile = (mobile: string): boolean => {
  const cleaned = mobile.replace(/\s+/g, '').replace(/[-+]/g, '');
  // Matches 10 digits or 10 digits prefixed with 91/0
  const mobileRegex = /^(\+?91|0)?[6-9]\d{9}$/;
  return mobileRegex.test(cleaned);
};

/**
 * Validates standard email address format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password strength (minimum 6 characters)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Checks if a string contains non-whitespace text
 */
export const isNonEmpty = (text: string): boolean => {
  return text.trim().length > 0;
};

/**
 * Validates numeric experience
 */
export const isValidExperience = (exp: string): boolean => {
  const num = Number(exp);
  return !isNaN(num) && num >= 0 && num <= 50;
};

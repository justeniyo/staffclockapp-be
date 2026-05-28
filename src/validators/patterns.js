/**
 * Shared validation patterns and custom validators.
 * Standards followed:
 *   - Names: Unicode letters, spaces, hyphens, apostrophes, periods (2-100 chars)
 *   - Phone: ITU-T E.164 — 7-15 digits, optional + prefix, formatting allowed
 *   - Password: NIST SP 800-63B — min 8, max 128, upper+lower+digit+special
 *   - Email: RFC 5322 via express-validator isEmail()
 */

// Allows Unicode letters (accented, CJK, Arabic, etc.), spaces, hyphens, apostrophes, periods
// Covers: O'Brien, Jean-Pierre, María José, Dr. Smith, Müller, 田中
export const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}'\-.\s]*$/u;
export const NAME_MIN = 2;
export const NAME_MAX = 100;

// E.164: strip formatting, require 7-15 digits, optional leading +
// Accepts: +250788888888, (555) 123-4567, +1 234 567 8900
export const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;
export const PHONE_DIGIT_MIN = 7;
export const PHONE_DIGIT_MAX = 15;

// NIST SP 800-63B compliant
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/**
 * Custom validator: ensures a phone number has enough actual digits.
 * @param {string} value - Phone number string
 * @returns {boolean}
 */
export function hasEnoughDigits(value) {
  const digitCount = (value.match(/\d/g) || []).length;
  return digitCount >= PHONE_DIGIT_MIN && digitCount <= PHONE_DIGIT_MAX;
}

/**
 * Custom validator: ensures name contains only valid characters.
 * @param {string} value - Name string
 * @returns {boolean}
 */
export function isValidName(value) {
  return NAME_REGEX.test(value);
}

/**
 * Custom validator: ensures endDate is on or after startDate.
 * @param {string} endDate
 * @param {{ req: object }} context
 * @returns {boolean}
 */
export function isEndDateAfterStart(endDate, { req }) {
  const start = new Date(req.body.startDate || req.query?.startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return true; // let isISO8601 handle format
  if (end < start) throw new Error('End date must be on or after start date');
  return true;
}

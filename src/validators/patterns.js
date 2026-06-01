import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

// Shared validation rules. Standards: Unicode names (2-100), ITU-T E.164 phones,
// NIST SP 800-63B passwords, RFC 5322 emails.

export const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}'\-.\s]*$/u;
export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const DEFAULT_PHONE_REGION = 'RW';

export function isValidName(value) {
  return NAME_REGEX.test(value);
}

export function isValidPhone(value) {
  if (!value) return false;
  return isValidPhoneNumber(value, DEFAULT_PHONE_REGION);
}

// Normalise to E.164 ("0788123456" → "+250788123456"). Returns null if invalid.
export function normalisePhone(value) {
  if (!value) return null;
  const parsed = parsePhoneNumberFromString(value, DEFAULT_PHONE_REGION);
  return parsed?.isValid() ? parsed.number : null;
}

export function isEndDateAfterStart(endDate, { req }) {
  const start = new Date(req.body.startDate || req.query?.startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
  if (end < start) throw new Error('End date must be on or after start date');
  return true;
}

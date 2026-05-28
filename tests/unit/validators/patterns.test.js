import { expect } from 'chai';
import {
  NAME_REGEX,
  PHONE_REGEX,
  isValidName,
  hasEnoughDigits,
  isEndDateAfterStart,
} from '../../../src/validators/patterns.js';

describe('Validation Patterns', () => {
  describe('NAME_REGEX / isValidName', () => {
    const valid = [
      'Alice',
      'Jean-Pierre',
      "O'Brien",
      'María José',
      'Dr. Smith',
      'Müller',
      'Élodie',
      'Анна',          // Cyrillic
      '田中',           // CJK
      'Al',            // minimum 2 chars
      'Mary Anne',     // space
      "D'Arcy-Smith",  // apostrophe + hyphen combo
    ];

    const invalid = [
      '',              // empty
      'A',             // too short (1 char — but regex only checks pattern, length is separate)
      '123',           // digits only
      '@lice',         // starts with special
      'Bob!',          // exclamation
      'test@user',     // at sign
      'Name<script>',  // HTML injection
      '-Name',         // starts with hyphen
      "'Name",         // starts with apostrophe
    ];

    valid.forEach((name) => {
      it(`should accept valid name: "${name}"`, () => {
        expect(isValidName(name)).to.be.true;
      });
    });

    invalid.forEach((name) => {
      it(`should reject invalid name: "${name}"`, () => {
        expect(isValidName(name)).to.be.false;
      });
    });
  });

  describe('PHONE_REGEX / hasEnoughDigits', () => {
    const validPhones = [
      { input: '+250788888888',    digits: 12 },
      { input: '+1 234 567 8900',  digits: 11 },
      { input: '(555) 123-4567',   digits: 10 },
      { input: '0788888888',       digits: 10 },
      { input: '+44 20 7946 0958', digits: 11 },
      { input: '1234567',          digits: 7  },  // minimum
    ];

    const invalidPhones = [
      { input: '123',              reason: 'too few digits (3)' },
      { input: '12345',            reason: 'too few digits (5)' },
      { input: '(((((',            reason: 'no digits at all' },
      { input: '---',              reason: 'no digits' },
      { input: '+',                reason: 'just a plus sign' },
      { input: '',                 reason: 'empty' },
    ];

    validPhones.forEach(({ input, digits }) => {
      it(`should accept "${input}" (${digits} digits)`, () => {
        expect(PHONE_REGEX.test(input)).to.be.true;
        expect(hasEnoughDigits(input)).to.be.true;
      });
    });

    invalidPhones.forEach(({ input, reason }) => {
      it(`should reject "${input}" — ${reason}`, () => {
        // Either regex fails or digit count is wrong
        const regexOk = PHONE_REGEX.test(input);
        const digitsOk = hasEnoughDigits(input);
        expect(regexOk && digitsOk).to.be.false;
      });
    });

    it('should reject phone with > 15 digits', () => {
      const longPhone = '1234567890123456'; // 16 digits
      expect(hasEnoughDigits(longPhone)).to.be.false;
    });
  });

  describe('isEndDateAfterStart', () => {
    it('should accept endDate equal to startDate', () => {
      const req = { body: { startDate: '2025-06-01' } };
      expect(isEndDateAfterStart('2025-06-01', { req })).to.be.true;
    });

    it('should accept endDate after startDate', () => {
      const req = { body: { startDate: '2025-06-01' } };
      expect(isEndDateAfterStart('2025-06-05', { req })).to.be.true;
    });

    it('should reject endDate before startDate', () => {
      const req = { body: { startDate: '2025-06-10' } };
      expect(() => isEndDateAfterStart('2025-06-05', { req })).to.throw('End date must be on or after start date');
    });

    it('should pass through if startDate is invalid (let isISO8601 handle it)', () => {
      const req = { body: { startDate: 'not-a-date' } };
      expect(isEndDateAfterStart('2025-06-05', { req })).to.be.true;
    });
  });
});

import { expect } from 'chai';
import {
  isValidName,
  isValidPhone,
  normalisePhone,
  isEndDateAfterStart,
} from '../../../src/validators/patterns.js';

describe('Validation Patterns', () => {
  describe('isValidName', () => {
    const valid = [
      'Alice', 'Jean-Pierre', "O'Brien", 'María José', 'Dr. Smith',
      'Müller', 'Élodie', 'Анна', '田中', 'Al', 'Mary Anne', "D'Arcy-Smith",
    ];
    const invalid = [
      '', '123', '@lice', 'Bob!', 'test@user', 'Name<script>',
      '-Name', "'Name",
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

  describe('isValidPhone (libphonenumber)', () => {
    // Default region is RW. Numbers without "+" are parsed as Rwandan.
    const validPhones = [
      '+250788123456',     // E.164 Rwanda
      '+12025550123',      // E.164 US
      '+442079460958',     // E.164 UK
      '0788123456',        // local Rwanda
      '+250 788 123 456',  // formatted with spaces
      '+1 (202) 555-0123', // formatted US
    ];
    const invalidPhones = [
      '',
      '123',           // too short
      '+',             // just a plus
      '(((((',         // no digits
      'abcdefghij',    // letters
      '12345',         // not a real number
      '+999999999999', // impossible country code
    ];

    validPhones.forEach((p) => {
      it(`should accept "${p}"`, () => {
        expect(isValidPhone(p)).to.be.true;
      });
    });

    invalidPhones.forEach((p) => {
      it(`should reject "${p}"`, () => {
        expect(isValidPhone(p)).to.be.false;
      });
    });
  });

  describe('normalisePhone (E.164)', () => {
    it('should normalise local Rwandan number to +250…', () => {
      expect(normalisePhone('0788123456')).to.equal('+250788123456');
    });

    it('should strip spaces from already-international number', () => {
      expect(normalisePhone('+250 788 123 456')).to.equal('+250788123456');
    });

    it('should keep a valid +1 US number', () => {
      expect(normalisePhone('+1 202 555 0123')).to.equal('+12025550123');
    });

    it('should return null for invalid input', () => {
      expect(normalisePhone('not-a-phone')).to.be.null;
      expect(normalisePhone('')).to.be.null;
      expect(normalisePhone(null)).to.be.null;
      expect(normalisePhone(undefined)).to.be.null;
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
      expect(() => isEndDateAfterStart('2025-06-05', { req }))
        .to.throw('End date must be on or after start date');
    });

    it('should pass through if startDate is invalid', () => {
      const req = { body: { startDate: 'not-a-date' } };
      expect(isEndDateAfterStart('2025-06-05', { req })).to.be.true;
    });
  });
});

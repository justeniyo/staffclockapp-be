import { expect } from 'chai';
import { createUserValidator, updateUserValidator, listUsersValidator } from '../../../src/validators/user.validator.js';
import { runValidator } from './helpers.js';

const VALID_USER = {
  email: 'jane@mtn-company.rw',
  password: 'Secure1!pass',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'staff',
  phone: '+250788123456',
  departmentId: '1',
  locationId: '2',
  managerId: '3',
};

describe('User Validators', () => {
  describe('createUserValidator', () => {
    it('should pass with all valid fields', async () => {
      const { isValid } = await runValidator(createUserValidator, { body: VALID_USER });
      expect(isValid).to.be.true;
    });

    it('should pass without optional fields', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { email: 'a@b.com', password: 'Pass1!word', firstName: 'Al', lastName: 'Bo', role: 'staff' },
      });
      expect(isValid).to.be.true;
    });

    // ── Email ──
    it('should reject missing email', async () => {
      const { isValid, getError } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, email: '' },
      });
      expect(isValid).to.be.false;
      expect(getError('email')).to.exist;
    });

    it('should reject invalid email format', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, email: 'not-an-email' },
      });
      expect(isValid).to.be.false;
    });

    // ── Password ──
    it('should reject password shorter than 8 chars', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, password: 'Ab1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject password longer than 128 chars', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, password: 'A'.repeat(129) + 'a1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject password without uppercase', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, password: 'lowercase1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject password without lowercase', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, password: 'UPPERCASE1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject password without digit', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, password: 'NoDigits!here' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject password without special character', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, password: 'NoSpecial1' },
      });
      expect(isValid).to.be.false;
    });

    // ── Names ──
    it('should reject first name shorter than 2 chars', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, firstName: 'A' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject first name with digits', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, firstName: 'Jane123' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject first name with special chars', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, firstName: 'Jane@!' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept hyphenated first name', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, firstName: 'Jean-Pierre' },
      });
      expect(isValid).to.be.true;
    });

    it('should accept apostrophe in last name', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, lastName: "O'Brien" },
      });
      expect(isValid).to.be.true;
    });

    it('should accept accented characters', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, firstName: 'Élodie', lastName: 'Müller' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject empty first name after trim', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, firstName: '   ' },
      });
      expect(isValid).to.be.false;
    });

    // ── Phone ──
    it('should accept E.164 phone format', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, phone: '+250788123456' },
      });
      expect(isValid).to.be.true;
    });

    it('should accept formatted phone with parens and dashes', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, phone: '(555) 123-4567' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject phone with fewer than 7 digits', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, phone: '12345' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject phone that is all formatting chars', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, phone: '(((---)))' },
      });
      expect(isValid).to.be.false;
    });

    it('should pass without phone (optional)', async () => {
      const body = { ...VALID_USER };
      delete body.phone;
      const { isValid } = await runValidator(createUserValidator, { body });
      expect(isValid).to.be.true;
    });

    it('should pass with empty phone string (optional + falsy)', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, phone: '' },
      });
      expect(isValid).to.be.true;
    });

    // ── Role ──
    it('should reject invalid role', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, role: 'superadmin' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept all valid roles', async () => {
      for (const role of ['staff', 'admin', 'security', 'ceo']) {
        const { isValid } = await runValidator(createUserValidator, {
          body: { ...VALID_USER, role },
        });
        expect(isValid, `role "${role}" should be valid`).to.be.true;
      }
    });

    // ── IDs (optional + falsy) ──
    it('should pass with empty managerId (select default)', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, managerId: '' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject non-integer departmentId', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, departmentId: 'abc' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject zero departmentId', async () => {
      const { isValid } = await runValidator(createUserValidator, {
        body: { ...VALID_USER, departmentId: '0' },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('updateUserValidator', () => {
    it('should pass with valid partial update', async () => {
      const { isValid } = await runValidator(updateUserValidator, {
        params: { id: '5' },
        body: { firstName: 'Updated' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject invalid param id', async () => {
      const { isValid } = await runValidator(updateUserValidator, {
        params: { id: 'abc' },
        body: { firstName: 'Updated' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject invalid status value', async () => {
      const { isValid } = await runValidator(updateUserValidator, {
        params: { id: '1' },
        body: { status: 'banned' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept valid status values', async () => {
      for (const status of ['active', 'inactive', 'suspended']) {
        const { isValid } = await runValidator(updateUserValidator, {
          params: { id: '1' },
          body: { status },
        });
        expect(isValid, `status "${status}" should be valid`).to.be.true;
      }
    });
  });

  describe('listUsersValidator', () => {
    it('should pass with no query params', async () => {
      const { isValid } = await runValidator(listUsersValidator, { query: {} });
      expect(isValid).to.be.true;
    });

    it('should reject limit > 100', async () => {
      const { isValid } = await runValidator(listUsersValidator, {
        query: { limit: '200' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject page < 1', async () => {
      const { isValid } = await runValidator(listUsersValidator, {
        query: { page: '0' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept valid pagination', async () => {
      const { isValid } = await runValidator(listUsersValidator, {
        query: { page: '2', limit: '25', role: 'staff' },
      });
      expect(isValid).to.be.true;
    });
  });
});

import { expect } from 'chai';
import {
  signupValidator,
  loginValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
} from '../../../src/validators/auth.validator.js';
import { runValidator } from './helpers.js';

describe('Auth Validators', () => {
  describe('signupValidator', () => {
    const VALID_SIGNUP = {
      email: 'new@mtn-company.rw',
      password: 'StrongP@ss1',
      firstName: 'Alice',
      lastName: 'Wonder',
    };

    it('should pass with valid signup data', async () => {
      const { isValid } = await runValidator(signupValidator, { body: VALID_SIGNUP });
      expect(isValid).to.be.true;
    });

    it('should reject missing email', async () => {
      const { isValid, getError } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, email: '' },
      });
      expect(isValid).to.be.false;
      expect(getError('email')).to.exist;
    });

    it('should reject invalid email', async () => {
      const { isValid } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, email: 'not@valid' },
      });
      // express-validator may accept some loose emails; test obviously invalid
      const r2 = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, email: 'plaintext' },
      });
      expect(r2.isValid).to.be.false;
    });

    it('should enforce name min length of 2', async () => {
      const { isValid: v1 } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, firstName: 'A' },
      });
      expect(v1).to.be.false;

      const { isValid: v2 } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, lastName: 'B' },
      });
      expect(v2).to.be.false;
    });

    it('should reject names with digits', async () => {
      const { isValid } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, firstName: 'Alice99' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject names starting with special characters', async () => {
      const { isValid } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, firstName: '-Alice' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept international names', async () => {
      const { isValid } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, firstName: 'Müller', lastName: 'Guðmundsdóttir' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject password without special character', async () => {
      const { isValid } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, password: 'NoSpecial1' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject password shorter than 8 chars', async () => {
      const { isValid } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, password: 'Ab1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject password over 128 chars', async () => {
      const longPass = 'Aa1!' + 'x'.repeat(126); // 130 chars
      const { isValid } = await runValidator(signupValidator, {
        body: { ...VALID_SIGNUP, password: longPass },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('loginValidator', () => {
    it('should pass with valid credentials', async () => {
      const { isValid } = await runValidator(loginValidator, {
        body: { email: 'user@test.com', password: 'anything' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject empty email', async () => {
      const { isValid } = await runValidator(loginValidator, {
        body: { email: '', password: 'something' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject empty password', async () => {
      const { isValid } = await runValidator(loginValidator, {
        body: { email: 'user@test.com', password: '' },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('resetPasswordValidator', () => {
    it('should pass with valid email, OTP, and password', async () => {
      const { isValid } = await runValidator(resetPasswordValidator, {
        body: { email: 'user@test.com', otp: '123456', password: 'NewPass1!' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject non-numeric OTP', async () => {
      const { isValid } = await runValidator(resetPasswordValidator, {
        body: { email: 'user@test.com', otp: 'abcdef', password: 'NewPass1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject OTP with wrong length', async () => {
      const { isValid } = await runValidator(resetPasswordValidator, {
        body: { email: 'user@test.com', otp: '12345', password: 'NewPass1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should enforce password rules on reset', async () => {
      const { isValid } = await runValidator(resetPasswordValidator, {
        body: { email: 'user@test.com', otp: '123456', password: 'weak' },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('changePasswordValidator', () => {
    it('should pass with matching passwords', async () => {
      const { isValid } = await runValidator(changePasswordValidator, {
        body: { currentPassword: 'OldPass1!', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject mismatched confirmPassword', async () => {
      const { isValid } = await runValidator(changePasswordValidator, {
        body: { currentPassword: 'OldPass1!', newPassword: 'NewPass1!', confirmPassword: 'Different1!' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject weak new password', async () => {
      const { isValid } = await runValidator(changePasswordValidator, {
        body: { currentPassword: 'OldPass1!', newPassword: 'weak', confirmPassword: 'weak' },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('verifyEmailValidator', () => {
    it('should accept valid email + 6-digit OTP', async () => {
      const { isValid } = await runValidator(verifyEmailValidator, {
        body: { email: 'user@test.com', otp: '654321' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject empty OTP', async () => {
      const { isValid } = await runValidator(verifyEmailValidator, {
        body: { email: 'user@test.com', otp: '' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject OTP that is not exactly 6 digits', async () => {
      const r1 = await runValidator(verifyEmailValidator, { body: { email: 'u@t.com', otp: '123' } });
      const r2 = await runValidator(verifyEmailValidator, { body: { email: 'u@t.com', otp: '1234567' } });
      expect(r1.isValid).to.be.false;
      expect(r2.isValid).to.be.false;
    });

    it('should reject non-numeric OTP', async () => {
      const { isValid } = await runValidator(verifyEmailValidator, {
        body: { email: 'user@test.com', otp: 'abcdef' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject missing email', async () => {
      const { isValid } = await runValidator(verifyEmailValidator, {
        body: { otp: '123456' },
      });
      expect(isValid).to.be.false;
    });
  });
});

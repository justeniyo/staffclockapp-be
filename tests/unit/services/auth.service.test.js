import { expect } from 'chai';
import sinon from 'sinon';
import AuthService from '../../../src/services/auth.service.js';
import emailService from '../../../src/emails/email.service.js';
import { createMockUser, hashPassword } from '../../setup.js';
import { USER_STATUS } from '../../../src/config/constants.js';

describe('AuthService', () => {
  let authService;
  let mockDb;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockDb = {
      User: {
        findOne: sandbox.stub(),
        findByPk: sandbox.stub(),
        create: sandbox.stub(),
      },
      Department: {},
      Location: {},
    };

    sandbox.stub(emailService, 'sendVerification').resolves();
    sandbox.stub(emailService, 'sendPasswordReset').resolves();
    sandbox.stub(emailService, 'sendWelcome').resolves();

    authService = new AuthService(mockDb);
  });

  afterEach(() => sandbox.restore());

  describe('signJwt', () => {
    it('should produce a valid 3-segment JWT', () => {
      const token = authService.signJwt(createMockUser());
      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.length(3);
    });
  });

  describe('generateOtp', () => {
    it('should return a 6-digit numeric string', () => {
      for (let i = 0; i < 20; i++) {
        expect(authService.generateOtp()).to.match(/^\d{6}$/);
      }
    });
  });

  describe('login', () => {
    it('should return token + user on successful login', async () => {
      const hashed = await hashPassword('Password123');
      const mockUser = {
        ...createMockUser({ password: hashed }),
        validatePassword: sandbox.stub().resolves(true),
        update: sandbox.stub().resolves(),
        toSafeObject: sandbox.stub().returns({ id: 1, email: 'test@staffclock.com' }),
      };
      mockDb.User.findOne.resolves(mockUser);

      const result = await authService.login('test@staffclock.com', 'Password123');
      expect(result.token).to.be.a('string');
      expect(result.user.email).to.equal('test@staffclock.com');
      expect(mockUser.update.calledOnce).to.be.true;
    });

    it('should reject unknown email', async () => {
      mockDb.User.findOne.resolves(null);
      try { await authService.login('nobody@test.com', 'pw'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.equal('Invalid credentials'); expect(err.statusCode).to.equal(401); }
    });

    it('should reject unverified email before password check', async () => {
      const mockUser = {
        ...createMockUser({ isVerified: false }),
        validatePassword: sandbox.stub().resolves(true),
      };
      mockDb.User.findOne.resolves(mockUser);
      try { await authService.login('test@staffclock.com', 'Password123'); expect.fail('Should throw'); }
      catch (err) {
        expect(err.message).to.match(/verify your email/i);
        expect(err.statusCode).to.equal(403);
        expect(mockUser.validatePassword.called).to.be.false;
      }
    });

    it('should reject inactive (verified) user', async () => {
      const mockUser = {
        ...createMockUser({ status: USER_STATUS.INACTIVE }),
        validatePassword: sandbox.stub().resolves(true),
      };
      mockDb.User.findOne.resolves(mockUser);
      try { await authService.login('test@staffclock.com', 'Password123'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.equal('Account is not active'); expect(err.statusCode).to.equal(403); }
    });

    it('should reject wrong password', async () => {
      const mockUser = { ...createMockUser(), validatePassword: sandbox.stub().resolves(false) };
      mockDb.User.findOne.resolves(mockUser);
      try { await authService.login('test@staffclock.com', 'wrong'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.equal('Invalid credentials'); expect(err.statusCode).to.equal(401); }
    });
  });

  describe('signup', () => {
    it('should create user, store a 6-digit OTP, and send verification email', async () => {
      mockDb.User.findOne.resolves(null);
      mockDb.User.create.resolves({ ...createMockUser({ isVerified: false }), update: sandbox.stub() });

      const result = await authService.signup({
        email: 'new@test.com', password: 'P1!', firstName: 'A', lastName: 'B',
      });

      expect(result.message).to.match(/verification code/i);
      expect(mockDb.User.create.calledOnce).to.be.true;
      const args = mockDb.User.create.firstCall.args[0];
      expect(args.verificationToken).to.match(/^\d{6}$/);
      expect(args.verificationExpires).to.be.instanceOf(Date);
      expect(emailService.sendVerification.calledOnce).to.be.true;
    });

    it('should reject duplicate email', async () => {
      mockDb.User.findOne.resolves(createMockUser());
      try { await authService.signup({ email: 't@t.com', password: 'P1!', firstName: 'A', lastName: 'B' }); expect.fail('Should throw'); }
      catch (err) { expect(err.statusCode).to.equal(409); }
    });
  });

  describe('verifyEmail (OTP)', () => {
    it('should activate user with correct OTP', async () => {
      const mockUser = {
        ...createMockUser({
          isVerified: false, status: USER_STATUS.INACTIVE,
          verificationToken: '123456',
          verificationExpires: new Date(Date.now() + 3600_000),
        }),
        update: sandbox.stub().resolves(),
      };
      mockDb.User.findOne.resolves(mockUser);

      const result = await authService.verifyEmail('test@staffclock.com', '123456');
      expect(result.message).to.match(/verified/i);
      const args = mockUser.update.firstCall.args[0];
      expect(args.isVerified).to.be.true;
      expect(args.status).to.equal(USER_STATUS.ACTIVE);
      expect(args.verificationToken).to.be.null;
      expect(emailService.sendWelcome.calledOnce).to.be.true;
    });

    it('should reject wrong OTP', async () => {
      mockDb.User.findOne.resolves(createMockUser({
        isVerified: false, verificationToken: '111111',
        verificationExpires: new Date(Date.now() + 3600_000),
      }));
      try { await authService.verifyEmail('t@t.com', '999999'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.match(/invalid/i); expect(err.statusCode).to.equal(400); }
    });

    it('should reject expired OTP', async () => {
      mockDb.User.findOne.resolves(createMockUser({
        isVerified: false, verificationToken: '123456',
        verificationExpires: new Date(Date.now() - 1000),
      }));
      try { await authService.verifyEmail('t@t.com', '123456'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.match(/expired/i); }
    });

    it('should reject if user already verified', async () => {
      mockDb.User.findOne.resolves(createMockUser({ verificationToken: '123456' }));
      try { await authService.verifyEmail('t@t.com', '123456'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.match(/already verified/i); }
    });

    it('should reject missing email or otp', async () => {
      try { await authService.verifyEmail('', '123456'); expect.fail('Should throw'); }
      catch (err) { expect(err.statusCode).to.equal(400); }
      try { await authService.verifyEmail('a@b.com', ''); expect.fail('Should throw'); }
      catch (err) { expect(err.statusCode).to.equal(400); }
    });
  });

  describe('resendVerification', () => {
    it('should generate fresh OTP and resend email for unverified user', async () => {
      const mockUser = { ...createMockUser({ isVerified: false }), update: sandbox.stub().resolves() };
      mockDb.User.findOne.resolves(mockUser);

      const result = await authService.resendVerification('test@staffclock.com');
      expect(result.message).to.match(/verification code/i);
      expect(mockUser.update.firstCall.args[0].verificationToken).to.match(/^\d{6}$/);
      expect(emailService.sendVerification.calledOnce).to.be.true;
    });

    it('should silently succeed for unknown email (anti-enumeration)', async () => {
      mockDb.User.findOne.resolves(null);
      const result = await authService.resendVerification('nobody@test.com');
      expect(result.message).to.match(/verification code/i);
      expect(emailService.sendVerification.called).to.be.false;
    });

    it('should silently succeed for already-verified user', async () => {
      mockDb.User.findOne.resolves(createMockUser());
      const result = await authService.resendVerification('test@staffclock.com');
      expect(result.message).to.match(/verification code/i);
      expect(emailService.sendVerification.called).to.be.false;
    });
  });

  describe('forgotPassword', () => {
    it('should set reset OTP with 15-min expiry and email it', async () => {
      const mockUser = { ...createMockUser(), update: sandbox.stub().resolves() };
      mockDb.User.findOne.resolves(mockUser);

      const result = await authService.forgotPassword('test@staffclock.com');
      expect(result.message).to.match(/password reset code/i);
      const args = mockUser.update.firstCall.args[0];
      expect(args.passwordResetToken).to.match(/^\d{6}$/);
      const minutes = (args.passwordResetExpires - Date.now()) / 60000;
      expect(minutes).to.be.greaterThan(10).and.lessThan(20);
      expect(emailService.sendPasswordReset.calledOnce).to.be.true;
    });

    it('should silently succeed for unknown email', async () => {
      mockDb.User.findOne.resolves(null);
      const result = await authService.forgotPassword('nobody@test.com');
      expect(result.message).to.match(/password reset code/i);
      expect(emailService.sendPasswordReset.called).to.be.false;
    });
  });

  describe('resetPassword (OTP)', () => {
    it('should update password and clear the token', async () => {
      const mockUser = {
        ...createMockUser({
          passwordResetToken: '654321',
          passwordResetExpires: new Date(Date.now() + 600_000),
        }),
        update: sandbox.stub().resolves(),
      };
      mockDb.User.findOne.resolves(mockUser);

      const result = await authService.resetPassword('test@staffclock.com', '654321', 'NewPass1!');
      expect(result.message).to.match(/password reset/i);
      const args = mockUser.update.firstCall.args[0];
      expect(args.password).to.equal('NewPass1!');
      expect(args.passwordResetToken).to.be.null;
    });

    it('should reject wrong OTP', async () => {
      mockDb.User.findOne.resolves(createMockUser({
        passwordResetToken: '111111',
        passwordResetExpires: new Date(Date.now() + 600_000),
      }));
      try { await authService.resetPassword('t@t.com', '999999', 'NewPass1!'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.match(/invalid/i); }
    });

    it('should reject expired OTP', async () => {
      mockDb.User.findOne.resolves(createMockUser({
        passwordResetToken: '654321',
        passwordResetExpires: new Date(Date.now() - 1000),
      }));
      try { await authService.resetPassword('t@t.com', '654321', 'NewPass1!'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.match(/expired/i); }
    });

    it('should reject when no reset token on file', async () => {
      mockDb.User.findOne.resolves(createMockUser({ passwordResetToken: null }));
      try { await authService.resetPassword('t@t.com', '654321', 'NewPass1!'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.match(/invalid/i); }
    });
  });

  describe('verifyResetOtp', () => {
    it('should confirm valid OTP without changing password', async () => {
      mockDb.User.findOne.resolves(createMockUser({
        passwordResetToken: '654321',
        passwordResetExpires: new Date(Date.now() + 600_000),
      }));
      const result = await authService.verifyResetOtp('test@staffclock.com', '654321');
      expect(result.message).to.match(/verified|set a new password/i);
    });

    it('should reject wrong code', async () => {
      mockDb.User.findOne.resolves(createMockUser({
        passwordResetToken: '111111',
        passwordResetExpires: new Date(Date.now() + 600_000),
      }));
      try { await authService.verifyResetOtp('t@t.com', '999999'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.match(/invalid/i); }
    });
  });

  describe('changePassword', () => {
    it('should change password when current is correct', async () => {
      const mockUser = {
        ...createMockUser(),
        validatePassword: sandbox.stub().resolves(true),
        update: sandbox.stub().resolves(),
      };
      mockDb.User.findByPk.resolves(mockUser);

      const result = await authService.changePassword(1, 'oldPw', 'newPw');
      expect(result.message).to.equal('Password changed successfully');
      expect(mockUser.update.calledOnce).to.be.true;
    });

    it('should reject wrong current password', async () => {
      const mockUser = { ...createMockUser(), validatePassword: sandbox.stub().resolves(false) };
      mockDb.User.findByPk.resolves(mockUser);
      try { await authService.changePassword(1, 'wrong', 'newPw'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.equal('Current password is incorrect'); expect(err.statusCode).to.equal(400); }
    });

    it('should reject non-existent user', async () => {
      mockDb.User.findByPk.resolves(null);
      try { await authService.changePassword(999, 'old', 'new'); expect.fail('Should throw'); }
      catch (err) { expect(err.message).to.equal('User not found'); expect(err.statusCode).to.equal(404); }
    });
  });
});

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import { AppError } from '../utils/index.js';
import { USER_STATUS, ROLES } from '../config/constants.js';
import emailService from '../emails/email.service.js';

const OTP_VERIFY_EXPIRY_MS = config.verification.tokenExpiry * 3600_000; // hours from env
const OTP_RESET_EXPIRY_MS = 15 * 60 * 1000;                              // 15 minutes
const OTP_LENGTH = 6;

class AuthService {
  constructor(db) { this.db = db; }

  signJwt(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  verifyToken(token) { return jwt.verify(token, config.jwt.secret); }

  // Generate a numeric OTP code (e.g. "493012"). Uses crypto for entropy.
  generateOtp() {
    const max = 10 ** OTP_LENGTH;
    return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, '0');
  }

  otpFields(expiryMs) {
    return { otp: this.generateOtp(), expires: new Date(Date.now() + expiryMs) };
  }

  async signup({ email, password, firstName, lastName }) {
    const { User } = this.db;
    if (await User.findOne({ where: { email } })) throw AppError.conflict('Email already registered');

    const { otp, expires } = this.otpFields(OTP_VERIFY_EXPIRY_MS);
    const user = await User.create({
      email, password, firstName, lastName,
      role: ROLES.STAFF, status: USER_STATUS.INACTIVE,
      isVerified: false, verificationToken: otp, verificationExpires: expires,
    });

    await emailService.sendVerification(user, otp);
    return { message: 'Registration successful. Please check your email for a verification code.' };
  }

  // Verify by email + OTP (no link/token flow).
  async verifyEmail(email, otp) {
    if (!email || !otp) throw AppError.badRequest('Email and verification code are required');

    const user = await this.db.User.findOne({ where: { email } });
    if (!user) throw AppError.badRequest('Invalid verification code');
    if (user.isVerified) throw AppError.badRequest('This account is already verified');
    if (!user.verificationToken || user.verificationToken !== otp) {
      throw AppError.badRequest('Invalid verification code');
    }
    if (user.verificationExpires < new Date()) {
      throw AppError.badRequest('Verification code has expired. Please request a new one.');
    }

    await user.update({
      isVerified: true,
      status: USER_STATUS.ACTIVE,
      verificationToken: null,
      verificationExpires: null,
    });
    await emailService.sendWelcome(user);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email) {
    const user = await this.db.User.findOne({ where: { email } });
    // Always return the same response (anti-enumeration).
    if (!user || user.isVerified) {
      return { message: 'If an unverified account exists for that email, a new verification code has been sent.' };
    }

    const { otp, expires } = this.otpFields(OTP_VERIFY_EXPIRY_MS);
    await user.update({ verificationToken: otp, verificationExpires: expires });
    await emailService.sendVerification(user, otp);
    return { message: 'If an unverified account exists for that email, a new verification code has been sent.' };
  }

  async forgotPassword(email) {
    const user = await this.db.User.findOne({ where: { email } });
    if (user) {
      const { otp, expires } = this.otpFields(OTP_RESET_EXPIRY_MS);
      await user.update({ passwordResetToken: otp, passwordResetExpires: expires });
      await emailService.sendPasswordReset(user, otp);
    }
    return { message: 'If an account exists, a password reset code has been sent.' };
  }

  // Optional pre-check: confirm the OTP is valid before showing the new-password form.
  async verifyResetOtp(email, otp) {
    if (!email || !otp) throw AppError.badRequest('Email and reset code are required');
    const user = await this.db.User.findOne({ where: { email } });
    if (!user || !user.passwordResetToken || user.passwordResetToken !== otp) {
      throw AppError.badRequest('Invalid reset code');
    }
    if (user.passwordResetExpires < new Date()) {
      throw AppError.badRequest('Reset code has expired. Please request a new one.');
    }
    return { message: 'Code verified. You can now set a new password.' };
  }

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp) throw AppError.badRequest('Email and reset code are required');

    const user = await this.db.User.findOne({ where: { email } });
    if (!user || !user.passwordResetToken || user.passwordResetToken !== otp) {
      throw AppError.badRequest('Invalid reset code');
    }
    if (user.passwordResetExpires < new Date()) {
      throw AppError.badRequest('Reset code has expired. Please request a new one.');
    }

    await user.update({
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    return { message: 'Password reset successful. You can now log in.' };
  }

  async login(email, password) {
    const { User, Department, Location } = this.db;
    const user = await User.findOne({
      where: { email },
      include: [{ model: Department, as: 'department' }, { model: Location, as: 'location' }],
    });
    if (!user) throw AppError.unauthorized('Invalid credentials');
    if (!user.isVerified) throw AppError.forbidden('Please verify your email before logging in');
    if (user.status !== USER_STATUS.ACTIVE) throw AppError.forbidden('Account is not active');
    if (!(await user.validatePassword(password))) throw AppError.unauthorized('Invalid credentials');

    await user.update({ lastLoginAt: new Date() });
    return { token: this.signJwt(user), user: user.toSafeObject() };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.findByPk(userId);
    if (!(await user.validatePassword(currentPassword))) {
      throw AppError.badRequest('Current password is incorrect');
    }
    await user.update({ password: newPassword });
    return { message: 'Password changed successfully' };
  }

  async getProfile(userId) {
    const { User, Department, Location } = this.db;
    return User.findByPk(userId, {
      attributes: { exclude: ['password', 'verificationToken', 'verificationExpires', 'passwordResetToken', 'passwordResetExpires'] },
      include: [
        { model: Department, as: 'department' },
        { model: Location, as: 'location' },
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      rejectOnEmpty: new AppError('User not found', 404),
    });
  }

  async findByPk(id) {
    const user = await this.db.User.findByPk(id);
    if (!user) throw AppError.notFound('User not found');
    return user;
  }
}

export default AuthService;

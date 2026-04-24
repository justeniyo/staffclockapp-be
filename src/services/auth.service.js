import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import { AppError } from '../utils/index.js';
import { USER_STATUS, ROLES } from '../config/constants.js';
import emailService from '../emails/email.service.js';

class AuthService {
  constructor(db) {
    this.db = db;
  }

  generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, config.jwt.secret);
  }

  generateRandomToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async signup({ email, password, firstName, lastName }) {
    const { User } = this.db;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw AppError.conflict('Email already registered');
    }

    const verificationToken = this.generateRandomToken();
    const verificationExpires = new Date(Date.now() + config.verification.tokenExpiry * 60 * 60 * 1000);

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: ROLES.STAFF,
      status: USER_STATUS.INACTIVE,
      isVerified: false,
      verificationToken,
      verificationExpires,
    });

    await emailService.sendVerification(user, verificationToken);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token) {
    const { User } = this.db;

    const user = await User.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw AppError.badRequest('Invalid verification token');
    }

    if (user.verificationExpires < new Date()) {
      throw AppError.badRequest('Verification token has expired');
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
    const { User } = this.db;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return { message: 'If an account exists, a verification email has been sent.' };
    }

    if (user.isVerified) {
      throw AppError.badRequest('Email is already verified');
    }

    const verificationToken = this.generateRandomToken();
    const verificationExpires = new Date(Date.now() + config.verification.tokenExpiry * 60 * 60 * 1000);

    await user.update({ verificationToken, verificationExpires });
    await emailService.sendVerification(user, verificationToken);

    return { message: 'If an account exists, a verification email has been sent.' };
  }

  async forgotPassword(email) {
    const { User } = this.db;

    const user = await User.findOne({ where: { email } });

    if (user) {
      const resetToken = this.generateRandomToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      await emailService.sendPasswordReset(user, resetToken);
    }

    return { message: 'If an account exists, a password reset email has been sent.' };
  }

  async resetPassword(token, newPassword) {
    const { User } = this.db;

    const user = await User.findOne({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw AppError.badRequest('Invalid reset token');
    }

    if (user.passwordResetExpires < new Date()) {
      throw AppError.badRequest('Reset token has expired');
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
      include: [
        { model: Department, as: 'department' },
        { model: Location, as: 'location' },
      ],
    });

    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (!user.isVerified) {
      throw AppError.forbidden('Please verify your email before logging in');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw AppError.forbidden('Account is not active');
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw AppError.unauthorized('Invalid credentials');
    }

    await user.update({ lastLoginAt: new Date() });

    return { token: this.generateToken(user), user: user.toSafeObject() };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const { User } = this.db;

    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      throw AppError.badRequest('Current password is incorrect');
    }

    await user.update({ password: newPassword });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId) {
    const { User, Department, Location } = this.db;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'verificationToken', 'verificationExpires', 'passwordResetToken', 'passwordResetExpires'] },
      include: [
        { model: Department, as: 'department' },
        { model: Location, as: 'location' },
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }
}

export default AuthService;

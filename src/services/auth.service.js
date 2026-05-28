import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import { AppError } from '../utils/index.js';
import { USER_STATUS, ROLES } from '../config/constants.js';
import emailService from '../emails/email.service.js';

const TOKEN_EXPIRY_MS = config.verification.tokenExpiry * 3600_000;
const RESET_EXPIRY_MS = 3600_000; // 1 hour

class AuthService {
  constructor(db) { this.db = db; }

  // ── Token helpers ──

  signJwt(user) {
    return jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  }

  verifyToken(token) { return jwt.verify(token, config.jwt.secret); }

  randomToken() { return crypto.randomBytes(32).toString('hex'); }

  tokenFields(expiryMs = TOKEN_EXPIRY_MS) {
    return { token: this.randomToken(), expires: new Date(Date.now() + expiryMs) };
  }

  // ── Auth flows ──

  async signup({ email, password, firstName, lastName }) {
    const { User } = this.db;
    if (await User.findOne({ where: { email } })) throw AppError.conflict('Email already registered');

    const { token, expires } = this.tokenFields();
    const user = await User.create({
      email, password, firstName, lastName,
      role: ROLES.STAFF, status: USER_STATUS.INACTIVE,
      isVerified: false, verificationToken: token, verificationExpires: expires,
    });

    await emailService.sendVerification(user, token);
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token) {
    const user = await this.findByField('verificationToken', token);
    if (user.verificationExpires < new Date()) throw AppError.badRequest('Verification token has expired');

    await user.update({ isVerified: true, status: USER_STATUS.ACTIVE, verificationToken: null, verificationExpires: null });
    await emailService.sendWelcome(user);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email) {
    const user = await this.db.User.findOne({ where: { email } });
    if (!user) return { message: 'If an account exists, a verification email has been sent.' };
    if (user.isVerified) throw AppError.badRequest('Email is already verified');

    const { token, expires } = this.tokenFields();
    await user.update({ verificationToken: token, verificationExpires: expires });
    await emailService.sendVerification(user, token);
    return { message: 'If an account exists, a verification email has been sent.' };
  }

  async forgotPassword(email) {
    const user = await this.db.User.findOne({ where: { email } });
    if (user) {
      const { token, expires } = this.tokenFields(RESET_EXPIRY_MS);
      await user.update({ passwordResetToken: token, passwordResetExpires: expires });
      await emailService.sendPasswordReset(user, token);
    }
    return { message: 'If an account exists, a password reset email has been sent.' };
  }

  async resetPassword(token, newPassword) {
    const user = await this.findByField('passwordResetToken', token);
    if (user.passwordResetExpires < new Date()) throw AppError.badRequest('Reset token has expired');

    await user.update({ password: newPassword, passwordResetToken: null, passwordResetExpires: null });
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
    if (!(await user.validatePassword(currentPassword))) throw AppError.badRequest('Current password is incorrect');
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

  // ── Internal helpers ──

  async findByField(field, value) {
    const user = await this.db.User.findOne({ where: { [field]: value } });
    if (!user) throw AppError.badRequest(`Invalid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    return user;
  }

  async findByPk(id) {
    const user = await this.db.User.findByPk(id);
    if (!user) throw AppError.notFound('User not found');
    return user;
  }
}

export default AuthService;

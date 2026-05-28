import nodemailer from 'nodemailer';
import config from '../config/environment.js';

/** Shared HTML email layout */
const layout = (body) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    ${body}
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
    <p style="color: #9CA3AF; font-size: 12px;">
      If you didn't expect this email, you can safely ignore it or contact your administrator.
    </p>
  </div>`;

const btn = (href, text) => `
  <p style="margin: 30px 0;">
    <a href="${href}" style="background-color: #4F46E5; color: white; padding: 12px 24px;
       text-decoration: none; border-radius: 6px; display: inline-block;">${text}</a>
  </p>`;

const linkNote = (url) => `
  <p>Or copy and paste this link into your browser:</p>
  <p style="color: #6B7280; word-break: break-all;">${url}</p>`;

class EmailService {
  constructor() {
    this.transporter = config.isTest
      ? { sendMail: async () => ({ messageId: 'test' }) }
      : nodemailer.createTransport({
          host: config.email.host, port: config.email.port,
          secure: config.email.secure,
          auth: { user: config.email.user, pass: config.email.pass },
        });
  }

  async send({ to, subject, html }) {
    return this.transporter.sendMail({
      from: `${config.app.name} <${config.email.from}>`,
      to, subject, html,
      text: html.replace(/<[^>]*>/g, ''),
    });
  }

  async sendVerification(user, token) {
    const url = `${config.app.url}/api/auth/verify-email?token=${token}`;
    return this.send({
      to: user.email,
      subject: `Verify your ${config.app.name} account`,
      html: layout(`
        <h2>Welcome to ${config.app.name}!</h2>
        <p>Hi ${user.firstName},</p>
        <p>Please verify your email address:</p>
        ${btn(url, 'Verify Email')}
        ${linkNote(url)}
        <p>This link expires in ${config.verification.tokenExpiry} hours.</p>`),
    });
  }

  async sendPasswordReset(user, token) {
    const url = `${config.app.url}/reset-password?token=${token}`;
    return this.send({
      to: user.email,
      subject: `Reset your ${config.app.name} password`,
      html: layout(`
        <h2>Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested to reset your password:</p>
        ${btn(url, 'Reset Password')}
        ${linkNote(url)}
        <p>This link expires in 1 hour.</p>`),
    });
  }

  async sendWelcome(user) {
    return this.send({
      to: user.email,
      subject: `Welcome to ${config.app.name}!`,
      html: layout(`
        <h2>Welcome aboard, ${user.firstName}!</h2>
        <p>Your email has been verified and your account is now active.</p>
        ${btn(`${config.app.url}/login`, 'Go to Login')}`),
    });
  }

  async sendAccountCreated(user, token, tempPassword) {
    const url = `${config.app.url}/api/auth/verify-email?token=${token}`;
    return this.send({
      to: user.email,
      subject: `Your ${config.app.name} account has been created`,
      html: layout(`
        <h2>Welcome to ${config.app.name}, ${user.firstName}!</h2>
        <p>An administrator has created an account for you:</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> ${tempPassword || 'Temp1234!'}</p>
        </div>
        <p><strong>Verify your email to activate your account:</strong></p>
        ${btn(url, 'Verify Email & Activate Account')}
        ${linkNote(url)}
        <p>This link expires in ${config.verification.tokenExpiry} hours.</p>
        <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400E;"><strong>Important:</strong> Please change your password after your first login.</p>
        </div>`),
    });
  }
}

export default new EmailService();

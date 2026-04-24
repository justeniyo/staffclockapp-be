import nodemailer from 'nodemailer';
import config from '../config/environment.js';

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    if (config.isTest) {
      return { sendMail: async () => ({ messageId: 'test' }) };
    }

    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  async send({ to, subject, html, text }) {
    const mailOptions = {
      from: `${config.app.name} <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendVerification(user, token) {
    const verifyUrl = `${config.app.url}/api/auth/verify-email?token=${token}`;

    return this.send({
      to: user.email,
      subject: `Verify your ${config.app.name} account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${config.app.name}!</h2>
          <p>Hi ${user.firstName},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #6B7280; word-break: break-all;">${verifyUrl}</p>
          <p>This link expires in ${config.verification.tokenExpiry} hours.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="color: #9CA3AF; font-size: 12px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordReset(user, token) {
    const resetUrl = `${config.app.url}/reset-password?token=${token}`;

    return this.send({
      to: user.email,
      subject: `Reset your ${config.app.name} password`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${user.firstName},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #6B7280; word-break: break-all;">${resetUrl}</p>
          <p>This link expires in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="color: #9CA3AF; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async sendWelcome(user) {
    return this.send({
      to: user.email,
      subject: `Welcome to ${config.app.name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome aboard, ${user.firstName}!</h2>
          <p>Your email has been verified and your account is now active.</p>
          <p>You can now log in to ${config.app.name} and start using all features.</p>
          <p style="margin: 30px 0;">
            <a href="${config.app.url}/login" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Login
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="color: #9CA3AF; font-size: 12px;">
            Need help? Contact our support team.
          </p>
        </div>
      `,
    });
  }
}

export default new EmailService();

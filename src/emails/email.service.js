import nodemailer from 'nodemailer';
import config from '../config/environment.js';

const layout = (body) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    ${body}
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:30px 0;">
    <p style="color:#9CA3AF;font-size:12px;">
      If you didn't expect this email, you can safely ignore it or contact your administrator.
    </p>
  </div>`;

const btn = (href, text) => `
  <p style="margin:30px 0;">
    <a href="${href}" style="background-color:#4F46E5;color:white;padding:12px 24px;
       text-decoration:none;border-radius:6px;display:inline-block;">${text}</a>
  </p>`;

const linkNote = (url) => `
  <p>Or copy and paste this link:</p>
  <p style="color:#6B7280;word-break:break-all;">${url}</p>`;

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

  send({ to, subject, html }) {
    return this.transporter.sendMail({
      from: `${config.app.name} <${config.email.from}>`,
      to, subject, html,
      text: html.replace(/<[^>]*>/g, ''),
    });
  }

  sendVerification(user, token) {
    // Link goes to the FRONTEND page, which then calls the API with the token
    const url = `${config.app.frontendUrl}/verify-account?token=${token}`;
    return this.send({
      to: user.email,
      subject: `Verify your ${config.app.name} account`,
      html: layout(`
        <h2>Welcome to ${config.app.name}!</h2>
        <p>Hi ${user.firstName}, please verify your email to activate your account:</p>
        ${btn(url, 'Verify Email')}
        ${linkNote(url)}
        <p>This link expires in ${config.verification.tokenExpiry} hours.</p>`),
    });
  }

  sendPasswordReset(user, token) {
    const url = `${config.app.frontendUrl}/reset-password?token=${token}`;
    return this.send({
      to: user.email,
      subject: `Reset your ${config.app.name} password`,
      html: layout(`
        <h2>Password Reset Request</h2>
        <p>Hi ${user.firstName}, click below to reset your password:</p>
        ${btn(url, 'Reset Password')}
        ${linkNote(url)}
        <p>This link expires in 1 hour.</p>`),
    });
  }

  sendWelcome(user) {
    return this.send({
      to: user.email,
      subject: `Welcome to ${config.app.name}!`,
      html: layout(`
        <h2>Welcome aboard, ${user.firstName}!</h2>
        <p>Your account is now active. You can log in with your email address.</p>
        ${btn(`${config.app.frontendUrl}`, 'Go to Login')}`),
    });
  }

  sendAccountCreated(user, token, tempPassword) {
    // Link goes to the FRONTEND verify page with the token in the URL
    const url = `${config.app.frontendUrl}/verify-account?token=${token}`;
    return this.send({
      to: user.email,
      subject: `Your ${config.app.name} account has been created`,
      html: layout(`
        <h2>Welcome to ${config.app.name}, ${user.firstName}!</h2>
        <p>An administrator has created an account for you:</p>
        <div style="background:#F3F4F6;padding:20px;border-radius:8px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin:0;"><strong>Temporary Password:</strong> ${tempPassword || 'Temp1234!'}</p>
        </div>
        <p><strong>Click below to verify your email and activate your account:</strong></p>
        ${btn(url, 'Verify Email & Activate Account')}
        ${linkNote(url)}
        <p>This link expires in ${config.verification.tokenExpiry} hours.</p>
        <div style="background:#FEF3C7;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#92400E;"><strong>Important:</strong> Change your password after your first login.</p>
        </div>`),
    });
  }
}

export default new EmailService();

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

// Big centred OTP box. Letter-spacing makes the digits readable at a glance.
const otpBox = (code) => `
  <div style="text-align:center;margin:24px 0;">
    <div style="display:inline-block;background:#FFF8D6;border:2px solid #FFD54D;
                border-radius:12px;padding:18px 32px;">
      <div style="font-size:32px;font-weight:900;letter-spacing:.4em;color:#111;
                  font-family:'Courier New',Courier,monospace;">${code}</div>
    </div>
  </div>`;

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

  sendVerification(user, otp) {
    return this.send({
      to: user.email,
      subject: `Your ${config.app.name} verification code`,
      html: layout(`
        <h2>Welcome to ${config.app.name}!</h2>
        <p>Hi ${user.firstName}, your verification code is:</p>
        ${otpBox(otp)}
        <p>Enter this code on the verification page to activate your account.</p>
        <p style="color:#6B7280;font-size:14px;">
          This code expires in ${config.verification.tokenExpiry} hour${config.verification.tokenExpiry === 1 ? '' : 's'}.
        </p>`),
    });
  }

  sendPasswordReset(user, otp) {
    return this.send({
      to: user.email,
      subject: `Your ${config.app.name} password reset code`,
      html: layout(`
        <h2>Password Reset Request</h2>
        <p>Hi ${user.firstName}, use the code below to reset your password:</p>
        ${otpBox(otp)}
        <p>Enter this code on the reset page, then choose a new password.</p>
        <p style="color:#6B7280;font-size:14px;">This code expires in 15 minutes.</p>
        <p style="color:#6B7280;font-size:14px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>`),
    });
  }

  sendWelcome(user) {
    return this.send({
      to: user.email,
      subject: `Welcome to ${config.app.name}!`,
      html: layout(`
        <h2>Welcome aboard, ${user.firstName}!</h2>
        <p>Your account is now active. You can log in at ${config.app.frontendUrl}.</p>`),
    });
  }

  sendAccountCreated(user, otp, tempPassword) {
    return this.send({
      to: user.email,
      subject: `Your ${config.app.name} account has been created`,
      html: layout(`
        <h2>Welcome to ${config.app.name}, ${user.firstName}!</h2>
        <p>An administrator has created an account for you. Your login details:</p>
        <div style="background:#F3F4F6;padding:20px;border-radius:8px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin:0;"><strong>Temporary Password:</strong> ${tempPassword || 'Temp1234!'}</p>
        </div>
        <p><strong>Use the code below to verify your email and activate your account:</strong></p>
        ${otpBox(otp)}
        <p style="color:#6B7280;font-size:14px;">
          Enter this code on the verification page at ${config.app.frontendUrl}/verify-account.
          The code expires in ${config.verification.tokenExpiry} hour${config.verification.tokenExpiry === 1 ? '' : 's'}.
        </p>
        <div style="background:#FEF3C7;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#92400E;">
            <strong>Important:</strong> Please change your password after your first login.
          </p>
        </div>`),
    });
  }
}

export default new EmailService();

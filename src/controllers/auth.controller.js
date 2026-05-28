import { wrap } from './base.controller.js';
import { HTTP_STATUS } from '../config/constants.js';

class AuthController {
  constructor(authService) {
    this.auth = authService;
  }

  signup      = wrap(async (req, res) => this.respond(res, await this.auth.signup(req.body), HTTP_STATUS.CREATED));
  verifyEmail = wrap(async (req, res) => this.respond(res, await this.auth.verifyEmail(req.query.token)));
  resendVerification = wrap(async (req, res) => this.respond(res, await this.auth.resendVerification(req.body.email)));
  forgotPassword     = wrap(async (req, res) => this.respond(res, await this.auth.forgotPassword(req.body.email)));
  resetPassword      = wrap(async (req, res) => this.respond(res, await this.auth.resetPassword(req.body.token, req.body.password)));
  login       = wrap(async (req, res) => this.respond(res, await this.auth.login(req.body.email, req.body.password), 200, 'Login successful'));
  logout      = (_req, res) => res.json({ success: true, message: 'Logout successful' });
  getProfile  = wrap(async (req, res) => this.respond(res, await this.auth.getProfile(req.user.id), 200, 'Profile retrieved', true));
  changePassword = wrap(async (req, res) => this.respond(res, await this.auth.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword)));
  verifyToken = (_req, res) => res.json({ success: true, data: { valid: true, user: _req.user }, message: 'Token is valid' });

  /** Helper: sends { success, message, data? } — avoids repeating res.json shape */
  respond(res, result, status = 200, msgOverride, asData = false) {
    const body = { success: true, message: msgOverride || result.message || 'Success' };
    if (asData) body.data = result;
    else if (result.token || result.user) body.data = result;
    return res.status(status).json(body);
  }
}

export default AuthController;

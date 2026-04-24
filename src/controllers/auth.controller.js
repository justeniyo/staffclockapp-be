import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  signup = async (req, res, next) => {
    try {
      const result = await this.authService.signup(req.body);
      return ApiResponse.success(res, { message: result.message, statusCode: HTTP_STATUS.CREATED });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req, res, next) => {
    try {
      const result = await this.authService.verifyEmail(req.query.token);
      return ApiResponse.success(res, { message: result.message });
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req, res, next) => {
    try {
      const result = await this.authService.resendVerification(req.body.email);
      return ApiResponse.success(res, { message: result.message });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      const result = await this.authService.forgotPassword(req.body.email);
      return ApiResponse.success(res, { message: result.message });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const result = await this.authService.resetPassword(req.body.token, req.body.password);
      return ApiResponse.success(res, { message: result.message });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const result = await this.authService.login(req.body.email, req.body.password);
      return ApiResponse.success(res, { data: result, message: 'Login successful' });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res) => {
    return ApiResponse.success(res, { message: 'Logout successful' });
  };

  getProfile = async (req, res, next) => {
    try {
      const user = await this.authService.getProfile(req.user.id);
      return ApiResponse.success(res, { data: user, message: 'Profile retrieved' });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const result = await this.authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
      return ApiResponse.success(res, { message: result.message });
    } catch (error) {
      next(error);
    }
  };

  verifyToken = async (req, res) => {
    return ApiResponse.success(res, { data: { valid: true, user: req.user }, message: 'Token is valid' });
  };
}

export default AuthController;

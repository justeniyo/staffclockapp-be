import { Router } from 'express';
import { authenticate, validate } from '../middleware/index.js';
import {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/index.js';

const createAuthRoutes = (authController) => {
  const router = Router();

  router.post('/signup', signupValidator, validate, authController.signup);
  router.post('/verify-email', verifyEmailValidator, validate, authController.verifyEmail);
  router.post('/resend-verification', resendVerificationValidator, validate, authController.resendVerification);
  router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
  router.post('/verify-reset-otp', verifyResetOtpValidator, validate, authController.verifyResetOtp);
  router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);
  router.post('/login', loginValidator, validate, authController.login);

  router.post('/logout', authenticate, authController.logout);
  router.get('/me', authenticate, authController.getProfile);
  router.put('/password', authenticate, changePasswordValidator, validate, authController.changePassword);
  router.get('/verify', authenticate, authController.verifyToken);

  return router;
};

export default createAuthRoutes;

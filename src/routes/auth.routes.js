import { Router } from 'express';
import { authenticate, validate } from '../middleware/index.js';
import {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/index.js';

const createAuthRoutes = (authController) => {
  const router = Router();

  // Public routes
  router.post('/signup', signupValidator, validate, authController.signup);
  router.get('/verify-email', verifyEmailValidator, validate, authController.verifyEmail);
  router.post('/resend-verification', resendVerificationValidator, validate, authController.resendVerification);
  router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
  router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);
  router.post('/login', loginValidator, validate, authController.login);

  // Protected routes
  router.post('/logout', authenticate, authController.logout);
  router.get('/me', authenticate, authController.getProfile);
  router.put('/password', authenticate, changePasswordValidator, validate, authController.changePassword);
  router.get('/verify', authenticate, authController.verifyToken);

  return router;
};

export default createAuthRoutes;

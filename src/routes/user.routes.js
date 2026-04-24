import { Router } from 'express';
import { authenticate, can, validate } from '../middleware/index.js';
import {
  createUserValidator,
  updateUserValidator,
  getUserValidator,
  listUsersValidator,
  roleParamValidator,
} from '../validators/index.js';

/**
 * Creates user routes with injected controller
 * @param {Object} userController - User controller instance
 * @returns {Router} Express router
 */
const createUserRoutes = (userController) => {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  // User CRUD operations
  router.post('/', can('users', 'create'), createUserValidator, validate, userController.create);
  router.get('/', can('users', 'list'), listUsersValidator, validate, userController.findAll);
  router.get('/role/:role', can('users', 'listByRole'), roleParamValidator, validate, userController.findByRole);
  router.get('/:id', getUserValidator, validate, userController.findById);
  router.put('/:id', can('users', 'update'), updateUserValidator, validate, userController.update);
  router.delete('/:id', can('users', 'delete'), getUserValidator, validate, userController.delete);
  router.get('/:id/direct-reports', can('users', 'directReports'), getUserValidator, validate, userController.getDirectReports);

  return router;
};

export default createUserRoutes;

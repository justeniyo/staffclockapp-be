import { Router } from 'express';
import { authenticate, can, validate } from '../middleware/index.js';
import {
  createLeaveValidator,
  leaveIdValidator,
  leaveQueryValidator,
  reviewLeaveValidator,
  balanceQueryValidator,
} from '../validators/index.js';

const createLeaveRoutes = (leaveController) => {
  const router = Router();

  router.use(authenticate);

  // Own leave requests
  router.post('/', can('leaves', 'create'), createLeaveValidator, validate, leaveController.create);
  router.get('/my', can('leaves', 'listOwn'), leaveQueryValidator, validate, leaveController.getOwn);
  router.get('/my/balance', can('leaves', 'readOwn'), balanceQueryValidator, validate, leaveController.getBalance);
  router.post('/:id/cancel', can('leaves', 'cancel'), leaveIdValidator, validate, leaveController.cancel);

  // Admin operations
  router.get('/', can('leaves', 'list'), leaveQueryValidator, validate, leaveController.getAll);
  router.get('/pending', can('leaves', 'list'), leaveQueryValidator, validate, leaveController.getPending);
  router.get('/user/:userId/balance', can('leaves', 'read'), balanceQueryValidator, validate, leaveController.getBalance);
  router.get('/:id', can('leaves', 'read'), leaveIdValidator, validate, leaveController.getById);
  router.post('/:id/approve', can('leaves', 'approve'), reviewLeaveValidator, validate, leaveController.approve);
  router.post('/:id/reject', can('leaves', 'reject'), reviewLeaveValidator, validate, leaveController.reject);

  return router;
};

export default createLeaveRoutes;

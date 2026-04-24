import { Router } from 'express';
import { authenticate, can, validate } from '../middleware/index.js';
import {
  createShiftValidator,
  createBulkShiftValidator,
  shiftIdValidator,
  shiftQueryValidator,
  updateShiftValidator,
  weekScheduleValidator,
} from '../validators/index.js';

const createShiftRoutes = (shiftController) => {
  const router = Router();

  router.use(authenticate);

  // Own shifts
  router.get('/my', can('shifts', 'readOwn'), shiftQueryValidator, validate, shiftController.getOwn);

  // Admin operations
  router.post('/', can('shifts', 'create'), createShiftValidator, validate, shiftController.create);
  router.post('/bulk', can('shifts', 'create'), createBulkShiftValidator, validate, shiftController.createBulk);
  router.get('/', can('shifts', 'list'), shiftQueryValidator, validate, shiftController.getAll);
  router.get('/week', can('shifts', 'list'), weekScheduleValidator, validate, shiftController.getWeekSchedule);
  router.get('/user/:userId', can('shifts', 'list'), shiftQueryValidator, validate, shiftController.getByUser);
  router.get('/:id', can('shifts', 'read'), shiftIdValidator, validate, shiftController.getById);
  router.put('/:id', can('shifts', 'update'), updateShiftValidator, validate, shiftController.update);
  router.post('/:id/cancel', can('shifts', 'update'), shiftIdValidator, validate, shiftController.cancel);
  router.delete('/:id', can('shifts', 'delete'), shiftIdValidator, validate, shiftController.delete);

  return router;
};

export default createShiftRoutes;

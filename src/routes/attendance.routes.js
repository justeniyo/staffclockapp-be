import { Router } from 'express';
import { authenticate, can, validate } from '../middleware/index.js';
import {
  clockInValidator,
  attendanceIdValidator,
  attendanceQueryValidator,
  updateAttendanceValidator,
} from '../validators/index.js';

const createAttendanceRoutes = (attendanceController) => {
  const router = Router();

  router.use(authenticate);

  // Self-service clock operations
  router.post('/clock-in', can('attendance', 'clockIn'), clockInValidator, validate, attendanceController.clockIn);
  router.post('/clock-out', can('attendance', 'clockOut'), attendanceController.clockOut);
  router.post('/break/start', can('attendance', 'startBreak'), attendanceController.startBreak);
  router.post('/break/end', can('attendance', 'endBreak'), attendanceController.endBreak);
  router.get('/status', can('attendance', 'viewOwn'), attendanceController.getStatus);
  router.get('/my', can('attendance', 'viewOwn'), attendanceQueryValidator, validate, attendanceController.getOwn);
  router.get('/my/summary', can('attendance', 'viewOwn'), attendanceQueryValidator, validate, attendanceController.getSummary);

  // Admin operations
  router.get('/', can('attendance', 'viewAll'), attendanceQueryValidator, validate, attendanceController.getAll);
  router.get('/user/:userId', can('attendance', 'viewByUser'), attendanceQueryValidator, validate, attendanceController.getByUser);
  router.get('/user/:userId/summary', can('attendance', 'viewByUser'), attendanceQueryValidator, validate, attendanceController.getSummary);
  router.get('/:id', can('attendance', 'viewAll'), attendanceIdValidator, validate, attendanceController.getById);
  router.put('/:id', can('attendance', 'update'), updateAttendanceValidator, validate, attendanceController.update);
  router.delete('/:id', can('attendance', 'delete'), attendanceIdValidator, validate, attendanceController.delete);

  return router;
};

export default createAttendanceRoutes;

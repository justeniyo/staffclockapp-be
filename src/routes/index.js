import { Router } from 'express';
import createAuthRoutes from './auth.routes.js';
import createUserRoutes from './user.routes.js';
import createAttendanceRoutes from './attendance.routes.js';
import createShiftRoutes from './shift.routes.js';
import createLeaveRoutes from './leave.routes.js';
import createDepartmentRoutes from './department.routes.js';
import createLocationRoutes from './location.routes.js';
import createReportRoutes from './report.routes.js';
import createNotificationRoutes from './notification.routes.js';

const createRoutes = (controllers) => {
  const router = Router();

  router.use('/auth', createAuthRoutes(controllers.authController));
  router.use('/users', createUserRoutes(controllers.userController));
  router.use('/attendance', createAttendanceRoutes(controllers.attendanceController));
  router.use('/shifts', createShiftRoutes(controllers.shiftController));
  router.use('/leaves', createLeaveRoutes(controllers.leaveController));
  router.use('/departments', createDepartmentRoutes(controllers.departmentController));
  router.use('/locations', createLocationRoutes(controllers.locationController));
  router.use('/reports', createReportRoutes(controllers.reportController));
  router.use('/notifications', createNotificationRoutes(controllers.notificationController));

  return router;
};

export default createRoutes;

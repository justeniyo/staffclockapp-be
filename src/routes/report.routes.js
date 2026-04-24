import { Router } from 'express';
import { authenticate, can, validate } from '../middleware/index.js';
import { reportQueryValidator } from '../validators/report.validator.js';

const createReportRoutes = (reportController) => {
  const router = Router();

  router.use(authenticate);

  // All report exports require admin+ permissions
  router.get(
    '/attendance',
    can('attendance', 'viewAll'),
    reportQueryValidator,
    validate,
    reportController.exportAttendance
  );

  router.get(
    '/attendance/summary',
    can('attendance', 'viewAll'),
    reportQueryValidator,
    validate,
    reportController.exportSummary
  );

  router.get(
    '/shifts',
    can('shifts', 'list'),
    reportQueryValidator,
    validate,
    reportController.exportShifts
  );

  router.get(
    '/leaves',
    can('leaves', 'list'),
    reportQueryValidator,
    validate,
    reportController.exportLeaves
  );

  return router;
};

export default createReportRoutes;

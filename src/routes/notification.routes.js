import { Router } from 'express';
import { authenticate } from '../middleware/index.js';

const createNotificationRoutes = (notificationController) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', notificationController.list);
  return router;
};

export default createNotificationRoutes;

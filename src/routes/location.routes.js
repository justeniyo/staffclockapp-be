import { Router } from 'express';
import { authenticate, can, validate } from '../middleware/index.js';
import {
  createLocationValidator,
  updateLocationValidator,
  locationIdValidator,
  locationQueryValidator,
} from '../validators/index.js';

const createLocationRoutes = (locationController) => {
  const router = Router();

  router.use(authenticate);

  router.post('/', can('locations', 'create'), createLocationValidator, validate, locationController.create);
  router.get('/', can('locations', 'list'), locationQueryValidator, validate, locationController.getAll);
  router.get('/:id', can('locations', 'read'), locationIdValidator, validate, locationController.getById);
  router.put('/:id', can('locations', 'update'), updateLocationValidator, validate, locationController.update);
  router.delete('/:id', can('locations', 'delete'), locationIdValidator, validate, locationController.delete);

  return router;
};

export default createLocationRoutes;

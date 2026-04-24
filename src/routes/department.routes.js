import { Router } from 'express';
import { authenticate, can, validate } from '../middleware/index.js';
import {
  createDepartmentValidator,
  updateDepartmentValidator,
  departmentIdValidator,
  departmentQueryValidator,
} from '../validators/index.js';

const createDepartmentRoutes = (departmentController) => {
  const router = Router();

  router.use(authenticate);

  router.post('/', can('departments', 'create'), createDepartmentValidator, validate, departmentController.create);
  router.get('/', can('departments', 'list'), departmentQueryValidator, validate, departmentController.getAll);
  router.get('/:id', can('departments', 'read'), departmentIdValidator, validate, departmentController.getById);
  router.put('/:id', can('departments', 'update'), updateDepartmentValidator, validate, departmentController.update);
  router.delete('/:id', can('departments', 'delete'), departmentIdValidator, validate, departmentController.delete);

  return router;
};

export default createDepartmentRoutes;

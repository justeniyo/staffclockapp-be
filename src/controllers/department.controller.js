import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class DepartmentController {
  constructor(departmentService) {
    this.service = departmentService;
  }

  create = async (req, res, next) => {
    try {
      const department = await this.service.create(req.body);
      return ApiResponse.success(res, { data: department, message: 'Department created', statusCode: HTTP_STATUS.CREATED });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const result = await this.service.findAll(req.query);
      return ApiResponse.paginated(res, result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const department = await this.service.findById(req.params.id);
      return ApiResponse.success(res, { data: department });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const department = await this.service.update(req.params.id, req.body);
      return ApiResponse.success(res, { data: department, message: 'Department updated' });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const result = await this.service.delete(req.params.id);
      return ApiResponse.success(res, { message: result.message });
    } catch (error) {
      next(error);
    }
  };
}

export default DepartmentController;

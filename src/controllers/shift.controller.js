import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class ShiftController {
  constructor(shiftService) {
    this.service = shiftService;
  }

  create = async (req, res, next) => {
    try {
      const shift = await this.service.create(req.body, req.user.id);
      return ApiResponse.success(res, { data: shift, message: 'Shift created', statusCode: HTTP_STATUS.CREATED });
    } catch (error) {
      next(error);
    }
  };

  createBulk = async (req, res, next) => {
    try {
      const results = await this.service.createBulk(req.body.shifts, req.user.id);
      return ApiResponse.success(res, { data: results, message: 'Bulk operation completed', statusCode: HTTP_STATUS.CREATED });
    } catch (error) {
      next(error);
    }
  };

  getOwn = async (req, res, next) => {
    try {
      const result = await this.service.findByUser(req.user.id, req.query);
      return ApiResponse.paginated(res, result);
    } catch (error) {
      next(error);
    }
  };

  getByUser = async (req, res, next) => {
    try {
      const result = await this.service.findByUser(req.params.userId, req.query);
      return ApiResponse.paginated(res, result);
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
      const shift = await this.service.findById(req.params.id);
      return ApiResponse.success(res, { data: shift });
    } catch (error) {
      next(error);
    }
  };

  getWeekSchedule = async (req, res, next) => {
    try {
      const shifts = await this.service.getWeekSchedule(req.query.startDate, req.query);
      return ApiResponse.success(res, { data: shifts });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const shift = await this.service.update(req.params.id, req.body);
      return ApiResponse.success(res, { data: shift, message: 'Shift updated' });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const shift = await this.service.cancel(req.params.id);
      return ApiResponse.success(res, { data: shift, message: 'Shift cancelled' });
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

export default ShiftController;

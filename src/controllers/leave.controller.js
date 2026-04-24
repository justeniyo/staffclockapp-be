import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class LeaveController {
  constructor(leaveService) {
    this.service = leaveService;
  }

  create = async (req, res, next) => {
    try {
      const leave = await this.service.create(req.user.id, req.body);
      return ApiResponse.success(res, { data: leave, message: 'Leave request submitted', statusCode: HTTP_STATUS.CREATED });
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

  getAll = async (req, res, next) => {
    try {
      const result = await this.service.findAll(req.query);
      return ApiResponse.paginated(res, result);
    } catch (error) {
      next(error);
    }
  };

  getPending = async (req, res, next) => {
    try {
      const result = await this.service.getPending(req.query);
      return ApiResponse.paginated(res, result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const leave = await this.service.findById(req.params.id);
      return ApiResponse.success(res, { data: leave });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req, res, next) => {
    try {
      const leave = await this.service.approve(req.params.id, req.user.id, req.body.notes);
      return ApiResponse.success(res, { data: leave, message: 'Leave approved' });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req, res, next) => {
    try {
      const leave = await this.service.reject(req.params.id, req.user.id, req.body.notes);
      return ApiResponse.success(res, { data: leave, message: 'Leave rejected' });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const leave = await this.service.cancel(req.params.id, req.user.id);
      return ApiResponse.success(res, { data: leave, message: 'Leave cancelled' });
    } catch (error) {
      next(error);
    }
  };

  getBalance = async (req, res, next) => {
    try {
      const userId = req.params.userId || req.user.id;
      const balance = await this.service.getBalance(userId, req.query.year);
      return ApiResponse.success(res, { data: balance });
    } catch (error) {
      next(error);
    }
  };
}

export default LeaveController;

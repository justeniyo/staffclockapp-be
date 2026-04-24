import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class AttendanceController {
  constructor(attendanceService) {
    this.service = attendanceService;
  }

  clockIn = async (req, res, next) => {
    try {
      const attendance = await this.service.clockIn(req.user.id, {
        locationId: req.body.locationId,
        notes: req.body.notes,
        ipAddress: req.ip,
      });
      return ApiResponse.success(res, { data: attendance, message: 'Clocked in', statusCode: HTTP_STATUS.CREATED });
    } catch (error) {
      next(error);
    }
  };

  clockOut = async (req, res, next) => {
    try {
      const attendance = await this.service.clockOut(req.user.id);
      return ApiResponse.success(res, { data: attendance, message: 'Clocked out' });
    } catch (error) {
      next(error);
    }
  };

  startBreak = async (req, res, next) => {
    try {
      const attendance = await this.service.startBreak(req.user.id);
      return ApiResponse.success(res, { data: attendance, message: 'Break started' });
    } catch (error) {
      next(error);
    }
  };

  endBreak = async (req, res, next) => {
    try {
      const attendance = await this.service.endBreak(req.user.id);
      return ApiResponse.success(res, { data: attendance, message: 'Break ended' });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req, res, next) => {
    try {
      const status = await this.service.getStatus(req.user.id);
      return ApiResponse.success(res, { data: status, message: 'Status retrieved' });
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
      const attendance = await this.service.findById(req.params.id);
      return ApiResponse.success(res, { data: attendance });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const attendance = await this.service.update(req.params.id, req.body);
      return ApiResponse.success(res, { data: attendance, message: 'Updated' });
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

  getSummary = async (req, res, next) => {
    try {
      const userId = req.params.userId || req.user.id;
      const summary = await this.service.getSummary(userId, req.query);
      return ApiResponse.success(res, { data: summary });
    } catch (error) {
      next(error);
    }
  };
}

export default AttendanceController;

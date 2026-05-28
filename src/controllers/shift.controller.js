import { wrap } from './base.controller.js';
import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class ShiftController {
  constructor(service) { this.svc = service; }

  create          = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.create(req.body, req.user.id), message: 'Shift created', statusCode: HTTP_STATUS.CREATED }));
  createBulk      = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.createBulk(req.body.shifts, req.user.id), message: 'Bulk operation completed', statusCode: HTTP_STATUS.CREATED }));
  getOwn          = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findByUser(req.user.id, req.query)));
  getByUser       = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findByUser(req.params.userId, req.query)));
  getAll          = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findAll(req.query)));
  getById         = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.findById(req.params.id) }));
  getWeekSchedule = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.getWeekSchedule(req.query.startDate, req.query) }));
  update          = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.update(req.params.id, req.body), message: 'Shift updated' }));
  cancel          = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.cancel(req.params.id), message: 'Shift cancelled' }));
  delete          = wrap(async (req, res) => ApiResponse.success(res, await this.svc.delete(req.params.id)));
}

export default ShiftController;

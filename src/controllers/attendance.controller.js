import { wrap } from './base.controller.js';
import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class AttendanceController {
  constructor(service) { this.svc = service; }

  clockIn    = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.clockIn(req.user.id, { locationId: req.body.locationId, notes: req.body.notes, ipAddress: req.ip }), message: 'Clocked in', statusCode: HTTP_STATUS.CREATED }));
  clockOut   = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.clockOut(req.user.id), message: 'Clocked out' }));
  startBreak = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.startBreak(req.user.id), message: 'Break started' }));
  endBreak   = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.endBreak(req.user.id), message: 'Break ended' }));
  getStatus  = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.getStatus(req.user.id) }));
  getOwn     = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findByUser(req.user.id, req.query)));
  getByUser  = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findByUser(req.params.userId, req.query)));
  getAll     = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findAll(req.query)));
  getById    = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.findById(req.params.id) }));
  update     = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.update(req.params.id, req.body), message: 'Updated' }));
  delete     = wrap(async (req, res) => ApiResponse.success(res, await this.svc.delete(req.params.id)));
  getSummary = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.getSummary(req.params.userId || req.user.id, req.query) }));
}

export default AttendanceController;

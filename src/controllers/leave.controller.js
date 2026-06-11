import { wrap } from './base.controller.js';
import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

class LeaveController {
  constructor(service) { this.svc = service; }

  create     = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.create(req.user.id, req.body), message: 'Leave request submitted', statusCode: HTTP_STATUS.CREATED }));
  getOwn     = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findByUser(req.user.id, req.query)));
  getAll     = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findAll(req.query)));
  getPending = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.getPending(req.query)));
  getById    = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.findById(req.params.id) }));
  approve    = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.approve(req.params.id, req.user.id, req.body.notes), message: 'Leave approved' }));
  reject     = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.reject(req.params.id, req.user.id, req.body.notes), message: 'Leave rejected' }));
  cancel     = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.cancel(req.params.id, req.user.id), message: 'Leave cancelled' }));
  updateOwn  = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.updateOwn(req.params.id, req.user.id, req.body), message: 'Leave updated' }));
  getBalance = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.getBalance(req.params.userId || req.user.id, req.query.year) }));
}

export default LeaveController;

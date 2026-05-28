import { wrap } from './base.controller.js';
import { ApiResponse } from '../utils/index.js';

class LocationController {
  constructor(svc) { this.svc = svc; }
  create  = wrap(async (req, res) => ApiResponse.created(res, { data: await this.svc.create(req.body) }));
  getAll  = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findAll(req.query)));
  getById = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.findById(req.params.id) }));
  update  = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.update(req.params.id, req.body), message: 'Updated' }));
  delete  = wrap(async (req, res) => ApiResponse.success(res, await this.svc.delete(req.params.id)));
}
export default LocationController;

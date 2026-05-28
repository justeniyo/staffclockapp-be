import { wrap } from './base.controller.js';
import { ApiResponse } from '../utils/index.js';

class UserController {
  constructor(userService) {
    this.svc = userService;
  }

  create       = wrap(async (req, res) => ApiResponse.created(res, { data: await this.svc.create(req.body, req.user.role), message: 'User created successfully. A verification email has been sent to the user.' }));
  findAll      = wrap(async (req, res) => ApiResponse.paginated(res, await this.svc.findAll(req.query)));
  findById     = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.findById(req.params.id) }));
  update       = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.update(req.params.id, req.body, req.user.role), message: 'User updated' }));
  delete       = wrap(async (req, res) => { await this.svc.delete(req.params.id, req.user.role); ApiResponse.success(res, { message: 'User deleted' }); });
  getDirectReports = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.getDirectReports(req.params.id) }));
  findByRole   = wrap(async (req, res) => ApiResponse.success(res, { data: await this.svc.findByRole(req.params.role) }));
}

export default UserController;

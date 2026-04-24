import { ApiResponse } from '../utils/index.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * User controller
 * Handles user-related HTTP requests
 */
class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  /**
   * POST /api/users
   * Creates a new user
   */
  create = async (req, res, next) => {
    try {
      const user = await this.userService.create(req.body, req.user.role);

      return ApiResponse.created(res, {
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users
   * Lists all users with filtering and pagination
   */
  findAll = async (req, res, next) => {
    try {
      const { items, pagination } = await this.userService.findAll(req.query);

      return ApiResponse.paginated(res, {
        data: items,
        pagination,
        message: 'Users retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/:id
   * Gets user by ID
   */
  findById = async (req, res, next) => {
    try {
      const user = await this.userService.findById(req.params.id);

      return ApiResponse.success(res, {
        data: user,
        message: 'User retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/users/:id
   * Updates user
   */
  update = async (req, res, next) => {
    try {
      const user = await this.userService.update(
        req.params.id,
        req.body,
        req.user.role
      );

      return ApiResponse.success(res, {
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/users/:id
   * Deletes user
   */
  delete = async (req, res, next) => {
    try {
      await this.userService.delete(req.params.id, req.user.role);

      return ApiResponse.success(res, {
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/:id/direct-reports
   * Gets direct reports of a user
   */
  getDirectReports = async (req, res, next) => {
    try {
      const users = await this.userService.getDirectReports(req.params.id);

      return ApiResponse.success(res, {
        data: users,
        message: 'Direct reports retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/role/:role
   * Gets users by role
   */
  findByRole = async (req, res, next) => {
    try {
      const users = await this.userService.findByRole(req.params.role);

      return ApiResponse.success(res, {
        data: users,
        message: 'Users retrieved',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;

import AuthController from './auth.controller.js';
import UserController from './user.controller.js';
import AttendanceController from './attendance.controller.js';
import ShiftController from './shift.controller.js';
import LeaveController from './leave.controller.js';
import DepartmentController from './department.controller.js';
import LocationController from './location.controller.js';
import ReportController from './report.controller.js';

export const createControllers = (services) => ({
  authController: new AuthController(services.authService),
  userController: new UserController(services.userService),
  attendanceController: new AttendanceController(services.attendanceService),
  shiftController: new ShiftController(services.shiftService),
  leaveController: new LeaveController(services.leaveService),
  departmentController: new DepartmentController(services.departmentService),
  locationController: new LocationController(services.locationService),
  reportController: new ReportController(services.reportService),
});

export {
  AuthController,
  UserController,
  AttendanceController,
  ShiftController,
  LeaveController,
  DepartmentController,
  LocationController,
  ReportController,
};

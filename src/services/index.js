import AuthService from './auth.service.js';
import UserService from './user.service.js';
import AttendanceService from './attendance.service.js';
import ShiftService from './shift.service.js';
import LeaveService from './leave.service.js';
import DepartmentService from './department.service.js';
import LocationService from './location.service.js';
import ReportService from './report.service.js';

export const createServices = (db) => ({
  authService: new AuthService(db),
  userService: new UserService(db),
  attendanceService: new AttendanceService(db),
  shiftService: new ShiftService(db),
  leaveService: new LeaveService(db),
  departmentService: new DepartmentService(db),
  locationService: new LocationService(db),
  reportService: new ReportService(db),
});

export { AuthService, UserService, AttendanceService, ShiftService, LeaveService, DepartmentService, LocationService, ReportService };
export { default as CrudService } from './crud.service.js';

import ExcelJS from 'exceljs';
import { Op } from 'sequelize';

/**
 * Column definition format: { header, key, width }
 * Each report type defines its columns once — CSV and Excel both derive from it.
 */
const REPORT_SCHEMAS = {
  attendance: {
    sheet: 'Attendance Report',
    columns: [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Employee ID', key: 'employeeId', width: 12 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Location', key: 'userLocation', width: 20 },
      { header: 'Clock In', key: 'clockIn', width: 20 },
      { header: 'Clock Out', key: 'clockOut', width: 20 },
      { header: 'Break (min)', key: 'breakMinutes', width: 12 },
      { header: 'Work (min)', key: 'workMinutes', width: 12 },
      { header: 'Work (hrs)', key: 'workHours', width: 12 },
      { header: 'Clock Location', key: 'clockLocation', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ],
  },
  shifts: {
    sheet: 'Shift Report',
    columns: [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Employee ID', key: 'employeeId', width: 12 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Start', key: 'startTime', width: 10 },
      { header: 'End', key: 'endTime', width: 10 },
      { header: 'Break (min)', key: 'breakMinutes', width: 12 },
      { header: 'Scheduled (hrs)', key: 'scheduledHours', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ],
  },
  leaves: {
    sheet: 'Leave Report',
    columns: [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Employee ID', key: 'employeeId', width: 12 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Start Date', key: 'startDate', width: 12 },
      { header: 'End Date', key: 'endDate', width: 12 },
      { header: 'Total Days', key: 'totalDays', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Reason', key: 'reason', width: 30 },
      { header: 'Reviewed By', key: 'reviewedBy', width: 20 },
      { header: 'Reviewed At', key: 'reviewedAt', width: 20 },
      { header: 'Review Notes', key: 'reviewNotes', width: 30 },
    ],
  },
  summary: {
    sheet: 'Attendance Summary',
    columns: [
      { header: 'Employee ID', key: 'employeeId', width: 12 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Total Days', key: 'totalDays', width: 12 },
      { header: 'Total Work (min)', key: 'totalWorkMinutes', width: 15 },
      { header: 'Total Work (hrs)', key: 'totalWorkHours', width: 15 },
      { header: 'Avg Hours/Day', key: 'avgWorkHoursPerDay', width: 15 },
      { header: 'Total Break (min)', key: 'totalBreakMinutes', width: 15 },
    ],
  },
};

// ── Helpers ──

const fullName = (u) => `${u.firstName} ${u.lastName}`;
const optName = (obj) => obj?.name || '';
const escapeCsv = (val) => {
  if (val == null) return '';
  const s = String(val);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const calcShiftHrs = (start, end, brk) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (((eh * 60 + em) - (sh * 60 + sm) - brk) / 60).toFixed(2);
};
const dateRange = (where, field, start, end, isTimestamp = false) => {
  if (start) where[field] = { [Op.gte]: isTimestamp ? new Date(start) : start };
  if (end) where[field] = { ...where[field], [Op.lte]: isTimestamp ? new Date(end + 'T23:59:59') : end };
};

class ReportService {
  constructor(db) { this.db = db; }

  // ── Generic export: one method handles both formats for any report type ──

  async export(type, filters, format = 'csv') {
    const data = await this[`get${type.charAt(0).toUpperCase() + type.slice(1)}Data`](filters);
    return format === 'excel' ? this.toExcel(type, data) : this.toCsv(type, data);
  }

  toCsv(type, data) {
    const { columns } = REPORT_SCHEMAS[type];
    const keys = columns.map((c) => c.key);
    const header = columns.map((c) => c.header).join(',');
    return [header, ...data.map((row) => keys.map((k) => escapeCsv(row[k])).join(','))].join('\n');
  }

  async toExcel(type, data) {
    const schema = REPORT_SCHEMAS[type];
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(schema.sheet);
    ws.columns = schema.columns;
    const hdr = ws.getRow(1);
    hdr.font = { bold: true };
    hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    hdr.alignment = { horizontal: 'center' };
    data.forEach((row) => ws.addRow(row));
    return wb.xlsx.writeBuffer();
  }

  // ── Data fetchers ──

  async getAttendanceData({ startDate, endDate, userId, departmentId, locationId }) {
    const { Attendance, User, Department, Location } = this.db;
    const where = { status: 'clocked_out' };
    dateRange(where, 'clockIn', startDate, endDate, true);
    if (userId) where.userId = userId;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;
    if (locationId) userWhere.locationId = locationId;

    const rows = await Attendance.findAll({
      where,
      include: [
        { model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }, { model: Location, as: 'location', attributes: ['name'] }] },
        { model: Location, as: 'location', attributes: ['name'] },
      ],
      order: [['clockIn', 'DESC']],
    });

    return rows.map((r) => ({
      id: r.id, employeeId: r.user.id, employeeName: fullName(r.user), email: r.user.email,
      department: optName(r.user.department), userLocation: optName(r.user.location),
      clockIn: r.clockIn, clockOut: r.clockOut, breakMinutes: r.breakDuration || 0,
      workMinutes: r.workDuration || 0, workHours: r.workDuration ? (r.workDuration / 60).toFixed(2) : '0',
      clockLocation: optName(r.location), notes: r.notes || '',
    }));
  }

  async getShiftsData({ startDate, endDate, userId, departmentId, locationId, status }) {
    const { Shift, User, Department, Location } = this.db;
    const where = {};
    dateRange(where, 'date', startDate, endDate);
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const rows = await Shift.findAll({
      where,
      include: [
        { model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }] },
        { model: Location, as: 'location', attributes: ['name'] },
        { model: User, as: 'creator', attributes: ['firstName', 'lastName'] },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    return rows.map((r) => ({
      id: r.id, employeeId: r.user.id, employeeName: fullName(r.user), email: r.user.email,
      department: optName(r.user.department), date: r.date, startTime: r.startTime, endTime: r.endTime,
      breakMinutes: r.breakMinutes, scheduledHours: calcShiftHrs(r.startTime, r.endTime, r.breakMinutes),
      location: optName(r.location), status: r.status, createdBy: r.creator ? fullName(r.creator) : '', notes: r.notes || '',
    }));
  }

  async getLeavesData({ startDate, endDate, userId, departmentId, status, type }) {
    const { Leave, User, Department } = this.db;
    const where = {};
    if (startDate) where.startDate = { [Op.gte]: startDate };
    if (endDate) where.endDate = { [Op.lte]: endDate };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (type) where.type = type;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const rows = await Leave.findAll({
      where,
      include: [
        { model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }] },
        { model: User, as: 'reviewer', attributes: ['firstName', 'lastName'] },
      ],
      order: [['startDate', 'DESC']],
    });

    return rows.map((r) => ({
      id: r.id, employeeId: r.user.id, employeeName: fullName(r.user), email: r.user.email,
      department: optName(r.user.department), type: r.type, startDate: r.startDate, endDate: r.endDate,
      totalDays: r.totalDays, status: r.status, reason: r.reason || '',
      reviewedBy: r.reviewer ? fullName(r.reviewer) : '', reviewedAt: r.reviewedAt || '', reviewNotes: r.reviewNotes || '',
    }));
  }

  async getSummaryData({ startDate, endDate, departmentId }) {
    const { Attendance, User, Department } = this.db;
    const where = { status: 'clocked_out' };
    dateRange(where, 'clockIn', startDate, endDate, true);

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const rows = await Attendance.findAll({
      where,
      include: [{ model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }), attributes: ['id', 'firstName', 'lastName'],
        include: [{ model: Department, as: 'department', attributes: ['name'] }] }],
      attributes: ['userId', 'workDuration', 'breakDuration'],
    });

    const map = {};
    for (const r of rows) {
      const s = map[r.userId] ??= { employeeId: r.user.id, employeeName: fullName(r.user), department: optName(r.user.department), totalDays: 0, totalWorkMinutes: 0, totalBreakMinutes: 0 };
      s.totalDays++;
      s.totalWorkMinutes += r.workDuration || 0;
      s.totalBreakMinutes += r.breakDuration || 0;
    }

    return Object.values(map).map((u) => ({
      ...u,
      totalWorkHours: (u.totalWorkMinutes / 60).toFixed(2),
      avgWorkHoursPerDay: u.totalDays ? (u.totalWorkMinutes / 60 / u.totalDays).toFixed(2) : '0',
    }));
  }
}

export default ReportService;

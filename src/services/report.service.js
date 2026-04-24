import ExcelJS from 'exceljs';
import { Op } from 'sequelize';

class ReportService {
  constructor(db) {
    this.db = db;
  }

  // ============ ATTENDANCE REPORTS ============

  async getAttendanceData({ startDate, endDate, userId, departmentId, locationId }) {
    const { Attendance, User, Department, Location } = this.db;

    const where = { status: 'clocked_out' };
    if (startDate) where.clockIn = { [Op.gte]: new Date(startDate) };
    if (endDate) where.clockIn = { ...where.clockIn, [Op.lte]: new Date(endDate + 'T23:59:59') };
    if (userId) where.userId = userId;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;
    if (locationId) userWhere.locationId = locationId;

    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length ? userWhere : undefined,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [
            { model: Department, as: 'department', attributes: ['name'] },
            { model: Location, as: 'location', attributes: ['name'] },
          ],
        },
        { model: Location, as: 'location', attributes: ['name'] },
      ],
      order: [['clockIn', 'DESC']],
    });

    return records.map((r) => ({
      id: r.id,
      employeeId: r.user.id,
      employeeName: `${r.user.firstName} ${r.user.lastName}`,
      email: r.user.email,
      department: r.user.department?.name || '',
      userLocation: r.user.location?.name || '',
      clockIn: r.clockIn,
      clockOut: r.clockOut,
      breakMinutes: r.breakDuration || 0,
      workMinutes: r.workDuration || 0,
      workHours: r.workDuration ? (r.workDuration / 60).toFixed(2) : '0',
      clockLocation: r.location?.name || '',
      notes: r.notes || '',
    }));
  }

  async exportAttendanceCsv(filters) {
    const data = await this.getAttendanceData(filters);
    const headers = ['ID', 'Employee ID', 'Employee Name', 'Email', 'Department', 'Location', 'Clock In', 'Clock Out', 'Break (min)', 'Work (min)', 'Work (hrs)', 'Clock Location', 'Notes'];
    return this.toCsv(headers, data, ['id', 'employeeId', 'employeeName', 'email', 'department', 'userLocation', 'clockIn', 'clockOut', 'breakMinutes', 'workMinutes', 'workHours', 'clockLocation', 'notes']);
  }

  async exportAttendanceExcel(filters) {
    const data = await this.getAttendanceData(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance Report');

    sheet.columns = [
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
    ];

    this.styleHeader(sheet);
    data.forEach((row) => sheet.addRow(row));

    return workbook.xlsx.writeBuffer();
  }

  // ============ SHIFT REPORTS ============

  async getShiftData({ startDate, endDate, userId, departmentId, locationId, status }) {
    const { Shift, User, Department, Location } = this.db;

    const where = {};
    if (startDate) where.date = { [Op.gte]: startDate };
    if (endDate) where.date = { ...where.date, [Op.lte]: endDate };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const records = await Shift.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length ? userWhere : undefined,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }],
        },
        { model: Location, as: 'location', attributes: ['name'] },
        { model: User, as: 'creator', attributes: ['firstName', 'lastName'] },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    return records.map((r) => ({
      id: r.id,
      employeeId: r.user.id,
      employeeName: `${r.user.firstName} ${r.user.lastName}`,
      email: r.user.email,
      department: r.user.department?.name || '',
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      breakMinutes: r.breakMinutes,
      scheduledHours: this.calculateShiftHours(r.startTime, r.endTime, r.breakMinutes),
      location: r.location?.name || '',
      status: r.status,
      createdBy: r.creator ? `${r.creator.firstName} ${r.creator.lastName}` : '',
      notes: r.notes || '',
    }));
  }

  async exportShiftsCsv(filters) {
    const data = await this.getShiftData(filters);
    const headers = ['ID', 'Employee ID', 'Employee Name', 'Email', 'Department', 'Date', 'Start', 'End', 'Break (min)', 'Scheduled (hrs)', 'Location', 'Status', 'Created By', 'Notes'];
    return this.toCsv(headers, data, ['id', 'employeeId', 'employeeName', 'email', 'department', 'date', 'startTime', 'endTime', 'breakMinutes', 'scheduledHours', 'location', 'status', 'createdBy', 'notes']);
  }

  async exportShiftsExcel(filters) {
    const data = await this.getShiftData(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Shift Report');

    sheet.columns = [
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
    ];

    this.styleHeader(sheet);
    data.forEach((row) => sheet.addRow(row));

    return workbook.xlsx.writeBuffer();
  }

  // ============ LEAVE REPORTS ============

  async getLeaveData({ startDate, endDate, userId, departmentId, status, type }) {
    const { Leave, User, Department } = this.db;

    const where = {};
    if (startDate) where.startDate = { [Op.gte]: startDate };
    if (endDate) where.endDate = { [Op.lte]: endDate };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (type) where.type = type;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const records = await Leave.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length ? userWhere : undefined,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }],
        },
        { model: User, as: 'reviewer', attributes: ['firstName', 'lastName'] },
      ],
      order: [['startDate', 'DESC']],
    });

    return records.map((r) => ({
      id: r.id,
      employeeId: r.user.id,
      employeeName: `${r.user.firstName} ${r.user.lastName}`,
      email: r.user.email,
      department: r.user.department?.name || '',
      type: r.type,
      startDate: r.startDate,
      endDate: r.endDate,
      totalDays: r.totalDays,
      status: r.status,
      reason: r.reason || '',
      reviewedBy: r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : '',
      reviewedAt: r.reviewedAt || '',
      reviewNotes: r.reviewNotes || '',
    }));
  }

  async exportLeavesCsv(filters) {
    const data = await this.getLeaveData(filters);
    const headers = ['ID', 'Employee ID', 'Employee Name', 'Email', 'Department', 'Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Reason', 'Reviewed By', 'Reviewed At', 'Review Notes'];
    return this.toCsv(headers, data, ['id', 'employeeId', 'employeeName', 'email', 'department', 'type', 'startDate', 'endDate', 'totalDays', 'status', 'reason', 'reviewedBy', 'reviewedAt', 'reviewNotes']);
  }

  async exportLeavesExcel(filters) {
    const data = await this.getLeaveData(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leave Report');

    sheet.columns = [
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
    ];

    this.styleHeader(sheet);
    data.forEach((row) => sheet.addRow(row));

    return workbook.xlsx.writeBuffer();
  }

  // ============ SUMMARY REPORTS ============

  async getAttendanceSummary({ startDate, endDate, departmentId }) {
    const { Attendance, User, Department } = this.db;

    const where = { status: 'clocked_out' };
    if (startDate) where.clockIn = { [Op.gte]: new Date(startDate) };
    if (endDate) where.clockIn = { ...where.clockIn, [Op.lte]: new Date(endDate + 'T23:59:59') };

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const records = await Attendance.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        where: Object.keys(userWhere).length ? userWhere : undefined,
        attributes: ['id', 'firstName', 'lastName'],
        include: [{ model: Department, as: 'department', attributes: ['name'] }],
      }],
      attributes: ['userId', 'workDuration', 'breakDuration'],
    });

    // Group by user
    const userSummary = {};
    records.forEach((r) => {
      const key = r.userId;
      if (!userSummary[key]) {
        userSummary[key] = {
          employeeId: r.user.id,
          employeeName: `${r.user.firstName} ${r.user.lastName}`,
          department: r.user.department?.name || '',
          totalDays: 0,
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
        };
      }
      userSummary[key].totalDays++;
      userSummary[key].totalWorkMinutes += r.workDuration || 0;
      userSummary[key].totalBreakMinutes += r.breakDuration || 0;
    });

    return Object.values(userSummary).map((u) => ({
      ...u,
      totalWorkHours: (u.totalWorkMinutes / 60).toFixed(2),
      avgWorkHoursPerDay: u.totalDays ? (u.totalWorkMinutes / 60 / u.totalDays).toFixed(2) : '0',
    }));
  }

  async exportSummaryCsv(filters) {
    const data = await this.getAttendanceSummary(filters);
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Total Days', 'Total Work (min)', 'Total Work (hrs)', 'Avg Hours/Day', 'Total Break (min)'];
    return this.toCsv(headers, data, ['employeeId', 'employeeName', 'department', 'totalDays', 'totalWorkMinutes', 'totalWorkHours', 'avgWorkHoursPerDay', 'totalBreakMinutes']);
  }

  async exportSummaryExcel(filters) {
    const data = await this.getAttendanceSummary(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance Summary');

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 12 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Total Days', key: 'totalDays', width: 12 },
      { header: 'Total Work (min)', key: 'totalWorkMinutes', width: 15 },
      { header: 'Total Work (hrs)', key: 'totalWorkHours', width: 15 },
      { header: 'Avg Hours/Day', key: 'avgWorkHoursPerDay', width: 15 },
      { header: 'Total Break (min)', key: 'totalBreakMinutes', width: 15 },
    ];

    this.styleHeader(sheet);
    data.forEach((row) => sheet.addRow(row));

    return workbook.xlsx.writeBuffer();
  }

  // ============ HELPER METHODS ============

  toCsv(headers, data, fields) {
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [headers.join(',')];
    data.forEach((row) => {
      rows.push(fields.map((f) => escape(row[f])).join(','));
    });

    return rows.join('\n');
  }

  styleHeader(sheet) {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    sheet.getRow(1).alignment = { horizontal: 'center' };
  }

  calculateShiftHours(startTime, endTime, breakMinutes) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - breakMinutes;
    return (totalMinutes / 60).toFixed(2);
  }
}

export default ReportService;

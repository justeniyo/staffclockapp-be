import { Op } from 'sequelize';
import { AppError } from '../utils/index.js';
import { ATTENDANCE_STATUS } from '../config/constants.js';

class AttendanceService {
  constructor(db) {
    this.db = db;
  }

  async getActiveAttendance(userId) {
    const { Attendance } = this.db;
    return Attendance.findOne({
      where: { userId, status: { [Op.ne]: ATTENDANCE_STATUS.CLOCKED_OUT } },
      order: [['clockIn', 'DESC']],
    });
  }

  async clockIn(userId, { locationId, notes, ipAddress } = {}) {
    const { Attendance } = this.db;

    const active = await this.getActiveAttendance(userId);
    if (active) {
      throw AppError.conflict('Already clocked in. Please clock out first.');
    }

    const record = await Attendance.create({
      userId,
      clockIn: new Date(),
      status: ATTENDANCE_STATUS.CLOCKED_IN,
      locationId,
      notes,
      ipAddress,
    });
    return record;
  }

  async clockOut(userId) {
    const active = await this.getActiveAttendance(userId);
    if (!active) {
      throw AppError.badRequest('Not currently clocked in');
    }

    if (active.isOnBreak()) {
      await this.endBreak(userId);
    }

    const clockOut = new Date();
    const { workDuration, breakDuration } = this.calculateDurations(active.clockIn, clockOut, active.breakDuration || 0);

    await active.update({
      clockOut,
      status: ATTENDANCE_STATUS.CLOCKED_OUT,
      workDuration,
      breakDuration,
    });

    const fresh = await active.reload({ include: this.getIncludes() });
    return fresh;
  }

  async startBreak(userId) {
    const active = await this.getActiveAttendance(userId);
    if (!active) {
      throw AppError.badRequest('Not currently clocked in');
    }

    if (active.isOnBreak()) {
      throw AppError.conflict('Already on break');
    }

    await active.update({
      breakStart: new Date(),
      status: ATTENDANCE_STATUS.ON_BREAK,
    });

    const fresh = await active.reload();
    return fresh;
  }

  async endBreak(userId) {
    const active = await this.getActiveAttendance(userId);
    if (!active) {
      throw AppError.badRequest('Not currently clocked in');
    }

    if (!active.isOnBreak()) {
      throw AppError.badRequest('Not currently on break');
    }

    const breakEnd = new Date();
    const breakMinutes = Math.floor((breakEnd - active.breakStart) / 60000);
    const totalBreak = (active.breakDuration || 0) + breakMinutes;

    await active.update({
      breakEnd,
      breakDuration: totalBreak,
      status: ATTENDANCE_STATUS.CLOCKED_IN,
    });

    const fresh = await active.reload();
    return fresh;
  }

  async getStatus(userId) {
    const active = await this.getActiveAttendance(userId);
    if (!active) {
      return { status: 'clocked_out', attendance: null };
    }

    return {
      status: active.status,
      attendance: active,
      clockedInAt: active.clockIn,
      breakDuration: active.breakDuration || 0,
    };
  }

  async findByUser(userId, { startDate, endDate, page = 1, limit = 20 } = {}) {
    const { Attendance } = this.db;

    const where = { userId };
    if (startDate || endDate) {
      where.clockIn = {};
      if (startDate) where.clockIn[Op.gte] = new Date(startDate);
      if (endDate) where.clockIn[Op.lte] = new Date(endDate + 'T23:59:59');
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Attendance.findAndCountAll({
      where,
      include: this.getIncludes(),
      order: [['clockIn', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
  }

  async findAll({ startDate, endDate, userId, status, page = 1, limit = 20 } = {}) {
    const { Attendance } = this.db;

    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.clockIn = {};
      if (startDate) where.clockIn[Op.gte] = new Date(startDate);
      if (endDate) where.clockIn[Op.lte] = new Date(endDate + 'T23:59:59');
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Attendance.findAndCountAll({
      where,
      include: this.getIncludes(),
      order: [['clockIn', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
  }

  async findById(id) {
    const { Attendance } = this.db;
    const attendance = await Attendance.findByPk(id, { include: this.getIncludes() });
    if (!attendance) throw AppError.notFound('Attendance record not found');
    return attendance;
  }

  async update(id, data) {
    const attendance = await this.findById(id);
    await attendance.update(data);
    return attendance.reload({ include: this.getIncludes() });
  }

  async delete(id) {
    const attendance = await this.findById(id);
    await attendance.destroy();
    return { message: 'Attendance record deleted' };
  }

  async getSummary(userId, { startDate, endDate }) {
    const { Attendance } = this.db;

    const where = { userId, status: ATTENDANCE_STATUS.CLOCKED_OUT };
    if (startDate || endDate) {
      where.clockIn = {};
      if (startDate) where.clockIn[Op.gte] = new Date(startDate);
      if (endDate) where.clockIn[Op.lte] = new Date(endDate + 'T23:59:59');
    }

    const records = await Attendance.findAll({ where });

    const totalWorkMinutes = records.reduce((sum, r) => sum + (r.workDuration || 0), 0);
    const totalBreakMinutes = records.reduce((sum, r) => sum + (r.breakDuration || 0), 0);

    return {
      totalDays: records.length,
      totalWorkMinutes,
      totalWorkHours: Math.round((totalWorkMinutes / 60) * 100) / 100,
      totalBreakMinutes,
      averageWorkMinutes: records.length ? Math.round(totalWorkMinutes / records.length) : 0,
    };
  }

  calculateDurations(clockIn, clockOut, existingBreak = 0) {
    const totalMinutes = Math.floor((clockOut - clockIn) / 60000);
    return {
      workDuration: totalMinutes - existingBreak,
      breakDuration: existingBreak,
    };
  }

  getIncludes() {
    const { User, Location, Department } = this.db;
    return [
      { model: User, as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'departmentId', 'locationId', 'managerId'],
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name'] },
          { model: Location,   as: 'location',   attributes: ['id', 'name'] },
        ],
      },
      { model: Location, as: 'location', attributes: ['id', 'name'] },
    ];
  }
}

export default AttendanceService;

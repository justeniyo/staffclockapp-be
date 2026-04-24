import { Op } from 'sequelize';
import { AppError } from '../utils/index.js';
import { LEAVE_STATUS } from '../config/constants.js';

class LeaveService {
  constructor(db) {
    this.db = db;
  }

  async create(userId, data) {
    const { Leave } = this.db;

    if (new Date(data.startDate) > new Date(data.endDate)) {
      throw AppError.badRequest('Start date must be before end date');
    }

    const overlapping = await Leave.findOne({
      where: {
        userId,
        status: { [Op.in]: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
        [Op.or]: [
          { startDate: { [Op.between]: [data.startDate, data.endDate] } },
          { endDate: { [Op.between]: [data.startDate, data.endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: data.startDate } },
              { endDate: { [Op.gte]: data.endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) throw AppError.conflict('Leave request overlaps with existing leave');

    const totalDays = this.calculateDays(data.startDate, data.endDate);

    const leave = await Leave.create({
      ...data,
      userId,
      totalDays,
      status: LEAVE_STATUS.PENDING,
    });

    return leave.reload({ include: this.getIncludes() });
  }

  async findById(id) {
    const { Leave } = this.db;
    const leave = await Leave.findByPk(id, { include: this.getIncludes() });
    if (!leave) throw AppError.notFound('Leave request not found');
    return leave;
  }

  async findByUser(userId, { status, type, year, page = 1, limit = 20 } = {}) {
    const { Leave } = this.db;

    const where = { userId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (year) {
      where.startDate = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      };
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Leave.findAndCountAll({
      where,
      include: this.getIncludes(),
      order: [['startDate', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
  }

  async findAll({ status, type, userId, startDate, endDate, page = 1, limit = 20 } = {}) {
    const { Leave } = this.db;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (startDate) where.startDate = { [Op.gte]: startDate };
    if (endDate) where.endDate = { [Op.lte]: endDate };

    const offset = (page - 1) * limit;
    const { rows, count } = await Leave.findAndCountAll({
      where,
      include: this.getIncludes(),
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
  }

  async getPending({ page = 1, limit = 20 } = {}) {
    return this.findAll({ status: LEAVE_STATUS.PENDING, page, limit });
  }

  async approve(id, reviewerId, reviewNotes) {
    const leave = await this.findById(id);

    if (!leave.isPending()) {
      throw AppError.badRequest('Only pending requests can be approved');
    }

    await leave.update({
      status: LEAVE_STATUS.APPROVED,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes,
    });

    return leave.reload({ include: this.getIncludes() });
  }

  async reject(id, reviewerId, reviewNotes) {
    const leave = await this.findById(id);

    if (!leave.isPending()) {
      throw AppError.badRequest('Only pending requests can be rejected');
    }

    await leave.update({
      status: LEAVE_STATUS.REJECTED,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes,
    });

    return leave.reload({ include: this.getIncludes() });
  }

  async cancel(id, userId) {
    const leave = await this.findById(id);

    if (leave.userId !== userId) {
      throw AppError.forbidden('Can only cancel own leave requests');
    }

    if (leave.status === LEAVE_STATUS.CANCELLED) {
      throw AppError.badRequest('Leave already cancelled');
    }

    if (leave.status === LEAVE_STATUS.APPROVED && new Date(leave.startDate) <= new Date()) {
      throw AppError.badRequest('Cannot cancel leave that has already started');
    }

    await leave.update({ status: LEAVE_STATUS.CANCELLED });
    return leave.reload({ include: this.getIncludes() });
  }

  async getBalance(userId, year = new Date().getFullYear()) {
    const { Leave } = this.db;

    const approved = await Leave.findAll({
      where: {
        userId,
        status: LEAVE_STATUS.APPROVED,
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
      attributes: ['type', 'totalDays'],
    });

    const used = {};
    approved.forEach((leave) => {
      used[leave.type] = (used[leave.type] || 0) + parseFloat(leave.totalDays);
    });

    return {
      year,
      used,
      pending: await Leave.count({
        where: { userId, status: LEAVE_STATUS.PENDING },
      }),
    };
  }

  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
    }

    return days;
  }

  getIncludes() {
    const { User } = this.db;
    return [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
    ];
  }
}

export default LeaveService;

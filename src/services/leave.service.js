import { Op } from 'sequelize';
import { AppError } from '../utils/index.js';
import { LEAVE_STATUS, LEAVE_TYPES_REQUIRING_REASON } from '../config/constants.js';

class LeaveService {
  constructor(db) {
    this.db = db;
  }

  async create(userId, data) {
    const { Leave } = this.db;

    if (new Date(data.startDate) > new Date(data.endDate)) {
      throw AppError.badRequest('Start date must be before end date');
    }

    // Reason policy (also enforced by the route validator).
    const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
    if (LEAVE_TYPES_REQUIRING_REASON.includes(data.type) && !reason) {
      throw AppError.badRequest('Please provide a reason for this leave type');
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
      reason: reason || null,
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
      limit, offset,
    });
    return { data: rows, pagination: { total: count, page: +page, limit: +limit, totalPages: Math.ceil(count / limit) } };
  }

  async findAll({ status, type, userId, departmentId, year, page = 1, limit = 20 } = {}) {
    const { Leave, User, Department } = this.db;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (year) {
      where.startDate = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      };
    }

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const offset = (page - 1) * limit;
    const { rows, count } = await Leave.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', ...(Object.keys(userWhere).length && { where: userWhere }),
          attributes: ['id', 'firstName', 'lastName', 'email', 'departmentId', 'managerId'],
          include: [
            { model: Department, as: 'department', attributes: ['id', 'name'] },
            { model: User,       as: 'manager',    attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['startDate', 'DESC']],
      limit, offset,
    });
    return { data: rows, pagination: { total: count, page: +page, limit: +limit, totalPages: Math.ceil(count / limit) } };
  }

  async approve(id, reviewerId, notes) {
    const leave = await this.findById(id);
    if (!leave.isPending()) throw AppError.badRequest('Only pending requests can be approved');
    await leave.update({
      status: LEAVE_STATUS.APPROVED,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes || null,
    });
    return leave;
  }

  async reject(id, reviewerId, notes) {
    const leave = await this.findById(id);
    if (!leave.isPending()) throw AppError.badRequest('Only pending requests can be rejected');
    await leave.update({
      status: LEAVE_STATUS.REJECTED,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes || null,
    });
    return leave;
  }

  async cancel(id, userId) {
    const leave = await this.findById(id);
    if (leave.userId !== userId) throw AppError.forbidden('You can only cancel own leave requests');
    if (leave.status === LEAVE_STATUS.CANCELLED) throw AppError.badRequest('Leave is already cancelled');
    await leave.update({ status: LEAVE_STATUS.CANCELLED });
    return leave;
  }

  // Owner-editable update: only the requester can edit their own pending
  // leave. Once a request has been approved or rejected it's immutable.
  async updateOwn(id, userId, data) {
    const { Leave } = this.db;
    const leave = await this.findById(id);
    if (leave.userId !== userId) throw AppError.forbidden('You can only modify your own leave requests');
    if (leave.status !== LEAVE_STATUS.PENDING) {
      throw AppError.badRequest('Only pending requests can be edited');
    }

    const updates = {};
    if (data.type !== undefined) updates.type = data.type;
    if (data.startDate !== undefined) updates.startDate = data.startDate;
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.reason !== undefined) {
      const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
      updates.reason = reason || null;
    }

    const nextType = updates.type ?? leave.type;
    const nextReason = updates.reason !== undefined ? updates.reason : leave.reason;
    if (LEAVE_TYPES_REQUIRING_REASON.includes(nextType) && !nextReason) {
      throw AppError.badRequest('Please provide a reason for this leave type');
    }

    const nextStart = updates.startDate ?? leave.startDate;
    const nextEnd = updates.endDate ?? leave.endDate;
    if (new Date(nextStart) > new Date(nextEnd)) {
      throw AppError.badRequest('Start date must be before end date');
    }

    // Check for overlap with other pending/approved leaves, excluding this one.
    const overlapping = await Leave.findOne({
      where: {
        id: { [Op.ne]: leave.id },
        userId,
        status: { [Op.in]: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
        [Op.or]: [
          { startDate: { [Op.between]: [nextStart, nextEnd] } },
          { endDate: { [Op.between]: [nextStart, nextEnd] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: nextStart } },
              { endDate: { [Op.gte]: nextEnd } },
            ],
          },
        ],
      },
    });
    if (overlapping) throw AppError.conflict('Leave request overlaps with existing leave');

    if (updates.startDate || updates.endDate) {
      updates.totalDays = this.calculateDays(nextStart, nextEnd);
    }

    await leave.update(updates);
    return leave.reload({ include: this.getIncludes() });
  }

  async getPending({ page = 1, limit = 20 } = {}) {
    const { Leave, User } = this.db;
    const offset = (page - 1) * limit;
    const { rows, count } = await Leave.findAndCountAll({
      where: { status: LEAVE_STATUS.PENDING },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'departmentId', 'managerId'] }],
      order: [['createdAt', 'ASC']],
      limit, offset,
    });
    return { data: rows, total: count, pagination: { total: count, page: +page, limit: +limit, totalPages: Math.ceil(count / limit) } };
  }

  async getBalance(userId, year) {
    const { Leave } = this.db;
    const approvedLeaves = await Leave.findAll({
      where: {
        userId,
        status: LEAVE_STATUS.APPROVED,
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
    });

    const used = approvedLeaves.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + Number(l.totalDays);
      return acc;
    }, {});

    const pending = await Leave.count({
      where: {
        userId,
        status: LEAVE_STATUS.PENDING,
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
    });

    return { year, used, pending };
  }

  calculateDays(start, end) {
    let days = 0;
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) days++;
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  getIncludes() {
    const { User, Department } = this.db;
    return [
      { model: User, as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'departmentId', 'managerId'],
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name'] },
          { model: User,       as: 'manager',    attributes: ['id', 'firstName', 'lastName'] },
        ],
      },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
    ];
  }
}

export default LeaveService;

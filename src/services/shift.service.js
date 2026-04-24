import { Op } from 'sequelize';
import { AppError } from '../utils/index.js';
import { SHIFT_STATUS } from '../config/constants.js';

class ShiftService {
  constructor(db) {
    this.db = db;
  }

  async create(data, createdBy) {
    const { Shift, User } = this.db;

    const user = await User.findByPk(data.userId);
    if (!user) throw AppError.notFound('User not found');

    const existing = await Shift.findOne({
      where: { userId: data.userId, date: data.date, status: { [Op.ne]: SHIFT_STATUS.CANCELLED } },
    });
    if (existing) throw AppError.conflict('Shift already exists for this date');

    const shift = await Shift.create({ ...data, createdBy, status: SHIFT_STATUS.SCHEDULED });
    return shift.reload({ include: this.getIncludes() });
  }

  async createBulk(shifts, createdBy) {
    const results = [];
    for (const shift of shifts) {
      try {
        const created = await this.create(shift, createdBy);
        results.push({ success: true, data: created });
      } catch (error) {
        results.push({ success: false, error: error.message, data: shift });
      }
    }
    return results;
  }

  async findById(id) {
    const { Shift } = this.db;
    const shift = await Shift.findByPk(id, { include: this.getIncludes() });
    if (!shift) throw AppError.notFound('Shift not found');
    return shift;
  }

  async findByUser(userId, { startDate, endDate, status, page = 1, limit = 20 } = {}) {
    const { Shift } = this.db;

    const where = { userId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Shift.findAndCountAll({
      where,
      include: this.getIncludes(),
      order: [['date', 'ASC'], ['startTime', 'ASC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page, limit };
  }

  async findAll({ startDate, endDate, userId, locationId, status, page = 1, limit = 20 } = {}) {
    const { Shift } = this.db;

    const where = {};
    if (userId) where.userId = userId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Shift.findAndCountAll({
      where,
      include: this.getIncludes(),
      order: [['date', 'ASC'], ['startTime', 'ASC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page, limit };
  }

  async getWeekSchedule(startDate, { userId, locationId } = {}) {
    const { Shift } = this.db;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const where = {
      date: { [Op.between]: [startDate, endDate.toISOString().split('T')[0]] },
      status: { [Op.ne]: SHIFT_STATUS.CANCELLED },
    };
    if (userId) where.userId = userId;
    if (locationId) where.locationId = locationId;

    return Shift.findAll({
      where,
      include: this.getIncludes(),
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
  }

  async update(id, data) {
    const shift = await this.findById(id);

    if (shift.status === SHIFT_STATUS.COMPLETED) {
      throw AppError.badRequest('Cannot modify completed shift');
    }

    await shift.update(data);
    return shift.reload({ include: this.getIncludes() });
  }

  async cancel(id) {
    const shift = await this.findById(id);

    if (shift.status !== SHIFT_STATUS.SCHEDULED) {
      throw AppError.badRequest('Only scheduled shifts can be cancelled');
    }

    await shift.update({ status: SHIFT_STATUS.CANCELLED });
    return shift.reload({ include: this.getIncludes() });
  }

  async delete(id) {
    const shift = await this.findById(id);
    await shift.destroy();
    return { message: 'Shift deleted' };
  }

  async markComplete(id) {
    const shift = await this.findById(id);
    await shift.update({ status: SHIFT_STATUS.COMPLETED });
    return shift.reload({ include: this.getIncludes() });
  }

  async markMissed(id) {
    const shift = await this.findById(id);
    await shift.update({ status: SHIFT_STATUS.MISSED });
    return shift.reload({ include: this.getIncludes() });
  }

  getIncludes() {
    const { User, Location } = this.db;
    return [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      { model: Location, as: 'location', attributes: ['id', 'name'] },
    ];
  }
}

export default ShiftService;

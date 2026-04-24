import { Op } from 'sequelize';
import { AppError } from '../utils/index.js';

class DepartmentService {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const { Department } = this.db;

    const existing = await Department.findOne({ where: { name: data.name } });
    if (existing) throw AppError.conflict('Department name already exists');

    return Department.create(data);
  }

  async findById(id) {
    const { Department } = this.db;
    const department = await Department.findByPk(id);
    if (!department) throw AppError.notFound('Department not found');
    return department;
  }

  async findAll({ search, isActive, page = 1, limit = 20 } = {}) {
    const { Department } = this.db;

    const where = {};
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const offset = (page - 1) * limit;
    const { rows, count } = await Department.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    return { data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
  }

  async update(id, data) {
    const department = await this.findById(id);

    if (data.name && data.name !== department.name) {
      const { Department } = this.db;
      const existing = await Department.findOne({ where: { name: data.name, id: { [Op.ne]: id } } });
      if (existing) throw AppError.conflict('Department name already exists');
    }

    await department.update(data);
    return department;
  }

  async delete(id) {
    const { User } = this.db;
    const department = await this.findById(id);

    const userCount = await User.count({ where: { departmentId: id } });
    if (userCount > 0) {
      throw AppError.conflict(`Cannot delete department with ${userCount} assigned users`);
    }

    await department.destroy();
    return { message: 'Department deleted' };
  }

  async getUserCount(id) {
    const { User } = this.db;
    await this.findById(id);
    return User.count({ where: { departmentId: id } });
  }
}

export default DepartmentService;

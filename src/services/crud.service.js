import { Op } from 'sequelize';
import { AppError } from '../utils/index.js';

// Generic CRUD service for simple name-based resources (Department, Location).
class CrudService {
  constructor(db, { modelName, fkField, label }) {
    this.db = db;
    this.modelName = modelName;
    this.fkField = fkField;
    this.label = label;
  }

  get model() { return this.db[this.modelName]; }

  async create(data) {
    if (await this.model.findOne({ where: { name: data.name } }))
      throw AppError.conflict(`${this.label} name already exists`);
    return this.model.create(data);
  }

  async findById(id) {
    const item = await this.model.findByPk(id);
    if (!item) throw AppError.notFound(`${this.label} not found`);
    return item;
  }

  async findAll({ search, isActive, page = 1, limit = 20 } = {}) {
    const where = {};
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const offset = (page - 1) * limit;
    const { rows, count } = await this.model.findAndCountAll({ where, order: [['name', 'ASC']], limit, offset });
    return { data: rows, pagination: { total: count, page: +page, limit: +limit, totalPages: Math.ceil(count / limit) } };
  }

  async update(id, data) {
    const item = await this.findById(id);
    if (data.name && data.name !== item.name) {
      if (await this.model.findOne({ where: { name: data.name, id: { [Op.ne]: id } } }))
        throw AppError.conflict(`${this.label} name already exists`);
    }
    await item.update(data);
    return item;
  }

  async delete(id) {
    const item = await this.findById(id);
    const userCount = await this.db.User.count({ where: { [this.fkField]: id } });
    if (userCount > 0) throw AppError.conflict(`Cannot delete ${this.label.toLowerCase()} with ${userCount} assigned users`);
    await item.destroy();
    return { message: `${this.label} deleted` };
  }
}

export default CrudService;

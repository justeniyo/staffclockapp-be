import { Op } from 'sequelize';
import { AppError } from '../utils/index.js';

class LocationService {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const { Location } = this.db;

    const existing = await Location.findOne({ where: { name: data.name } });
    if (existing) throw AppError.conflict('Location name already exists');

    return Location.create(data);
  }

  async findById(id) {
    const { Location } = this.db;
    const location = await Location.findByPk(id);
    if (!location) throw AppError.notFound('Location not found');
    return location;
  }

  async findAll({ search, isActive, page = 1, limit = 20 } = {}) {
    const { Location } = this.db;

    const where = {};
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const offset = (page - 1) * limit;
    const { rows, count } = await Location.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page, limit };
  }

  async update(id, data) {
    const location = await this.findById(id);

    if (data.name && data.name !== location.name) {
      const { Location } = this.db;
      const existing = await Location.findOne({ where: { name: data.name, id: { [Op.ne]: id } } });
      if (existing) throw AppError.conflict('Location name already exists');
    }

    await location.update(data);
    return location;
  }

  async delete(id) {
    const { User } = this.db;
    const location = await this.findById(id);

    const userCount = await User.count({ where: { locationId: id } });
    if (userCount > 0) {
      throw AppError.conflict(`Cannot delete location with ${userCount} assigned users`);
    }

    await location.destroy();
    return { message: 'Location deleted' };
  }

  async getUserCount(id) {
    const { User } = this.db;
    await this.findById(id);
    return User.count({ where: { locationId: id } });
  }
}

export default LocationService;

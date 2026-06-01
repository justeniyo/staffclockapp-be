import { Model, DataTypes } from 'sequelize';

class Department extends Model {
  static initialize(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: { msg: 'Department name cannot be empty' },
            len: {
              args: [2, 100],
              msg: 'Department name must be between 2 and 100 characters',
            },
          },
        },
        description: {
          type: DataTypes.STRING(500),
          allowNull: true,
          validate: {
            len: { args: [0, 500], msg: 'Description must be 500 characters or fewer' },
          },
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active',
        },
      },
      {
        sequelize,
        tableName: 'departments',
        modelName: 'Department',
        timestamps: true,
        underscored: true,
      }
    );
  }

  static associate(models) {
    this.hasMany(models.User, {
      foreignKey: 'department_id',
      as: 'users',
    });
  }
}

export default Department;

import { Model, DataTypes } from 'sequelize';

class Location extends Model {
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
            notEmpty: { msg: 'Location name cannot be empty' },
            len: {
              args: [2, 100],
              msg: 'Location name must be between 2 and 100 characters',
            },
          },
        },
        address: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active',
        },
      },
      {
        sequelize,
        tableName: 'locations',
        modelName: 'Location',
        timestamps: true,
        underscored: true,
      }
    );
  }

  static associate(models) {
    this.hasMany(models.User, {
      foreignKey: 'location_id',
      as: 'users',
    });
  }
}

export default Location;

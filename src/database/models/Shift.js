import { Model, DataTypes } from 'sequelize';

class Shift extends Model {
  static initialize(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'user_id',
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        startTime: {
          type: DataTypes.TIME,
          allowNull: false,
          field: 'start_time',
        },
        endTime: {
          type: DataTypes.TIME,
          allowNull: false,
          field: 'end_time',
        },
        breakMinutes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'break_minutes',
        },
        locationId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'location_id',
        },
        status: {
          type: DataTypes.ENUM('scheduled', 'completed', 'missed', 'cancelled'),
          allowNull: false,
          defaultValue: 'scheduled',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'created_by',
        },
      },
      {
        sequelize,
        tableName: 'shifts',
        modelName: 'Shift',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['user_id', 'date'] },
          { fields: ['date'] },
        ],
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    this.belongsTo(models.Location, { foreignKey: 'location_id', as: 'location' });
  }

  getScheduledMinutes() {
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return totalMinutes - this.breakMinutes;
  }
}

export default Shift;

import { Model, DataTypes, Op } from 'sequelize';

class Attendance extends Model {
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
        clockIn: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'clock_in',
          validate: {
            isDate: { msg: 'Clock-in must be a valid date' },
            notFuture(value) {
              if (value && new Date(value) > new Date(Date.now() + 60000)) {
                throw new Error('Clock-in cannot be in the future');
              }
            },
          },
        },
        clockOut: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'clock_out',
          validate: {
            isDate: { msg: 'Clock-out must be a valid date' },
            isAfterClockIn(value) {
              if (value && this.clockIn && new Date(value) < new Date(this.clockIn)) {
                throw new Error('Clock-out must be after clock-in');
              }
            },
          },
        },
        breakStart: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'break_start',
        },
        breakEnd: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'break_end',
        },
        breakDuration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
          field: 'break_duration',
          comment: 'Total break time in minutes',
        },
        workDuration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'work_duration',
          comment: 'Total work time in minutes (excluding breaks)',
        },
        status: {
          type: DataTypes.ENUM('clocked_in', 'on_break', 'clocked_out'),
          allowNull: false,
          defaultValue: 'clocked_in',
        },
        locationId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'location_id',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
          field: 'ip_address',
        },
      },
      {
        sequelize,
        tableName: 'attendances',
        modelName: 'Attendance',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['user_id', 'clock_in'] },
          { fields: ['status'] },
        ],
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.Location, { foreignKey: 'location_id', as: 'location' });
  }

  isOnBreak() {
    return this.status === 'on_break';
  }

  isClockedOut() {
    return this.status === 'clocked_out';
  }

  calculateDurations() {
    if (!this.clockOut) return { workDuration: null, breakDuration: this.breakDuration || 0 };

    const totalMinutes = Math.floor((this.clockOut - this.clockIn) / 60000);
    const breakMinutes = this.breakDuration || 0;
    const workMinutes = totalMinutes - breakMinutes;

    return { workDuration: workMinutes, breakDuration: breakMinutes };
  }
}

export default Attendance;

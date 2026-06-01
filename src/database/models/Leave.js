import { Model, DataTypes } from 'sequelize';

const LEAVE_TYPES = ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'];
const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

class Leave extends Model {
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
        type: {
          type: DataTypes.ENUM(...LEAVE_TYPES),
          allowNull: false,
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'start_date',
          validate: {
            isDate: { msg: 'Start date must be a valid date' },
          },
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'end_date',
          validate: {
            isDate: { msg: 'End date must be a valid date' },
            isAfterStart(value) {
              if (value && this.startDate && new Date(value) < new Date(this.startDate)) {
                throw new Error('End date must be on or after start date');
              }
            },
          },
        },
        totalDays: {
          type: DataTypes.DECIMAL(4, 1),
          allowNull: false,
          field: 'total_days',
          validate: {
            min: { args: [0.5], msg: 'Total days must be at least 0.5' },
            max: { args: [365], msg: 'Total days cannot exceed 365' },
          },
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            len: { args: [0, 1000], msg: 'Reason must be 1000 characters or fewer' },
          },
        },
        status: {
          type: DataTypes.ENUM(...LEAVE_STATUSES),
          allowNull: false,
          defaultValue: 'pending',
        },
        reviewedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'reviewed_by',
        },
        reviewedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'reviewed_at',
        },
        reviewNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'review_notes',
        },
      },
      {
        sequelize,
        tableName: 'leaves',
        modelName: 'Leave',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['user_id', 'start_date'] },
          { fields: ['status'] },
        ],
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  }

  isPending() {
    return this.status === 'pending';
  }

  isApproved() {
    return this.status === 'approved';
  }
}

Leave.TYPES = LEAVE_TYPES;
Leave.STATUSES = LEAVE_STATUSES;

export default Leave;

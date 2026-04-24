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
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'end_date',
        },
        totalDays: {
          type: DataTypes.DECIMAL(4, 1),
          allowNull: false,
          field: 'total_days',
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
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

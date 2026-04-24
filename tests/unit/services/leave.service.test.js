import { expect } from 'chai';
import sinon from 'sinon';
import LeaveService from '../../../src/services/leave.service.js';
import { LEAVE_STATUS } from '../../../src/config/constants.js';

describe('LeaveService', () => {
  let leaveService;
  let mockDb;
  let mockLeave;

  beforeEach(() => {
    mockLeave = {
      id: 1,
      userId: 1,
      type: 'annual',
      startDate: '2024-01-15',
      endDate: '2024-01-19',
      totalDays: 5,
      status: LEAVE_STATUS.PENDING,
      isPending: () => true,
      isApproved: () => false,
      update: sinon.stub().resolves(),
      reload: sinon.stub().resolves(),
    };
    mockLeave.reload.resolves(mockLeave);

    mockDb = {
      Leave: {
        findOne: sinon.stub(),
        findByPk: sinon.stub(),
        findAndCountAll: sinon.stub(),
        findAll: sinon.stub(),
        create: sinon.stub(),
        count: sinon.stub(),
      },
      User: {},
    };

    leaveService = new LeaveService(mockDb);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should create leave request when no overlap', async () => {
      mockDb.Leave.findOne.resolves(null);
      mockDb.Leave.create.resolves(mockLeave);

      const result = await leaveService.create(1, {
        type: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-19',
        reason: 'Vacation',
      });

      expect(mockDb.Leave.create.calledOnce).to.be.true;
      expect(result).to.equal(mockLeave);
    });

    it('should throw error when start date after end date', async () => {
      try {
        await leaveService.create(1, {
          type: 'annual',
          startDate: '2024-01-19',
          endDate: '2024-01-15',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('Start date must be before');
      }
    });

    it('should throw conflict when overlapping leave exists', async () => {
      mockDb.Leave.findOne.resolves(mockLeave);

      try {
        await leaveService.create(1, {
          type: 'annual',
          startDate: '2024-01-17',
          endDate: '2024-01-20',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(409);
        expect(error.message).to.include('overlaps');
      }
    });
  });

  describe('approve', () => {
    it('should approve pending leave request', async () => {
      mockDb.Leave.findByPk.resolves(mockLeave);

      const result = await leaveService.approve(1, 2, 'Approved');

      expect(mockLeave.update.calledOnce).to.be.true;
      const updateCall = mockLeave.update.getCall(0);
      expect(updateCall.args[0].status).to.equal(LEAVE_STATUS.APPROVED);
      expect(updateCall.args[0].reviewedBy).to.equal(2);
      expect(result).to.equal(mockLeave);
    });

    it('should throw error when not pending', async () => {
      mockLeave.status = LEAVE_STATUS.APPROVED;
      mockLeave.isPending = () => false;
      mockDb.Leave.findByPk.resolves(mockLeave);

      try {
        await leaveService.approve(1, 2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('Only pending');
      }
    });
  });

  describe('reject', () => {
    it('should reject pending leave request', async () => {
      mockDb.Leave.findByPk.resolves(mockLeave);

      const result = await leaveService.reject(1, 2, 'Insufficient coverage');

      expect(mockLeave.update.calledOnce).to.be.true;
      const updateCall = mockLeave.update.getCall(0);
      expect(updateCall.args[0].status).to.equal(LEAVE_STATUS.REJECTED);
      expect(result).to.equal(mockLeave);
    });

    it('should throw error when not pending', async () => {
      mockLeave.status = LEAVE_STATUS.REJECTED;
      mockLeave.isPending = () => false;
      mockDb.Leave.findByPk.resolves(mockLeave);

      try {
        await leaveService.reject(1, 2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
      }
    });
  });

  describe('cancel', () => {
    it('should cancel own pending leave request', async () => {
      mockDb.Leave.findByPk.resolves(mockLeave);

      const result = await leaveService.cancel(1, 1);

      expect(mockLeave.update.calledWith({ status: LEAVE_STATUS.CANCELLED })).to.be.true;
      expect(result).to.equal(mockLeave);
    });

    it('should throw forbidden when cancelling others leave', async () => {
      mockDb.Leave.findByPk.resolves(mockLeave);

      try {
        await leaveService.cancel(1, 999);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(403);
        expect(error.message).to.include('only cancel own');
      }
    });

    it('should throw error when already cancelled', async () => {
      mockLeave.status = LEAVE_STATUS.CANCELLED;
      mockDb.Leave.findByPk.resolves(mockLeave);

      try {
        await leaveService.cancel(1, 1);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('already cancelled');
      }
    });
  });

  describe('getBalance', () => {
    it('should calculate leave balance correctly', async () => {
      const approvedLeaves = [
        { type: 'annual', totalDays: 5 },
        { type: 'annual', totalDays: 3 },
        { type: 'sick', totalDays: 2 },
      ];
      mockDb.Leave.findAll.resolves(approvedLeaves);
      mockDb.Leave.count.resolves(1);

      const result = await leaveService.getBalance(1, 2024);

      expect(result.year).to.equal(2024);
      expect(result.used.annual).to.equal(8);
      expect(result.used.sick).to.equal(2);
      expect(result.pending).to.equal(1);
    });
  });

  describe('calculateDays', () => {
    it('should calculate business days correctly', () => {
      // Mon Jan 15 to Fri Jan 19 = 5 business days
      const days = leaveService.calculateDays('2024-01-15', '2024-01-19');
      expect(days).to.equal(5);
    });

    it('should exclude weekends', () => {
      // Mon Jan 15 to Mon Jan 22 = 6 business days (excludes Sat/Sun)
      const days = leaveService.calculateDays('2024-01-15', '2024-01-22');
      expect(days).to.equal(6);
    });

    it('should return 1 for same day', () => {
      const days = leaveService.calculateDays('2024-01-15', '2024-01-15');
      expect(days).to.equal(1);
    });
  });

  describe('findById', () => {
    it('should return leave when found', async () => {
      mockDb.Leave.findByPk.resolves(mockLeave);

      const result = await leaveService.findById(1);

      expect(result).to.equal(mockLeave);
    });

    it('should throw not found error', async () => {
      mockDb.Leave.findByPk.resolves(null);

      try {
        await leaveService.findById(999);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
      }
    });
  });

  describe('getPending', () => {
    it('should return pending leave requests', async () => {
      mockDb.Leave.findAndCountAll.resolves({ rows: [mockLeave], count: 1 });

      const result = await leaveService.getPending();

      expect(result.data).to.have.length(1);
      expect(result.total).to.equal(1);
    });
  });
});

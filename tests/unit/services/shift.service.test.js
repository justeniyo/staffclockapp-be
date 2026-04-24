import { expect } from 'chai';
import sinon from 'sinon';
import ShiftService from '../../../src/services/shift.service.js';
import { SHIFT_STATUS } from '../../../src/config/constants.js';

describe('ShiftService', () => {
  let shiftService;
  let mockDb;
  let mockShift;

  beforeEach(() => {
    mockShift = {
      id: 1,
      userId: 1,
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 60,
      status: SHIFT_STATUS.SCHEDULED,
      update: sinon.stub().resolves(),
      reload: sinon.stub().resolves(),
      destroy: sinon.stub().resolves(),
    };
    mockShift.reload.resolves(mockShift);

    mockDb = {
      Shift: {
        findOne: sinon.stub(),
        findByPk: sinon.stub(),
        findAndCountAll: sinon.stub(),
        findAll: sinon.stub(),
        create: sinon.stub(),
      },
      User: {
        findByPk: sinon.stub(),
      },
      Location: {},
    };

    shiftService = new ShiftService(mockDb);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should create shift when no conflict', async () => {
      mockDb.User.findByPk.resolves({ id: 1 });
      mockDb.Shift.findOne.resolves(null);
      mockDb.Shift.create.resolves(mockShift);

      const result = await shiftService.create({
        userId: 1,
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '17:00',
      }, 2);

      expect(mockDb.Shift.create.calledOnce).to.be.true;
      expect(result).to.equal(mockShift);
    });

    it('should throw not found when user does not exist', async () => {
      mockDb.User.findByPk.resolves(null);

      try {
        await shiftService.create({ userId: 999, date: '2024-01-15' }, 2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.include('User not found');
      }
    });

    it('should throw conflict when shift exists for date', async () => {
      mockDb.User.findByPk.resolves({ id: 1 });
      mockDb.Shift.findOne.resolves(mockShift);

      try {
        await shiftService.create({
          userId: 1,
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '17:00',
        }, 2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(409);
        expect(error.message).to.include('already exists');
      }
    });
  });

  describe('createBulk', () => {
    it('should process multiple shifts and return results', async () => {
      mockDb.User.findByPk.resolves({ id: 1 });
      mockDb.Shift.findOne.resolves(null);
      mockDb.Shift.create.resolves(mockShift);

      const shifts = [
        { userId: 1, date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
        { userId: 1, date: '2024-01-16', startTime: '09:00', endTime: '17:00' },
      ];

      const results = await shiftService.createBulk(shifts, 2);

      expect(results).to.have.length(2);
      expect(results[0].success).to.be.true;
      expect(results[1].success).to.be.true;
    });

    it('should capture errors for individual shifts', async () => {
      mockDb.User.findByPk.resolves({ id: 1 });
      mockDb.Shift.findOne
        .onFirstCall().resolves(null)
        .onSecondCall().resolves(mockShift);
      mockDb.Shift.create.resolves(mockShift);

      const shifts = [
        { userId: 1, date: '2024-01-15', startTime: '09:00', endTime: '17:00' },
        { userId: 1, date: '2024-01-16', startTime: '09:00', endTime: '17:00' },
      ];

      const results = await shiftService.createBulk(shifts, 2);

      expect(results[0].success).to.be.true;
      expect(results[1].success).to.be.false;
      expect(results[1].error).to.include('already exists');
    });
  });

  describe('update', () => {
    it('should update shift when scheduled', async () => {
      mockDb.Shift.findByPk.resolves(mockShift);

      const result = await shiftService.update(1, { notes: 'Updated' });

      expect(mockShift.update.calledOnce).to.be.true;
      expect(result).to.equal(mockShift);
    });

    it('should throw error when shift is completed', async () => {
      mockShift.status = SHIFT_STATUS.COMPLETED;
      mockDb.Shift.findByPk.resolves(mockShift);

      try {
        await shiftService.update(1, { notes: 'Updated' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('Cannot modify completed shift');
      }
    });
  });

  describe('cancel', () => {
    it('should cancel scheduled shift', async () => {
      mockDb.Shift.findByPk.resolves(mockShift);

      const result = await shiftService.cancel(1);

      expect(mockShift.update.calledWith({ status: SHIFT_STATUS.CANCELLED })).to.be.true;
      expect(result).to.equal(mockShift);
    });

    it('should throw error when not scheduled', async () => {
      mockShift.status = SHIFT_STATUS.COMPLETED;
      mockDb.Shift.findByPk.resolves(mockShift);

      try {
        await shiftService.cancel(1);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('Only scheduled shifts');
      }
    });
  });

  describe('getWeekSchedule', () => {
    it('should return shifts for a week', async () => {
      const weekShifts = [mockShift, { ...mockShift, id: 2, date: '2024-01-16' }];
      mockDb.Shift.findAll.resolves(weekShifts);

      const result = await shiftService.getWeekSchedule('2024-01-15');

      expect(result).to.have.length(2);
      expect(mockDb.Shift.findAll.calledOnce).to.be.true;
    });
  });

  describe('findById', () => {
    it('should return shift when found', async () => {
      mockDb.Shift.findByPk.resolves(mockShift);

      const result = await shiftService.findById(1);

      expect(result).to.equal(mockShift);
    });

    it('should throw not found error', async () => {
      mockDb.Shift.findByPk.resolves(null);

      try {
        await shiftService.findById(999);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
      }
    });
  });

  describe('delete', () => {
    it('should delete shift', async () => {
      mockDb.Shift.findByPk.resolves(mockShift);

      const result = await shiftService.delete(1);

      expect(mockShift.destroy.calledOnce).to.be.true;
      expect(result.message).to.include('deleted');
    });
  });
});

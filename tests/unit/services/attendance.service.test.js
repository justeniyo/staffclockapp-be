import { expect } from 'chai';
import sinon from 'sinon';
import AttendanceService from '../../../src/services/attendance.service.js';
import { ATTENDANCE_STATUS } from '../../../src/config/constants.js';

describe('AttendanceService', () => {
  let attendanceService;
  let mockDb;
  let mockAttendance;

  beforeEach(() => {
    mockAttendance = {
      id: 1,
      userId: 1,
      clockIn: new Date('2024-01-15T09:00:00'),
      clockOut: null,
      breakDuration: 0,
      status: ATTENDANCE_STATUS.CLOCKED_IN,
      isOnBreak: () => false,
      isClockedOut: () => false,
      update: sinon.stub().resolves(),
      reload: sinon.stub().resolves(),
    };

    mockDb = {
      Attendance: {
        findOne: sinon.stub(),
        findByPk: sinon.stub(),
        findAndCountAll: sinon.stub(),
        findAll: sinon.stub(),
        create: sinon.stub(),
      },
      User: { findByPk: sinon.stub() },
      Location: {},
    };

    attendanceService = new AttendanceService(mockDb);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('clockIn', () => {
    it('should create attendance record when not clocked in', async () => {
      mockDb.Attendance.findOne.resolves(null);
      mockDb.Attendance.create.resolves(mockAttendance);

      const result = await attendanceService.clockIn(1, { locationId: 1 });

      expect(mockDb.Attendance.create.calledOnce).to.be.true;
      expect(result).to.equal(mockAttendance);
    });

    it('should throw conflict error when already clocked in', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);

      try {
        await attendanceService.clockIn(1);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(409);
        expect(error.message).to.include('Already clocked in');
      }
    });
  });

  describe('clockOut', () => {
    it('should update attendance with clock out time', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);
      mockAttendance.reload.resolves(mockAttendance);

      const result = await attendanceService.clockOut(1);

      expect(mockAttendance.update.calledOnce).to.be.true;
      expect(result).to.equal(mockAttendance);
    });

    it('should throw error when not clocked in', async () => {
      mockDb.Attendance.findOne.resolves(null);

      try {
        await attendanceService.clockOut(1);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('Not currently clocked in');
      }
    });

    it('should end break before clocking out if on break', async () => {
      const onBreakAttendance = {
        ...mockAttendance,
        status: ATTENDANCE_STATUS.ON_BREAK,
        breakStart: new Date('2024-01-15T12:00:00'),
        isOnBreak: () => true,
        update: sinon.stub().resolves(),
        reload: sinon.stub().resolves(),
      };
      onBreakAttendance.reload.resolves(onBreakAttendance);

      mockDb.Attendance.findOne.resolves(onBreakAttendance);

      await attendanceService.clockOut(1);

      expect(onBreakAttendance.update.called).to.be.true;
    });
  });

  describe('startBreak', () => {
    it('should start break when clocked in', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);
      mockAttendance.reload.resolves(mockAttendance);

      const result = await attendanceService.startBreak(1);

      expect(mockAttendance.update.calledOnce).to.be.true;
      const updateCall = mockAttendance.update.getCall(0);
      expect(updateCall.args[0].status).to.equal(ATTENDANCE_STATUS.ON_BREAK);
      expect(result).to.equal(mockAttendance);
    });

    it('should throw error when already on break', async () => {
      mockAttendance.isOnBreak = () => true;
      mockAttendance.status = ATTENDANCE_STATUS.ON_BREAK;
      mockDb.Attendance.findOne.resolves(mockAttendance);

      try {
        await attendanceService.startBreak(1);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(409);
        expect(error.message).to.include('Already on break');
      }
    });
  });

  describe('endBreak', () => {
    it('should end break and calculate duration', async () => {
      const onBreakAttendance = {
        ...mockAttendance,
        status: ATTENDANCE_STATUS.ON_BREAK,
        breakStart: new Date(Date.now() - 30 * 60000), // 30 minutes ago
        breakDuration: 0,
        isOnBreak: () => true,
        update: sinon.stub().resolves(),
        reload: sinon.stub().resolves(),
      };
      onBreakAttendance.reload.resolves(onBreakAttendance);

      mockDb.Attendance.findOne.resolves(onBreakAttendance);

      await attendanceService.endBreak(1);

      expect(onBreakAttendance.update.calledOnce).to.be.true;
      const updateCall = onBreakAttendance.update.getCall(0);
      expect(updateCall.args[0].status).to.equal(ATTENDANCE_STATUS.CLOCKED_IN);
      expect(updateCall.args[0].breakDuration).to.be.at.least(29);
    });

    it('should throw error when not on break', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);

      try {
        await attendanceService.endBreak(1);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('Not currently on break');
      }
    });
  });

  describe('getStatus', () => {
    it('should return clocked_out when no active attendance', async () => {
      mockDb.Attendance.findOne.resolves(null);

      const result = await attendanceService.getStatus(1);

      expect(result.status).to.equal('clocked_out');
      expect(result.attendance).to.be.null;
    });

    it('should return current status when clocked in', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);

      const result = await attendanceService.getStatus(1);

      expect(result.status).to.equal(ATTENDANCE_STATUS.CLOCKED_IN);
      expect(result.attendance).to.equal(mockAttendance);
    });
  });

  describe('getSummary', () => {
    it('should calculate work summary correctly', async () => {
      const records = [
        { workDuration: 480, breakDuration: 60 },
        { workDuration: 450, breakDuration: 30 },
        { workDuration: 420, breakDuration: 45 },
      ];
      mockDb.Attendance.findAll.resolves(records);

      const result = await attendanceService.getSummary(1, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.totalDays).to.equal(3);
      expect(result.totalWorkMinutes).to.equal(1350);
      expect(result.totalBreakMinutes).to.equal(135);
      expect(result.averageWorkMinutes).to.equal(450);
    });
  });

  describe('findById', () => {
    it('should return attendance when found', async () => {
      mockDb.Attendance.findByPk.resolves(mockAttendance);

      const result = await attendanceService.findById(1);

      expect(result).to.equal(mockAttendance);
    });

    it('should throw not found error when not exists', async () => {
      mockDb.Attendance.findByPk.resolves(null);

      try {
        await attendanceService.findById(999);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
      }
    });
  });
});

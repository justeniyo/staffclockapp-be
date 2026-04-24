import { expect } from 'chai';
import sinon from 'sinon';
import ReportService from '../../../src/services/report.service.js';

describe('ReportService', () => {
  let reportService;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      Attendance: { findAll: sinon.stub() },
      Shift: { findAll: sinon.stub() },
      Leave: { findAll: sinon.stub() },
      User: {},
      Department: {},
      Location: {},
    };

    reportService = new ReportService(mockDb);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAttendanceData', () => {
    it('should return formatted attendance records', async () => {
      const mockRecords = [{
        id: 1,
        clockIn: new Date('2024-01-15T09:00:00'),
        clockOut: new Date('2024-01-15T17:00:00'),
        breakDuration: 60,
        workDuration: 420,
        notes: 'Test',
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          department: { name: 'IT' },
          location: { name: 'HQ' },
        },
        location: { name: 'Main Office' },
      }];

      mockDb.Attendance.findAll.resolves(mockRecords);

      const result = await reportService.getAttendanceData({});

      expect(result).to.have.length(1);
      expect(result[0].employeeName).to.equal('John Doe');
      expect(result[0].department).to.equal('IT');
      expect(result[0].workMinutes).to.equal(420);
      expect(result[0].workHours).to.equal('7.00');
    });
  });

  describe('getShiftData', () => {
    it('should return formatted shift records', async () => {
      const mockRecords = [{
        id: 1,
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
        status: 'scheduled',
        notes: 'Morning shift',
        user: {
          id: 1,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
          department: { name: 'Sales' },
        },
        location: { name: 'Branch' },
        creator: { firstName: 'Admin', lastName: 'User' },
      }];

      mockDb.Shift.findAll.resolves(mockRecords);

      const result = await reportService.getShiftData({});

      expect(result).to.have.length(1);
      expect(result[0].employeeName).to.equal('Jane Smith');
      expect(result[0].scheduledHours).to.equal('7.00');
      expect(result[0].createdBy).to.equal('Admin User');
    });
  });

  describe('getLeaveData', () => {
    it('should return formatted leave records', async () => {
      const mockRecords = [{
        id: 1,
        type: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-19',
        totalDays: 5,
        status: 'approved',
        reason: 'Vacation',
        reviewedAt: new Date('2024-01-10'),
        reviewNotes: 'Approved',
        user: {
          id: 1,
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@test.com',
          department: { name: 'Engineering' },
        },
        reviewer: { firstName: 'Manager', lastName: 'Name' },
      }];

      mockDb.Leave.findAll.resolves(mockRecords);

      const result = await reportService.getLeaveData({});

      expect(result).to.have.length(1);
      expect(result[0].employeeName).to.equal('Bob Wilson');
      expect(result[0].totalDays).to.equal(5);
      expect(result[0].reviewedBy).to.equal('Manager Name');
    });
  });

  describe('getAttendanceSummary', () => {
    it('should aggregate attendance by user', async () => {
      const mockRecords = [
        { userId: 1, workDuration: 480, breakDuration: 60, user: { id: 1, firstName: 'John', lastName: 'Doe', department: { name: 'IT' } } },
        { userId: 1, workDuration: 450, breakDuration: 30, user: { id: 1, firstName: 'John', lastName: 'Doe', department: { name: 'IT' } } },
        { userId: 2, workDuration: 500, breakDuration: 45, user: { id: 2, firstName: 'Jane', lastName: 'Smith', department: { name: 'Sales' } } },
      ];

      mockDb.Attendance.findAll.resolves(mockRecords);

      const result = await reportService.getAttendanceSummary({});

      expect(result).to.have.length(2);

      const johnSummary = result.find((r) => r.employeeId === 1);
      expect(johnSummary.totalDays).to.equal(2);
      expect(johnSummary.totalWorkMinutes).to.equal(930);
      expect(johnSummary.totalWorkHours).to.equal('15.50');
    });
  });

  describe('toCsv', () => {
    it('should convert data to CSV format', () => {
      const headers = ['ID', 'Name', 'Email'];
      const data = [
        { id: 1, name: 'John Doe', email: 'john@test.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@test.com' },
      ];
      const fields = ['id', 'name', 'email'];

      const csv = reportService.toCsv(headers, data, fields);

      expect(csv).to.include('ID,Name,Email');
      expect(csv).to.include('1,John Doe,john@test.com');
      expect(csv).to.include('2,Jane Smith,jane@test.com');
    });

    it('should escape values with commas', () => {
      const headers = ['Name', 'Address'];
      const data = [{ name: 'John', address: '123 Main St, Suite 100' }];
      const fields = ['name', 'address'];

      const csv = reportService.toCsv(headers, data, fields);

      expect(csv).to.include('"123 Main St, Suite 100"');
    });

    it('should handle null values', () => {
      const headers = ['Name', 'Notes'];
      const data = [{ name: 'John', notes: null }];
      const fields = ['name', 'notes'];

      const csv = reportService.toCsv(headers, data, fields);

      expect(csv).to.include('John,');
    });
  });

  describe('calculateShiftHours', () => {
    it('should calculate hours correctly', () => {
      const hours = reportService.calculateShiftHours('09:00', '17:00', 60);
      expect(hours).to.equal('7.00');
    });

    it('should handle no break', () => {
      const hours = reportService.calculateShiftHours('09:00', '13:00', 0);
      expect(hours).to.equal('4.00');
    });
  });

  describe('exportAttendanceExcel', () => {
    it('should return a buffer', async () => {
      mockDb.Attendance.findAll.resolves([]);

      const buffer = await reportService.exportAttendanceExcel({});

      expect(buffer).to.be.instanceOf(Buffer);
    });
  });

  describe('exportShiftsExcel', () => {
    it('should return a buffer', async () => {
      mockDb.Shift.findAll.resolves([]);

      const buffer = await reportService.exportShiftsExcel({});

      expect(buffer).to.be.instanceOf(Buffer);
    });
  });

  describe('exportLeavesExcel', () => {
    it('should return a buffer', async () => {
      mockDb.Leave.findAll.resolves([]);

      const buffer = await reportService.exportLeavesExcel({});

      expect(buffer).to.be.instanceOf(Buffer);
    });
  });
});

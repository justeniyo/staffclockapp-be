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

  afterEach(() => sinon.restore());

  describe('getAttendanceData', () => {
    it('should return formatted attendance records with work time computed from clockIn/clockOut (no break)', async () => {
      mockDb.Attendance.findAll.resolves([{
        id: 1,
        clockIn:  new Date('2024-01-15T09:00:00Z'),
        clockOut: new Date('2024-01-15T17:00:00Z'),
        notes: 'Test',
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com',
                department: { name: 'IT' }, location: { name: 'HQ' } },
        location: { name: 'Main Office' },
      }]);

      const result = await reportService.getAttendanceData({});

      expect(result).to.have.length(1);
      expect(result[0].employeeName).to.equal('John Doe');
      expect(result[0].department).to.equal('IT');
      // 8 hours = 480 minutes (full elapsed, no break subtracted)
      expect(result[0].workMinutes).to.equal(480);
      expect(result[0].workHours).to.equal('8.00');
      // Datetimes are formatted as compact numeric strings
      expect(result[0].clockIn).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(result[0].clockOut).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      // Break-related fields must NOT exist
      expect(result[0]).to.not.have.property('breakMinutes');
      expect(result[0]).to.not.have.property('breakDuration');
    });

    it('should handle records with no clockOut', async () => {
      mockDb.Attendance.findAll.resolves([{
        id: 1, clockIn: new Date('2024-01-15T09:00:00Z'), clockOut: null,
        user: { id: 1, firstName: 'A', lastName: 'B', email: 'a@b.com', department: null, location: null },
        location: null,
      }]);
      const result = await reportService.getAttendanceData({});
      expect(result[0].workMinutes).to.equal(0);
    });
  });

  describe('getShiftsData', () => {
    it('should return formatted shift records without break columns', async () => {
      mockDb.Shift.findAll.resolves([{
        id: 1, date: '2024-01-15', startTime: '09:00', endTime: '17:00',
        status: 'scheduled', notes: 'Morning shift',
        user: { id: 1, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com',
                department: { name: 'Sales' } },
        location: { name: 'Branch' },
        creator: { firstName: 'Admin', lastName: 'User' },
      }]);

      const result = await reportService.getShiftsData({});

      expect(result).to.have.length(1);
      expect(result[0].employeeName).to.equal('Jane Smith');
      // 8 hours scheduled (full duration, no break subtraction)
      expect(result[0].scheduledHours).to.equal('8.00');
      expect(result[0].createdBy).to.equal('Admin User');
      expect(result[0]).to.not.have.property('breakMinutes');
    });
  });

  describe('getLeavesData', () => {
    it('should return formatted leave records', async () => {
      mockDb.Leave.findAll.resolves([{
        id: 1, type: 'annual', startDate: '2024-01-15', endDate: '2024-01-19',
        totalDays: 5, status: 'approved', reason: 'Vacation',
        reviewedAt: new Date('2024-01-10'), reviewNotes: 'Approved',
        user: { id: 1, firstName: 'Bob', lastName: 'Wilson', email: 'bob@test.com',
                department: { name: 'Engineering' } },
        reviewer: { firstName: 'Manager', lastName: 'Name' },
      }]);

      const result = await reportService.getLeavesData({});
      expect(result).to.have.length(1);
      expect(result[0].employeeName).to.equal('Bob Wilson');
      expect(result[0].totalDays).to.equal(5);
      expect(result[0].reviewedBy).to.equal('Manager Name');
    });
  });

  describe('getSummaryData', () => {
    it('should aggregate work minutes from clockIn/clockOut (no break) per user', async () => {
      // John: two 8-hour shifts → 960 minutes total
      // Jane: one 9-hour shift → 540 minutes total
      mockDb.Attendance.findAll.resolves([
        { userId: 1, clockIn: new Date('2024-01-15T09:00:00Z'), clockOut: new Date('2024-01-15T17:00:00Z'),
          user: { id: 1, firstName: 'John', lastName: 'Doe', department: { name: 'IT' } } },
        { userId: 1, clockIn: new Date('2024-01-16T09:00:00Z'), clockOut: new Date('2024-01-16T17:00:00Z'),
          user: { id: 1, firstName: 'John', lastName: 'Doe', department: { name: 'IT' } } },
        { userId: 2, clockIn: new Date('2024-01-15T08:00:00Z'), clockOut: new Date('2024-01-15T17:00:00Z'),
          user: { id: 2, firstName: 'Jane', lastName: 'Smith', department: { name: 'Sales' } } },
      ]);

      const result = await reportService.getSummaryData({});

      expect(result).to.have.length(2);
      const john = result.find((r) => r.employeeId === 'staff_0000001');
      expect(john.totalDays).to.equal(2);
      expect(john.totalWorkMinutes).to.equal(960);
      expect(john.totalWorkHours).to.equal('16.00');
      expect(john.avgWorkHoursPerDay).to.equal('8.00');
      // No break totals
      expect(john).to.not.have.property('totalBreakMinutes');
    });
  });

  describe('toCsv', () => {
    it('should convert data to CSV format', () => {
      const data = [
        { id: 1, employeeName: 'John Doe', email: 'john@test.com', employeeId: 1,
          department: '', userLocation: '', clockIn: '', clockOut: '',
          workMinutes: 480, workHours: '8.00', clockLocation: '', notes: '' },
      ];
      const csv = reportService.toCsv('attendance', data);

      expect(csv).to.include('Employee Name');
      expect(csv).to.include('John Doe');
      // Header should NOT include break
      expect(csv).to.not.include('Break');
    });

    it('should escape values with commas', () => {
      const data = [{ id: 1, employeeName: 'A B', email: 'a@b', employeeId: 1,
        department: '', userLocation: '', clockIn: '', clockOut: '',
        workMinutes: 0, workHours: '0', clockLocation: '', notes: '123 Main St, Suite 100' }];
      const csv = reportService.toCsv('attendance', data);
      expect(csv).to.include('"123 Main St, Suite 100"');
    });
  });

  describe('export (Excel format)', () => {
    it('should return a buffer for attendance', async () => {
      mockDb.Attendance.findAll.resolves([]);
      const buffer = await reportService.export('attendance', {}, 'excel');
      expect(buffer).to.be.instanceOf(Buffer);
    });

    it('should return a buffer for shifts', async () => {
      mockDb.Shift.findAll.resolves([]);
      const buffer = await reportService.export('shifts', {}, 'excel');
      expect(buffer).to.be.instanceOf(Buffer);
    });

    it('should return a buffer for leaves', async () => {
      mockDb.Leave.findAll.resolves([]);
      const buffer = await reportService.export('leaves', {}, 'excel');
      expect(buffer).to.be.instanceOf(Buffer);
    });
  });

  describe('export (PDF format)', () => {
    it('should return a PDF buffer for attendance', async () => {
      mockDb.Attendance.findAll.resolves([]);
      const buffer = await reportService.export('attendance', {}, 'pdf');
      expect(buffer).to.be.instanceOf(Buffer);
      // PDF files start with "%PDF-"
      expect(buffer.slice(0, 5).toString()).to.equal('%PDF-');
    });

    it('should produce a PDF with data rows', async () => {
      mockDb.Attendance.findAll.resolves([
        { id: 1, clockIn: new Date('2024-01-15T09:00:00Z'), clockOut: new Date('2024-01-15T17:00:00Z'),
          notes: '', user: { id: 1, firstName: 'X', lastName: 'Y', email: 'x@y.com',
            department: null, location: null }, location: null },
      ]);
      const buffer = await reportService.export('attendance', { startDate: '2024-01-01', endDate: '2024-01-31' }, 'pdf');
      expect(buffer.length).to.be.greaterThan(1000); // Non-trivial PDF
      expect(buffer.slice(0, 5).toString()).to.equal('%PDF-');
    });
  });

  describe('export (default CSV)', () => {
    it('should return CSV when no format specified', async () => {
      mockDb.Attendance.findAll.resolves([]);
      const csv = await reportService.export('attendance', {});
      expect(csv).to.be.a('string');
      expect(csv).to.include('Employee Name');
    });
  });
});

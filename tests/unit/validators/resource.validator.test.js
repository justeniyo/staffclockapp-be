import { expect } from 'chai';
import { createShiftValidator, createBulkShiftValidator, shiftQueryValidator } from '../../../src/validators/shift.validator.js';
import { createDepartmentValidator, updateDepartmentValidator, departmentQueryValidator } from '../../../src/validators/department.validator.js';
import { createLocationValidator, updateLocationValidator } from '../../../src/validators/location.validator.js';
import { clockInValidator, attendanceQueryValidator, updateAttendanceValidator } from '../../../src/validators/attendance.validator.js';
import { runValidator } from './helpers.js';

describe('Shift Validators', () => {
  const VALID_SHIFT = {
    userId: '1',
    date: '2025-07-01',
    startTime: '08:00',
    endTime: '16:00',
    breakMinutes: '60',
    locationId: '1',
    notes: 'Morning shift',
  };

  describe('createShiftValidator', () => {
    it('should pass with valid shift', async () => {
      const { isValid } = await runValidator(createShiftValidator, { body: VALID_SHIFT });
      expect(isValid).to.be.true;
    });

    it('should reject invalid time format', async () => {
      const { isValid } = await runValidator(createShiftValidator, {
        body: { ...VALID_SHIFT, startTime: '8:00' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject 25:00 as time', async () => {
      const { isValid } = await runValidator(createShiftValidator, {
        body: { ...VALID_SHIFT, startTime: '25:00' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept 23:59 as valid time', async () => {
      const { isValid } = await runValidator(createShiftValidator, {
        body: { ...VALID_SHIFT, endTime: '23:59' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject break > 480 minutes', async () => {
      const { isValid } = await runValidator(createShiftValidator, {
        body: { ...VALID_SHIFT, breakMinutes: '500' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject negative break', async () => {
      const { isValid } = await runValidator(createShiftValidator, {
        body: { ...VALID_SHIFT, breakMinutes: '-10' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject notes over 500 chars', async () => {
      const { isValid } = await runValidator(createShiftValidator, {
        body: { ...VALID_SHIFT, notes: 'x'.repeat(501) },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('createBulkShiftValidator', () => {
    it('should pass with valid bulk shifts', async () => {
      const { isValid } = await runValidator(createBulkShiftValidator, {
        body: { shifts: [{ userId: '1', date: '2025-07-01', startTime: '08:00', endTime: '16:00' }] },
      });
      expect(isValid).to.be.true;
    });

    it('should reject empty shifts array', async () => {
      const { isValid } = await runValidator(createBulkShiftValidator, {
        body: { shifts: [] },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('shiftQueryValidator', () => {
    it('should reject invalid status', async () => {
      const { isValid } = await runValidator(shiftQueryValidator, {
        query: { status: 'done' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept all valid statuses', async () => {
      for (const status of ['scheduled', 'completed', 'missed', 'cancelled']) {
        const { isValid } = await runValidator(shiftQueryValidator, { query: { status } });
        expect(isValid, `status "${status}"`).to.be.true;
      }
    });
  });
});

describe('Department Validators', () => {
  describe('createDepartmentValidator', () => {
    it('should pass with valid department', async () => {
      const { isValid } = await runValidator(createDepartmentValidator, {
        body: { name: 'Engineering', description: 'Software development team' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject name shorter than 2 chars', async () => {
      const { isValid } = await runValidator(createDepartmentValidator, {
        body: { name: 'X' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject empty name', async () => {
      const { isValid } = await runValidator(createDepartmentValidator, {
        body: { name: '' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept name with ampersand and parens', async () => {
      const { isValid } = await runValidator(createDepartmentValidator, {
        body: { name: 'Research & Development (R&D)' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject name with HTML tags', async () => {
      const { isValid } = await runValidator(createDepartmentValidator, {
        body: { name: '<script>alert(1)</script>' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject description over 500 chars', async () => {
      const { isValid } = await runValidator(createDepartmentValidator, {
        body: { name: 'Test', description: 'x'.repeat(501) },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('updateDepartmentValidator', () => {
    it('should pass with valid partial update', async () => {
      const { isValid } = await runValidator(updateDepartmentValidator, {
        params: { id: '1' },
        body: { name: 'Updated Name' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject invalid param id', async () => {
      const { isValid } = await runValidator(updateDepartmentValidator, {
        params: { id: 'abc' },
        body: { name: 'Updated' },
      });
      expect(isValid).to.be.false;
    });
  });
});

describe('Location Validators', () => {
  describe('createLocationValidator', () => {
    it('should pass with valid location', async () => {
      const { isValid } = await runValidator(createLocationValidator, {
        body: { name: 'Main Office', address: '123 Business Ave' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject name shorter than 2 chars', async () => {
      const { isValid } = await runValidator(createLocationValidator, {
        body: { name: 'X' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject address over 500 chars', async () => {
      const { isValid } = await runValidator(createLocationValidator, {
        body: { name: 'Office', address: 'x'.repeat(501) },
      });
      expect(isValid).to.be.false;
    });

    it('should accept name with numbers', async () => {
      const { isValid } = await runValidator(createLocationValidator, {
        body: { name: 'Branch Office 2' },
      });
      expect(isValid).to.be.true;
    });
  });
});

describe('Attendance Validators', () => {
  describe('clockInValidator', () => {
    it('should pass with valid locationId', async () => {
      const { isValid } = await runValidator(clockInValidator, {
        body: { locationId: '1', notes: 'Arriving on time' },
      });
      expect(isValid).to.be.true;
    });

    it('should pass without locationId (optional)', async () => {
      const { isValid } = await runValidator(clockInValidator, { body: {} });
      expect(isValid).to.be.true;
    });

    it('should pass with empty locationId (falsy optional)', async () => {
      const { isValid } = await runValidator(clockInValidator, {
        body: { locationId: '' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject notes over 500 chars', async () => {
      const { isValid } = await runValidator(clockInValidator, {
        body: { notes: 'x'.repeat(501) },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('attendanceQueryValidator', () => {
    it('should pass with no params', async () => {
      const { isValid } = await runValidator(attendanceQueryValidator, { query: {} });
      expect(isValid).to.be.true;
    });

    it('should reject invalid status', async () => {
      const { isValid } = await runValidator(attendanceQueryValidator, {
        query: { status: 'absent' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept all valid statuses', async () => {
      for (const status of ['clocked_in', 'on_break', 'clocked_out']) {
        const { isValid } = await runValidator(attendanceQueryValidator, { query: { status } });
        expect(isValid, `status "${status}"`).to.be.true;
      }
    });

    it('should reject invalid date format', async () => {
      const { isValid } = await runValidator(attendanceQueryValidator, {
        query: { startDate: '31/12/2025' },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('updateAttendanceValidator', () => {
    it('should pass with valid update', async () => {
      const { isValid } = await runValidator(updateAttendanceValidator, {
        params: { id: '1' },
        body: { clockOut: '2025-07-01T17:00:00Z' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject invalid clockIn format', async () => {
      const { isValid } = await runValidator(updateAttendanceValidator, {
        params: { id: '1' },
        body: { clockIn: 'not-a-date' },
      });
      expect(isValid).to.be.false;
    });
  });
});

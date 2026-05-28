import { expect } from 'chai';
import { createLeaveValidator, leaveQueryValidator, reviewLeaveValidator } from '../../../src/validators/leave.validator.js';
import { runValidator } from './helpers.js';

describe('Leave Validators', () => {
  describe('createLeaveValidator', () => {
    const VALID_LEAVE = {
      type: 'annual',
      startDate: '2025-07-01',
      endDate: '2025-07-05',
      reason: 'Family vacation',
    };

    it('should pass with valid leave request', async () => {
      const { isValid } = await runValidator(createLeaveValidator, { body: VALID_LEAVE });
      expect(isValid).to.be.true;
    });

    it('should pass without reason (optional)', async () => {
      const body = { ...VALID_LEAVE };
      delete body.reason;
      const { isValid } = await runValidator(createLeaveValidator, { body });
      expect(isValid).to.be.true;
    });

    it('should reject invalid leave type', async () => {
      const { isValid } = await runValidator(createLeaveValidator, {
        body: { ...VALID_LEAVE, type: 'holiday' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept all valid leave types', async () => {
      const types = ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'];
      for (const type of types) {
        const { isValid } = await runValidator(createLeaveValidator, {
          body: { ...VALID_LEAVE, type },
        });
        expect(isValid, `type "${type}" should be valid`).to.be.true;
      }
    });

    it('should reject invalid startDate format', async () => {
      const { isValid } = await runValidator(createLeaveValidator, {
        body: { ...VALID_LEAVE, startDate: '07/01/2025' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject endDate before startDate', async () => {
      const { isValid } = await runValidator(createLeaveValidator, {
        body: { ...VALID_LEAVE, startDate: '2025-07-10', endDate: '2025-07-05' },
      });
      expect(isValid).to.be.false;
    });

    it('should accept same-day leave (startDate == endDate)', async () => {
      const { isValid } = await runValidator(createLeaveValidator, {
        body: { ...VALID_LEAVE, startDate: '2025-07-01', endDate: '2025-07-01' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject reason over 1000 chars', async () => {
      const { isValid } = await runValidator(createLeaveValidator, {
        body: { ...VALID_LEAVE, reason: 'x'.repeat(1001) },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('leaveQueryValidator', () => {
    it('should pass with no params', async () => {
      const { isValid } = await runValidator(leaveQueryValidator, { query: {} });
      expect(isValid).to.be.true;
    });

    it('should reject invalid status', async () => {
      const { isValid } = await runValidator(leaveQueryValidator, {
        query: { status: 'expired' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject invalid year', async () => {
      const { isValid } = await runValidator(leaveQueryValidator, {
        query: { year: '1900' },
      });
      expect(isValid).to.be.false;
    });
  });

  describe('reviewLeaveValidator', () => {
    it('should pass with valid id and notes', async () => {
      const { isValid } = await runValidator(reviewLeaveValidator, {
        params: { id: '5' },
        body: { notes: 'Approved by manager' },
      });
      expect(isValid).to.be.true;
    });

    it('should reject notes over 500 chars', async () => {
      const { isValid } = await runValidator(reviewLeaveValidator, {
        params: { id: '5' },
        body: { notes: 'x'.repeat(501) },
      });
      expect(isValid).to.be.false;
    });
  });
});

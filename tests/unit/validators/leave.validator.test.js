import { expect } from 'chai';
import { createLeaveValidator, leaveQueryValidator, reviewLeaveValidator } from '../../../src/validators/leave.validator.js';
import { runValidator } from './helpers.js';

describe('Leave Validators', () => {
  describe('createLeaveValidator', () => {
    const VALID_LEAVE = {
      type: 'annual',
      startDate: '2025-07-01',
      endDate: '2025-07-05',
    };

    it('should pass with the minimal required fields (no reason)', async () => {
      const { isValid } = await runValidator(createLeaveValidator, { body: VALID_LEAVE });
      expect(isValid).to.be.true;
    });

    it('should accept all defined leave types', async () => {
      const types = ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'];
      for (const type of types) {
        const body = { ...VALID_LEAVE, type };
        // Types that require a reason need one for validation to pass
        if (['personal', 'unpaid', 'other'].includes(type)) body.reason = 'Has a reason';
        const { isValid } = await runValidator(createLeaveValidator, { body });
        expect(isValid, `type "${type}" should validate`).to.be.true;
      }
    });

    it('should reject an unknown leave type', async () => {
      const { isValid } = await runValidator(createLeaveValidator, {
        body: { ...VALID_LEAVE, type: 'holiday' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject non-ISO startDate', async () => {
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

    it('should accept same-day leave', async () => {
      const { isValid } = await runValidator(createLeaveValidator, {
        body: { ...VALID_LEAVE, startDate: '2025-07-01', endDate: '2025-07-01' },
      });
      expect(isValid).to.be.true;
    });

    describe('reason policy', () => {
      const REQUIRED = ['personal', 'unpaid', 'other'];
      const NOT_REQUIRED = ['annual', 'sick', 'maternity', 'paternity', 'bereavement'];

      it('should reject when reason is missing for a type that requires it', async () => {
        for (const type of REQUIRED) {
          const { isValid } = await runValidator(createLeaveValidator, {
            body: { ...VALID_LEAVE, type },
          });
          expect(isValid, `${type} without reason should fail`).to.be.false;
        }
      });

      it('should reject when reason is empty string for a required type', async () => {
        for (const type of REQUIRED) {
          const { isValid } = await runValidator(createLeaveValidator, {
            body: { ...VALID_LEAVE, type, reason: '' },
          });
          expect(isValid, `${type} with empty reason should fail`).to.be.false;
        }
      });

      it('should reject when reason is only whitespace for a required type', async () => {
        for (const type of REQUIRED) {
          const { isValid } = await runValidator(createLeaveValidator, {
            body: { ...VALID_LEAVE, type, reason: '    ' },
          });
          expect(isValid, `${type} with whitespace reason should fail`).to.be.false;
        }
      });

      it('should pass without reason for types that do not require it', async () => {
        for (const type of NOT_REQUIRED) {
          const { isValid } = await runValidator(createLeaveValidator, {
            body: { ...VALID_LEAVE, type },
          });
          expect(isValid, `${type} without reason should pass`).to.be.true;
        }
      });

      it('should accept an optional reason on a non-required type', async () => {
        const { isValid } = await runValidator(createLeaveValidator, {
          body: { ...VALID_LEAVE, type: 'annual', reason: 'Going to a wedding' },
        });
        expect(isValid).to.be.true;
      });

      it('should reject reason over 1000 chars regardless of type', async () => {
        const r1 = await runValidator(createLeaveValidator, {
          body: { ...VALID_LEAVE, type: 'annual', reason: 'x'.repeat(1001) },
        });
        const r2 = await runValidator(createLeaveValidator, {
          body: { ...VALID_LEAVE, type: 'personal', reason: 'x'.repeat(1001) },
        });
        expect(r1.isValid).to.be.false;
        expect(r2.isValid).to.be.false;
      });
    });
  });

  describe('leaveQueryValidator', () => {
    it('should pass with no params', async () => {
      const { isValid } = await runValidator(leaveQueryValidator, { query: {} });
      expect(isValid).to.be.true;
    });

    it('should reject an unknown status', async () => {
      const { isValid } = await runValidator(leaveQueryValidator, {
        query: { status: 'expired' },
      });
      expect(isValid).to.be.false;
    });

    it('should reject a year outside the allowed range', async () => {
      const r1 = await runValidator(leaveQueryValidator, { query: { year: '1900' } });
      const r2 = await runValidator(leaveQueryValidator, { query: { year: '2200' } });
      expect(r1.isValid).to.be.false;
      expect(r2.isValid).to.be.false;
    });
  });

  describe('reviewLeaveValidator', () => {
    it('should pass with a valid id and notes', async () => {
      const { isValid } = await runValidator(reviewLeaveValidator, {
        params: { id: '5' },
        body: { notes: 'Approved by manager' },
      });
      expect(isValid).to.be.true;
    });

    it('should pass without notes (optional)', async () => {
      const { isValid } = await runValidator(reviewLeaveValidator, {
        params: { id: '5' },
        body: {},
      });
      expect(isValid).to.be.true;
    });

    it('should reject a non-numeric id', async () => {
      const { isValid } = await runValidator(reviewLeaveValidator, {
        params: { id: 'abc' },
        body: {},
      });
      expect(isValid).to.be.false;
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

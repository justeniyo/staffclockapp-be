import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import createApp from '../../src/app.js';
import { createServices } from '../../src/services/index.js';
import { createControllers } from '../../src/controllers/index.js';
import { ATTENDANCE_STATUS } from '../../src/config/constants.js';

describe('Attendance API', () => {
  let app;
  let mockDb;
  let staffToken;
  let adminToken;
  let mockAttendance;

  beforeEach(async () => {
    mockAttendance = {
      id: 1,
      userId: 1,
      clockIn: new Date(),
      clockOut: null,
      status: ATTENDANCE_STATUS.CLOCKED_IN,
      breakDuration: 0,
      isOnBreak: () => false,
      isClockedOut: () => false,
      update: sinon.stub().resolves(),
      reload: sinon.stub().resolves(),
      toJSON: () => ({ id: 1, userId: 1, status: ATTENDANCE_STATUS.CLOCKED_IN }),
    };
    mockAttendance.reload.resolves(mockAttendance);

    const mockStaffUser = {
      id: 1,
      email: 'staff@test.com',
      role: 'staff',
      status: 'active',
      isAdmin: () => false,
      isCeo: () => false,
    };

    const mockAdminUser = {
      id: 2,
      email: 'admin@test.com',
      role: 'admin',
      status: 'active',
      isAdmin: () => true,
      isCeo: () => false,
    };

    mockDb = {
      User: {
        findByPk: sinon.stub(),
        findOne: sinon.stub(),
      },
      Attendance: {
        findOne: sinon.stub(),
        findByPk: sinon.stub(),
        findAndCountAll: sinon.stub(),
        findAll: sinon.stub(),
        create: sinon.stub(),
      },
      Location: {},
      Department: {},
    };

    mockDb.User.findByPk
      .withArgs(1).resolves(mockStaffUser)
      .withArgs(2).resolves(mockAdminUser);

    const services = createServices(mockDb);
    const controllers = createControllers(services);
    app = await createApp({ db: mockDb, services, controllers });

    staffToken = 'Bearer mock-staff-token';
    adminToken = 'Bearer mock-admin-token';

    // Mock JWT verification (ES module - stub the imported namespace)
    sinon.stub(jwt, 'verify')
      .callsFake((token) => {
        if (token === 'mock-staff-token') return { userId: 1, role: 'staff' };
        if (token === 'mock-admin-token') return { userId: 2, role: 'admin' };
        throw new Error('Invalid token');
      });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/attendance/clock-in', () => {
    it('should clock in successfully', async () => {
      mockDb.Attendance.findOne.resolves(null);
      mockDb.Attendance.create.resolves(mockAttendance);

      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', staffToken)
        .send({ locationId: 1 });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
    });

    it('should fail when already clocked in', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);

      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', staffToken);

      expect(res.status).to.equal(409);
    });
  });

  describe('POST /api/attendance/clock-out', () => {
    it('should clock out successfully', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);

      const res = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', staffToken);

      expect(res.status).to.equal(200);
      expect(mockAttendance.update.called).to.be.true;
    });

    it('should fail when not clocked in', async () => {
      mockDb.Attendance.findOne.resolves(null);

      const res = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', staffToken);

      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/attendance/status', () => {
    it('should return current status', async () => {
      mockDb.Attendance.findOne.resolves(mockAttendance);

      const res = await request(app)
        .get('/api/attendance/status')
        .set('Authorization', staffToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal(ATTENDANCE_STATUS.CLOCKED_IN);
    });

    it('should return clocked_out when no active attendance', async () => {
      mockDb.Attendance.findOne.resolves(null);

      const res = await request(app)
        .get('/api/attendance/status')
        .set('Authorization', staffToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal('clocked_out');
    });
  });

  describe('GET /api/attendance/my', () => {
    it('should return own attendance records', async () => {
      mockDb.Attendance.findAndCountAll.resolves({
        rows: [mockAttendance],
        count: 1,
      });

      const res = await request(app)
        .get('/api/attendance/my')
        .set('Authorization', staffToken);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.length(1);
    });
  });

  describe('GET /api/attendance (admin)', () => {
    it('should return all records for admin', async () => {
      mockDb.Attendance.findAndCountAll.resolves({
        rows: [mockAttendance],
        count: 1,
      });

      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', adminToken);

      expect(res.status).to.equal(200);
    });

    it('should deny access for staff', async () => {
      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', staffToken);

      expect(res.status).to.equal(403);
    });
  });
});

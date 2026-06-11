import { expect } from 'chai';
import sinon from 'sinon';
import DepartmentService from '../../../src/services/department.service.js';

describe('DepartmentService', () => {
  let departmentService;
  let mockDb;
  let mockDepartment;

  beforeEach(() => {
    mockDepartment = {
      id: 1,
      name: 'Engineering',
      description: 'Software development',
      isActive: true,
      update: sinon.stub().resolves(),
      destroy: sinon.stub().resolves(),
    };

    mockDb = {
      Department: {
        findOne: sinon.stub(),
        findByPk: sinon.stub(),
        findAndCountAll: sinon.stub(),
        create: sinon.stub(),
      },
      User: {
        count: sinon.stub(),
      },
    };

    departmentService = new DepartmentService(mockDb);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should create department when name is unique', async () => {
      mockDb.Department.findOne.resolves(null);
      mockDb.Department.create.resolves(mockDepartment);

      const result = await departmentService.create({ name: 'Engineering' });

      expect(mockDb.Department.create.calledOnce).to.be.true;
      expect(result).to.equal(mockDepartment);
    });

    it('should throw conflict when name exists', async () => {
      mockDb.Department.findOne.resolves(mockDepartment);

      try {
        await departmentService.create({ name: 'Engineering' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(409);
        expect(error.message).to.include('already exists');
      }
    });
  });

  describe('update', () => {
    it('should update department', async () => {
      mockDb.Department.findByPk.resolves(mockDepartment);
      mockDb.Department.findOne.resolves(null);

      const result = await departmentService.update(1, { description: 'Updated' });

      expect(mockDepartment.update.calledOnce).to.be.true;
      expect(result).to.equal(mockDepartment);
    });

    it('should throw conflict when new name already exists', async () => {
      mockDb.Department.findByPk.resolves(mockDepartment);
      mockDb.Department.findOne.resolves({ id: 2, name: 'Sales' });

      try {
        await departmentService.update(1, { name: 'Sales' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(409);
      }
    });
  });

  describe('delete', () => {
    it('should delete department with no users', async () => {
      mockDb.Department.findByPk.resolves(mockDepartment);
      mockDb.User.count.resolves(0);

      const result = await departmentService.delete(1);

      expect(mockDepartment.destroy.calledOnce).to.be.true;
      expect(result.message).to.include('deleted');
    });

    it('should throw conflict when department has users', async () => {
      mockDb.Department.findByPk.resolves(mockDepartment);
      mockDb.User.count.resolves(5);

      try {
        await departmentService.delete(1);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(409);
        expect(error.message).to.include('5 assigned users');
      }
    });
  });

  describe('findById', () => {
    it('should return department when found', async () => {
      mockDb.Department.findByPk.resolves(mockDepartment);

      const result = await departmentService.findById(1);

      expect(result).to.equal(mockDepartment);
    });

    it('should throw not found error', async () => {
      mockDb.Department.findByPk.resolves(null);

      try {
        await departmentService.findById(999);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated departments', async () => {
      mockDb.Department.findAndCountAll.resolves({
        rows: [mockDepartment],
        count: 1,
      });

      const result = await departmentService.findAll({ page: 1, limit: 20 });

      expect(result.data).to.have.length(1);
      expect(result.pagination.total).to.equal(1);
    });

    it('should filter by search term', async () => {
      mockDb.Department.findAndCountAll.resolves({ rows: [], count: 0 });

      await departmentService.findAll({ search: 'eng' });

      const callArgs = mockDb.Department.findAndCountAll.getCall(0).args[0];
      expect(callArgs.where.name).to.exist;
    });
  });
});

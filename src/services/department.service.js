import CrudService from './crud.service.js';
export default class DepartmentService extends CrudService {
  constructor(db) { super(db, { modelName: 'Department', fkField: 'departmentId', label: 'Department' }); }
}

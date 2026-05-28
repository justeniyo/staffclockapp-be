import CrudService from './crud.service.js';
export default class LocationService extends CrudService {
  constructor(db) { super(db, { modelName: 'Location', fkField: 'locationId', label: 'Location' }); }
}

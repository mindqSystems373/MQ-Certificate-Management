const Faculty = require('../models/Faculty');
const makeCrudController = require('../utils/crudFactory');

module.exports = makeCrudController(Faculty, {
  entityName: 'Faculty',
  logType: 'faculty_saved',
  editableFields: ['name', 'email', 'specialization'],
});

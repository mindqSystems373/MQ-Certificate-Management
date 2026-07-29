const Grade = require('../models/Grade');
const makeCrudController = require('../utils/crudFactory');

module.exports = makeCrudController(Grade, {
  entityName: 'Grade',
  logType: 'grade_saved',
  editableFields: ['label', 'minPercentage'],
});

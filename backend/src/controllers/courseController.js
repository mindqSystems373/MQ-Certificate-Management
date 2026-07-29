const Course = require('../models/Course');
const makeCrudController = require('../utils/crudFactory');

module.exports = makeCrudController(Course, {
  entityName: 'Course',
  logType: 'course_saved',
  editableFields: ['name', 'code', 'durationWeeks'],
});

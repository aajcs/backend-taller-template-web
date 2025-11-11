const serviceBayController = require("./serviceBay.controller");
const assignmentController = require("./assignment.controller");
const reportsController = require("./reports.controller");

module.exports = {
  ...serviceBayController,
  ...assignmentController,
  ...reportsController,
};

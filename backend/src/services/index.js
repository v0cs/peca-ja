// Services index file
// Export all services from here

const apiVeicularService = require("./apiVeicularService");
const emailService = require("./emailService");
const NotificationService = require("./notificationService");
const uploadService = require("./uploadService");

module.exports = {
  apiVeicularService,
  emailService,
  NotificationService,
  uploadService,
};

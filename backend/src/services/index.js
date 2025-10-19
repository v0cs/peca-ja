// Services index file
// Export all services from here

const apiVeicularService = require("./apiVeicularService");
const emailService = require("./emailService");
const NotificationService = require("./notificationService");

module.exports = {
  apiVeicularService,
  emailService,
  NotificationService,
};

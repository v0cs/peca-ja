// middleware/index.js
const authMiddleware = require("./authMiddleware");
const {
  uploadMiddleware,
  uploadSingleMiddleware,
} = require("./uploadMiddleware");

module.exports = {
  authMiddleware,
  uploadMiddleware,
  uploadSingleMiddleware,
};

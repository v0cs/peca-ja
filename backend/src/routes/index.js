// Routes index file
// Export all routes from here

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");

// Mount routes
router.use("/auth", authRoutes);

module.exports = router;

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Rota para registro de usuários
router.post("/register", authController.register);

module.exports = router;

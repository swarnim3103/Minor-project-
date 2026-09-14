const express = require("express");
const { authenticate } = require("../middleware/auth");
const { getDashboard } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/", authenticate, getDashboard);

module.exports = router;
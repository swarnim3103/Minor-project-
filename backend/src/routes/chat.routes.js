const express = require("express");

const router = express.Router();

const { chat } = require("../controllers/chat.controller");
const {authenticate} = require("../middleware/auth");

router.post("/", authenticate, chat);

module.exports = router;
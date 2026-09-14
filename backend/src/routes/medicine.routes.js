const express = require("express");
const { addMedicine, getMedicines } = require("../controllers/medicine.controller");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, addMedicine);
router.get("/", authenticate, getMedicines);
module.exports = router;
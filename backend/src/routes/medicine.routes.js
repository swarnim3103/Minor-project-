const express = require("express");
const { addMedicine, getMedicines } = require("../controllers/medicine.controller");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, addMedicine);
router.get("/", authenticate, getMedicines);
router.put("/:id", authenticate, updateMedicine);
router.delete("/:id", authenticate, deleteMedicine);
module.exports = router;
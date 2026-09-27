const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', authenticate, upload.single('file'), prescriptionController.uploadPrescription);
router.get('/', authenticate, prescriptionController.getPrescriptions);
router.delete('/:id', authenticate, prescriptionController.deletePrescription);

module.exports = router;
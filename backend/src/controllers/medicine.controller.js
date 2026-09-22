const db = require("../config/db");

const ALLOWED_FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Weekly",
];

function getIndiaDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}


function validateDates(start_date, end_date) {
  if (!start_date) {
    return "Start date is required";
  }

  const today = getIndiaDate();

  if (start_date < today) {
    return "Start date cannot be before today";
  }

  if (end_date && end_date < start_date) {
    return "End date cannot be before start date";
  }

  return null;
}


// =========================
// ADD MEDICINE
// =========================
async function addMedicine(req, res) {
  try {
    const userId = req.user.id;

    const {
      name,
      dosage,
      frequency,
      instructions,
      start_date,
      end_date,
    } = req.body;

    if (!name || !dosage || !frequency || !start_date) {
      return res.status(400).json({
        message: "Name, dosage, frequency and start date are required",
      });
    }

    // Prevent invalid/custom frequency values
    if (!ALLOWED_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        message: "Invalid medicine frequency",
      });
    }

    // Validate dates
    const dateError = validateDates(start_date, end_date);

    if (dateError) {
      return res.status(400).json({
        message: dateError,
      });
    }

    const sql = `
      INSERT INTO medicines
      (
        user_id,
        name,
        dosage,
        frequency,
        instructions,
        start_date,
        end_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      userId,
      name.trim(),
      dosage.trim(),
      frequency,
      instructions?.trim() || null,
      start_date,
      end_date || null,
    ]);

    res.status(201).json({
      message: "Medicine added successfully",
      medicineId: result.insertId,
    });

  } catch (error) {
    console.error("Add medicine error:", error);

    res.status(500).json({
      message: "Failed to add medicine",
    });
  }
}


// =========================
// GET MEDICINES
// =========================
async function getMedicines(req, res) {
  try {
    const userId = req.user.id;

    const [medicines] = await db.execute(
  `
  SELECT
    id,
    name,
    dosage,
    frequency,
    instructions,
    DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
  FROM medicines
  WHERE user_id = ?
  ORDER BY start_date DESC
  `,
  [userId]
);
    res.json(medicines);

  } catch (error) {
    console.error("Get medicines error:", error);

    res.status(500).json({
      message: "Failed to fetch medicines",
    });
  }
}


// =========================
// UPDATE MEDICINE
// =========================
async function updateMedicine(req, res) {
  try {
    const userId = req.user.id;
    const medicineId = req.params.id;

    const {
      name,
      dosage,
      frequency,
      instructions,
      start_date,
      end_date,
    } = req.body;

    if (!name || !dosage || !frequency || !start_date) {
      return res.status(400).json({
        message: "Name, dosage, frequency and start date are required",
      });
    }

    // Prevent invalid/custom frequency values
    if (!ALLOWED_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        message: "Invalid medicine frequency",
      });
    }

    // Validate dates
    const dateError = validateDates(start_date, end_date);

    if (dateError) {
      return res.status(400).json({
        message: dateError,
      });
    }

    // Make sure this medicine belongs to the logged-in user
    const [existingMedicine] = await db.execute(
      `
      SELECT id
      FROM medicines
      WHERE id = ? AND user_id = ?
      `,
      [medicineId, userId]
    );

    if (existingMedicine.length === 0) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    await db.execute(
      `
      UPDATE medicines
      SET
        name = ?,
        dosage = ?,
        frequency = ?,
        instructions = ?,
        start_date = ?,
        end_date = ?
      WHERE id = ? AND user_id = ?
      `,
      [
        name.trim(),
        dosage.trim(),
        frequency,
        instructions?.trim() || null,
        start_date,
        end_date || null,
        medicineId,
        userId,
      ]
    );

    res.json({
      message: "Medicine updated successfully",
    });

  } catch (error) {
    console.error("Update medicine error:", error);

    res.status(500).json({
      message: "Failed to update medicine",
    });
  }
}


// =========================
// DELETE MEDICINE
// =========================
async function deleteMedicine(req, res) {
  try {
    const userId = req.user.id;
    const medicineId = req.params.id;

    // Make sure this medicine belongs to the logged-in user
    const [existingMedicine] = await db.execute(
      `
      SELECT id
      FROM medicines
      WHERE id = ? AND user_id = ?
      `,
      [medicineId, userId]
    );

    if (existingMedicine.length === 0) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    await db.execute(
      `
      DELETE FROM medicines
      WHERE id = ? AND user_id = ?
      `,
      [medicineId, userId]
    );

    res.json({
      message: "Medicine deleted successfully",
    });

  } catch (error) {
    console.error("Delete medicine error:", error);

    res.status(500).json({
      message: "Failed to delete medicine",
    });
  }
}


module.exports = {
  addMedicine,
  getMedicines,
  updateMedicine,
  deleteMedicine,
};
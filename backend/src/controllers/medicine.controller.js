const db = require("../config/db");

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

    const sql = `
      INSERT INTO medicines
      (user_id, name, dosage, frequency, instructions, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      userId,
      name,
      dosage,
      frequency,
      instructions || null,
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
        start_date,
        end_date
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
module.exports = {
  addMedicine,
    getMedicines,
};
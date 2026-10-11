
require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../src/config/db");

const csvPath = path.join(__dirname, "../data/medicines_new.csv");
const TABLE_NAME = "medicine_catalogue_v2";
const BATCH_SIZE = 500;

async function importMedicines() {
  const medicines = [];
  const seenIds = new Set();

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  // Read the CSV and collect the required fields.
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header.trim().replace(/^\uFEFF/, ""),
        })
      )
      .on("data", (row) => {
        const sourceId = Number(row.id);
        const name = row.name?.trim();

        if (
          !Number.isInteger(sourceId) ||
          sourceId <= 0 ||
          !name ||
          seenIds.has(sourceId)
        ) {
          return;
        }

        seenIds.add(sourceId);

        medicines.push([
          sourceId,
          name,
          row.short_composition1?.trim() || null,
          row.short_composition2?.trim() || null,
        ]);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (medicines.length === 0) {
    throw new Error(
      "No valid medicine records found. Check the CSV headers and data."
    );
  }

  console.log(`Read ${medicines.length} unique medicine records.`);

  try {
    // Clear ONLY the new catalogue before a fresh import.
    // This makes rerunning the script safe from duplicate imports.
    await db.query(`TRUNCATE TABLE ${TABLE_NAME}`);

    let imported = 0;

    for (let i = 0; i < medicines.length; i += BATCH_SIZE) {
      const batch = medicines.slice(i, i + BATCH_SIZE);
      const placeholders = batch
        .map(() => "(?, ?, ?, ?)")
        .join(", ");

      const values = batch.flat();

      await db.execute(
        `INSERT INTO ${TABLE_NAME}
          (source_id, name, short_composition1, short_composition2)
         VALUES ${placeholders}`,
        values
      );

      imported += batch.length;
      console.log(`Imported ${imported}/${medicines.length}`);
    }

    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM ${TABLE_NAME}`
    );

    console.log(
      `Import complete. Records in new catalogue: ${rows[0].total}`
    );
  } finally {
    await db.end();
  }
}

importMedicines().catch((error) => {
  console.error("Medicine import failed:", error);
  process.exitCode = 1;
});

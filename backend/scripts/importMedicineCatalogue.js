require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../src/config/db");

const csvPath = path.join(__dirname, "../data/medicines.csv");

async function importMedicines() {
  const names = new Set();

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      const name = row.Name?.trim();

      if (name) {
        names.add(name);
      }
    })
    .on("end", async () => {
      try {
        for (const name of names) {
          await db.execute(
            "INSERT IGNORE INTO medicine_catalogue (name) VALUES (?)",
            [name]
          );
        }

        console.log(`Imported ${names.size} unique medicine names.`);
      } catch (error) {
        console.error("Import failed:", error);
      } finally {
        if (typeof db.end === "function") {
          await db.end();
        }
      }
    })
    .on("error", (error) => {
      console.error("Could not read CSV:", error);
    });
}

importMedicines();
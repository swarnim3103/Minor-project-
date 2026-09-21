const medicalKeywords = [
  // Medicines
  "medicine",
  "medication",
  "drug",
  "tablet",
  "capsule",
  "syrup",
  "dose",
  "dosage",
  "prescription",
  "pill",

  // Medication-related
  "side effect",
  "side effects",
  "interaction",
  "interactions",
  "drug interaction",
  "missed dose",
  "overdose",
  "allergy",
  "allergic reaction",
  "storage",
  "expiry",
  "expired medicine",

  // Medical topics
  "symptom",
  "symptoms",
  "disease",
  "condition",
  "treatment",
  "pain",
  "fever",
  "infection",
  "blood pressure",
  "diabetes",
  "sugar level",
  "headache",
  "nausea",
  "vomiting",
  "diarrhea",
  "dizziness",
  "swelling",
  "rash",
  "health",
  "medical",
  "doctor",
  "pharmacy",
  "pharmacist"
];

// Medicines currently present in medical_data.json
const medicineNames = [
  "metformin",
  "paracetamol",
  "ibuprofen"
];

// Common misspellings
const medicineAliases = {
  metamorfin: "metformin",
  metformine: "metformin",
  metformn: "metformin",

  paracetmol: "paracetamol",
  paracetamol: "paracetmol",

  ibuprofren: "ibuprofen",
  ibuprofin: "ibuprofen"
};

function isMedicalQuery(message) {
  const query = message.toLowerCase().trim();

  // 1. Normal medical keywords
  const hasMedicalKeyword = medicalKeywords.some((keyword) =>
    query.includes(keyword)
  );

  if (hasMedicalKeyword) {
    return true;
  }

  // 2. Known medicine names
  const hasMedicineName = medicineNames.some((medicine) =>
    query.includes(medicine)
  );

  if (hasMedicineName) {
    return true;
  }

  // 3. Common medicine spelling mistakes
  const hasMedicineAlias = Object.keys(medicineAliases).some((alias) =>
    query.includes(alias)
  );

  if (hasMedicineAlias) {
    return true;
  }

  return false;
}

module.exports = {
  isMedicalQuery
};
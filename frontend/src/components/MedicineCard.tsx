import { EditIcon, TrashIcon, PillIcon } from "./icons";
import "./MedicineCard.css";

export interface Medicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  start_date: string;
  end_date?: string | null;
}

interface MedicineCardProps {
  medicine: Medicine;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (id: number) => void;
}

function MedicineCard({ medicine, onEdit, onDelete }: MedicineCardProps) {
  return (
    <div className="medicine-card">
      <div className="medicine-card-icon">
        <PillIcon />
      </div>

      <div className="medicine-card-body">
        <h3>{medicine.name}</h3>
        <p className="medicine-card-dosage">
          {medicine.dosage} &middot; {medicine.frequency}
        </p>
        {medicine.instructions && (
          <p className="medicine-card-instructions">{medicine.instructions}</p>
        )}
        <p className="medicine-card-dates">
          Since {medicine.start_date}
          {medicine.end_date ? ` · until ${medicine.end_date}` : ""}
        </p>
      </div>

      <div className="medicine-card-actions">
        <button
          className="medicine-card-btn"
          onClick={() => onEdit?.(medicine)}
          aria-label={`Edit ${medicine.name}`}
        >
          <EditIcon width={16} height={16} />
        </button>
        <button
          className="medicine-card-btn medicine-card-btn-danger"
          onClick={() => onDelete?.(medicine.id)}
          aria-label={`Delete ${medicine.name}`}
        >
          <TrashIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

export default MedicineCard;

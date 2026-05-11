export type ParseConfidence = 'confident' | 'unrecognized';

export interface MedicationEntry {
  id: string;
  rawName: string;
  canonicalName: string;
  activeIngredient: string;
  strength: string;
  form: string;
  frequency: string;
  duration: string;
  indication: string;
  confidence: ParseConfidence;
}

export interface TherapeuticAlternative {
  brandName: string;
  activeIngredient: string;
  strength: string;
  form: string;
  reason: string;
}

export interface DecodedPrescription {
  medications: MedicationEntry[];
  alternativesByMedicationId: Record<string, TherapeuticAlternative[]>;
  simulated: true;
  warnings: string[];
}

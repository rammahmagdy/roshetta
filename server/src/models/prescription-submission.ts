// In-memory shape only — submissions are NOT persisted (FR-014).
// This type exists so controllers and tests share one vocabulary even though
// nothing is written to disk.

export interface PrescriptionSubmission {
  id: string;
  receivedAt: number;
  mimeType: string;
  sizeBytes: number;
}

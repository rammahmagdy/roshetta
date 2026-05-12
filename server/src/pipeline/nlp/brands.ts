// =============================================================================
// KNOWN_BRANDS — Egyptian / MENA drug formulary (mock).
// =============================================================================
// In a real integration this would be loaded from a published formulary
// (e.g. the Egyptian Drug Authority list). The values here cover the brands
// we expect to see in the bundled OCR samples plus a few common adjacencies.
// Keys are normalized lower-case to make lookup cheap.

export interface BrandInfo {
  /** Canonical display name (used in the UI). */
  canonical: string;
  /** Active ingredient(s), human-readable. */
  activeIngredient: string;
  /** Default dosage form when not visible in the prescription. */
  form: string;
  /** Default indication for the result card when not in the Rx line. */
  defaultIndication?: string;
}

export const KNOWN_BRANDS: Record<string, BrandInfo> = {
  // -------- antibiotics / respiratory ----------------------------------
  augmentin: { canonical: 'Augmentin', activeIngredient: 'Amoxicillin + Clavulanate', form: 'tablet', defaultIndication: 'bacterial infection' },
  'augmentin susp': { canonical: 'Augmentin Suspension', activeIngredient: 'Amoxicillin + Clavulanate', form: 'syrup', defaultIndication: 'bacterial infection' },
  panadol: { canonical: 'Panadol Extra', activeIngredient: 'Paracetamol + Caffeine', form: 'tablet', defaultIndication: 'pain / fever' },
  'panadol extra': { canonical: 'Panadol Extra', activeIngredient: 'Paracetamol + Caffeine', form: 'tablet', defaultIndication: 'pain / fever' },
  claritine: { canonical: 'Claritine', activeIngredient: 'Loratadine', form: 'tablet', defaultIndication: 'allergy / rhinitis' },
  otrivin: { canonical: 'Otrivin', activeIngredient: 'Xylometazoline', form: 'nasal drops', defaultIndication: 'nasal congestion' },
  hexitol: { canonical: 'Hexitol', activeIngredient: 'Chlorhexidine Gluconate', form: 'mouthwash', defaultIndication: 'oral antiseptic' },

  // -------- cardiovascular ---------------------------------------------
  concor: { canonical: 'Concor', activeIngredient: 'Bisoprolol', form: 'tablet', defaultIndication: 'hypertension' },
  lipitor: { canonical: 'Lipitor', activeIngredient: 'Atorvastatin', form: 'tablet', defaultIndication: 'cholesterol' },
  atoris: { canonical: 'Atoris', activeIngredient: 'Atorvastatin', form: 'tablet', defaultIndication: 'cholesterol' },
  aspocid: { canonical: 'Aspocid', activeIngredient: 'Acetylsalicylic Acid', form: 'tablet', defaultIndication: 'cardio-protection' },
  vastarel: { canonical: 'Vastarel MR', activeIngredient: 'Trimetazidine', form: 'tablet', defaultIndication: 'angina' },
  'vastarel mr': { canonical: 'Vastarel MR', activeIngredient: 'Trimetazidine', form: 'tablet', defaultIndication: 'angina' },

  // -------- GI ----------------------------------------------------------
  nexium: { canonical: 'Nexium', activeIngredient: 'Esomeprazole', form: 'capsule', defaultIndication: 'acid reflux / GERD' },
  motilium: { canonical: 'Motilium', activeIngredient: 'Domperidone', form: 'tablet', defaultIndication: 'nausea / dyspepsia' },
  gaviscon: { canonical: 'Gaviscon', activeIngredient: 'Sodium Alginate + Sodium Bicarbonate', form: 'suspension', defaultIndication: 'heartburn' },

  // -------- pain / inflammation (NSAIDs) -------------------------------
  brufen: { canonical: 'Brufen', activeIngredient: 'Ibuprofen', form: 'syrup', defaultIndication: 'fever / pain' },
  catafast: { canonical: 'Catafast', activeIngredient: 'Diclofenac Potassium', form: 'sachet', defaultIndication: 'acute pain' },
  cataflam: { canonical: 'Cataflam', activeIngredient: 'Diclofenac Potassium', form: 'tablet', defaultIndication: 'acute pain' },
  voltaren: { canonical: 'Voltaren', activeIngredient: 'Diclofenac Sodium', form: 'tablet', defaultIndication: 'inflammation / pain' },
  mobic: { canonical: 'Mobic', activeIngredient: 'Meloxicam', form: 'tablet', defaultIndication: 'arthritis / inflammation' },
  // common doctor-shorthand misspelling of Mobic.
  mobix: { canonical: 'Mobic', activeIngredient: 'Meloxicam', form: 'tablet', defaultIndication: 'arthritis / inflammation' },
  olfen: { canonical: 'Olfen Gel', activeIngredient: 'Diclofenac Sodium', form: 'topical gel', defaultIndication: 'localized pain / inflammation' },
  'olfen gel': { canonical: 'Olfen Gel', activeIngredient: 'Diclofenac Sodium', form: 'topical gel', defaultIndication: 'localized pain / inflammation' },

  // -------- vitamins / nerve -------------------------------------------
  multinerv: { canonical: 'Multinerv', activeIngredient: 'Vitamin B1 + B6 + B12', form: 'tablet', defaultIndication: 'nerve support / neuropathy' },
  neurorubine: { canonical: 'Neurorubine', activeIngredient: 'Vitamin B1 + B6 + B12', form: 'tablet', defaultIndication: 'nerve support / neuropathy' },

  // -------- calcium ----------------------------------------------------
  maxicalc: { canonical: 'Maxicalc', activeIngredient: 'Calcium Carbonate + Vitamin D3', form: 'tablet', defaultIndication: 'calcium / bone support' },
  'maxicalc d': { canonical: 'Maxicalc D', activeIngredient: 'Calcium Carbonate + Vitamin D3', form: 'tablet', defaultIndication: 'calcium / bone support' },

  // -------- diabetes ---------------------------------------------------
  glucophage: { canonical: 'Glucophage', activeIngredient: 'Metformin', form: 'tablet', defaultIndication: 'type 2 diabetes' },
  amaryl: { canonical: 'Amaryl', activeIngredient: 'Glimepiride', form: 'tablet', defaultIndication: 'type 2 diabetes' },

  // -------- muscle relaxants -------------------------------------------
  'multi relax': { canonical: 'Multi Relax', activeIngredient: 'Methocarbamol + Paracetamol', form: 'tablet', defaultIndication: 'muscle pain / spasm' },
  multirelax: { canonical: 'Multi Relax', activeIngredient: 'Methocarbamol + Paracetamol', form: 'tablet', defaultIndication: 'muscle pain / spasm' },
  myolastan: { canonical: 'Myolastan', activeIngredient: 'Tetrazepam', form: 'tablet', defaultIndication: 'muscle spasm' },
  sirdalud: { canonical: 'Sirdalud', activeIngredient: 'Tizanidine', form: 'tablet', defaultIndication: 'muscle spasm' },
  myogesic: { canonical: 'Myogesic', activeIngredient: 'Orphenadrine + Paracetamol', form: 'tablet', defaultIndication: 'muscle pain' },

  // -------- paracetamol family (common in pediatric / pain prescriptions)
  captin: { canonical: 'Captin', activeIngredient: 'Paracetamol', form: 'tablet', defaultIndication: 'fever / pain' },
  'captin plus': { canonical: 'Captin Plus', activeIngredient: 'Paracetamol + Caffeine', form: 'tablet', defaultIndication: 'fever / pain' },
  adol: { canonical: 'Adol', activeIngredient: 'Paracetamol', form: 'tablet', defaultIndication: 'fever / pain' },
  cetal: { canonical: 'Cetal', activeIngredient: 'Paracetamol', form: 'tablet', defaultIndication: 'fever / pain' },
  abimol: { canonical: 'Abimol', activeIngredient: 'Paracetamol', form: 'tablet', defaultIndication: 'fever / pain' },

  // -------- Meloxicam brands (Mobitil / Movalis are common in EG) ------
  mobitil: { canonical: 'Mobitil', activeIngredient: 'Meloxicam', form: 'tablet', defaultIndication: 'arthritis / inflammation' },
  movalis: { canonical: 'Movalis', activeIngredient: 'Meloxicam', form: 'tablet', defaultIndication: 'arthritis / inflammation' },

  // -------- topical / dermatology --------------------------------------
  'maxi care': { canonical: 'Maxi Care', activeIngredient: 'Moisturizing complex', form: 'cream', defaultIndication: 'dry / irritated skin' },
  maxicare: { canonical: 'Maxi Care', activeIngredient: 'Moisturizing complex', form: 'cream', defaultIndication: 'dry / irritated skin' },
  bioderma: { canonical: 'Bioderma', activeIngredient: 'Skincare formula', form: 'cream', defaultIndication: 'sensitive skin' },
  cetaphil: { canonical: 'Cetaphil', activeIngredient: 'Skincare formula', form: 'cream', defaultIndication: 'sensitive skin' },

  // -------- antibiotics (extras) ---------------------------------------
  klacid: { canonical: 'Klacid', activeIngredient: 'Clarithromycin', form: 'tablet', defaultIndication: 'bacterial infection' },
  zithromax: { canonical: 'Zithromax', activeIngredient: 'Azithromycin', form: 'tablet', defaultIndication: 'bacterial infection' },
  cipro: { canonical: 'Cipro', activeIngredient: 'Ciprofloxacin', form: 'tablet', defaultIndication: 'bacterial infection' },
  curam: { canonical: 'Curam', activeIngredient: 'Amoxicillin + Clavulanate', form: 'tablet', defaultIndication: 'bacterial infection' },
  hibiotic: { canonical: 'Hibiotic', activeIngredient: 'Amoxicillin + Clavulanate', form: 'tablet', defaultIndication: 'bacterial infection' },

  // -------- allergy (extras) -------------------------------------------
  telfast: { canonical: 'Telfast', activeIngredient: 'Fexofenadine', form: 'tablet', defaultIndication: 'allergy / rhinitis' },
  histazine: { canonical: 'Histazine', activeIngredient: 'Loratadine', form: 'tablet', defaultIndication: 'allergy / rhinitis' },
  lorinase: { canonical: 'Lorinase', activeIngredient: 'Loratadine', form: 'tablet', defaultIndication: 'allergy / rhinitis' },

  // -------- pain (extras) ----------------------------------------------
  profinal: { canonical: 'Profinal', activeIngredient: 'Ibuprofen', form: 'syrup', defaultIndication: 'fever / pain' },
  advil: { canonical: 'Advil', activeIngredient: 'Ibuprofen', form: 'tablet', defaultIndication: 'fever / pain' },
  rivo: { canonical: 'Rivo', activeIngredient: 'Acetylsalicylic Acid', form: 'tablet', defaultIndication: 'cardio-protection' },
  adwiflam: { canonical: 'Adwiflam', activeIngredient: 'Diclofenac Sodium', form: 'tablet', defaultIndication: 'inflammation / pain' },
  rofenac: { canonical: 'Rofenac', activeIngredient: 'Diclofenac Sodium', form: 'topical gel', defaultIndication: 'localized pain' },
  'adwiflam k': { canonical: 'Adwiflam K', activeIngredient: 'Diclofenac Potassium', form: 'tablet', defaultIndication: 'acute pain' },
  rapidus: { canonical: 'Rapidus', activeIngredient: 'Diclofenac Potassium', form: 'sachet', defaultIndication: 'acute pain' },

  // -------- GI (extras) -------------------------------------------------
  pantoloc: { canonical: 'Pantoloc', activeIngredient: 'Pantoprazole', form: 'tablet', defaultIndication: 'acid reflux' },
  esoprazole: { canonical: 'Esoprazole', activeIngredient: 'Esomeprazole', form: 'capsule', defaultIndication: 'acid reflux' },
  sompraz: { canonical: 'Sompraz', activeIngredient: 'Esomeprazole', form: 'capsule', defaultIndication: 'acid reflux' },
  buscopan: { canonical: 'Buscopan', activeIngredient: 'Hyoscine Butylbromide', form: 'tablet', defaultIndication: 'stomach cramps' },

  // -------- B-vitamin / nerve (extras) ---------------------------------
  milga: { canonical: 'Milga', activeIngredient: 'Vitamin B1 + B6 + B12', form: 'tablet', defaultIndication: 'nerve support' },
  neuroton: { canonical: 'Neuroton', activeIngredient: 'Vitamin B1 + B6 + B12', form: 'tablet', defaultIndication: 'nerve support' },
  neurobion: { canonical: 'Neurobion', activeIngredient: 'Vitamin B1 + B6 + B12', form: 'tablet', defaultIndication: 'nerve support' },
  riconia: { canonical: 'Riconia', activeIngredient: 'Multivitamin + Minerals', form: 'tablet', defaultIndication: 'general supplementation' },
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Best-effort match against KNOWN_BRANDS. Tries the full name, then the first
 * two words, then the first word — handles cases like "Augmentin susp 312"
 * where "augmentin susp" is the right key.
 */
export function lookupBrand(rawName: string): BrandInfo | undefined {
  const normalized = normalizeName(rawName);
  if (KNOWN_BRANDS[normalized]) return KNOWN_BRANDS[normalized];

  const words = normalized.split(' ');
  if (words.length >= 2) {
    const firstTwo = words.slice(0, 2).join(' ');
    if (KNOWN_BRANDS[firstTwo]) return KNOWN_BRANDS[firstTwo];
  }
  const firstWord = words[0];
  return firstWord ? KNOWN_BRANDS[firstWord] : undefined;
}

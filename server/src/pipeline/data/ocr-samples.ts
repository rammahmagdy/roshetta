// Mocked raw-OCR strings. Each one mirrors a real-world shape that's common
// on Egyptian / MENA prescriptions:
//   - Hospital letterhead lines
//   - "Rx <brand> <strength>" + Arabic dosing line below
//   - Inline English shorthand (TDS / BID / OD / PRN / HS)
//   - Some intentionally illegible items so the parser exercises FR-015
//
// These are picked deterministically per request from a hash of the
// preprocessed image bytes (testability) but the variation is wide enough
// that different uploads feel like different prescriptions (demo realism).
//
// When real vision providers are configured (ANTHROPIC_API_KEY / etc.),
// THIS FILE IS UNUSED — the cascade in providers/index.ts produces the raw
// text instead.

export const OCR_SAMPLES: readonly string[] = [
  // 0 — Air Force Specialized Hospital, ortho / pain (mirrors the user's photo)
  `Air Force Specialized Hospital — Cairo
Date: 22/3/2024

Rx Multinerv 5mg
   مرتين يومياً بعد الأكل

Rx Catafast 100
   كيس مرتين يومياً عند الحاجة

Rx Mobic 15
   قرص يومياً صباحاً

Rx Olfen Gel 1%
   موضعياً 3 مرات يومياً على المنطقة المؤلمة`,

  // 1 — Internal medicine, hypertension + lipids (mixed Arabic / English shorthand)
  `Cardiology Clinic
Date: 9/1/2024

Rx Concor 5mg
   1 tab OD صباحاً

Rx Lipitor 20mg
   قرص قبل النوم

Rx Aspocid 75mg
   قرص يومياً بعد الغذاء

Rx Vastarel MR 35mg
   BID — قرص مرتين يومياً`,

  // 2 — GI clinic, GERD (clean MSA Arabic instructions)
  `Date: 5/3/2024

Rx Nexium 40mg
   كبسولة يومياً قبل الإفطار لمدة 14 يوم

Rx Motilium 10mg
   قرص ثلاث مرات يومياً قبل الأكل

Rx Gaviscon Suspension
   10 ml بعد الأكل عند الحاجة`,

  // 3 — Pediatric (one intentionally illegible line)
  `Pediatric Clinic
Patient age: 6 years

Rx Augmentin susp 312
   5 ml كل 12 ساعة لمدة 7 أيام

Rx Brufen syrup 100mg/5ml
   5 ml كل 8 ساعات عند ارتفاع الحرارة

Rx ----illegible---- nasal drops
   نقطة في كل فتحة كل 6 ساعات`,

  // 4 — Diabetes (English shorthand frequencies)
  `Internal Medicine Clinic
Date: 11/4/2024

Rx Glucophage 500mg
   1 tab BID with meals

Rx Amaryl 2mg
   قرص قبل الإفطار

Rx Lipitor 10mg
   قرص قبل النوم`,

  // 5 — Dental clinic, antibiotic + analgesic (heavily abbreviated)
  `Dental Clinic — Cairo
Date: 17/6/2024

Rx Augmentin 1g
   1 tab q12h x 5d
   مرتين يومياً لمدة 5 أيام

Rx Cataflam 50
   1 tab TDS PRN  (after meals)
   قرص ثلاث مرات يومياً عند الألم

Rx Hexitol Mouthwash
   مضمضة بعد كل وجبة`,

  // 6 — URI clinic, very compact (mimics quick-scribble style)
  `Date: 28/2/2024
Patient: --

Rx Augmentin 625
   BID x 7d

Rx Panadol Extra
   PRN — every 6h max

Rx ----illegible---- spray
   نفخة في كل فتحة BID

Rx Claritine
   1 tab HS`,

  // 7 — Chronic care, mostly Arabic instructions (rare brand name twist)
  `Internal Medicine
Date: 19/5/2024

Rx Concor 2.5
   قرص يومياً صباحاً مدى الحياة

Rx Aspocid 75
   قرص يومياً بعد الغذاء

Rx Atoris 10mg
   قرص قبل النوم  (alternative to Lipitor)
   ----illegible---- لو حصل آلام في العضلات

Rx Maxicalc D
   قرص يومياً مع الإفطار`,
];

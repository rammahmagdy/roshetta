// =============================================================================
// line-parser — given an Rx-prefixed line body, extract the head
// (brand + strength) and any inline instruction / indication. The whole
// pipeline knows two formats:
//
//   1. legacy single-line:
//      "Augmentin 1g — 1 tab every 12 hours x 7 days  (bacterial sinusitis)"
//
//   2. modern multi-line (Egyptian hospital style):
//      "Rx Catafast 100"
//      "   كيس مرتين يومياً عند الحاجة"
//
// This module handles (1) parsing the head + any inline content from the
// first line. The multi-line stitching happens in ./index.ts.
// =============================================================================

export interface ParsedRxLine {
  head: string;
  inlineInstruction: string;
  inlineIndication: string;
}

export interface ParsedHead {
  rawName: string;
  strength: string;
}

/**
 * Strip off a trailing parenthesised indication and a "— inline instructions"
 * tail, returning the structured pieces.
 */
export function parseLineBody(body: string): ParsedRxLine {
  let working = body.trim();
  let inlineIndication = '';

  const indMatch = working.match(/\(([^)]+)\)\s*$/);
  if (indMatch) {
    inlineIndication = indMatch[1]!.trim();
    working = working.slice(0, indMatch.index).trim();
  }

  const dashSplit = working.split(/\s+[—\-–]\s+/);
  if (dashSplit.length >= 2) {
    return {
      head: dashSplit[0]!.trim(),
      inlineInstruction: dashSplit.slice(1).join(' — ').trim(),
      inlineIndication,
    };
  }
  return { head: working, inlineInstruction: '', inlineIndication };
}

/**
 * Extract the brand name and trailing strength from a head like
 *   "Multinerv 5mg" → { rawName: "Multinerv", strength: "5mg" }
 *   "Catafast 100"   → { rawName: "Catafast",   strength: "100"   }
 *   "Olfen Gel 1%"   → { rawName: "Olfen Gel",  strength: "1%"    }
 */
export function parseHead(head: string): ParsedHead {
  const trimmed = head.trim().replace(/[—\-–]\s*$/, '').trim();
  const strengthRegex = /\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|mg\/\d+ml|%)?)\b\s*$/i;
  const m = trimmed.match(strengthRegex);
  if (m) {
    return {
      rawName: trimmed.slice(0, m.index).trim(),
      strength: m[1]!.trim(),
    };
  }
  return { rawName: trimmed, strength: '' };
}

/** Matches either "1) ..." or "Rx ..." / "R/ ..." prefix. */
export const RX_PREFIX = /^\s*(?:Rx\b|R\/|\d+\))\s*(.+)$/i;

export interface ParsedPropertyAddress {
  street: string;
  city?: string;
  state?: string;
  postalCode?: string;
  /** Best-effort single-line rendering. */
  formattedSingleLine: string;
}

function cleanupAddressSegment(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.;:,]\s*$/g, "")
    .trim();
}

function extractAddressSegmentFromStatement(statement: string): string | null {
  const s = statement.trim();
  if (!s) return null;

  const patterns: RegExp[] = [
    // "The property is located at 111 Non Street, Bentonville, VA 12345"
    /located at\s+(.+?)(?:[.;]|$)/i,
    // "Property address: 111 Non Street, Bentonville, VA 12345"
    /address\s*:\s*(.+?)(?:[.;]|$)/i,
    // Fallback: grab anything that looks like "... , City, ST 12345"
    /(\d{1,6}\s+[^.]+?,\s*[^,]+?,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)(?:[.;]|$)/,
  ];

  for (const re of patterns) {
    const m = s.match(re);
    const seg = m?.[1] ? cleanupAddressSegment(m[1]) : null;
    if (seg) return seg;
  }

  return null;
}

function parseUsCityStateZip(segment: string): {
  street: string;
  city?: string;
  state?: string;
  postalCode?: string;
} {
  // e.g. "1250 Sunshine Boulevard, Phoenix, AZ 85004"
  const re =
    /^(?<street>.+?),\s*(?<city>[^,]+?),\s*(?<state>[A-Z]{2})\s+(?<zip>\d{5}(?:-\d{4})?)$/;
  const m = segment.match(re);
  if (!m?.groups?.street) return { street: segment };
  return {
    street: cleanupAddressSegment(m.groups.street),
    city: cleanupAddressSegment(m.groups.city ?? ""),
    state: cleanupAddressSegment(m.groups.state ?? ""),
    postalCode: cleanupAddressSegment(m.groups.zip ?? ""),
  };
}

export function parsePropertyAddressFromLoanSummaryStatement(
  statement: unknown
): ParsedPropertyAddress | null {
  if (typeof statement !== "string") return null;

  const segment = extractAddressSegmentFromStatement(statement);
  if (!segment) return null;

  const parts = parseUsCityStateZip(segment);
  const formattedSingleLine =
    parts.city && parts.state && parts.postalCode
      ? `${parts.street}, ${parts.city}, ${parts.state} ${parts.postalCode}`
      : parts.street;

  return { ...parts, formattedSingleLine };
}


/**
 * A short, human-readable booking reference derived from the opaque QR token,
 * e.g. "RG-AB12CD". Display-only — the QR still encodes the full token.
 */
export function bookingReference(token: string): string {
  return `RG-${token.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

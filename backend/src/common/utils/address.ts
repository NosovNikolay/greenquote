/** Best-effort city label from a free-form installation address. */
export function extractCityFromAddress(address: string | undefined): string | undefined {
  if (address == null || !address.trim()) return undefined;
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;
  const last = parts[parts.length - 1] ?? '';
  const withoutZip = last.replace(/^\d{5}\s+/, '').trim();
  const candidate = withoutZip || last;
  return candidate || undefined;
}

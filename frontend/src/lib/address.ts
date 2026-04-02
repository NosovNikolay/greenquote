export function formatInstallationAddress(
  streetLine: string,
  city: string,
  country: string,
): string {
  return [streetLine, city, country]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

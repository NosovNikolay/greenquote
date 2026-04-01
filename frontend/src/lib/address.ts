/** Single-line label for maps, PDFs, and upstream `installationAddress`. */
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

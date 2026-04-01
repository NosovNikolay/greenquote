/** Convert a EUR decimal amount to integer cents for persistence. */
export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

/** Convert integer cents to a EUR decimal amount. */
export function centsToEur(cents: number): number {
  return Math.round(cents) / 100;
}

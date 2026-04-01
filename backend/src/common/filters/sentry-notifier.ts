/**
 * Hook for error observability (Sentry, Datadog, etc.).
 * Keep this module free of vendor SDKs until you wire one in.
 */
export function notifyErrorReporting(exception: unknown): void {
  void exception;
  // Future: Sentry.captureException(exception, { extra: { path, userId } });
}

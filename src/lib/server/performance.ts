import "server-only";

export function logServerTiming(
  operation: string,
  startedAt: number,
  details: Record<string, string | number | boolean | null> = {},
) {
  console.info(
    JSON.stringify({
      event: "server_timing",
      operation,
      durationMs: Date.now() - startedAt,
      ...details,
    }),
  );
}

export const staleProcessingMinutes = 15;

const retryBackoffMinutes = [0, 5, 30, 120, 720] as const;

export function getNextAttemptAt(attemptCount: number, now = new Date()) {
  const minutes = retryBackoffMinutes[Math.min(Math.max(attemptCount, 0), retryBackoffMinutes.length - 1)] ?? 720;
  return new Date(now.getTime() + minutes * 60 * 1000);
}

export function getStaleProcessingCutoff(now = new Date()) {
  return new Date(now.getTime() - staleProcessingMinutes * 60 * 1000);
}

const limits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const existing = limits.get(key);
  if (!existing || now >= existing.resetAt) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  limits.set(key, existing);
  return true;
}

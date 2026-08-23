function hasUnsafeKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasUnsafeKey);
  return Object.entries(value).some(([key, child]) => key.startsWith('$') || key.includes('.') || hasUnsafeKey(child));
}

export function rejectUnsafePayload(req, res, next) {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return res.status(400).json({ message: 'Invalid request payload' });
  }
  next();
}

const buckets = new Map();
export function simpleRateLimit({ windowMs = 60_000, max = 120 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path.startsWith('/api/ai') ? 'ai' : 'api'}`;
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ message: 'Too many requests' });
    }
    next();
  };
}

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

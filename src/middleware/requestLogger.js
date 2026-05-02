import { logEvent } from '../logger/loggingClient.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    void logEvent({
      stack: 'backend',
      level,
      packageName: 'middleware',
      message: `${req.method} ${req.originalUrl} -> ${res.statusCode} in ${duration}ms`
    });
  });

  next();
}

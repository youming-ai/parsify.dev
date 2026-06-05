type LogMethod = (msg: string, ...args: unknown[]) => void;

export interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
  trace: LogMethod;
}

/** Redact sensitive patterns from log output */
function redact(msg: string): string {
  return msg
    .replace(/(api[_-]?key[=:]\s*)[^\s,}]+/gi, '$1[REDACTED]')
    .replace(/(authorization[=:]\s*)[^\s,}]+/gi, '$1[REDACTED]')
    .replace(/(cookie[=:]\s*)[^\s,}]+/gi, '$1[REDACTED]')
    .replace(/(bearer\s+)[^\s,}]+/gi, '$1[REDACTED]');
}

function createLogger(level: string): Logger {
  const levels = ['trace', 'debug', 'info', 'warn', 'error'];
  const currentIdx = levels.indexOf(level) !== -1 ? levels.indexOf(level) : 2;

  function log(levelName: string, method: 'log' | 'warn' | 'error') {
    const enabled = levels.indexOf(levelName) >= currentIdx;
    return (msg: string, ...args: unknown[]) => {
      if (!enabled) return;
      console[method](`[${levelName.toUpperCase()}]`, redact(msg), ...args);
    };
  }

  return {
    trace: log('trace', 'log'),
    debug: log('debug', 'log'),
    info: log('info', 'log'),
    warn: log('warn', 'warn'),
    error: log('error', 'error'),
  };
}

export const logger = createLogger(
  (() => {
    try {
      return process.env['LOG_LEVEL'] ?? 'info';
    } catch {
      return 'info';
    }
  })()
);

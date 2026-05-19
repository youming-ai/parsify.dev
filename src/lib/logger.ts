type LogMethod = (msg: string, ...args: unknown[]) => void;

export interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
  trace: LogMethod;
}

function createLogger(level: string): Logger {
  const levels = ['trace', 'debug', 'info', 'warn', 'error'];
  const currentIdx = levels.indexOf(level) !== -1 ? levels.indexOf(level) : 2;

  function log(levelName: string, method: 'log' | 'warn' | 'error') {
    const enabled = levels.indexOf(levelName) >= currentIdx;
    return (msg: string, ...args: unknown[]) => {
      if (!enabled) return;
      console[method](`[${levelName.toUpperCase()}]`, msg, ...args);
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

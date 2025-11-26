// logStore.ts - Centralized log storage for backend logs
// Intercepts console.log/error/warn and stores them for API access

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'success';
  message: string;
  source?: string;
}

class LogStore {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private originalConsoleLog: typeof console.log;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;

  constructor() {
    // Store original console methods
    this.originalConsoleLog = console.log.bind(console);
    this.originalConsoleError = console.error.bind(console);
    this.originalConsoleWarn = console.warn.bind(console);

    // Intercept console methods
    this.interceptConsole();
  }

  private interceptConsole() {
    // Intercept console.log
    console.log = (...args: any[]) => {
      const message = this.formatMessage(args);
      this.addLog('info', message);
      this.originalConsoleLog(...args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      const message = this.formatMessage(args);
      this.addLog('error', message);
      this.originalConsoleError(...args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      const message = this.formatMessage(args);
      this.addLog('warn', message);
      this.originalConsoleWarn(...args);
    };
  }

  private formatMessage(args: any[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  private extractSource(message: string): string | undefined {
    // Extract source from log messages like [ParseController], [R2Client], etc.
    const match = message.match(/\[([^\]]+)\]/);
    return match ? match[1] : undefined;
  }

  private addLog(level: LogEntry['level'], message: string) {
    const timestamp = new Date().toISOString();
    const source = this.extractSource(message);

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      source,
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsSince(timestamp: string): LogEntry[] {
    return this.logs.filter((log) => log.timestamp >= timestamp);
  }

  clearLogs() {
    this.logs = [];
  }

  getLogCount(): number {
    return this.logs.length;
  }
}

export const logStore = new LogStore();


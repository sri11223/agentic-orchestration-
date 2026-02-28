/**
 * Production-safe logger utility.
 * In development, logs normally. In production, suppresses debug/info logs.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};

/**
 * Safe JSON parse that never throws.
 */
export function safeJsonParse<T = any>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

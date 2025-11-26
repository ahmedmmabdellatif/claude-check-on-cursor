// safe.ts - Safety helpers to prevent crashes when accessing potentially undefined/missing fields

/**
 * Safely get an array from a value, returning empty array if not an array
 */
export const getArray = <T = any>(v: any): T[] => {
  return Array.isArray(v) ? v : [];
};

/**
 * Safely get a string from a value, returning empty string if not a string
 */
export const getString = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return String(v);
};

/**
 * Safely get a number from a value, returning 0 if not a number
 */
export const getNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Safely get an object from a value, returning empty object if not an object
 */
export const getObject = <T = any>(v: any): T => {
  if (v === null || v === undefined) return {} as T;
  if (typeof v === 'object' && !Array.isArray(v)) return v as T;
  return {} as T;
};

/**
 * Safely get a boolean from a value
 */
export const getBoolean = (v: any): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  if (typeof v === 'number') return v !== 0;
  return Boolean(v);
};

/**
 * Safely access a nested property with dot notation
 */
export const getNested = (obj: any, path: string, defaultValue: any = null): any => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  return current !== undefined ? current : defaultValue;
};


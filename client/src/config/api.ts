const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;
const resolvedBaseUrl =
  rawBaseUrl && rawBaseUrl.trim().length > 0
    ? rawBaseUrl
    : typeof window !== 'undefined'
      ? window.location.origin
      : DEFAULT_API_BASE_URL;

export const API_BASE_URL = resolvedBaseUrl.replace(/\/$/, '');
export const API_URL = `${API_BASE_URL}/api`;

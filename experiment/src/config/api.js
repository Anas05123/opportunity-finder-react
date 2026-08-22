/**
 * Dynamic API Base URL Resolver for Careerly
 * Works seamlessly in:
 * 1. Production deployments (Render, Vercel, Netlify, custom domains) -> uses current origin or relative /api
 * 2. Local network / LAN sharing (e.g. friend accessing via http://192.168.1.x:3100 or http://10.x.x.x:3100) -> uses current hostname:5000 or proxy
 * 3. Vite development on localhost -> proxies /api or hits port 5000
 * 4. Custom VITE_API_URL environment variable if provided
 */

export const getApiBase = () => {
  // If explicitly configured in environment
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // In browser environment
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // When served directly by the production backend or reverse proxy on same port
    if (port === '5000' || (!port && (protocol === 'https:' || protocol === 'http:'))) {
      return '';
    }

    // When accessed via Vite dev server (e.g. port 3100 or 5173), prefer relative path if proxy is active,
    // or fallback to same hostname on backend port 5000
    if (port === '3100' || port === '5173' || port === '4173' || port === '3000') {
      return `${protocol}//${hostname}:5000`;
    }

    // Default to relative path for cloud deployments (e.g. *.onrender.com)
    return '';
  }

  return 'http://localhost:5000';
};

export const API_HOST = getApiBase();
export const API_BASE_URL = `${API_HOST}/api/v1`;
export const API_V3_URL = `${API_HOST}/api/v3`;

export default { API_HOST, API_BASE_URL, API_V3_URL, getApiBase };

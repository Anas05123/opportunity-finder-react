/**
 * Dynamic API Base URL Resolver for Careerly
 * Works seamlessly in:
 * 1. Production deployments (Render, Vercel, Netlify, custom domains) -> uses current origin or relative /api
 * 2. Local network / LAN sharing (e.g. friend accessing via http://192.168.1.x:3100 or http://10.x.x.x:3100) -> uses current hostname:5000 or proxy
 * 3. Vite development on localhost -> proxies /api or hits port 5000
 * 4. Custom VITE_API_URL environment variable if provided
 */

export const getApiBase = () => {
  // 1. Explicitly configured in environment (e.g. Vercel/Netlify pointing to backend)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // 2. In browser environment
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // When running locally on dev server on ANY port (3100, 5173, 5174, 3000, etc.)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\./.test(hostname) || /^10\./.test(hostname)) {
      if (port === '5000') return '';
      return `${protocol}//${hostname}:5000`;
    }

    // When running on Render (backend & frontend served on same origin)
    if (hostname.includes('onrender.com')) {
      return '';
    }

    // When frontend is hosted on Vercel / Netlify / GitHub Pages
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app') || hostname.includes('github.io')) {
      return 'https://opportunity-finder-gsxr.onrender.com';
    }

    // Default same-origin relative
    return '';
  }

  return 'http://localhost:5000';
};

export const API_HOST = getApiBase();
export const API_BASE_URL = `${API_HOST}/api/v1`;
export const API_V3_URL = `${API_HOST}/api/v3`;

export default { API_HOST, API_BASE_URL, API_V3_URL, getApiBase };

/**
 * API Client Configuration
 * Resolves the backend base URL dynamically:
 * - In production on Vercel: reads import.meta.env.VITE_API_URL (e.g. https://msme-creditos-api.onrender.com)
 * - In local development: defaults to http://localhost:5000 or Vite proxy
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Universal fetch wrapper for API requests
 * @param {string} endpoint e.g. '/api/health'
 * @param {RequestInit} options fetch options
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

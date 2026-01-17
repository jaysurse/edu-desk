// Centralized API helper for edu-desk
// Reads base URL from VITE_API_BASE_URL and standardizes error/loading handling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (err) {
    return { success: false, data: null, error: 'Network error' };
  }
  let json;
  try {
    json = await response.json();
  } catch (e) {
    return { success: false, data: null, error: 'Invalid server response' };
  }
  // Always return standardized object
  return {
    success: !!json.success,
    data: json.data ?? null,
    error: json.error ?? (json.success === false ? 'Unknown error' : null),
    status: response.status,
  };
}

export default apiRequest;

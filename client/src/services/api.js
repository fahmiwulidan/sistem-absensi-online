const rawUrl = import.meta.env.VITE_API_URL || '';
// Hapus tanda '/' di akhir URL jika tidak sengaja terisi
const BASE_URL = rawUrl.replace(/\/+$/, '');
const API_BASE = `${BASE_URL}/api`;

/**
 * Helper to get current auth token
 */
export function getToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Universal API request wrapper with JWT authentication
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

// ============================================
// API Modules
// ============================================

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  me: () => apiRequest('/auth/me'),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'PUT', body: data }),
  adminResetPassword: (data) => apiRequest('/auth/admin-reset-password', { method: 'PUT', body: data }),
};

export const dashboardApi = {
  getAdmin: () => apiRequest('/dashboard/admin'),
  getTeacher: () => apiRequest('/dashboard/teacher'),
  getStudent: () => apiRequest('/dashboard/student'),
  getParent: () => apiRequest('/dashboard/parent'),
  getPrincipal: () => apiRequest('/dashboard/principal'),
};

export const studentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/students${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/students/${id}`),
  create: (data) => apiRequest('/students', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/students/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/students/${id}`, { method: 'DELETE' }),
};

export const teachersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/teachers${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/teachers/${id}`),
  create: (data) => apiRequest('/teachers', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/teachers/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/teachers/${id}`, { method: 'DELETE' }),
};

export const parentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/parents${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/parents/${id}`),
  create: (data) => apiRequest('/parents', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/parents/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/parents/${id}`, { method: 'DELETE' }),
};

export const classesApi = {
  getAll: () => apiRequest('/classes'),
  getById: (id) => apiRequest(`/classes/${id}`),
  create: (data) => apiRequest('/classes', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/classes/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/classes/${id}`, { method: 'DELETE' }),
};

export const subjectsApi = {
  getAll: () => apiRequest('/subjects'),
  getById: (id) => apiRequest(`/subjects/${id}`),
  create: (data) => apiRequest('/subjects', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/subjects/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/subjects/${id}`, { method: 'DELETE' }),
};

export const schedulesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/schedules${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/schedules/${id}`),
  create: (data) => apiRequest('/schedules', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/schedules/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/schedules/${id}`, { method: 'DELETE' }),
};

export const attendancesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/attendances${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/attendances/${id}`),
  bulkCreate: (data) => apiRequest('/attendances/bulk', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/attendances/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/attendances/${id}`, { method: 'DELETE' }),
};

export const settingsApi = {
  get: () => apiRequest('/settings'),
  update: (data) => apiRequest('/settings', { method: 'PUT', body: data }),
};

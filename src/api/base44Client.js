const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  return localStorage.getItem('jwt_token');
}

async function request(method, path, data = null) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (data !== null) options.body = JSON.stringify(data);

  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    const err = new Error(errorData.detail || 'Request failed');
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  if (response.status === 204) return null;
  return response.json();
}

function createEntityAPI(resourcePath) {
  return {
    list: (sort, limit) => {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const query = params.toString();
      return request('GET', `/${resourcePath}${query ? `?${query}` : ''}`);
    },
    filter: (filters) => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null))
      );
      return request('GET', `/${resourcePath}?${params.toString()}`);
    },
    get: (id) => request('GET', `/${resourcePath}/${id}`),
    create: (data) => request('POST', `/${resourcePath}`, data),
    update: (id, data) => request('PUT', `/${resourcePath}/${id}`, data),
    delete: (id) => request('DELETE', `/${resourcePath}/${id}`),
  };
}

export const base44 = {
  entities: {
    Clinic: createEntityAPI('clinics'),
    Patient: createEntityAPI('patients'),
    Appointment: createEntityAPI('appointments'),
    Staff: createEntityAPI('staff'),
    TreatmentRecord: createEntityAPI('treatment-records'),
    Course: createEntityAPI('courses'),
    Invoice: createEntityAPI('invoices'),
    Review: createEntityAPI('reviews'),
  },
  auth: {
    me: () => request('GET', '/auth/me'),
    logout: (redirectUrl) => {
      localStorage.removeItem('jwt_token');
      window.location.href = redirectUrl || '/';
    },
    redirectToLogin: (redirectUrl) => {
      const params = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
      window.location.href = `/login${params}`;
    },
  },
};

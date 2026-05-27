/*
  API helper for frontend calls to Django REST framework.
  Centralizes base URL, auth token injection, and error handling.
*/
(function (window) {
  const API_BASE_URL = 'http://127.0.0.1:8000/api/';

  function getAuthToken() {
    return localStorage.getItem('token');
  }

  function getAuthHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Token ${token}` } : {};
  }

  async function parseJsonSafe(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch (error) {
      return text;
    }
  }

  function buildUrl(path) {
    if (!path) {
      return API_BASE_URL;
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return `${API_BASE_URL}${path.replace(/^\//, '')}`;
  }

  function redirectToLogin() {
    if (window.location.pathname !== '/frontend/academy/login.html') {
      window.location.href = '/frontend/academy/login.html';
    }
  }

  async function handleResponse(response) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      redirectToLogin();
      const error = new Error('Unauthorized: authentication required.');
      error.status = 401;
      throw error;
    }

    if (!response.ok) {
      const payload = await parseJsonSafe(response);
      const message = payload && (payload.detail || payload.error || JSON.stringify(payload));
      const error = new Error(message || `HTTP error ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return parseJsonSafe(response);
  }

  async function request(path, options = {}) {
    const url = buildUrl(path);
    const headers = Object.assign(
      {
        'Content-Type': 'application/json',
      },
      getAuthHeaders(),
      options.headers || {}
    );

    const init = Object.assign({}, options, {
      headers,
      credentials: 'same-origin',
    });

    if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
      init.body = JSON.stringify(init.body);
    }

    const response = await fetch(url, init);
    return handleResponse(response);
  }

  const api = {
    API_BASE_URL,
    get: (path, headers = {}) => request(path, { method: 'GET', headers }),
    post: (path, body, headers = {}) => request(path, { method: 'POST', body, headers }),
    put: (path, body, headers = {}) => request(path, { method: 'PUT', body, headers }),
    patch: (path, body, headers = {}) => request(path, { method: 'PATCH', body, headers }),
    delete: (path, headers = {}) => request(path, { method: 'DELETE', headers }),
    getAuthToken,
    setAuthToken: (token) => localStorage.setItem('token', token),
    clearAuthToken: () => localStorage.removeItem('token'),
  };

  window.APIClient = api;
})(window);

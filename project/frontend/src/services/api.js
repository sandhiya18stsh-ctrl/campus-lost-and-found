const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

class ApiService {
  getAuthToken() {
    const token = localStorage.getItem('token')?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return token;
  }

  buildHeaders(body, extraHeaders = {}) {
    const headers = new Headers(extraHeaders);
    const isFormData = body instanceof FormData;

    if (!isFormData && body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  formatErrorMessage(error) {
    const detail = error?.detail ?? error?.message ?? error;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const location = Array.isArray(item.loc) ? item.loc.join('.') : item.loc;
          return location ? `${location}: ${item.msg}` : item.msg;
        })
        .filter(Boolean)
        .join('\n');
    }

    if (detail && typeof detail === 'object') {
      return JSON.stringify(detail);
    }

    return detail || 'An error occurred';
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: this.buildHeaders(options.body, options.headers),
        body: options.body,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(this.formatErrorMessage(error));
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return this.request('/auth/login', {
      method: 'POST',
      body: formData,
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateCurrentUser(userData) {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async uploadProfileAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/auth/me/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteProfileAvatar() {
    return this.request('/auth/me/avatar', {
      method: 'DELETE',
    });
  }

  // Lost Items endpoints
  async getLostItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/lost-items/?${queryString}`);
  }

  async getLostItem(id) {
    return this.request(`/lost-items/${id}`);
  }

  async createLostItem(itemData) {
    return this.request('/lost-items/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateLostItem(id, itemData) {
    return this.request(`/lost-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteLostItem(id) {
    return this.request(`/lost-items/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadLostItemImage(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_primary', 'true');

    return this.request(`/lost-items/${id}/images`, {
      method: 'POST',
      body: formData,
    });
  }

  // Found Items endpoints
  async getFoundItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/found-items/?${queryString}`);
  }

  async getFoundItem(id) {
    return this.request(`/found-items/${id}`);
  }

  async createFoundItem(itemData) {
    return this.request('/found-items/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateFoundItem(id, itemData) {
    return this.request(`/found-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteFoundItem(id) {
    return this.request(`/found-items/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadFoundItemImage(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_primary', 'true');

    return this.request(`/found-items/${id}/images`, {
      method: 'POST',
      body: formData,
    });
  }

  // Claims endpoints
  async getClaims(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/claims/?${queryString}`);
  }

  async getClaimsForFoundItem(foundItemId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const suffix = queryString ? `?${queryString}` : '';
    return this.request(`/claims/by-found-item/${foundItemId}${suffix}`);
  }

  async getMyClaims(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/claims/my-claims?${queryString}`);
  }

  async getClaim(id) {
    return this.request(`/claims/${id}`);
  }

  async createClaim(claimData) {
    return this.request('/claims/', {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  }

  async updateClaim(id, claimData) {
    return this.request(`/claims/${id}`, {
      method: 'PUT',
      body: JSON.stringify(claimData),
    });
  }

  async verifyClaim(id, verificationData) {
    return this.request(`/claims/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  async reviewClaim(id) {
    return this.request(`/claims/${id}/review`, {
      method: 'POST',
    });
  }

  async completeClaim(id) {
    return this.request(`/claims/${id}/complete`, {
      method: 'POST',
    });
  }

  // Notifications endpoints
  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/notifications/?${queryString}`);
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async getNotification(id) {
    return this.request(`/notifications/${id}`);
  }

  async updateNotification(id, updateData) {
    return this.request(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async markAllAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async deleteNotification(id) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories endpoints
  async getCategories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/categories/?${queryString}`);
  }

  async getCategory(id) {
    return this.request(`/categories/${id}`);
  }

  // Locations endpoints
  async getLocations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/locations/?${queryString}`);
  }

  async getLocation(id) {
    return this.request(`/locations/${id}`);
  }

  // Users endpoints (Admin only)
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/?${queryString}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // AI Matching endpoints
  async getMatchesForLostItem(lostItemId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const suffix = queryString ? `?${queryString}` : '';
    return this.request(`/matching/lost-items/${lostItemId}/matches${suffix}`);
  }

  async getMatchesForFoundItem(foundItemId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const suffix = queryString ? `?${queryString}` : '';
    return this.request(`/matching/found-items/${foundItemId}/matches${suffix}`);
  }

  async getAIMatchStats() {
    return this.request('/matching/stats');
  }
}

export const api = new ApiService();

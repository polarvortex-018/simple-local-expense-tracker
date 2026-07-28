const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    let errorMessage = `Error (${response.status}): ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      // Fallback to generic HTTP error message
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export const api = {
  // Transactions
  getTransactions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) {
          val.forEach(item => {
            if (item !== undefined && item !== null && item !== '') {
              query.append(key, item);
            }
          });
        } else {
          query.append(key, val);
        }
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/transactions/${queryString}`);
  },

  getTransactionSummary(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) {
          val.forEach(item => {
            if (item !== undefined && item !== null && item !== '') {
              query.append(key, item);
            }
          });
        } else {
          query.append(key, val);
        }
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/transactions/summary${queryString}`);
  },
  
  createTransaction(payload) {
    return request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  
  updateTransaction(id, payload) {
    return request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  
  deleteTransaction(id) {
    return request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Accounts
  getAccounts() {
    return request('/accounts/');
  },
  
  createAccount(payload) {
    return request('/accounts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateAccount(id, payload) {
    return request(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteAccount(id) {
    return request(`/accounts/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Categories
  getCategories() {
    return request('/categories/');
  },
  
  createCategory(payload) {
    return request('/categories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCategory(id, payload) {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteCategory(id) {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Debts
  getDebts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/debts/${queryString}`);
  },

  createDebt(payload) {
    return request('/debts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  settleDebt(id, payload) {
    return request(`/debts/${id}/settle`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteDebt(id) {
    return request(`/debts/${id}`, {
      method: 'DELETE',
    });
  },

  // Savings Buckets
  getBuckets(includeArchived = false) {
    const query = includeArchived ? '?include_archived=true' : '';
    return request(`/buckets/${query}`);
  },

  createBucket(payload) {
    return request('/buckets/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBucket(id, payload) {
    return request(`/buckets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteBucket(id) {
    return request(`/buckets/${id}`, {
      method: 'DELETE',
    });
  },

  transferBucket(payload) {
    return request('/buckets/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};

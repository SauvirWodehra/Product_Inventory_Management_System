const BASE_URL = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Something went wrong');
  }
  return data;
}

export const api = {
  getProducts: () => request('/products'),
  getVendors: () => request('/vendors'),
  getPurchaseOrders: () => request('/purchase-orders'),
  getPurchaseOrder: (id) => request(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) =>
    request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  approvePurchaseOrder: (id, role) =>
    request(`/purchase-orders/${id}/approve${role ? `?role=${role}` : ''}`, { method: 'POST' }),
  receivePurchaseOrder: (id) =>
    request(`/purchase-orders/${id}/receive`, { method: 'POST' }),
};

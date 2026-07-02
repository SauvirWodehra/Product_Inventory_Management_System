const seed = require('../data/seed');

let products = [];
let vendors = [];
let purchaseOrders = [];

function resetStore() {
  products = seed.products.map((p) => ({ ...p }));
  vendors = seed.vendors.map((v) => ({ ...v }));
  purchaseOrders = [];
}

// Initialize on first load
resetStore();

function getProducts() {
  return products;
}

function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

function updateProductStock(id, quantityToAdd) {
  const product = getProductById(id);
  if (product) {
    product.stock += quantityToAdd;
  }
  return product;
}

function getVendors() {
  return vendors;
}

function getVendorById(id) {
  return vendors.find((v) => v.id === id) || null;
}

function getPurchaseOrders() {
  return purchaseOrders;
}

function getPurchaseOrderById(id) {
  return purchaseOrders.find((po) => po.id === id) || null;
}

function addPurchaseOrder(po) {
  purchaseOrders.push(po);
  return po;
}

function updatePurchaseOrder(id, updates) {
  const po = getPurchaseOrderById(id);
  if (po) {
    Object.assign(po, updates);
  }
  return po;
}

module.exports = {
  getProducts,
  getProductById,
  updateProductStock,
  getVendors,
  getVendorById,
  getPurchaseOrders,
  getPurchaseOrderById,
  addPurchaseOrder,
  updatePurchaseOrder,
  resetStore,
};

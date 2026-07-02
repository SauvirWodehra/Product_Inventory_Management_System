const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

function createPO(vendorId, lineItems) {
  // Validate vendorId
  const vendor = store.getVendorById(vendorId);
  if (!vendor) {
    throw new AppError(`Vendor with id ${vendorId} not found`, 404);
  }

  // Validate lineItems
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw new AppError('At least one line item is required', 400);
  }

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];

    if (!item.productId) {
      throw new AppError(`Line item ${i + 1}: productId is required`, 400);
    }

    const product = store.getProductById(item.productId);
    if (!product) {
      throw new AppError(`Line item ${i + 1}: product with id ${item.productId} not found`, 404);
    }

    if (!item.qty || item.qty <= 0) {
      throw new AppError(`Line item ${i + 1}: qty must be greater than 0`, 400);
    }

    if (!item.unitPrice || item.unitPrice <= 0) {
      throw new AppError(`Line item ${i + 1}: unitPrice must be greater than 0`, 400);
    }
  }

  // Compute total
  const total = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  // Generate PO id
  const id = 'PO-' + uuidv4().substring(0, 8);

  const po = {
    id,
    vendorId,
    lineItems: lineItems.map((item) => ({
      productId: item.productId,
      qty: item.qty,
      unitPrice: item.unitPrice,
    })),
    total,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  store.addPurchaseOrder(po);
  return po;
}

function approvePO(poId, role) {
  const po = store.getPurchaseOrderById(poId);
  if (!po) {
    throw new AppError(`Purchase order ${poId} not found`, 404);
  }

  if (po.status !== 'draft') {
    throw new AppError(
      `Purchase order can only be approved when in draft status. Current status: ${po.status}`,
      400
    );
  }

  // Manager approval required for POs over $5000
  if (po.total > 5000 && role !== 'manager') {
    throw new AppError(
      'Purchase orders exceeding $5,000 require manager approval. Please use ?role=manager',
      403
    );
  }

  store.updatePurchaseOrder(poId, { status: 'approved' });
  return store.getPurchaseOrderById(poId);
}

function receivePO(poId) {
  const po = store.getPurchaseOrderById(poId);
  if (!po) {
    throw new AppError(`Purchase order ${poId} not found`, 404);
  }

  if (po.status !== 'approved') {
    throw new AppError(
      `Purchase order can only be received when in approved status. Current status: ${po.status}`,
      400
    );
  }

  // Update stock for each line item
  for (const item of po.lineItems) {
    store.updateProductStock(item.productId, item.qty);
  }

  store.updatePurchaseOrder(poId, { status: 'received' });
  return store.getPurchaseOrderById(poId);
}

module.exports = { createPO, approvePO, receivePO, AppError };

import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

// ─── Create PO Modal ──────────────────────────────────────────────
function CreatePOModal({ isOpen, onClose, onCreated, vendors, products }) {
  const { showToast } = useToast();
  const [vendorId, setVendorId] = useState('');
  const [lineItems, setLineItems] = useState([
    { productId: '', quantity: '', unitPrice: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setVendorId('');
    setLineItems([{ productId: '', quantity: '', unitPrice: '' }]);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: '', unitPrice: '' }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index, field, value) => {
    const updated = lineItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setLineItems(updated);
  };

  const computedTotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const validate = () => {
    if (!vendorId) {
      showToast('Please select a vendor', 'error');
      return false;
    }
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.productId) {
        showToast(`Line item ${i + 1}: Please select a product`, 'error');
        return false;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        showToast(`Line item ${i + 1}: Quantity must be greater than 0`, 'error');
        return false;
      }
      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
        showToast(`Line item ${i + 1}: Unit price must be greater than 0`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        vendorId: parseInt(vendorId),
        lineItems: lineItems.map((item) => ({
          productId: parseInt(item.productId),
          qty: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
      };
      await api.createPurchaseOrder(payload);
      showToast('Purchase order created successfully', 'success');
      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="create-po-overlay" className="fixed inset-0 z-40 flex items-start justify-center pt-10 px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        id="create-po-modal"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto z-50"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Create Purchase Order</h2>
            <button
              id="create-po-close-btn"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vendor Selection */}
          <div>
            <label htmlFor="create-po-vendor" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <select
              id="create-po-vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            >
              <option value="">Select a vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Line Items</label>
              <button
                id="create-po-add-line-btn"
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Line Item
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  id={`create-po-line-item-${index}`}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Item {index + 1}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        id={`create-po-remove-line-btn-${index}`}
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                      <select
                        id={`create-po-product-${index}`}
                        value={item.productId}
                        onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="">Select...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                      <input
                        id={`create-po-quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                      <input
                        id={`create-po-unit-price-${index}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Computed Total */}
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-indigo-700">Estimated Total</span>
            <span id="create-po-total" className="text-lg font-semibold text-indigo-900">
              ${computedTotal.toFixed(2)}
            </span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              id="create-po-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="create-po-submit-btn"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PO Detail Modal ──────────────────────────────────────────────
function PODetailModal({ po, isOpen, onClose, onAction }) {
  const { showToast } = useToast();
  const [approveAsManager, setApproveAsManager] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  if (!isOpen || !po) return null;

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      const role = approveAsManager ? 'manager' : undefined;
      await api.approvePurchaseOrder(po.id, role);
      showToast('Purchase order approved successfully', 'success');
      onAction();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceive = async () => {
    setActionLoading('receive');
    try {
      await api.receivePurchaseOrder(po.id);
      showToast('Purchase order received — inventory updated', 'success');
      onAction();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const total =
    po.total ??
    po.lineItems?.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) ??
    0;

  const isHighValue = total >= 5000;

  return (
    <div id="po-detail-overlay" className="fixed inset-0 z-40 flex items-start justify-center pt-10 px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        id="po-detail-modal"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto z-50"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Purchase Order #{po.id}
              </h2>
              <StatusBadge status={po.status} />
            </div>
            <button
              id="po-detail-close-btn"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* PO Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Vendor</span>
              <p id="po-detail-vendor" className="text-sm font-medium text-gray-900 mt-1">
                {po.vendor?.name || po.vendorName || `Vendor #${po.vendorId}`}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Created</span>
              <p id="po-detail-date" className="text-sm font-medium text-gray-900 mt-1">
                {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Total</span>
              <p id="po-detail-total" className="text-sm font-semibold text-gray-900 mt-1">
                ${Number(total).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table id="po-detail-items-table" className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {po.lineItems?.map((item, idx) => (
                    <tr key={idx} id={`po-detail-item-row-${idx}`}>
                      <td className="px-4 py-2.5 text-sm text-gray-900">
                        {item.product?.name || item.productName || `Product #${item.productId}`}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700 text-right">
                        {item.qty}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700 text-right">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900 text-right">
                        ${(item.qty * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">
                      Total
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900 text-right">
                      ${Number(total).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          {(po.status === 'draft' || po.status === 'approved') && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {po.status === 'draft' && (
                <div>
                  {isHighValue && (
                    <label
                      id="po-detail-manager-toggle"
                      className="flex items-center gap-2 mb-3 cursor-pointer"
                    >
                      <input
                        id="po-detail-manager-checkbox"
                        type="checkbox"
                        checked={approveAsManager}
                        onChange={(e) => setApproveAsManager(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        Approve as Manager{' '}
                        <span className="text-xs text-gray-400">(required for POs ≥ $5,000)</span>
                      </span>
                    </label>
                  )}
                  <button
                    id="po-detail-approve-btn"
                    onClick={handleApprove}
                    disabled={actionLoading !== null}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'approve' ? 'Approving...' : 'Approve Purchase Order'}
                  </button>
                </div>
              )}
              {po.status === 'approved' && (
                <button
                  id="po-detail-receive-btn"
                  onClick={handleReceive}
                  disabled={actionLoading !== null}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === 'receive' ? 'Receiving...' : 'Mark as Received'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  const { showToast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [inlineActionLoading, setInlineActionLoading] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [posData, vendorsData, productsData] = await Promise.all([
        api.getPurchaseOrders(),
        api.getVendors(),
        api.getProducts(),
      ]);
      setPurchaseOrders(posData);
      setVendors(vendorsData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleViewDetail = async (po) => {
    try {
      const detail = await api.getPurchaseOrder(po.id);
      setSelectedPO(detail);
      setShowDetailModal(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleInlineApprove = async (e, po) => {
    e.stopPropagation();
    setInlineActionLoading(`approve-${po.id}`);
    try {
      await api.approvePurchaseOrder(po.id);
      showToast('Purchase order approved', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setInlineActionLoading(null);
    }
  };

  const handleInlineReceive = async (e, po) => {
    e.stopPropagation();
    setInlineActionLoading(`receive-${po.id}`);
    try {
      await api.receivePurchaseOrder(po.id);
      showToast('Purchase order received — inventory updated', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setInlineActionLoading(null);
    }
  };

  const getTotal = (po) => {
    if (po.total != null) return Number(po.total);
    if (po.lineItems) return po.lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    return 0;
  };

  return (
    <div id="purchase-orders-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 id="po-title" className="text-2xl font-semibold text-gray-900">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage purchase orders, approvals, and receiving
          </p>
        </div>
        <button
          id="create-po-open-btn"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Purchase Order
        </button>
      </div>

      {loading && <Spinner />}

      {error && !loading && (
        <div id="po-error" className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-medium">Failed to load purchase orders</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={fetchAll}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table id="po-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No purchase orders found. Create your first one!
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po, index) => (
                  <tr
                    key={po.id}
                    id={`po-row-${po.id}`}
                    onClick={() => handleViewDetail(po)}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-indigo-50/30 cursor-pointer transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-indigo-600">#{po.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {po.vendor?.name || po.vendorName || `Vendor #${po.vendorId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ${getTotal(po).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {po.status === 'draft' && (
                          <button
                            id={`po-approve-btn-${po.id}`}
                            onClick={(e) => handleInlineApprove(e, po)}
                            disabled={inlineActionLoading === `approve-${po.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                          >
                            {inlineActionLoading === `approve-${po.id}` ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        {po.status === 'approved' && (
                          <button
                            id={`po-receive-btn-${po.id}`}
                            onClick={(e) => handleInlineReceive(e, po)}
                            disabled={inlineActionLoading === `receive-${po.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            {inlineActionLoading === `receive-${po.id}` ? 'Receiving...' : 'Receive'}
                          </button>
                        )}
                        <button
                          id={`po-view-btn-${po.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(po);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create PO Modal */}
      <CreatePOModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchAll}
        vendors={vendors}
        products={products}
      />

      {/* PO Detail Modal */}
      <PODetailModal
        po={selectedPO}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPO(null);
        }}
        onAction={fetchAll}
      />
    </div>
  );
}

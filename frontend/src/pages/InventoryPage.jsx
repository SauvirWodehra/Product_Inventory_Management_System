import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getStockColor = (stock) => {
    if (stock < 50) return 'text-red-600 bg-red-50';
    if (stock < 100) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockLabel = (stock) => {
    if (stock < 50) return 'Low';
    if (stock < 100) return 'Medium';
    return 'Good';
  };

  return (
    <div id="inventory-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 id="inventory-title" className="text-2xl font-semibold text-gray-900">
            Products &amp; Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track stock levels across all products
          </p>
        </div>
        <button
          id="inventory-refresh-btn"
          onClick={fetchProducts}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading && <Spinner />}

      {error && !loading && (
        <div id="inventory-error" className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-medium">Failed to load products</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table id="inventory-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr
                    key={product.id}
                    id={`product-row-${product.id}`}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50/30 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {product.sku}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStockColor(product.stock)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.stock < 50
                              ? 'bg-red-500'
                              : product.stock < 100
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        {getStockLabel(product.stock)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

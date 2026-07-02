import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;

  return (
    <nav id="main-navbar" className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" id="navbar-logo" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SG</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">SimpleGrid</span>
            </NavLink>
            <div className="flex items-center gap-1">
              <NavLink to="/" end id="nav-link-inventory" className={linkClass}>
                Inventory
              </NavLink>
              <NavLink to="/purchase-orders" id="nav-link-purchase-orders" className={linkClass}>
                Purchase Orders
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Package, TrendingUp, ShoppingCart, FileText, Grid3x3 } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Varieties from './pages/Varieties';
import SupplierInventory from './pages/SupplierInventory';
import SupplierReturns from './pages/SupplierReturns';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import AnalyticsDashboard from './pages/AnalyticsDashboard'
// import PredictionsDashboard from './pages/PredictionsDashboard';
// import ProductDemandPredictor from './pages/ProductDemandPredictor';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/varieties', icon: Grid3x3, label: 'Varieties' },
    { path: '/supplier-inventory', icon: Package, label: 'Inventory' },
    { path: '/supplier-returns', icon: TrendingUp, label: 'Returns' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/AnalyticsDashboard', icon: FileText, label: 'AnalyticsDashboard' },
    // { path: '/PredictionsDashboard', icon: FileText, label: 'PredictionsDashboard' },
    // { path: '/ProductDemandPredictor', icon: FileText, label: 'ProductDemandPredictor' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">Cloth Shop</h1>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/varieties" element={<Varieties />} />
              <Route path="/supplier-inventory" element={<SupplierInventory />} />
              <Route path="/supplier-returns" element={<SupplierReturns />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/AnalyticsDashboard" element={<AnalyticsDashboard />} />
              {/* <Route path="/PredictionsDashboard" element={<PredictionsDashboard />} />
              <Route path="/ProductDemandPredictor" element={<ProductDemandPredictor />} /> */}
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
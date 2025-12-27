import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Package, TrendingUp, ShoppingCart, FileText, Grid3x3, BarChart3 } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Varieties from './pages/Varieties';
import SupplierInventory from './pages/SupplierInventory';
import SupplierReturns from './pages/SupplierReturns';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import PredictionsDashboard from './components/PredictionsDashboard'; 
import ProductDemandPredictor from './components/ProductDemandPredictor';
import AIChatbot from './components/AIChatbot'

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/varieties', icon: Grid3x3, label: 'Varieties' },
    { path: '/supplier-inventory', icon: Package, label: 'Inventory' },
    { path: '/supplier-returns', icon: TrendingUp, label: 'Returns' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
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
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Top Navigation Bar with Buttons */}
            <Navigation />
            
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/varieties" element={<Varieties />} />
                  <Route path="/supplier-inventory" element={<SupplierInventory />} />
                  <Route path="/supplier-returns" element={<SupplierReturns />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/ProductDemandPredictor" element={<ProductDemandPredictor />} />
                  <Route path="/PredictionsDashboard" element={<PredictionsDashboard />} />
                  <Route path="/AIChatbot" element={<AIChatbot />} />
                  
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
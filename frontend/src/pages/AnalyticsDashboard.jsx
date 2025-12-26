import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Award, AlertCircle } from 'lucide-react';

// Real API integration
const API_BASE_URL = 'http://localhost:8000';

const getDateRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

const fetchRealAnalytics = async (days) => {
  try {
    const { startDate, endDate } = getDateRange(days);
    
    // Fetch all data in parallel
    const [salesRes, inventoryRes, returnsRes, varietiesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sales/`),
      fetch(`${API_BASE_URL}/supplier/inventory`),
      fetch(`${API_BASE_URL}/supplier/returns`),
      fetch(`${API_BASE_URL}/varieties/`)
    ]);

    if (!salesRes.ok || !inventoryRes.ok || !returnsRes.ok || !varietiesRes.ok) {
      throw new Error('Failed to fetch data');
    }

    const [allSales, allInventory, allReturns, varieties] = await Promise.all([
      salesRes.json(),
      inventoryRes.json(),
      returnsRes.json(),
      varietiesRes.json()
    ]);

    // Filter by date range
    const sales = allSales.filter(s => {
      const date = new Date(s.sale_date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    const inventory = allInventory.filter(i => {
      const date = new Date(i.supply_date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    const returns = allReturns.filter(r => {
      const date = new Date(r.return_date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    // Calculate KPIs
    const totalRevenue = sales.reduce((sum, sale) => 
      sum + parseFloat(sale.selling_price) * sale.quantity, 0
    );
    
    const totalProfit = sales.reduce((sum, sale) => 
      sum + parseFloat(sale.profit), 0
    );
    
    const totalSales = sales.length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Calculate growth rate
    const midDate = new Date(startDate);
    midDate.setDate(midDate.getDate() + Math.floor(days / 2));
    
    const firstHalfSales = sales.filter(s => new Date(s.sale_date) < midDate);
    const secondHalfSales = sales.filter(s => new Date(s.sale_date) >= midDate);
    
    const firstHalfRevenue = firstHalfSales.reduce((sum, s) => 
      sum + parseFloat(s.selling_price) * s.quantity, 0
    );
    const secondHalfRevenue = secondHalfSales.reduce((sum, s) => 
      sum + parseFloat(s.selling_price) * s.quantity, 0
    );
    
    const growthRate = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;

    // Generate sales trend data
    const salesByDate = {};
    sales.forEach(sale => {
      const date = new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, profit: 0, sales: 0 };
      }
      salesByDate[date].revenue += parseFloat(sale.selling_price) * sale.quantity;
      salesByDate[date].profit += parseFloat(sale.profit);
      salesByDate[date].sales += 1;
    });
    
    const salesData = Object.values(salesByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate top products
    const productStats = {};
    sales.forEach(sale => {
      const variety = varieties.find(v => v.id === sale.variety_id);
      const name = variety ? variety.name : `Product ${sale.variety_id}`;
      
      if (!productStats[name]) {
        productStats[name] = { name, revenue: 0, profit: 0, quantity: 0, margin: 0 };
      }
      
      const revenue = parseFloat(sale.selling_price) * sale.quantity;
      const profit = parseFloat(sale.profit);
      
      productStats[name].revenue += revenue;
      productStats[name].profit += profit;
      productStats[name].quantity += sale.quantity;
    });
    
    Object.values(productStats).forEach(product => {
      product.margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
    });
    
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate supplier performance
    const supplierStats = {};
    
    inventory.forEach(inv => {
      const name = inv.supplier_name;
      if (!supplierStats[name]) {
        supplierStats[name] = { name, totalSupply: 0, returns: 0, netAmount: 0, reliability: 0 };
      }
      supplierStats[name].totalSupply += parseFloat(inv.total_amount);
    });
    
    returns.forEach(ret => {
      const name = ret.supplier_name;
      if (!supplierStats[name]) {
        supplierStats[name] = { name, totalSupply: 0, returns: 0, netAmount: 0, reliability: 0 };
      }
      supplierStats[name].returns += parseFloat(ret.total_amount);
    });
    
    Object.values(supplierStats).forEach(supplier => {
      supplier.netAmount = supplier.totalSupply - supplier.returns;
      supplier.reliability = supplier.totalSupply > 0 
        ? ((supplier.totalSupply - supplier.returns) / supplier.totalSupply) * 100 
        : 100;
    });
    
    const suppliers = Object.values(supplierStats)
      .sort((a, b) => b.netAmount - a.netAmount)
      .slice(0, 5);

    // Calculate product mix
    const totalRevenueByProduct = topProducts.reduce((sum, p) => sum + p.revenue, 0);
    const productMix = topProducts.map(product => ({
      name: product.name,
      value: totalRevenueByProduct > 0 ? (product.revenue / totalRevenueByProduct) * 100 : 0,
      amount: product.revenue
    }));

    const topProduct = topProducts.length > 0 ? topProducts[0] : null;
    const topProductShare = topProduct && totalRevenue > 0 ? (topProduct.revenue / totalRevenue) * 100 : 0;

    return {
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        totalProfit: Math.round(totalProfit),
        totalSales,
        avgOrderValue: Math.round(avgOrderValue),
        growthRate: parseFloat(growthRate.toFixed(1)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        topProduct: topProduct ? topProduct.name : 'N/A',
        topProductShare: parseFloat(topProductShare.toFixed(1))
      },
      salesData,
      topProducts,
      suppliers,
      productMix
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRealAnalytics(timeRange);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics data. Please check if the API is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-red-200 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Error Loading Data</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#6e647a', '#ba77b2', '#8dba77', '#2f6933', '#735945'];

  const KPICard = ({ title, value, subtitle, icon: Icon, trend, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend !== null && trend !== undefined && (
        <div className="mt-4 flex items-center">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time business insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  timeRange === days ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Revenue"
            value={`₹${(analytics.kpis.totalRevenue / 1000).toFixed(1)}K`}
            subtitle={`${analytics.kpis.totalSales} transactions`}
            icon={DollarSign}
            trend={analytics.kpis.growthRate}
            color="bg-gray-400"
          />
          <KPICard
            title="Total Profit"
            value={`₹${(analytics.kpis.totalProfit / 1000).toFixed(1)}K`}
            subtitle={`${analytics.kpis.profitMargin.toFixed(1)}% margin`}
            icon={TrendingUp}
            trend={null}
            color="bg-gray-400"
          />
          <KPICard
            title="Orders"
            value={analytics.kpis.totalSales}
            subtitle={`₹${analytics.kpis.avgOrderValue} avg value`}
            icon={ShoppingCart}
            trend={null}
            color="bg-gray-400"
          />
          <KPICard
            title="Top Product"
            value={analytics.kpis.topProduct}
            subtitle={`${analytics.kpis.topProductShare.toFixed(1)}% of sales`}
            icon={Award}
            color="bg-gray-400"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sales Trend</h2>
          {analytics.salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#765496" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#765496" strokeWidth={2} name="Revenue (₹)" />
                <Line type="monotone" dataKey="profit" stroke="#bf5095" strokeWidth={2} name="Profit (₹)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No sales data available for this period</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Product</h2>
            {analytics.productMix.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.productMix}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {analytics.productMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`₹${props.payload.amount.toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No product data available</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Products by Revenue</h2>
            {analytics.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe394" />
                  <XAxis type="number" stroke="#dfe394" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="name" type="category" stroke="#aaad68" style={{ fontSize: '12px' }} width={100} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#aaad68" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No product data available</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Product Performance</h2>
            </div>
            <div className="overflow-x-auto">
              {analytics.topProducts.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.topProducts.map((product, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: COLORS[idx] }}></div>
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ₹{product.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-600">{product.margin.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-8">No product data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Supplier Reliability</h2>
            </div>
            <div className="overflow-x-auto">
              {analytics.suppliers.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Net Supply</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Reliability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.suppliers.map((supplier, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-bold text-gray-600">{supplier.name.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{supplier.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ₹{(supplier.netAmount / 1000).toFixed(0)}K
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-gray-600 h-2 rounded-full" style={{ width: `${supplier.reliability}%` }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{supplier.reliability.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-8">No supplier data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
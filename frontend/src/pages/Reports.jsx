import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign, Users, Award, Package, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }
};

export default function Reports() {
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'range'
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // For range view
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [dailyReport, setDailyReport] = useState(null);
  const [profitReport, setProfitReport] = useState(null);
  const [rangeReport, setRangeReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyReports();
    } else {
      loadRangeReport();
    }
  }, [date, startDate, endDate, viewMode]);

  const loadDailyReports = async () => {
    setLoading(true);
    try {
      const [dailyRes, profitRes] = await Promise.all([
        api.get(`/reports/daily/${date}`),
        api.get(`/reports/profit/${date}`)
      ]);
      setDailyReport(dailyRes);
      setProfitReport(profitRes);
    } catch (error) {
      console.error('Error loading reports:', error);
      setDailyReport(null);
      setProfitReport(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRangeReport = async () => {
    setLoading(true);
    try {
      const [allSales, allInventory, allReturns] = await Promise.all([
        api.get('/sales/'),
        api.get('/supplier/inventory'),
        api.get('/supplier/returns')
      ]);

      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      });

      const filteredInventory = allInventory.filter(inv => {
        const invDate = new Date(inv.supply_date);
        return invDate >= new Date(startDate) && invDate <= new Date(endDate);
      });

      const filteredReturns = allReturns.filter(ret => {
        const retDate = new Date(ret.return_date);
        return retDate >= new Date(startDate) && retDate <= new Date(endDate);
      });

      const totalRevenue = filteredSales.reduce((sum, sale) =>
        sum + (parseFloat(sale.selling_price) * sale.quantity), 0
      );

      const totalProfit = filteredSales.reduce((sum, sale) =>
        sum + parseFloat(sale.profit), 0
      );

      const totalItemsSold = filteredSales.reduce((sum, sale) =>
        sum + sale.quantity, 0
      );

      const totalSupply = filteredInventory.reduce((sum, inv) =>
        sum + parseFloat(inv.total_amount), 0
      );

      const totalReturns = filteredReturns.reduce((sum, ret) =>
        sum + parseFloat(ret.total_amount), 0
      );

      const salesBySalesperson = filteredSales.reduce((acc, sale) => {
        const name = sale.salesperson_name;
        if (!acc[name]) {
          acc[name] = {
            name,
            revenue: 0,
            profit: 0,
            transactions: 0,
            itemsSold: 0
          };
        }
        acc[name].revenue += parseFloat(sale.selling_price) * sale.quantity;
        acc[name].profit += parseFloat(sale.profit);
        acc[name].transactions += 1;
        acc[name].itemsSold += sale.quantity;
        return acc;
      }, {});

      const salespersonData = Object.values(salesBySalesperson)
        .sort((a, b) => b.revenue - a.revenue);

      const productStats = filteredSales.reduce((acc, sale) => {
        const varietyName = sale.variety?.name || `Product ${sale.variety_id}`;
        if (!acc[varietyName]) {
          acc[varietyName] = {
            name: varietyName,
            revenue: 0,
            profit: 0,
            quantity: 0
          };
        }
        acc[varietyName].revenue += parseFloat(sale.selling_price) * sale.quantity;
        acc[varietyName].profit += parseFloat(sale.profit);
        acc[varietyName].quantity += sale.quantity;
        return acc;
      }, {});

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const dailyBreakdown = filteredSales.reduce((acc, sale) => {
        const date = sale.sale_date;
        if (!acc[date]) {
          acc[date] = {
            date,
            revenue: 0,
            profit: 0,
            transactions: 0
          };
        }
        acc[date].revenue += parseFloat(sale.selling_price) * sale.quantity;
        acc[date].profit += parseFloat(sale.profit);
        acc[date].transactions += 1;
        return acc;
      }, {});

      const dailyData = Object.values(dailyBreakdown)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setRangeReport({
        summary: {
          totalRevenue,
          totalProfit,
          totalItemsSold,
          transactionCount: filteredSales.length,
          avgTransactionValue: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0,
          profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
          totalSupply,
          totalReturns,
          netSupply: totalSupply - totalReturns
        },
        salespersonData,
        topProducts,
        dailyData
      });

    } catch (error) {
      console.error('Error loading range report:', error);
      setRangeReport(null);
    } finally {
      setLoading(false);
    }
  };

  const setLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setViewMode('range');
  };

  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    setViewMode('range');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-600 mt-1">View daily or range-based business reports</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'daily' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('range')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'range' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Range
            </button>
          </div>

          {/* Quick Actions */}
          {viewMode === 'range' && (
            <div className="flex gap-2">
              <button
                onClick={setLast30Days}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg
             hover:bg-slate-700 transition font-medium text-sm
             shadow-sm active:scale-95"
              >
                Last 30 Days
              </button>

              <button
                onClick={setThisMonth}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                This Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Selector */}
      {viewMode === 'daily' ? (
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-600" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
              />
            </div>
            <div className="flex-1 min-w-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* Daily Report View */}
      {viewMode === 'daily' && dailyReport && dailyReport.supplier_summary && dailyReport.sales_summary && (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* Supplier Net */}
            <div className="card p-4 hover:shadow-md transition rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Supplier Net</h3>
                <DollarSign size={20} className="text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(dailyReport.supplier_summary.net_amount).toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>Supply: ₹{parseFloat(dailyReport.supplier_summary.total_supply).toFixed(2)}</div>
                <div>Returns: ₹{parseFloat(dailyReport.supplier_summary.total_returns).toFixed(2)}</div>
              </div>
            </div>

            {/* Total Sales */}
            <div className="card p-4 hover:shadow-md transition rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
                <TrendingUp size={20} className="text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(dailyReport.sales_summary.total_sales_amount).toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>Items Sold: {dailyReport.sales_summary.total_quantity_sold}</div>
                <div>Transactions: {dailyReport.sales_summary.sales_count}</div>
              </div>
            </div>

            {/* Total Profit */}
            <div className="card p-4 hover:shadow-md transition rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Profit</h3>
                <TrendingUp size={20} className="text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-teal-700">
                ₹{parseFloat(dailyReport.sales_summary.total_profit).toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                Profit Margin:{' '}
                {dailyReport.sales_summary.total_sales_amount > 0
                  ? (
                    (parseFloat(dailyReport.sales_summary.total_profit) /
                      parseFloat(dailyReport.sales_summary.total_sales_amount)) *
                    100
                  ).toFixed(1)
                  : '0'}
                %
              </div>
            </div>
          </div>

          {/* Summary Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Supplier Summary */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Supply</span>
                  <span className="font-semibold text-slate-700">
                    ₹{parseFloat(dailyReport.supplier_summary.total_supply).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Supply Records</span>
                  <span className="font-semibold">{dailyReport.supplier_summary.supply_count}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Returns</span>
                  <span className="font-semibold text-rose-600">
                    ₹{parseFloat(dailyReport.supplier_summary.total_returns).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Return Records</span>
                  <span className="font-semibold">{dailyReport.supplier_summary.return_count}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-800 font-semibold">Net Amount</span>
                  <span className="font-bold text-lg text-slate-800">
                    ₹{parseFloat(dailyReport.supplier_summary.net_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Sales Amount</span>
                  <span className="font-semibold text-slate-700">
                    ₹{parseFloat(dailyReport.sales_summary.total_sales_amount).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-semibold">{dailyReport.sales_summary.sales_count}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Items Sold</span>
                  <span className="font-semibold">{dailyReport.sales_summary.total_quantity_sold}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Average Sale</span>
                  <span className="font-semibold">
                    ₹{dailyReport.sales_summary.sales_count > 0
                      ? (
                        parseFloat(dailyReport.sales_summary.total_sales_amount) /
                        dailyReport.sales_summary.sales_count
                      ).toFixed(2)
                      : '0.00'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-800 font-semibold">Total Profit</span>
                  <span className="font-bold text-lg text-teal-700">
                    ₹{parseFloat(dailyReport.sales_summary.total_profit).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Lists */}
          {profitReport && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Profit by Variety */}
              {profitReport.profit_by_variety?.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit by Variety</h3>
                  <div className="space-y-2">
                    {profitReport.profit_by_variety.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">Variety ID: {item.variety_id}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({item.total_quantity} items)
                          </span>
                        </div>
                        <span className="font-semibold text-teal-700">
                          ₹{parseFloat(item.total_profit).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profit by Salesperson */}
              {profitReport.profit_by_salesperson?.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit by Salesperson</h3>
                  <div className="space-y-2">
                    {profitReport.profit_by_salesperson.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.salesperson_name}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({item.total_quantity} items)
                          </span>
                        </div>
                        <span className="font-semibold text-teal-700">
                          ₹{parseFloat(item.total_profit).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}


{/* Range Report View */}
{viewMode === 'range' && rangeReport && (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

      {/* Total Revenue */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">
              ₹{(rangeReport.summary.totalRevenue / 1000).toFixed(1)}K
            </h3>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-slate-600" />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {rangeReport.summary.transactionCount} transactions
        </p>
      </div>

      {/* Total Profit */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Profit</p>
            <h3 className="text-3xl font-bold text-emerald-700 mt-1">
              ₹{(rangeReport.summary.totalProfit / 1000).toFixed(1)}K
            </h3>
          </div>
          <div className="p-3 bg-emerald-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-emerald-700" />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {rangeReport.summary.profitMargin.toFixed(1)}% margin
        </p>
      </div>

      {/* Items Sold */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Items Sold</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">
              {rangeReport.summary.totalItemsSold}
            </h3>
          </div>
          <div className="p-3 bg-indigo-100 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Avg: ₹{rangeReport.summary.avgTransactionValue.toFixed(0)}/sale
        </p>
      </div>

      {/* Net Supply */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Net Supply</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">
              ₹{(rangeReport.summary.netSupply / 1000).toFixed(1)}K
            </h3>
          </div>
          <div className="p-3 bg-amber-100 rounded-lg">
            <Package className="w-6 h-6 text-amber-700" />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Supply − Returns
        </p>
      </div>

    </div>

    {/* Salesperson Performance */}
    {rangeReport.salespersonData.length > 0 && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-slate-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Salesperson Performance
              </h2>
              <p className="text-sm text-gray-600">
                Individual contributions for selected period
              </p>
            </div>
          </div>
        </div>


              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Transactions</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Items Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Profit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Avg/Transaction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rangeReport.salespersonData.map((person, idx) => (
                      <tr key={idx} className={`hover:bg-gray-50 transition ${idx === 0 ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-blue-500' : 'bg-gray-300'
                              }`}>
                              <span className="text-sm font-semibold text-white">
                                {person.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{person.name}</p>
                              {idx === 0 && (
                                <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                                  <Award size={12} /> Top Performer
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {person.transactions}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{person.itemsSold}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{person.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-green-600">
                            ₹{person.profit.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-gray-700">
                            ₹{(person.revenue / person.transactions).toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rangeReport.topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
                <p className="text-sm text-gray-600">Best selling items by revenue</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rangeReport.topProducts.map((product, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-500' :
                            idx === 1 ? 'bg-gray-400' :
                              idx === 2 ? 'bg-orange-400' : 'bg-gray-300'
                            }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{product.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{product.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-green-600">
                            ₹{product.profit.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rangeReport.dailyData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Daily Breakdown</h2>
                <p className="text-sm text-gray-600">Day-by-day performance</p>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Transactions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rangeReport.dailyData.map((day, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {day.transactions}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{day.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-green-600">
                            ₹{day.profit.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty States */}
      {viewMode === 'daily' && (!dailyReport || !dailyReport.supplier_summary || !dailyReport.sales_summary) && !loading && (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No data available for this date</p>
          <p className="text-sm text-gray-400">Add some transactions to see the report</p>
        </div>
      )}

      {viewMode === 'range' && !rangeReport && !loading && (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No data available for this period</p>
          <p className="text-sm text-gray-400">Select a date range with transactions</p>
        </div>
      )}
    </div>
  );
}
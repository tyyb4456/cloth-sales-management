import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { getDailyReport, getProfitReport } from '../api/api';

export default function Reports() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dailyReport, setDailyReport] = useState(null);
  const [profitReport, setProfitReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [date]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [dailyRes, profitRes] = await Promise.all([
        getDailyReport(date),
        getProfitReport(date)
      ]);
      setDailyReport(dailyRes.data);
      setProfitReport(profitRes.data);
    } catch (error) {
      console.error('Error loading reports:', error);
      setDailyReport(null);
      setProfitReport(null);
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-3xl font-bold text-gray-800">Reports</h2>
        <div className="flex items-center gap-2 mb-6">
          <Calendar size={18} className="text-gray-600" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-auto px-3 py-2 border border-gray-300 rounded-lg
               focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
          />
        </div>

      </div>

      {dailyReport && dailyReport.supplier_summary && dailyReport.sales_summary && (
        <>
          {/* Daily Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/** Supplier Net */}
            <div className="card p-4 hover:shadow-lg transition rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Supplier Net</h3>
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(dailyReport.supplier_summary.net_amount).toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>Supply: ₹{parseFloat(dailyReport.supplier_summary.total_supply).toFixed(2)}</div>
                <div>Returns: ₹{parseFloat(dailyReport.supplier_summary.total_returns).toFixed(2)}</div>
              </div>
            </div>

            {/** Total Sales */}
            <div className="card p-4 hover:shadow-lg transition rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(dailyReport.sales_summary.total_sales_amount).toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>Items Sold: {dailyReport.sales_summary.total_quantity_sold}</div>
                <div>Transactions: {dailyReport.sales_summary.sales_count}</div>
              </div>
            </div>

            {/** Total Profit */}
            <div className="card p-4 hover:shadow-lg transition rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Profit</h3>
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                ₹{parseFloat(dailyReport.sales_summary.total_profit).toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                Profit Margin: {dailyReport.sales_summary.total_sales_amount > 0
                  ? ((parseFloat(dailyReport.sales_summary.total_profit) / parseFloat(dailyReport.sales_summary.total_sales_amount)) * 100).toFixed(1)
                  : '0'}%
              </div>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Supply</span>
                  <span className="font-semibold text-blue-600">
                    ₹{parseFloat(dailyReport.supplier_summary.total_supply).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Supply Records</span>
                  <span className="font-semibold">{dailyReport.supplier_summary.supply_count}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Returns</span>
                  <span className="font-semibold text-red-600">
                    ₹{parseFloat(dailyReport.supplier_summary.total_returns).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Return Records</span>
                  <span className="font-semibold">{dailyReport.supplier_summary.return_count}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-800 font-semibold">Net Amount</span>
                  <span className="font-bold text-lg text-primary-600">
                    ₹{parseFloat(dailyReport.supplier_summary.net_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Sales Amount</span>
                  <span className="font-semibold text-purple-600">
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
                      ? (parseFloat(dailyReport.sales_summary.total_sales_amount) / dailyReport.sales_summary.sales_count).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-800 font-semibold">Total Profit</span>
                  <span className="font-bold text-lg text-green-600">
                    ₹{parseFloat(dailyReport.sales_summary.total_profit).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Breakdown */}
          {profitReport && (
            <div className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profit by Variety */}
                {profitReport.profit_by_variety && profitReport.profit_by_variety.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit by Variety</h3>
                    <div className="space-y-2">
                      {profitReport.profit_by_variety.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">Variety ID: {item.variety_id}</span>
                            <span className="text-sm text-gray-600 ml-2">({item.total_quantity} items)</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            ₹{parseFloat(item.total_profit).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profit by Salesperson */}
                {profitReport.profit_by_salesperson && profitReport.profit_by_salesperson.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit by Salesperson</h3>
                    <div className="space-y-2">
                      {profitReport.profit_by_salesperson.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{item.salesperson_name}</span>
                            <span className="text-sm text-gray-600 ml-2">({item.total_quantity} items)</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            ₹{parseFloat(item.total_profit).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {(!dailyReport || !dailyReport.supplier_summary || !dailyReport.sales_summary) && !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">No data available for this date</p>
          <p className="text-sm text-gray-400">Add some transactions to see the report</p>
        </div>

      )}
    </div>
  );
}
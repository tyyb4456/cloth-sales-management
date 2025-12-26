import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { Card, CardBody, CardHeader, Input, Spinner } from '@heroui/react';
import { getDailyReport } from '../api/api';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl ${color} shrink-0`}>
            <Icon size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-serif text-gray-500">{value}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [date]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await getDailyReport(date);
      setReport(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="default" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto min-w-50"
          variant="bordered"
          color="default"
        />
      </div>

      {report && report.supplier_summary && report.sales_summary && (
        <>
          {/* Supplier Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Supplier Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Supply"
                value={`Rs ${parseFloat(report.supplier_summary.total_supply).toFixed(2)}`}
                icon={Package}
                color="bg-gray-500"
              />
              <StatCard
                title="Total Returns"
                value={`Rs ${parseFloat(report.supplier_summary.total_returns).toFixed(2)}`}
                icon={TrendingUp}
                color="bg-gray-500"
              />
              <StatCard
                title="Net Amount"
                value={`Rs ${parseFloat(report.supplier_summary.net_amount).toFixed(2)}`}
                icon={DollarSign}
                color="bg-gray-500"
              />
            </div>
          </div>

          {/* Sales Summary */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Sales Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Sales"
                value={`Rs ${parseFloat(report.sales_summary.total_sales_amount).toFixed(2)}`}
                icon={ShoppingCart}
                color="bg-gray-600"
              />
              <StatCard
                title="Total Profit"
                value={`Rs ${parseFloat(report.sales_summary.total_profit).toFixed(2)}`}
                icon={TrendingUp}
                color="bg-gray-600"
              />
              <StatCard
                title="Items Sold"
                value={report.sales_summary.total_quantity_sold}
                icon={Package}
                color="bg-gray-600"
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-0">
                <h4 className="text-lg font-semibold text-gray-800">Supplier Transactions</h4>
              </CardHeader>
              <CardBody className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Supply Records:</span>
                    <span className="font-bold text-lg text-gray-500">{report.supplier_summary.supply_count}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Return Records:</span>
                    <span className="font-bold text-lg text-gray-600">{report.supplier_summary.return_count}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-0">
                <h4 className="text-lg font-semibold text-gray-800">Sales Transactions</h4>
              </CardHeader>
              <CardBody className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Total Sales:</span>
                    <span className="font-bold text-lg text-gray-600">{report.sales_summary.sales_count}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Avg Sale Value:</span>
                    <span className="font-bold text-lg text-gray-800">
                      Rs {report.sales_summary.sales_count > 0
                        ? (parseFloat(report.sales_summary.total_sales_amount) / report.sales_summary.sales_count).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">No data available for this date</p>
          <p className="text-sm text-gray-400">Try selecting a different date or add some transactions</p>
        </div>
      )}
    </div>
  );
}


import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getVarieties, createSale, getSalesByDate, deleteSale } from '../api/api';

export default function Sales() {
  const [varieties, setVarieties] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formData, setFormData] = useState({
    salesperson_name: '',
    variety_id: '',
    quantity: '',
    selling_price: '',
    cost_price: '',
    sale_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [varietySearch, setVarietySearch] = useState('');
  const [showVarietyDropdown, setShowVarietyDropdown] = useState(false);
  useEffect(() => {
    const handler = () => setShowVarietyDropdown(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);


  useEffect(() => {
    loadVarieties();
  }, []);

  useEffect(() => {
    loadSales();
  }, [selectedDate]);

  const loadVarieties = async () => {
    try {
      const response = await getVarieties();
      setVarieties(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading varieties:', error);
      setVarieties([]);
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const response = await getSalesByDate(selectedDate);
      setSales(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSale({
        ...formData,
        variety_id: parseInt(formData.variety_id),
        quantity: parseInt(formData.quantity),
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price)
      });
      setVarietySearch('');
      setFormData({
        salesperson_name: '',
        variety_id: '',
        quantity: '',
        selling_price: '',
        cost_price: '',
        sale_date: format(new Date(), 'yyyy-MM-dd')
      });
      setShowForm(false);
      loadSales();
      alert('Sale recorded successfully!');
    } catch (error) {
      console.error('Error creating sale:', error);
      alert(error.response?.data?.detail || 'Failed to record sale');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;

    try {
      await deleteSale(id);
      loadSales();
      alert('Sale deleted successfully!');
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete sale');
    }
  };

  const totalSales = Array.isArray(sales) ? sales.reduce((sum, item) => sum + (parseFloat(item.selling_price) * item.quantity), 0) : 0;
  const totalProfit = Array.isArray(sales) ? sales.reduce((sum, item) => sum + parseFloat(item.profit), 0) : 0;


  const filteredVarieties = varieties.filter(v =>
    v.name.toLowerCase().includes(varietySearch.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Sales</h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-3 bg-white border border-gray-300
                  rounded-lg px-4 py-2
                  focus-within:ring-2 focus-within:ring-gray-500/20
                  transition">
            <Calendar size={18} className="text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-gray-800 focus:outline-none"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-5 py-2.5 rounded-lg
               bg-gray-700 text-white font-medium
               hover:bg-gray-800 transition-all
               hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Plus size={18} className="mr-2" />
            Record Sale
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            New Sale
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Salesperson Name */}
            <div className="relative w-full">

              <label className="block mb-1 text-sm font-medium text-gray-700">
                Salesperson Name
              </label>
              <input
                type="text"
                required
                value={formData.salesperson_name}
                onChange={(e) =>
                  setFormData({ ...formData, salesperson_name: e.target.value })
                }
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 text-gray-900 bg-white
                   border border-gray-300 rounded-lg
                   focus:outline-none focus:border-gray-500
                   focus:ring-2 focus:ring-gray-500/20
                   transition-all duration-300"
              />

            </div>

            {/* Cloth Variety (Searchable) */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Cloth Variety
              </label>

              <input
                type="text"
                required
                value={varietySearch}
                onChange={(e) => {
                  setVarietySearch(e.target.value);
                  setShowVarietyDropdown(true);
                }}
                onFocus={() => setShowVarietyDropdown(true)}
                placeholder="Search cloth variety..."
                className="w-full px-4 py-3 text-gray-900 bg-white
      border border-gray-300 rounded-lg
      focus:outline-none focus:border-gray-500
      focus:ring-2 focus:ring-gray-500/20"
              />

              {showVarietyDropdown && (
                <div
                  className="absolute z-20 mt-1 w-full
        max-h-56 overflow-y-auto
        bg-white border border-gray-200
        rounded-lg shadow-lg"
                >
                  {filteredVarieties.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">
                      No varieties found
                    </div>
                  ) : (
                    filteredVarieties.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setFormData({ ...formData, variety_id: v.id });
                          setVarietySearch(v.name);
                          setShowVarietyDropdown(false);
                        }}
                        className="px-4 py-2 cursor-pointer
              hover:bg-gray-100 transition"
                      >
                        {v.name}
                      </div>
                    ))
                  )}
                </div>
              )}

              <label
                className="absolute left-4 top-4 text-gray-500
                   pointer-events-none transition-all duration-300
                   peer-focus:top-1 peer-focus:text-sm
                   peer-not-[value='']:top-1 peer-not-[value='']:text-sm"
              >

              </label>
            </div>

            {/* Quantity */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                required
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 text-gray-900 bg-white
      border border-gray-300 rounded-lg
      focus:outline-none focus:border-gray-500
      focus:ring-2 focus:ring-gray-500/20"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />

            </div>


            {/* Cost Price */}
            <div className="relative w-full">

              <label className="block mb-1 text-sm font-medium text-gray-700">
                Cost Price
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 text-gray-900 bg-white
                   border border-gray-300 rounded-lg
                   focus:outline-none focus:border-gray-500
                   focus:ring-2 focus:ring-gray-500/20
                   transition-all duration-300"
              />

            </div>

            {/* Selling Price */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Selling Price
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: e.target.value })
                }
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 text-gray-900 bg-white
                   border border-gray-300 rounded-lg
                   focus:outline-none focus:border-gray-500
                   focus:ring-2 focus:ring-gray-500/20
                   transition-all duration-300"
              />
            </div>

            {/* Sale Date */}
            <div className="relative w-full">
              <input
                type="date"
                required
                value={formData.sale_date}
                onChange={(e) =>
                  setFormData({ ...formData, sale_date: e.target.value })
                }
                className="w-full px-4 py-3 text-gray-900 bg-white
                   border border-gray-300 rounded-lg
                   focus:outline-none focus:border-gray-500
                   focus:ring-2 focus:ring-gray-500/20
                   transition-all duration-300"
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-gray-600 text-white font-medium
                   transition-all duration-300
                   hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Record Sale
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-lg border border-gray-300
                   text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No sales records for this date
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Salesperson</th>
                    <th className="px-4 py-3 text-left font-semibold">Variety</th>
                    <th className="px-4 py-3 text-center font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Cost</th>
                    <th className="px-4 py-3 text-right font-semibold">Selling</th>
                    <th className="px-4 py-3 text-right font-semibold">Profit</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-center font-semibold">Time</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {sales.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.salesperson_name}
                      </td>
                      <td className="px-4 py-3">{item.variety.name}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        ₹{parseFloat(item.cost_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        ₹{parseFloat(item.selling_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        ₹{parseFloat(item.profit).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₹{(parseFloat(item.selling_price) * item.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {new Date(item.sale_timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <div className="text-lg font-semibold">
                Total Sales:{" "}
                <span className="text-gray-800">₹{totalSales.toFixed(2)}</span>
              </div>
              <div className="text-lg font-semibold">
                Total Profit:{" "}
                <span className="text-green-600">₹{totalProfit.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
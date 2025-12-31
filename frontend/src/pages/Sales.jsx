// frontend/src/pages/Sales.jsx - UPDATED with auto-fill cost price

import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getVarieties, createSale, getSalesByDate, deleteSale } from '../api/api';

// Helper function to format quantity with unit
const formatQuantityWithUnit = (quantity, unit) => {
  const qty = parseFloat(quantity);
  if (unit === 'meters') {
    return qty % 1 === 0 ? `${qty}m` : `${qty.toFixed(2)}m`;
  }
  if (unit === 'yards') {
    return qty % 1 === 0 ? `${qty}y` : `${qty.toFixed(2)}y`;
  }
  return Math.floor(qty);
};

const getItemCount = (quantity, unit) => {
  if (unit === 'meters' || unit === 'yards') return 1;
  return parseFloat(quantity);
};

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
  const [selectedVariety, setSelectedVariety] = useState(null);

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

  // ✨ NEW: Auto-fill cost price when variety is selected
  const handleVarietySelect = (variety) => {
    setFormData({ 
      ...formData, 
      variety_id: variety.id,
      // Auto-fill cost price if available
      cost_price: variety.default_cost_price 
        ? (parseFloat(variety.default_cost_price) * (parseFloat(formData.quantity) || 1)).toString()
        : formData.cost_price
    });
    setVarietySearch(variety.name);
    setSelectedVariety(variety);
    setShowVarietyDropdown(false);
  };

  // ✨ NEW: Recalculate cost price when quantity changes
  const handleQuantityChange = (quantity) => {
    setFormData({ ...formData, quantity });
    
    // If variety has default price, recalculate total cost
    if (selectedVariety?.default_cost_price && quantity) {
      const totalCost = parseFloat(selectedVariety.default_cost_price) * parseFloat(quantity);
      setFormData(prev => ({ ...prev, quantity, cost_price: totalCost.toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSale({
        ...formData,
        variety_id: parseInt(formData.variety_id),
        quantity: parseFloat(formData.quantity),
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price)
      });

      setVarietySearch('');
      setSelectedVariety(null);
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

  const totalItemsSold = Array.isArray(sales) ? sales.reduce((sum, item) => {
    return sum + getItemCount(item.quantity, item.variety.measurement_unit);
  }, 0) : 0;

  const filteredVarieties = varieties.filter(v =>
    v.name.toLowerCase().includes(varietySearch.toLowerCase())
  );

  const getUnitLabel = () => {
    if (!selectedVariety) return '';
    if (selectedVariety.measurement_unit === 'meters') return 'm';
    if (selectedVariety.measurement_unit === 'yards') return 'y';
    return '';
  };

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
                Salesperson Name *
              </label>
              <select
                required
                value={formData.salesperson_name}
                onChange={(e) =>
                  setFormData({ ...formData, salesperson_name: e.target.value })
                }
                className="w-full px-4 py-3 text-gray-900 bg-white
                  border border-gray-300 rounded-lg
                  focus:outline-none focus:border-gray-500
                  focus:ring-2 focus:ring-gray-500/20
                  transition-all duration-300"
              >
                <option value="" disabled>Select Salesperson</option>
                <option value="shahzad">shahzad</option>
                <option value="zulifqar">zulifqar</option>
                <option value="kashif">kashif</option>
              </select>
            </div>

            {/* Cloth Variety with auto-complete */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Cloth Variety *
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
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto
                  bg-white border border-gray-200 rounded-lg shadow-lg"
                >
                  {filteredVarieties.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">No varieties found</div>
                  ) : (
                    filteredVarieties.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleVarietySelect(v)}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="font-medium">{v.name}</div>
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span className="capitalize">{v.measurement_unit}</span>
                          {v.default_cost_price && (
                            <span className="text-green-600">
                              ₹{parseFloat(v.default_cost_price).toFixed(2)}/unit
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quantity with unit */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Quantity {selectedVariety && `(${selectedVariety.measurement_unit})`} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  step={selectedVariety?.measurement_unit !== 'pieces' ? '0.01' : '1'}
                  placeholder={selectedVariety?.measurement_unit === 'meters' ? 'Length in meters' :
                    selectedVariety?.measurement_unit === 'yards' ? 'Length in yards' :
                      'Number of pieces'}
                  className="peer w-full px-4 py-3 text-gray-900 bg-white
                    border border-gray-300 rounded-lg
                    focus:outline-none focus:border-gray-500
                    focus:ring-2 focus:ring-gray-500/20"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
                {selectedVariety && getUnitLabel() && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {getUnitLabel()}
                  </span>
                )}
              </div>
              {selectedVariety && (selectedVariety.measurement_unit === 'meters' || selectedVariety.measurement_unit === 'yards') && (
                <p className="text-xs text-blue-600 mt-1">
                  This will count as 1 item in inventory
                </p>
              )}
            </div>

            {/* Total Cost Price with auto-fill indicator */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Total Cost Price (₹) *
                {selectedVariety?.default_cost_price && (
                  <span className="ml-2 text-xs text-green-600">
                    (Auto-filled)
                  </span>
                )}
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
                placeholder="Total cost for all items"
                className="peer w-full px-4 py-3 text-gray-900 bg-white
                  border border-gray-300 rounded-lg
                  focus:outline-none focus:border-gray-500
                  focus:ring-2 focus:ring-gray-500/20
                  transition-all duration-300"
              />
              {formData.quantity && formData.cost_price && (
                <p className="text-xs text-gray-500 mt-1">
                  Per unit: ₹{(parseFloat(formData.cost_price) / parseFloat(formData.quantity)).toFixed(2)}
                </p>
              )}
            </div>

            {/* Total Selling Price */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Total Selling Price (₹) *
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
                placeholder="Total selling price for all items"
                className="peer w-full px-4 py-3 text-gray-900 bg-white
                  border border-gray-300 rounded-lg
                  focus:outline-none focus:border-gray-500
                  focus:ring-2 focus:ring-gray-500/20
                  transition-all duration-300"
              />
              {formData.quantity && formData.selling_price && (
                <p className="text-xs text-gray-500 mt-1">
                  Per unit: ₹{(parseFloat(formData.selling_price) / parseFloat(formData.quantity)).toFixed(2)}
                </p>
              )}
            </div>

            {/* Sale Date */}
            <div className="relative w-full">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Sale Date *
              </label>
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

            {/* Total Profit Preview */}
            {formData.quantity && formData.cost_price && formData.selling_price && (
              <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Expected Total Profit: ₹{(parseFloat(formData.selling_price) - parseFloat(formData.cost_price)).toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Per unit profit: ₹{((parseFloat(formData.selling_price) - parseFloat(formData.cost_price)) / parseFloat(formData.quantity)).toFixed(2)}
                </p>
              </div>
            )}

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
                onClick={() => {
                  setShowForm(false);
                  setSelectedVariety(null);
                }}
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
                    <th className="px-4 py-3 text-right font-semibold">Cost/Unit</th>
                    <th className="px-4 py-3 text-right font-semibold">Price/Unit</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Profit</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Sale</th>
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
                      <td className="px-4 py-3">
                        <div>{item.variety.name}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {item.variety.measurement_unit}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {formatQuantityWithUnit(item.quantity, item.variety.measurement_unit)}
                      </td>
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
            <div className="mt-6 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600 mb-1">Items Sold</p>
                <p className="text-2xl font-bold text-gray-800">{totalItemsSold}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800">₹{totalSales.toFixed(2)}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-600 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-green-600">₹{totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
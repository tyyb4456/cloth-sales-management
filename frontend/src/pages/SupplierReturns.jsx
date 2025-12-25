import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getVarieties, createSupplierReturn, getSupplierReturnsByDate, deleteSupplierReturn } from '../api/api';

export default function SupplierReturns() {
  const [varieties, setVarieties] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formData, setFormData] = useState({
    supplier_name: '',
    variety_id: '',
    quantity: '',
    price_per_item: '',
    return_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  });

  useEffect(() => {
    loadVarieties();
  }, []);

  useEffect(() => {
    loadReturns();
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

  const loadReturns = async () => {
    setLoading(true);
    try {
      const response = await getSupplierReturnsByDate(selectedDate);
      setReturns(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading returns:', error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSupplierReturn({
        ...formData,
        variety_id: parseInt(formData.variety_id),
        quantity: parseInt(formData.quantity),
        price_per_item: parseFloat(formData.price_per_item)
      });
      setFormData({
        supplier_name: '',
        variety_id: '',
        quantity: '',
        price_per_item: '',
        return_date: format(new Date(), 'yyyy-MM-dd'),
        reason: ''
      });
      setShowForm(false);
      loadReturns();
      alert('Return recorded successfully!');
    } catch (error) {
      console.error('Error creating return:', error);
      alert(error.response?.data?.detail || 'Failed to record return');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this return record?')) return;
    
    try {
      await deleteSupplierReturn(id);
      loadReturns();
      alert('Return deleted successfully!');
    } catch (error) {
      console.error('Error deleting return:', error);
      alert('Failed to delete return');
    }
  };

  const totalAmount = Array.isArray(returns) ? returns.reduce((sum, item) => sum + parseFloat(item.total_amount), 0) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Supplier Returns</h2>
 <div className="flex flex-wrap items-center gap-4">
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
    Add Return
  </button>
</div>

      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">New Return</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                required
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                className="input-field"
                placeholder="Enter supplier name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cloth Variety *
              </label>
              <select
                required
                value={formData.variety_id}
                onChange={(e) => setFormData({ ...formData, variety_id: e.target.value })}
                className="input-field"
              >
                <option value="">Select variety</option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input-field"
                placeholder="Number of items"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Item (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price_per_item}
                onChange={(e) => setFormData({ ...formData, price_per_item: e.target.value })}
                className="input-field"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Date *
              </label>
              <input
                type="date"
                required
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input-field"
                rows="2"
                placeholder="Optional reason for return"
              />
            </div>
<div className="md:col-span-2 flex gap-3 pt-2">
  <button
    type="submit"
    className="px-6 py-3 rounded-lg bg-gray-700 text-white font-medium
               hover:bg-gray-800 transition hover:shadow-lg"
  >
    Record Return
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

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No return records for this date
          </div>
        ) : (
          <>
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full border-collapse">
    <thead className="bg-gray-50 text-gray-600 text-sm">
      <tr>
        <th className="px-4 py-3 text-left">Supplier</th>
        <th className="px-4 py-3 text-left">Variety</th>
        <th className="px-4 py-3 text-center">Qty</th>
        <th className="px-4 py-3 text-right">Price</th>
        <th className="px-4 py-3 text-right">Total</th>
        <th className="px-4 py-3 text-left">Reason</th>
        <th className="px-4 py-3 text-center">Date</th>
        <th className="px-4 py-3 text-center">Actions</th>
      </tr>
    </thead>

    <tbody className="text-sm">
      {returns.map((item, idx) => (
        <tr
          key={item.id}
          className={`border-t ${
            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
          } hover:bg-gray-100 transition`}
        >
          <td className="px-4 py-3 font-medium text-gray-800">
            {item.supplier_name}
          </td>
          <td className="px-4 py-3">{item.variety.name}</td>
          <td className="px-4 py-3 text-center">{item.quantity}</td>
          <td className="px-4 py-3 text-right">
            ₹{parseFloat(item.price_per_item).toFixed(2)}
          </td>
          <td className="px-4 py-3 text-right font-semibold text-red-600">
            ₹{parseFloat(item.total_amount).toFixed(2)}
          </td>
          <td className="px-4 py-3">
            {item.reason || <span className="text-gray-400">—</span>}
          </td>
          <td className="px-4 py-3 text-center text-gray-500">
            {new Date(item.return_date).toLocaleDateString()}
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

<div className="mt-6 pt-4 border-t flex justify-end">
  <div className="text-lg font-semibold">
    Total Returns:{" "}
    <span className="text-red-600">₹{totalAmount.toFixed(2)}</span>
  </div>
</div>
<div className="mt-6 pt-4 border-t flex justify-end">
  <div className="text-lg font-semibold">
    Total Returns:{" "}
    <span className="text-red-600">₹{totalAmount.toFixed(2)}</span>
  </div>
</div>
          </>
        )}
      </div>
    </div>
  );
}
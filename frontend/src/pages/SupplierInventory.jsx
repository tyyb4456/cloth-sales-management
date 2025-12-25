import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getVarieties, createSupplierInventory, getSupplierInventoryByDate, getSupplierWiseSummary, deleteSupplierInventory } from '../api/api';

export default function SupplierInventory() {
  const [varieties, setVarieties] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [supplierSummary, setSupplierSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formData, setFormData] = useState({
    supplier_name: '',
    variety_id: '',
    quantity: '',
    price_per_item: '',
    supply_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadVarieties();
  }, []);

  useEffect(() => {
    loadInventory();
    loadSupplierSummary();
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

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await getSupplierInventoryByDate(selectedDate);
      setInventory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierSummary = async () => {
    try {
      const response = await getSupplierWiseSummary(selectedDate);
      setSupplierSummary(response.data);
    } catch (error) {
      console.error('Error loading supplier summary:', error);
      setSupplierSummary(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSupplierInventory({
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
        supply_date: format(new Date(), 'yyyy-MM-dd')
      });
      setShowForm(false);
      loadInventory();
      loadSupplierSummary();
      alert('Inventory added successfully!');
    } catch (error) {
      console.error('Error creating inventory:', error);
      alert(error.response?.data?.detail || 'Failed to add inventory');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this inventory record?')) return;
    
    try {
      await deleteSupplierInventory(id);
      loadInventory();
      loadSupplierSummary();
      alert('Inventory deleted successfully!');
    } catch (error) {
      console.error('Error deleting inventory:', error);
      alert('Failed to delete inventory');
    }
  };

  const totalAmount = Array.isArray(inventory) ? inventory.reduce((sum, item) => sum + parseFloat(item.total_amount), 0) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Supplier Inventory</h2>
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
               hover:bg-gray-800 transition
               hover:-translate-y-0.5 hover:shadow-lg"
  >
    <Plus size={18} className="mr-2" />
    Add Supply
  </button>
</div>

      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">New Supply</h3>
<form
  onSubmit={handleSubmit}
  className="grid grid-cols-1 md:grid-cols-2 gap-5"
>

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
                Supply Date *
              </label>
              <input
                type="date"
                required
                value={formData.supply_date}
                onChange={(e) => setFormData({ ...formData, supply_date: e.target.value })}
                className="input-field"
              />
            </div>
<div className="md:col-span-2 flex gap-3 pt-2">
  <button
    type="submit"
    className="px-6 py-3 rounded-lg bg-gray-700 text-white font-medium
               hover:bg-gray-800 transition hover:shadow-lg"
  >
    Add Supply
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
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No inventory records for this date
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
        <th className="px-4 py-3 text-center">Date</th>
        <th className="px-4 py-3 text-center">Actions</th>
      </tr>
    </thead>

    <tbody className="text-sm">
      {inventory.map((item, idx) => (
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
          <td className="px-4 py-3 text-right font-semibold">
            ₹{parseFloat(item.total_amount).toFixed(2)}
          </td>
          <td className="px-4 py-3 text-center text-gray-500">
            {new Date(item.supply_date).toLocaleDateString()}
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
    Total:{" "}
    <span className="text-gray-800">₹{totalAmount.toFixed(2)}</span>
  </div>
</div>

          </>
        )}
      </div>

      {/* Supplier-wise Summary */}
      {supplierSummary && supplierSummary.suppliers && supplierSummary.suppliers.length > 0 && (
<div className="card mt-6 p-6">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">
    Supplier-wise Summary
  </h3>

  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="w-full border-collapse">
      <thead className="bg-gray-50 text-gray-600 text-sm">
        <tr>
          <th className="px-4 py-3 text-left">Supplier</th>
          <th className="px-4 py-3 text-right">Supply</th>
          <th className="px-4 py-3 text-center">Qty</th>
          <th className="px-4 py-3 text-right">Returns</th>
          <th className="px-4 py-3 text-center">Return Qty</th>
          <th className="px-4 py-3 text-right">Net</th>
        </tr>
      </thead>

      <tbody className="text-sm">
        {supplierSummary.suppliers.map((s, idx) => (
          <tr
            key={idx}
            className={`border-t ${
              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <td className="px-4 py-3 font-medium">{s.supplier_name}</td>
            <td className="px-4 py-3 text-right text-blue-600">
              ₹{s.total_supply.toFixed(2)}
            </td>
            <td className="px-4 py-3 text-center">{s.supply_quantity}</td>
            <td className="px-4 py-3 text-right text-red-600">
              ₹{s.total_returns.toFixed(2)}
            </td>
            <td className="px-4 py-3 text-center">{s.return_quantity}</td>
            <td className="px-4 py-3 text-right font-semibold text-green-600">
              ₹{s.net_amount.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      )}
    </div>
  );
}
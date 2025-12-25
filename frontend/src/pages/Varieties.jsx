import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getVarieties, createVariety, deleteVariety } from '../api/api';

export default function Varieties() {
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadVarieties();
  }, []);

  const loadVarieties = async () => {
    setLoading(true);
    try {
      const response = await getVarieties();
      setVarieties(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading varieties:', error);
      setVarieties([]);
      alert('Failed to load varieties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createVariety(formData);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      loadVarieties();
      alert('Variety created successfully!');
    } catch (error) {
      console.error('Error creating variety:', error);
      alert(error.response?.data?.detail || 'Failed to create variety');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this variety?')) return;

    try {
      await deleteVariety(id);
      loadVarieties();
      alert('Variety deleted successfully!');
    } catch (error) {
      console.error('Error deleting variety:', error);
      alert('Failed to delete variety');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Cloth Varieties</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg
               font-medium hover:bg-gray-800 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus size={18} className="mr-2" />
          Add Variety
        </button>
      </div>


{showForm && (
  <div className="card mb-6 p-6">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">New Variety</h3>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field w-full px-4 py-2 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition"
          placeholder="e.g., Cotton Fabric"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field w-full px-4 py-2 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition"
          rows="3"
          placeholder="Optional description"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-6 py-2.5 bg-gray-700 text-white rounded-lg font-medium
                     hover:bg-gray-800 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          Create Variety
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700
                     hover:bg-gray-100 transition"
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
        ) : varieties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No varieties found. Add your first variety!
          </div>
        ) : (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full border-collapse">
    <thead className="bg-gray-50 text-gray-600 text-sm">
      <tr>
        <th className="px-4 py-3 text-left">ID</th>
        <th className="px-4 py-3 text-left">Name</th>
        <th className="px-4 py-3 text-left">Description</th>
        <th className="px-4 py-3 text-left">Created At</th>
        <th className="px-4 py-3 text-center">Actions</th>
      </tr>
    </thead>
    <tbody className="text-sm">
      {varieties.map((v, idx) => (
        <tr
          key={v.id}
          className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}
        >
          <td className="px-4 py-3">{v.id}</td>
          <td className="px-4 py-3 font-semibold text-gray-800">{v.name}</td>
          <td className="px-4 py-3">{v.description || '-'}</td>
          <td className="px-4 py-3">{new Date(v.created_at).toLocaleDateString()}</td>
          <td className="px-4 py-3 text-center">
            <button
              onClick={() => handleDelete(v.id)}
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

        )}
      </div>
    </div>
  );
}
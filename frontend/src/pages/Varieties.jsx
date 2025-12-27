import { useState, useEffect } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { getVarieties, createVariety, deleteVariety } from '../api/api';

export default function Varieties() {
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    measurement_unit: 'pieces',
    standard_length: '',
  });

  const units = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'meters', label: 'Meters' },
    { value: 'yards', label: 'Yards' },
  ];

  useEffect(() => {
    loadVarieties();
  }, []);

  const loadVarieties = async () => {
    setLoading(true);
    try {
      const res = await getVarieties();
      setVarieties(Array.isArray(res.data) ? res.data : []);
    } catch {
      alert('Failed to load varieties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      standard_length:
        formData.measurement_unit === 'pieces'
          ? null
          : Number(formData.standard_length),
    };

    try {
      await createVariety(payload);
      resetForm();
      loadVarieties();
      alert('Variety created successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create variety');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this variety?')) return;
    await deleteVariety(id);
    loadVarieties();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      measurement_unit: 'pieces',
      standard_length: '',
    });
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-bold">Cloth Varieties</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg"
        >
          <Plus size={18} className="mr-2" />
          Add Variety
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-6 space-y-4">
          <input
            placeholder="Variety Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border p-2 rounded"
          />

          <select
            value={formData.measurement_unit}
            onChange={(e) =>
              setFormData({ ...formData, measurement_unit: e.target.value })
            }
            className="w-full border p-2 rounded"
          >
            {units.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>

          {(formData.measurement_unit === 'meters' ||
            formData.measurement_unit === 'yards') && (
            <input
              type="number"
              step="0.01"
              required
              placeholder="Standard Length"
              value={formData.standard_length}
              onChange={(e) =>
                setFormData({ ...formData, standard_length: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          )}

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full border p-2 rounded"
          />

          <div className="flex gap-2">
            <button className="bg-gray-700 text-white px-4 py-2 rounded">
              Create
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : varieties.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Package className="mx-auto mb-2" />
            No varieties found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-center">Unit</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {varieties.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-3">{v.name}</td>
                  <td className="p-3 text-center">{v.measurement_unit}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

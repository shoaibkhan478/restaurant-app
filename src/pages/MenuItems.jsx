import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function MenuItems() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
    is_special: false,
    category_id: '',
  });

  const loadItems = async (categoryId) => {
    const { data, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: true });

    if (itemError) {
      setError('Items load nahi hue: ' + itemError.message);
    } else {
      setItems(data || []);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');

      const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (cancelled) return;

      if (catError) {
        setError('Categories load nahi hui: ' + catError.message);
        setLoading(false);
        return;
      }

      setCategories(cats || []);

      if (cats && cats.length > 0) {
        setSelectedCategory(cats[0].id);
        await loadItems(cats[0].id);
      }

      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, []);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    loadItems(catId);
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_available: true,
      is_special: false,
      category_id: selectedCategory,
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      is_available: item.is_available,
      is_special: item.is_special,
      category_id: item.category_id,
    });
    setEditingItem(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      image_url: form.image_url.trim(),
      is_available: form.is_available,
      is_special: form.is_special,
      category_id: selectedCategory,
    };

    if (editingItem) {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', editingItem);

      if (updateError) {
        setError('Update nahi hua: ' + updateError.message);
      } else {
        loadItems(selectedCategory);
        resetForm();
      }
    } else {
      const { error: insertError } = await supabase
        .from('menu_items')
        .insert(payload);

      if (insertError) {
        setError('Item add nahi hua: ' + insertError.message);
      } else {
        loadItems(selectedCategory);
        resetForm();
      }
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Is item ko delete karna chahte hain?');
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError('Delete nahi hua: ' + deleteError.message);
    } else {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  const toggleAvailability = async (item) => {
    const { error: toggleError } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);

    if (!toggleError) {
      setItems(items.map((i) =>
        i.id === item.id ? { ...i, is_available: !i.is_available } : i
      ));
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <button onClick={() => navigate(-1)} className="text-sm underline">
          Wapas Jayein
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-4 py-2 rounded text-sm font-medium border ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => { setShowForm(!showForm); setEditingItem(null); }}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded text-sm font-medium"
      >
        {showForm ? 'Cancel' : '+ Naya Item Add Karein'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 space-y-3">
          <input
            type="text"
            placeholder="Item ka naam *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Price *"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            min="0"
            step="0.01"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              />
              Available
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_special}
                onChange={(e) => setForm({ ...form, is_special: e.target.checked })}
              />
              Special Item
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium"
          >
            {editingItem ? 'Update Karein' : 'Add Karein'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-gray-500 text-sm">Is category mein koi item nahi hai.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="border rounded p-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                {item.is_special && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Special</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.is_available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              )}
              <p className="text-sm font-semibold mt-1">Rs. {item.price}</p>
            </div>
            <div className="flex gap-2 text-sm ml-4 flex-col items-end">
              <button onClick={() => toggleAvailability(item)} className="text-yellow-600">
                {item.is_available ? 'Unavailable Karein' : 'Available Karein'}
              </button>
              <button onClick={() => handleEdit(item)} className="text-blue-600">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
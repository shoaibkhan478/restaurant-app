import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function MenuManagement() {
  const navigate = useNavigate();
  const [restaurantId, setRestaurantId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');

      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1)
        .single();

      if (cancelled) return;

      if (restError || !restaurant) {
        setError('Restaurant nahi mila.');
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);

      const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('display_order', { ascending: true });

      if (cancelled) return;

      if (catError) {
        setError('Categories load nahi hui: ' + catError.message);
      } else {
        setCategories(cats || []);
      }

      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const nextOrder =
      categories.length > 0
        ? Math.max(...categories.map((c) => c.display_order || 0)) + 1
        : 0;

    const { data, error: insertError } = await supabase
      .from('menu_categories')
      .insert({
        name: newCategoryName.trim(),
        restaurant_id: restaurantId,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (insertError) {
      setError('Category add nahi hui: ' + insertError.message);
    } else {
      setCategories([...categories, data]);
      setNewCategoryName('');
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;

    const { error: updateError } = await supabase
      .from('menu_categories')
      .update({ name: editingName.trim() })
      .eq('id', id);

    if (updateError) {
      setError('Update nahi hua: ' + updateError.message);
    } else {
      setCategories(
        categories.map((c) =>
          c.id === id ? { ...c, name: editingName.trim() } : c
        )
      );
      cancelEdit();
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Kya aap is category ko delete karna chahte hain?'
    );
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError('Delete nahi hua: ' + deleteError.message);
    } else {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button onClick={() => navigate(-1)} className="text-sm underline">
          Wapas Jayein
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nayi category ka naam (e.g. Starters, Drinks)"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-gray-500 text-sm">
            Abhi tak koi category nahi bani.
          </p>
        )}

        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between border rounded px-4 py-3"
          >
            {editingId === cat.id ? (
              <div className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => saveEdit(cat.id)}
                  className="text-sm text-green-600 font-medium"
                >
                  Save
                </button>
                <button onClick={cancelEdit} className="text-sm text-gray-500">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-between">
                <span className="font-medium">{cat.name}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-sm text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
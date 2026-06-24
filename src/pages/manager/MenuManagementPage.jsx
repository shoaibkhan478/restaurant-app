import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ManagerLayout from '../../components/manager/ManagerLayout';

const CATEGORIES_DEFAULT = [
  { emoji: '🍚', name: 'Biryani' },
  { emoji: '🍖', name: 'BBQ' },
  { emoji: '🍛', name: 'Karahi' },
  { emoji: '🫓', name: 'Naan & Roti' },
  { emoji: '🥗', name: 'Salads' },
  { emoji: '🍜', name: 'Soups' },
  { emoji: '🍔', name: 'Fast Food' },
  { emoji: '🥤', name: 'Drinks' },
  { emoji: '🍮', name: 'Desserts' },
  { emoji: '🍳', name: 'Breakfast' },
];

export default function MenuManagementPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '',
    dietary_tags: [], is_available: true, image_url: ''
  });

  const fetchData = async () => {
    const { data: cats } = await supabase.from('menu_categories').select('*').order('display_order');
    const { data: menuItems } = await supabase.from('menu_items').select('*').order('name');
    setCategories(cats || []);
    setItems(menuItems || []);
    if (cats?.length && !activeCategory) setActiveCategory(cats[0].id);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredItems = items.filter(i => i.category_id === activeCategory);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', description: '', price: '', category_id: activeCategory || '', dietary_tags: [], is_available: true, image_url: '' });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, description: item.description || '', price: item.price,
      category_id: item.category_id, dietary_tags: item.dietary_tags || [],
      is_available: item.is_available, image_url: item.image_url || ''
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return alert('Name aur price zaroori hain!');
    const payload = { ...form, price: parseFloat(form.price) };
    if (editItem) {
      await supabase.from('menu_items').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('menu_items').insert(payload);
    }
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Item delete karein?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    fetchData();
  };

  const toggleAvailable = async (item) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    fetchData();
  };

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      dietary_tags: f.dietary_tags.includes(tag)
        ? f.dietary_tags.filter(t => t !== tag)
        : [...f.dietary_tags, tag]
    }));
  };

  if (loading) return <ManagerLayout><div className="flex items-center justify-center h-64 text-slate-400">Loading...</div></ManagerLayout>;

  return (
    <ManagerLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} total items</p>
        </div>
        <button onClick={openAdd} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
          + Add Item
        </button>
      </div>

      <div className="flex gap-6">
        {/* Categories sidebar */}
        <div className="w-52 flex-shrink-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Categories</h3>
          <div className="space-y-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${activeCategory === cat.id ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span>{cat.icon} {cat.name}</span>
                <span className="text-xs text-slate-400">{items.filter(i => i.category_id === cat.id).length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div className="flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Is category mein koi item nahi — Add Item karo!</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Image */}
                  <div className="h-36 bg-amber-50 relative overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-amber-600 font-bold">Rs. {item.price}</p>
                      <div className="flex gap-2">
                        <button onClick={() => toggleAvailable(item)} className="text-xs px-2 py-1 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                          {item.is_available ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={() => openEdit(item)} className="text-xs px-2 py-1 bg-amber-50 rounded-lg text-amber-700 hover:bg-amber-100">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 bg-red-50 rounded-lg text-red-600 hover:bg-red-100">
                          Delete
                        </button>
                      </div>
                    </div>
                    {item.dietary_tags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.dietary_tags.map(tag => (
                          <span key={tag} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{editItem ? 'Item Edit Karein' : 'Naya Item Add Karein'}</h2>
            <div className="space-y-3">

              {/* Image Upload */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Item ki Photo:</p>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                  {form.image_url ? (
                    <div className="relative">
                      <img src={form.image_url} alt="preview" className="w-full h-32 object-contain p-2 rounded-lg" />
                      <button onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs">✕</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="text-3xl mb-1">📷</div>
                      <p className="text-xs text-slate-400">{uploading ? 'Uploading...' : 'Photo select karein'}</p>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>

              <input placeholder="Item name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />

              <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 h-20 resize-none" />

              <input placeholder="Price (Rs.) *" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />

              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">Category select karein</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
              </select>

              <div>
                <p className="text-xs text-slate-500 mb-2">Dietary Tags:</p>
                <div className="flex gap-2 flex-wrap">
                  {['Halal', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy', 'Bestseller'].map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1 rounded-full border transition ${form.dietary_tags.includes(tag) ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
                <span className="text-sm text-slate-700">Available hai (customer dekh sakta hai)</span>
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}


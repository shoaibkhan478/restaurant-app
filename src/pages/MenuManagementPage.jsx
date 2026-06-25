import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import ManagerLayout from '../../components/manager/ManagerLayout';

export default function MenuManagementPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '', dietary_tags: [], is_available: true
  });
const fetchData = async () => {
    const { data: cats } = await supabase.from('menu_categories').select('*').order('display_order');
    const { data: menuItems } = await supabase.from('menu_items').select('*').order('name');
    setCategories(cats || []);
    setItems(menuItems || []);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const { data: cats } = await supabase.from('menu_categories').select('*').order('display_order');
      const { data: menuItems } = await supabase.from('menu_items').select('*').order('name');
      setCategories(cats || []);
      setItems(menuItems || []);
      if (cats?.length) setActiveCategory(cats[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || '', price: item.price, category_id: item.category_id, dietary_tags: item.dietary_tags || [], is_available: item.is_available });
    setShowForm(true);
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

  if (loading) return (
    <ManagerLayout>
      <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
    </ManagerLayout>
  );

  return (
    <ManagerLayout>
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{items.length} total items</p>
        </div>
        <button onClick={openAdd} className="bg-amber-500 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-600 transition whitespace-nowrap flex-shrink-0">
          + Add Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">

        <div className="w-full sm:w-48 flex-shrink-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 sm:mb-3">Categories</h3>
          <div className="flex sm:flex-col gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${activeCategory === cat.id ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="block whitespace-nowrap">{cat.name}</span>
                <span className="text-[10px] text-slate-400">{items.filter(i => i.category_id === cat.id).length} items</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">Is category mein koi item nahi</div>
            )}
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0">🍴</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{item.name}</h3>
                    {item.dietary_tags?.map(tag => (
                      <span key={tag} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">{tag}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
                  <p className="text-amber-600 font-bold text-sm mt-1">Rs. {item.price}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button onClick={() => toggleAvailable(item)}
                    className={`text-xs px-2 sm:px-3 py-1 rounded-full font-medium whitespace-nowrap ${item.is_available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {item.is_available ? '✅' : '⛔'}
                  </button>
                  <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-amber-600 px-2 py-1 rounded hover:bg-amber-50 text-sm">✏️</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 text-sm">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{editItem ? 'Item Edit Karein' : 'Naya Item'}</h2>
            <div className="space-y-3">
              <input placeholder="Item name *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 h-20 resize-none" />
              <input placeholder="Price (Rs.) *" type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <select value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">Category select karein</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <div>
                <p className="text-xs text-slate-500 mb-2">Dietary Tags:</p>
                <div className="flex gap-2 flex-wrap">
                  {['Halal', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy'].map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1 rounded-full border transition ${form.dietary_tags.includes(tag) ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';

export default function MenuPage() {
  const { tableId } = useParams();
  const { categories, items, loading } = useMenu();
  const { addItem, getTotalItems, getTotalPrice } = useCartStore();
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const { items: cartItems, updateQuantity, clearCart } = useCartStore();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const filteredItems = items.filter(item => {
    const matchCategory = !activeCategory || item.category_id === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch && item.is_available;
  });

  const handleOrder = async () => {
    setOrderLoading(true);
    const sessionId = crypto.randomUUID();
    const { data: tableData, error: tableError } = await supabase
      .from('tables').select('id').eq('table_number', parseInt(tableId)).single();
    if (tableError || !tableData) {
      alert('Table nahi mili!');
      setOrderLoading(false);
      return;
    }
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ table_id: tableData.id, customer_session_id: sessionId, status: 'received', total_amount: getTotalPrice() })
      .select('id').single();
    if (orderError || !order) {
      alert('Order save nahi hua!');
      setOrderLoading(false);
      return;
    }
    await supabase.from('order_items').insert(
      cartItems.map(i => ({ order_id: order.id, item_id: i.id, quantity: i.quantity, item_price: i.price }))
    );
    clearCart();
    setCartOpen(false);
    setOrderLoading(false);
    setOrderPlaced(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🍽️</div>
        <p className="text-slate-500 font-medium">Menu load ho raha hai...</p>
      </div>
    </div>
  );

  if (orderPlaced) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center px-8">
        <div className="text-7xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-slate-900">Order Place Ho Gaya!</h1>
        <p className="text-slate-500 mt-2">Kitchen ko mil gaya — thoda intezaar karein 🍳</p>
        <p className="text-xs text-slate-400 mt-1">Table {tableId}</p>
        <button onClick={() => setOrderPlaced(false)}
          className="mt-6 bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg">
          Aur Order Karein
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">🍽️ Restaurant Menu</h1>
            <p className="text-xs text-amber-600 font-medium">Table {tableId}</p>
          </div>
          {getTotalItems() > 0 && (
            <button onClick={() => setCartOpen(true)}
              className="relative bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold">
              🛒 Cart
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {getTotalItems()}
              </span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <input type="text" placeholder="🔍 Kuch dhundein..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition ${!activeCategory ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}>
            🍽️ All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition ${activeCategory === cat.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Count */}
      <div className="px-4 py-2">
        <p className="text-xs text-slate-400">{filteredItems.length} items</p>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-3">
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-2">😕</div>
            <p>Koi item nahi mila</p>
          </div>
        )}
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex">
            {/* Image */}
            <div className="w-28 h-28 flex-shrink-0 bg-amber-50 relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
              )}
              {item.dietary_tags?.includes('Bestseller') && (
                <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                  ⭐ Best
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.dietary_tags?.filter(t => t !== 'Bestseller').map(tag => (
                    <span key={tag} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-amber-600 font-bold text-base">Rs. {item.price}</span>
                <button onClick={() => addItem(item)}
                  className="bg-amber-500 text-white text-sm px-4 py-1.5 rounded-xl font-bold hover:bg-amber-600 active:scale-95 transition">
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <button onClick={() => setCartOpen(true)}
            className="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-5 shadow-xl">
            <span className="bg-white text-amber-600 text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
              {getTotalItems()}
            </span>
            <span className="text-base">🛒 Cart Dekhen</span>
            <span className="font-bold">Rs. {getTotalPrice()}</span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">🛒 Aapka Order</h2>
                <button onClick={() => setCartOpen(false)} className="text-slate-400 text-xl">✕</button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Table {tableId}</p>
            </div>

            <div className="px-6 py-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">Rs. {item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-slate-100 rounded-full text-slate-700 font-bold">−</button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-amber-500 rounded-full text-white font-bold">+</button>
                  </div>
                  <span className="text-sm font-bold text-slate-900 w-16 text-right">Rs. {item.price * item.quantity}</span>
                </div>
              ))}

              <div className="py-4 border-t border-slate-200 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-xl text-amber-600">Rs. {getTotalPrice()}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">* Cash payment at table</p>
              </div>

              <button onClick={handleOrder} disabled={orderLoading}
                className="w-full bg-amber-500 disabled:bg-amber-300 text-white py-4 rounded-2xl font-bold text-base mb-4 shadow-lg">
                {orderLoading ? '⏳ Order ja raha hai...' : '✅ Order Place Karein'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
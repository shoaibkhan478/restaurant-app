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
    return matchCategory && matchSearch;
  });

  const handleOrder = async () => {
    setOrderLoading(true);
    const sessionId = crypto.randomUUID();

    // Table dhundo
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('id')
      .eq('table_number', parseInt(tableId))
      .single();

    if (tableError || !tableData) {
      alert('Table nahi mili! Error: ' + (tableError?.message || 'Unknown'));
      setOrderLoading(false);
      return;
    }

    // Order banao
    // const { data: order, error: orderError } = await supabase
    //   .from('orders')
    //   .insert({
    //     table_id: tableData.id,
    //     session_id: sessionId,
    //     status: 'received',
    //     total: getTotalPrice()
    //   })
    //   .select('id')
    //   .single();


    // Order banao
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    table_id: tableData.id,
    customer_session_id: sessionId,
    status: 'received',
    total_amount: getTotalPrice()
  })
  .select('id')
  .single();

    if (orderError || !order) {
      alert('Order save nahi hua! Error: ' + (orderError?.message || 'Unknown'));
      setOrderLoading(false);
      return;
    }

    // Order items banao
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        cartItems.map(i => ({
          order_id: order.id,
          item_id: i.id,
          quantity: i.quantity,
          item_price: i.price,
        }))
      );

    if (itemsError) {
      alert('Items save nahi hue! Error: ' + itemsError.message);
      setOrderLoading(false);
      return;
    }

    clearCart();
    setCartOpen(false);
    setOrderLoading(false);
    setOrderPlaced(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4">🍽️</div>
        <p className="text-slate-500">Menu load ho raha hai...</p>
      </div>
    </div>
  );

  if (orderPlaced) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center px-8">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-slate-900">Order Place Ho Gaya!</h1>
        <p className="text-slate-500 mt-2">Kitchen ko mil gaya — thoda intezaar karein 🍳</p>
        <button
          onClick={() => setOrderPlaced(false)}
          className="mt-6 bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Aur Order Karein
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-slate-900">🍽️ Restaurant</h1>
          <p className="text-xs text-slate-500">Table {tableId}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4">
        <input
          type="text"
          placeholder="🔍 Menu search karein..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 pt-3 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
            !activeCategory ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === cat.id ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="px-4 pt-4 space-y-3">
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-400">Koi item nahi mila 😕</div>
        )}
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
            <div className="w-20 h-20 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl">
              🍴
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm">{item.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {item.dietary_tags?.map(tag => (
                  <span key={tag} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-amber-600 font-bold">Rs. {item.price}</span>
                <button
                  onClick={() => addItem(item)}
                  className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-amber-600 transition"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 left-4 right-4">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-amber-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-between px-6 shadow-lg"
          >
            <span className="bg-white text-amber-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {getTotalItems()}
            </span>
            <span>Cart Dekhen</span>
            <span>Rs. {getTotalPrice()}</span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">🛒 Aapka Cart</h2>
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-3 border-b border-slate-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">Rs. {item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-slate-100 rounded-full text-slate-700 font-bold text-sm">−</button>
                  <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-amber-500 rounded-full text-white font-bold text-sm">+</button>
                </div>
                <span className="text-sm font-bold text-slate-900 w-16 text-right">Rs. {item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-4 font-bold text-slate-900">
              <span>Total</span>
              <span>Rs. {getTotalPrice()}</span>
            </div>
            <button
              onClick={handleOrder}
              disabled={orderLoading}
              className="w-full bg-amber-500 disabled:bg-amber-300 text-white py-4 rounded-2xl font-bold text-base"
            >
              {orderLoading ? '⏳ Order ja raha hai...' : 'Order Place Karein ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
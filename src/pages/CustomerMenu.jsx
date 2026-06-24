import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { useCartStore } from "../store/cartStore";
import { supabase } from "../lib/supabase";

export default function MenuPage() {
  const { tableId } = useParams();
  const { categories, items, loading } = useMenu();
  const { addItem, getTotalItems, getTotalPrice, items: cartItems, updateQuantity, clearCart } = useCartStore();
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
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
    const { data: tableData } = await supabase.from("tables").select("id").eq("table_number", parseInt(tableId)).single();
    if (!tableData) { alert("Table nahi mili!"); setOrderLoading(false); return; }
    const { data: order } = await supabase.from("orders").insert({ table_id: tableData.id, customer_session_id: sessionId, status: "received", total_amount: getTotalPrice() }).select("id").single();
    if (!order) { alert("Order save nahi hua!"); setOrderLoading(false); return; }
    await supabase.from("order_items").insert(cartItems.map(i => ({ order_id: order.id, item_id: i.id, quantity: i.quantity, item_price: i.price })));
    clearCart(); setCartOpen(false); setOrderLoading(false); setOrderPlaced(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{background:"#fff8f0"}}>
      <div className="text-center">
        <div className="text-6xl mb-3 animate-bounce">🍽️</div>
        <p className="text-orange-400 font-semibold">Menu load ho raha hai...</p>
      </div>
    </div>
  );

  if (orderPlaced) return (
    <div className="flex items-center justify-center h-screen" style={{background:"#f0fff4"}}>
      <div className="text-center px-8">
        <div className="text-7xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800">Order Ho Gaya!</h1>
        <p className="text-gray-500 mt-2">Kitchen ko mil gaya, thoda wait karein</p>
        <p className="text-sm font-bold text-orange-500 mt-1">Table {tableId}</p>
        <button onClick={() => setOrderPlaced(false)} className="mt-6 text-white px-8 py-3 rounded-2xl font-bold shadow-lg" style={{background:"#f97316"}}>Aur Order Karein</button>
      </div>
    </div>
  );

  return (
    <div style={{background:"#f8f8f8", minHeight:"100vh", paddingBottom:"100px"}}>
      <div style={{background:"#f97316", padding:"16px 16px 0 16px"}}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">🍽️ Restaurant</h1>
            <p className="text-orange-100 text-xs font-medium">Table {tableId}</p>
          </div>
          {getTotalItems() > 0 && (
            <button onClick={() => setCartOpen(true)} className="relative bg-white text-orange-500 px-4 py-2 rounded-xl text-sm font-bold shadow">
              🛒 {getTotalItems()} items
            </button>
          )}
        </div>
        <div className="mb-3">
          <input type="text" placeholder="🔍 Search karein..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{background:"rgba(255,255,255,0.95)"}} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3" style={{scrollbarWidth:"none"}}>
          <button onClick={() => setActiveCategory(null)}
            className="px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
            style={{background: !activeCategory ? "white" : "rgba(255,255,255,0.25)", color: !activeCategory ? "#f97316" : "white"}}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
              style={{background: activeCategory === cat.id ? "white" : "rgba(255,255,255,0.25)", color: activeCategory === cat.id ? "#f97316" : "white"}}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-3 space-y-3">
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">😕</div>
            <p>Koi item nahi mila</p>
          </div>
        )}
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex" style={{minHeight:"100px"}}>
            <div className="flex-shrink-0" style={{width:"100px", height:"100px", background:"#fff3e0", overflow:"hidden"}}>
              {item.image_url
                ? <img src={item.image_url} alt={item.name} style={{width:"100px", height:"100px", objectFit:"cover", display:"block"}} />
                : <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
              }
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between" style={{minWidth:0}}>
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                  {item.dietary_tags?.includes("Bestseller") && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-1 flex-shrink-0" style={{background:"#fff3e0", color:"#f97316"}}>⭐ Best</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.dietary_tags?.filter(t => t !== "Bestseller").map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{background:"#f0fdf4", color:"#16a34a"}}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-extrabold text-base" style={{color:"#f97316"}}>Rs. {item.price}</span>
                <button onClick={() => addItem(item)} className="text-white text-sm px-4 py-1.5 rounded-xl font-bold" style={{background:"#f97316"}}>+ Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 left-3 right-3 z-20">
          <button onClick={() => setCartOpen(true)} className="w-full text-white py-4 rounded-2xl font-bold flex items-center justify-between px-5 shadow-xl" style={{background:"#f97316"}}>
            <span className="bg-white text-orange-500 text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">{getTotalItems()}</span>
            <span>🛒 Cart Dekhen</span>
            <span>Rs. {getTotalPrice()}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-y-auto" style={{maxHeight:"85vh"}}>
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🛒 Aapka Order</h2>
                <p className="text-xs text-gray-400">Table {tableId}</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
            </div>
            <div className="px-5 py-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-100">
                  <div className="rounded-xl overflow-hidden flex-shrink-0" style={{width:"48px", height:"48px", background:"#fff3e0"}}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{width:"48px", height:"48px", objectFit:"cover"}} />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">Rs. {item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-gray-100 rounded-full text-gray-700 font-bold text-sm">−</button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full text-white font-bold text-sm" style={{background:"#f97316"}}>+</button>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-16 text-right">Rs. {item.price * item.quantity}</span>
                </div>
              ))}
              <div className="py-4 flex justify-between items-center border-t border-gray-100 mt-1">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-xl" style={{color:"#f97316"}}>Rs. {getTotalPrice()}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">* Cash payment at table</p>
              <button onClick={handleOrder} disabled={orderLoading} className="w-full text-white py-4 rounded-2xl font-bold text-base mb-4 shadow-lg disabled:opacity-50" style={{background:"#f97316"}}>
                {orderLoading ? "⏳ Order ja raha hai..." : "✅ Order Place Karein"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}/ /   u p d a t e  
 
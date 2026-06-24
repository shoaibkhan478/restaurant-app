import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMenu } from "../../hooks/useMenu";
import { useCartStore } from "../../store/cartStore";
import { supabase } from "../../lib/supabase";

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
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#fff8f0"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"60px",marginBottom:"12px"}}>🍽️</div>
        <p style={{color:"#f97316",fontWeight:"600"}}>Menu load ho raha hai...</p>
      </div>
    </div>
  );

  if (orderPlaced) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f0fff4"}}>
      <div style={{textAlign:"center",padding:"0 32px"}}>
        <div style={{fontSize:"70px",marginBottom:"16px"}}>✅</div>
        <h1 style={{fontSize:"24px",fontWeight:"bold",color:"#1f2937"}}>Order Ho Gaya!</h1>
        <p style={{color:"#6b7280",marginTop:"8px"}}>Kitchen ko mil gaya, thoda wait karein</p>
        <p style={{fontSize:"14px",fontWeight:"bold",color:"#f97316",marginTop:"4px"}}>Table {tableId}</p>
        <button onClick={() => setOrderPlaced(false)} style={{marginTop:"24px",background:"#f97316",color:"white",padding:"12px 32px",borderRadius:"16px",fontWeight:"bold",border:"none",cursor:"pointer"}}>Aur Order Karein</button>
      </div>
    </div>
  );

  return (
    <div style={{background:"#f8f8f8",minHeight:"100vh",paddingBottom:"100px"}}>
      <div style={{background:"#f97316",padding:"16px 16px 0 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
          <div>
            <h1 style={{fontSize:"20px",fontWeight:"900",color:"white"}}>🍽️ Restaurant</h1>
            <p style={{fontSize:"12px",color:"rgba(255,255,255,0.8)",fontWeight:"500"}}>Table {tableId}</p>
          </div>
          {getTotalItems() > 0 && (
            <button onClick={() => setCartOpen(true)} style={{background:"white",color:"#f97316",padding:"8px 16px",borderRadius:"12px",fontSize:"14px",fontWeight:"bold",border:"none",cursor:"pointer"}}>
              🛒 {getTotalItems()} items
            </button>
          )}
        </div>
        <div style={{marginBottom:"12px"}}>
          <input type="text" placeholder="🔍 Search karein..." value={search} onChange={e => setSearch(e.target.value)}
            style={{width:"100%",padding:"10px 16px",borderRadius:"12px",border:"none",fontSize:"14px",background:"rgba(255,255,255,0.95)",boxSizing:"border-box"}} />
        </div>
        <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"12px",scrollbarWidth:"none"}}>
          <button onClick={() => setActiveCategory(null)}
            style={{padding:"6px 16px",borderRadius:"20px",fontSize:"14px",fontWeight:"bold",whiteSpace:"nowrap",border:"none",cursor:"pointer",background:!activeCategory?"white":"rgba(255,255,255,0.25)",color:!activeCategory?"#f97316":"white"}}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{padding:"6px 16px",borderRadius:"20px",fontSize:"14px",fontWeight:"bold",whiteSpace:"nowrap",border:"none",cursor:"pointer",background:activeCategory===cat.id?"white":"rgba(255,255,255,0.25)",color:activeCategory===cat.id?"#f97316":"white"}}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:"12px"}}>
        {filteredItems.length === 0 && (
          <div style={{textAlign:"center",padding:"64px 0",color:"#9ca3af"}}>
            <div style={{fontSize:"40px",marginBottom:"8px"}}>😕</div>
            <p>Koi item nahi mila</p>
          </div>
        )}
        {filteredItems.map(item => (
          <div key={item.id} style={{background:"white",borderRadius:"16px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",overflow:"hidden",display:"flex",minHeight:"100px"}}>
            <div style={{width:"100px",height:"100px",flexShrink:0,background:"#fff3e0",overflow:"hidden"}}>
              {item.image_url
                ? <img src={item.image_url} alt={item.name} style={{width:"100px",height:"100px",objectFit:"cover",display:"block"}} />
                : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px"}}>🍽️</div>
              }
            </div>
            <div style={{flex:1,padding:"12px",display:"flex",flexDirection:"column",justifyContent:"space-between",minWidth:0}}>
              <div>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                  <h3 style={{fontWeight:"bold",color:"#111827",fontSize:"14px",margin:0}}>{item.name}</h3>
                  {item.dietary_tags?.includes("Bestseller") && (
                    <span style={{fontSize:"11px",fontWeight:"bold",padding:"2px 8px",borderRadius:"20px",background:"#fff3e0",color:"#f97316",marginLeft:"4px",flexShrink:0}}>⭐ Best</span>
                  )}
                </div>
                <p style={{fontSize:"12px",color:"#9ca3af",marginTop:"4px"}}>{item.description}</p>
                <div style={{display:"flex",gap:"4px",marginTop:"4px",flexWrap:"wrap"}}>
                  {item.dietary_tags?.filter(t => t !== "Bestseller").map(tag => (
                    <span key={tag} style={{fontSize:"11px",padding:"2px 8px",borderRadius:"20px",background:"#f0fdf4",color:"#16a34a"}}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"8px"}}>
                <span style={{fontWeight:"900",fontSize:"16px",color:"#f97316"}}>Rs. {item.price}</span>
                <button onClick={() => addItem(item)} style={{background:"#f97316",color:"white",fontSize:"14px",padding:"6px 16px",borderRadius:"12px",fontWeight:"bold",border:"none",cursor:"pointer"}}>+ Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {getTotalItems() > 0 && (
        <div style={{position:"fixed",bottom:"16px",left:"12px",right:"12px",zIndex:20}}>
          <button onClick={() => setCartOpen(true)} style={{width:"100%",background:"#f97316",color:"white",padding:"16px 20px",borderRadius:"16px",fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"space-between",border:"none",cursor:"pointer"}}>
            <span style={{background:"white",color:"#f97316",fontSize:"12px",fontWeight:"bold",width:"28px",height:"28px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{getTotalItems()}</span>
            <span>🛒 Cart Dekhen</span>
            <span>Rs. {getTotalPrice()}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div style={{position:"fixed",inset:0,zIndex:50}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)"}} onClick={() => setCartOpen(false)} />
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"white",borderRadius:"24px 24px 0 0",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{position:"sticky",top:0,background:"white",padding:"20px 20px 12px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <h2 style={{fontSize:"18px",fontWeight:"bold",color:"#111827",margin:0}}>🛒 Aapka Order</h2>
                <p style={{fontSize:"12px",color:"#9ca3af",margin:0}}>Table {tableId}</p>
              </div>
              <button onClick={() => setCartOpen(false)} style={{background:"#f3f4f6",border:"none",cursor:"pointer",width:"32px",height:"32px",borderRadius:"50%",fontSize:"16px",color:"#6b7280"}}>✕</button>
            </div>
            <div style={{padding:"0 20px"}}>
              {cartItems.map(item => (
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 0",borderBottom:"1px solid #f3f4f6"}}>
                  <div style={{width:"48px",height:"48px",borderRadius:"12px",overflow:"hidden",flexShrink:0,background:"#fff3e0"}}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{width:"48px",height:"48px",objectFit:"cover"}} />
                      : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>🍽️</div>
                    }
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:"14px",fontWeight:"bold",color:"#111827",margin:0}}>{item.name}</p>
                    <p style={{fontSize:"12px",color:"#9ca3af",margin:0}}>Rs. {item.price} each</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{width:"28px",height:"28px",background:"#f3f4f6",border:"none",cursor:"pointer",borderRadius:"50%",fontWeight:"bold",fontSize:"14px"}}>−</button>
                    <span style={{fontSize:"14px",fontWeight:"bold",width:"16px",textAlign:"center"}}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{width:"28px",height:"28px",background:"#f97316",border:"none",cursor:"pointer",borderRadius:"50%",color:"white",fontWeight:"bold",fontSize:"14px"}}>+</button>
                  </div>
                  <span style={{fontSize:"14px",fontWeight:"bold",color:"#111827",width:"64px",textAlign:"right"}}>Rs. {item.price * item.quantity}</span>
                </div>
              ))}
              <div style={{padding:"16px 0",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #e5e7eb",marginTop:"4px"}}>
                <span style={{fontWeight:"bold",color:"#111827"}}>Total</span>
                <span style={{fontWeight:"900",fontSize:"20px",color:"#f97316"}}>Rs. {getTotalPrice()}</span>
              </div>
              <p style={{fontSize:"12px",color:"#9ca3af",marginBottom:"12px"}}>* Cash payment at table</p>
              <button onClick={handleOrder} disabled={orderLoading} style={{width:"100%",background:orderLoading?"#fdba74":"#f97316",color:"white",padding:"16px",borderRadius:"16px",fontWeight:"bold",fontSize:"16px",marginBottom:"16px",border:"none",cursor:"pointer"}}>
                {orderLoading ? "⏳ Order ja raha hai..." : "✅ Order Place Karein"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
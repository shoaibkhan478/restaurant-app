// import { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { supabase } from '../lib/supabase';

// export default function CustomerMenu() {
//   const { tableNumber } = useParams();
//   const [tableId, setTableId] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [items, setItems] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [cart, setCart] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [orderPlaced, setOrderPlaced] = useState(false);
//   const [placingOrder, setPlacingOrder] = useState(false);

//   useEffect(() => {
//     let cancelled = false;

//     const run = async () => {
//       setLoading(true);

//       const { data: table, error: tableError } = await supabase
//         .from('tables')
//         .select('id')
//         .eq('table_number', parseInt(tableNumber))
//         .single();

//       if (cancelled) return;
//       if (tableError || !table) {
//         setError('Table nahi mili. QR code check karein.');
//         setLoading(false);
//         return;
//       }
//       setTableId(table.id);

//       const { data: cats, error: catError } = await supabase
//         .from('menu_categories')
//         .select('*')
//         .order('display_order', { ascending: true });

//       if (cancelled) return;
//       if (catError) { setError('Menu load nahi hua.'); setLoading(false); return; }

//       setCategories(cats || []);

//       if (cats && cats.length > 0) {
//         setSelectedCategory(cats[0].id);
//         const { data: menuItems } = await supabase
//           .from('menu_items')
//           .select('*')
//           .eq('is_available', true);
//         if (!cancelled) setItems(menuItems || []);
//       }

//       setLoading(false);
//     };

//     run();
//     return () => { cancelled = true; };
//   }, [tableNumber]);

//   const filteredItems = items.filter(
//     (item) => item.category_id === selectedCategory
//   );

//   const addToCart = (item) => {
//     setCart((prev) => {
//       const existing = prev.find((c) => c.id === item.id);
//       if (existing) {
//         return prev.map((c) =>
//           c.id === item.id ? { ...c, qty: c.qty + 1 } : c
//         );
//       }
//       return [...prev, { ...item, qty: 1 }];
//     });
//   };

//   const removeFromCart = (itemId) => {
//     setCart((prev) => {
//       const existing = prev.find((c) => c.id === itemId);
//       if (existing && existing.qty > 1) {
//         return prev.map((c) =>
//           c.id === itemId ? { ...c, qty: c.qty - 1 } : c
//         );
//       }
//       return prev.filter((c) => c.id !== itemId);
//     });
//   };

//   const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
//   const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

//   const placeOrder = async () => {
//     if (cart.length === 0) return;
//     setPlacingOrder(true);
//     setError('');

//     const sessionId = 'sess_' + Date.now();

//     const { data: order, error: orderError } = await supabase
//       .from('orders')
//       .insert({
//         table_id: tableId,
//         status: 'pending',
//         total_amount: cartTotal,
//         customer_session_id: sessionId,
//       })
//       .select()
//       .single();

//     if (orderError) {
//       setError('Order place nahi hua: ' + orderError.message);
//       setPlacingOrder(false);
//       return;
//     }

//     const orderItems = cart.map((c) => ({
//       order_id: order.id,
//       item_id: c.id,
//       quantity: c.qty,
//       item_price: c.price,
//     }));

//     const { error: itemsError } = await supabase
//       .from('order_items')
//       .insert(orderItems);

//     if (itemsError) {
//       setError('Order items save nahi hue: ' + itemsError.message);
//       setPlacingOrder(false);
//       return;
//     }

//     setCart([]);
//     setOrderPlaced(true);
//     setPlacingOrder(false);
//   };

//   if (loading) return <div className="p-8 text-center">Menu load ho raha hai...</div>;

//   if (orderPlaced) {
//     return (
//       <div className="p-8 text-center max-w-md mx-auto mt-20">
//         <div className="text-5xl mb-4">✅</div>
//         <h1 className="text-2xl font-bold mb-2">Order Place Ho Gaya!</h1>
//         <p className="text-gray-500">Aapka order kitchen ko bhej diya gaya hai.</p>
//         <button
//           onClick={() => setOrderPlaced(false)}
//           className="mt-6 px-6 py-2 bg-blue-600 text-white rounded"
//         >
//           Dobara Order Karein
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto pb-40">
//       <div className="bg-blue-600 text-white p-6 text-center">
//         <h1 className="text-2xl font-bold">Our Menu</h1>
//         <p className="text-blue-100 text-sm mt-1">Table: {tableNumber}</p>
//       </div>

//       {error && (
//         <div className="bg-red-50 text-red-600 px-4 py-2 text-sm m-4 rounded">
//           {error}
//         </div>
//       )}

//       <div className="flex gap-2 p-4 overflow-x-auto">
//         {categories.map((cat) => (
//           <button
//             key={cat.id}
//             onClick={() => setSelectedCategory(cat.id)}
//             className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
//               selectedCategory === cat.id
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-100 text-gray-700'
//             }`}
//           >
//             {cat.name}
//           </button>
//         ))}
//       </div>

//       <div className="px-4 space-y-3">
//         {filteredItems.length === 0 && (
//           <p className="text-gray-500 text-sm text-center py-8">
//             Is category mein koi item nahi hai.
//           </p>
//         )}
//         {filteredItems.map((item) => {
//           const cartItem = cart.find((c) => c.id === item.id);
//           return (
//             <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
//               <div className="flex-1">
//                 <div className="flex items-center gap-2">
//                   <span className="font-medium">{item.name}</span>
//                   {item.is_special && (
//                     <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
//                       Special
//                     </span>
//                   )}
//                 </div>
//                 {item.description && (
//                   <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
//                 )}
//                 <p className="text-blue-600 font-semibold mt-1">Rs. {item.price}</p>
//               </div>
//               <div className="flex items-center gap-2 ml-4">
//                 {cartItem ? (
//                   <>
//                     <button
//                       onClick={() => removeFromCart(item.id)}
//                       className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold"
//                     >
//                       -
//                     </button>
//                     <span className="w-6 text-center font-medium">{cartItem.qty}</span>
//                     <button
//                       onClick={() => addToCart(item)}
//                       className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold"
//                     >
//                       +
//                     </button>
//                   </>
//                 ) : (
//                   <button
//                     onClick={() => addToCart(item)}
//                     className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium"
//                   >
//                     Add
//                   </button>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {cart.length > 0 && (
//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 max-w-2xl mx-auto">
//           <div className="flex justify-between items-center mb-3">
//             <span className="font-medium">{cartCount} items</span>
//             <span className="font-bold">Total: Rs. {cartTotal}</span>
//           </div>
//           <button
//             onClick={placeOrder}
//             disabled={placingOrder}
//             className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
//           >
//             {placingOrder ? 'Order place ho raha hai...' : 'Order Place Karein'}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function CustomerMenu() {
  const { tableNumber } = useParams();
  const [tableId, setTableId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('id')
        .eq('table_number', parseInt(tableNumber))
        .single();

      if (cancelled) return;
      if (tableError || !table) {
        setError('Table nahi mili. QR code check karein.');
        setLoading(false);
        return;
      }
      setTableId(table.id);

      const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (cancelled) return;
      if (catError) {
        setError('Menu load nahi hua.');
        setLoading(false);
        return;
      }

      setCategories(cats || []);

      if (cats && cats.length > 0) {
        setSelectedCategory(cats[0].id);
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true);
        if (!cancelled) setItems(menuItems || []);
      }

      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [tableNumber]);

  const filteredItems = items.filter((item) => item.category_id === selectedCategory);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map((c) => (c.id === itemId ? { ...c, qty: c.qty - 1 } : c));
      }
      return prev.filter((c) => c.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    setError('');

    const sessionId = 'sess_' + Date.now();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_id: tableId,
        status: 'pending',
        total_amount: cartTotal,
        customer_session_id: sessionId,
      })
      .select()
      .single();

    if (orderError) {
      setError('Order place nahi hua: ' + orderError.message);
      setPlacingOrder(false);
      return;
    }

    const orderItems = cart.map((c) => ({
      order_id: order.id,
      item_id: c.id,
      quantity: c.qty,
      item_price: c.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      setError('Order items save nahi hue: ' + itemsError.message);
      setPlacingOrder(false);
      return;
    }

    setCart([]);
    setOrderPlaced(true);
    setPlacingOrder(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-secondary">
        Menu load ho raha hai...
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">Order place ho gaya!</h1>
          <p className="text-text-secondary text-sm">
            Aapka order kitchen ko bhej diya gaya hai. Thodi der mein tayar ho jayega.
          </p>
          <button
            onClick={() => setOrderPlaced(false)}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Dobara order karein
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="bg-primary text-primary-foreground px-6 py-6 text-center">
        <h1 className="text-xl font-semibold">Khan's Kitchen</h1>
        <p className="text-sm opacity-90 mt-1">Table {tableNumber}</p>
      </div>

      {error && (
        <div className="bg-status-soldout/10 text-status-soldout px-4 py-2 m-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 px-4 py-4 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-text-secondary border border-border'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 max-w-md mx-auto">
        {filteredItems.length === 0 && (
          <p className="text-text-secondary text-sm text-center py-8">Is category mein koi item nahi hai.</p>
        )}

        {filteredItems.map((item) => {
          const cartItem = cart.find((c) => c.id === item.id);
          return (
            <div key={item.id} className="bg-surface border border-border rounded-lg p-4 flex justify-between items-center">
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{item.name}</span>
                  {item.is_special && (
                    <span className="text-xs bg-status-warning/10 text-status-warning px-2 py-0.5 rounded-full">
                      Special
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-text-secondary mt-0.5">{item.description}</p>
                )}
                <p className="text-primary-dark font-semibold mt-1 text-sm">Rs. {item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                {cartItem ? (
                  <>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full bg-background text-text-primary font-medium"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{cartItem.qty}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-sm p-4 max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-text-primary">{cartCount} items</span>
            <span className="font-semibold text-text-primary">Total: Rs. {cartTotal}</span>
          </div>
          <button
            onClick={placeOrder}
            disabled={placingOrder}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium disabled:opacity-60"
          >
            {placingOrder ? 'Order place ho raha hai...' : 'Order place karein'}
          </button>
        </div>
      )}
    </div>
  );
}
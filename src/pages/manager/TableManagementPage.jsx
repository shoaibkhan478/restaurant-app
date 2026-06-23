// import { useState, useEffect } from 'react';
// import { supabase } from '../../lib/supabase';
// import ManagerLayout from '../../components/manager/ManagerLayout';

// const STATUS_CONFIG = {
//   empty: { label: 'Empty', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: '⚪' },
//   received: { label: 'Order Placed', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: '🔵' },
//   preparing: { label: 'Preparing', color: 'bg-orange-50 text-orange-700 border-orange-200', dot: '🟠' },
//   ready: { label: 'Ready', color: 'bg-green-50 text-green-700 border-green-200', dot: '🟢' },
// };

// export default function TableManagementPage() {
//   const [tables, setTables] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [selectedTable, setSelectedTable] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchData = async () => {
//     const { data: tablesData } = await supabase
//       .from('tables')
//       .select('*')
//       .order('table_number');

//     const { data: ordersData } = await supabase
//       .from('orders')
//       .select(`
//         id, status, created_at, total_amount, table_id,
//         order_items (
//           id, quantity, item_price,
//           menu_items (name)
//         )
//       `)
//       .in('status', ['received', 'preparing', 'ready']);

//     setTables(tablesData || []);
//     setOrders(ordersData || []);
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchData();
//     const channel = supabase
//       .channel('tables-realtime')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
//       .subscribe();
//     return () => supabase.removeChannel(channel);
//   }, []);

//   const getTableOrder = (tableId) => orders.find(o => o.table_id === tableId);

//   const getTableStatus = (table) => {
//     const order = getTableOrder(table.id);
//     if (!order) return 'empty';
//     return order.status;
//   };

//   const resetTable = async (tableId) => {
//     if (!confirm('Table reset karein?')) return;
//     const order = getTableOrder(tableId);
//     if (order) {
//       await supabase.from('orders').update({ status: 'served' }).eq('id', order.id);
//     }
//     setSelectedTable(null);
//     fetchData();
//   };

//   if (loading) return (
//     <ManagerLayout>
//       <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
//     </ManagerLayout>
//   );

//   return (
//     <ManagerLayout>
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-slate-900">Table Management</h1>
//         <p className="text-slate-500 text-sm mt-1">Live table status — {tables.length} tables</p>
//       </div>

//       <div className="grid grid-cols-4 gap-4 mb-6">
//         {['empty', 'received', 'preparing', 'ready'].map(status => (
//           <div key={status} className="bg-white rounded-xl border border-slate-200 p-4">
//             <p className="text-xs text-slate-500">{STATUS_CONFIG[status]?.label}</p>
//             <p className="text-2xl font-bold text-slate-900 mt-1">
//               {tables.filter(t => getTableStatus(t) === status).length}
//             </p>
//           </div>
//         ))}
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//         {tables.map(table => {
//           const status = getTableStatus(table);
//           const config = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
//           const order = getTableOrder(table.id);

//           return (
//             <div
//               key={table.id}
//               onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
//               className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition hover:shadow-md ${config.color}`}
//             >
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-lg font-bold">Table {table.table_number}</span>
//                 <span>{config.dot}</span>
//               </div>
//               <p className="text-xs font-medium">{config.label}</p>
//               <p className="text-xs mt-1 opacity-70">{table.seats} seats</p>
//               {order && (
//                 <p className="text-xs mt-2 font-semibold">Rs. {order.total_amount || 0}</p>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       {selectedTable && (
//         <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl p-6 overflow-y-auto z-50">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-lg font-bold">Table {selectedTable.table_number}</h2>
//             <button onClick={() => setSelectedTable(null)} className="text-slate-400 text-xl">✕</button>
//           </div>

//           {(() => {
//             const order = getTableOrder(selectedTable.id);
//             if (!order) return (
//               <div className="text-center py-8 text-slate-400">
//                 <div className="text-4xl mb-2">🪑</div>
//                 <p>Table khali hai</p>
//               </div>
//             );
//             return (
//               <div>
//                 <div className="bg-slate-50 rounded-xl p-3 mb-4">
//                   <p className="text-xs text-slate-500">Status</p>
//                   <p className="font-semibold capitalize mt-1">{order.status}</p>
//                 </div>
//                 <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Items</h3>
//                 <div className="space-y-2 mb-4">
//                   {order.order_items?.map(item => (
//                     <div key={item.id} className="flex justify-between text-sm">
//                       <span>{item.quantity}x {item.menu_items?.name}</span>
//                       <span className="text-slate-500">Rs. {item.item_price * item.quantity}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="border-t pt-3 mb-4">
//                   <div className="flex justify-between font-bold">
//                     <span>Total</span>
//                     <span>Rs. {order.total_amount}</span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => resetTable(selectedTable.id)}
//                   className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-semibold"
//                 >
//                   🔄 Reset Table
//                 </button>
//               </div>
//             );
//           })()}
//         </div>
//       )}
//     </ManagerLayout>
//   );
// }

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ManagerLayout from '../../components/manager/ManagerLayout';

const STATUS_CONFIG = {
  empty: { label: 'Empty', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: '⚪' },
  received: { label: 'Order Placed', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: '🔵' },
  preparing: { label: 'Preparing', color: 'bg-orange-50 text-orange-700 border-orange-200', dot: '🟠' },
  ready: { label: 'Ready', color: 'bg-green-50 text-green-700 border-green-200', dot: '🟢' },
};

export default function TableManagementPage() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: tablesData } = await supabase
      .from('tables').select('*').order('table_number');
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`id, status, created_at, total_amount, table_id,
        order_items (id, quantity, item_price, menu_items (name))`)
      .in('status', ['received', 'preparing', 'ready']);
    setTables(tablesData || []);
    setOrders(ordersData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const getTableOrder = (tableId) => orders.find(o => o.table_id === tableId);
  const getTableStatus = (table) => {
    const order = getTableOrder(table.id);
    return order ? order.status : 'empty';
  };

  const resetTable = async (tableId) => {
    if (!confirm('Table reset karein?')) return;
    const order = getTableOrder(tableId);
    if (order) await supabase.from('orders').update({ status: 'served' }).eq('id', order.id);
    setSelectedTable(null);
    fetchData();
  };

  if (loading) return <ManagerLayout><div className="flex items-center justify-center h-64 text-slate-400">Loading...</div></ManagerLayout>;

  return (
    <ManagerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Table Management</h1>
        <p className="text-slate-500 text-sm mt-1">{tables.length} tables total</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {['empty', 'received', 'preparing', 'ready'].map(status => (
          <div key={status} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{STATUS_CONFIG[status]?.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {tables.filter(t => getTableStatus(t) === status).length}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map(table => {
          const status = getTableStatus(table);
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
          const order = getTableOrder(table.id);
          return (
            <div key={table.id}
              onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
              className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition hover:shadow-md ${config.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">Table {table.table_number}</span>
                <span>{config.dot}</span>
              </div>
              <p className="text-xs font-medium">{config.label}</p>
              <p className="text-xs mt-1 opacity-70">{table.seats} seats</p>
              {order && <p className="text-xs mt-2 font-semibold">Rs. {order.total_amount || 0}</p>}
            </div>
          );
        })}
      </div>

      {selectedTable && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl p-6 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Table {selectedTable.table_number}</h2>
            <button onClick={() => setSelectedTable(null)} className="text-slate-400 text-xl">✕</button>
          </div>
          {(() => {
            const order = getTableOrder(selectedTable.id);
            if (!order) return (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">🪑</div>
                <p>Table khali hai</p>
              </div>
            );
            return (
              <div>
                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="font-semibold capitalize mt-1">{order.status}</p>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Items</h3>
                <div className="space-y-2 mb-4">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menu_items?.name}</span>
                      <span className="text-slate-500">Rs. {item.item_price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 mb-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>Rs. {order.total_amount}</span>
                  </div>
                </div>
                <button onClick={() => resetTable(selectedTable.id)}
                  className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-semibold">
                  🔄 Reset Table
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </ManagerLayout>
  );
}
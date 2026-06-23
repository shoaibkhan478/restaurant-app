import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, created_at, total_amount,
        tables (table_number),
        order_items (
          id, quantity, notes, item_price,
          menu_items (name)
        )
      `)
      .in('status', ['received', 'preparing'])
      .order('created_at', { ascending: true });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  const getTimerColor = (createdAt) => {
    const mins = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (mins < 10) return 'text-green-400 bg-green-900/30';
    if (mins < 20) return 'text-amber-400 bg-amber-900/30';
    return 'text-red-400 bg-red-900/30 animate-pulse';
  };

  const getElapsed = (createdAt) => {
    const total = Math.floor((new Date() - new Date(createdAt)) / 1000);
    return `${Math.floor(total / 60)}m ${total % 60}s`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍🍳</div>
        <p>Orders load ho rahe hain...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍🍳</span>
          <div>
            <h1 className="text-lg font-bold">Kitchen Display</h1>
            <p className="text-xs text-slate-400">{orders.length} active orders</p>
          </div>
        </div>
        <p className="text-xl font-mono font-bold text-amber-400">
          {currentTime.toLocaleTimeString()}
        </p>
      </div>

      <div className="p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl font-semibold">Sab orders complete!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">Table {order.tables?.table_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === 'received' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {order.status === 'received' ? '🔵 Received' : '🟡 Preparing'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-mono font-bold ${getTimerColor(order.created_at)}`}>
                    ⏱ {getElapsed(order.created_at)}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.quantity}
                      </span>
                      <span className="text-sm text-slate-200 flex-1">{item.menu_items?.name}</span>
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  {order.status === 'received' && (
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      🍳 Preparing Shuru
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      ✅ Ready Hai!
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
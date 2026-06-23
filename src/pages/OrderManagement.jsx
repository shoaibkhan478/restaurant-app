import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let query = supabase
        .from('orders')
        .select('*, order_items(id, quantity, item_price, notes, menu_items(name))')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error: fetchError } = await query;

      if (cancelled) return;

      if (fetchError) {
        setError('Orders load failed: ' + fetchError.message);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [filterStatus]);

  const fetchOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*, order_items(id, quantity, item_price, notes, menu_items(name))')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError('Orders load failed: ' + fetchError.message);
    } else {
      setOrders(data || []);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateError) {
      setError('Status update failed: ' + updateError.message);
    } else {
      fetchOrders();
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-red-100 text-red-700',
      preparing: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const nextStatus = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'completed',
  };

  const nextStatusLabel = {
    pending: 'Mark Preparing',
    preparing: 'Mark Ready',
    ready: 'Mark Completed',
  };

  const statuses = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'];

  if (loading) {
    return <div className="p-8 text-center">Loading orders...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded text-sm"
          >
            Back
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={
              'px-4 py-2 rounded-full text-sm font-medium capitalize ' +
              (filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700')
            }
          >
            {s}
          </button>
        ))}
      </div>

      {orders.length === 0 && (
        <p className="text-gray-500 text-center py-12">No orders found.</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-bold text-lg">
                  Order #{order.id.slice(-6).toUpperCase()}
                </span>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={'text-xs px-3 py-1 rounded-full font-semibold capitalize ' + getStatusBadge(order.status)}>
                  {order.status}
                </span>
                <span className="font-bold text-gray-800">
                  Rs. {order.total_amount}
                </span>
              </div>
            </div>

            <div className="border-t pt-3 mb-3">
              {order.order_items && order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>
                    <span className="font-medium">{item.quantity}x </span>
                    {item.menu_items ? item.menu_items.name : 'Unknown Item'}
                    {item.notes ? (
                      <span className="text-orange-500 italic ml-2">({item.notes})</span>
                    ) : null}
                  </span>
                  <span className="text-gray-600">Rs. {item.item_price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {nextStatus[order.status] && (
                <button
                  onClick={() => updateStatus(order.id, nextStatus[order.status])}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
                >
                  {nextStatusLabel[order.status]}
                </button>
              )}
              {order.status !== 'cancelled' && order.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(order.id, 'cancelled')}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded text-sm font-medium"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
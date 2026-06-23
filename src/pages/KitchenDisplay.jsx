import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/shared/DashboardLayout';

function timeAgo(createdAt) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  return mins < 1 ? 'Abhi' : `${mins} min`;
}

function urgencyStyle(createdAt, status) {
  if (status === 'ready') return { bg: '#E1F5EE', text: '#085041' };
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins >= 12) return { bg: '#FCEBEB', text: '#791F1F' };
  if (mins >= 6) return { bg: '#FAEEDA', text: '#854F0B' };
  return { bg: '#E1F5EE', text: '#085041' };
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, created_at, tables(table_number), order_items(id, quantity, menu_items(name))')
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError('Orders load nahi hue: ' + fetchError.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    loadOrders();

    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (!cancelled) loadOrders();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const advanceStatus = async (order) => {
    const next =
      order.status === 'pending' ? 'preparing' : order.status === 'preparing' ? 'ready' : 'served';
    const { error: updateError } = await supabase.from('orders').update({ status: next }).eq('id', order.id);
    if (!updateError) loadOrders();
  };

  if (loading) {
    return (
      <DashboardLayout title="Kitchen Display">
        <p className="text-text-secondary text-sm">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kitchen Display" subtitle="Live orders, sabse purana order pehle">
      {error && (
        <div className="bg-status-soldout/10 text-status-soldout px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {orders.length === 0 && (
        <p className="text-text-secondary text-sm">Abhi koi active order nahi hai.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {orders.map((order) => {
          const style = urgencyStyle(order.created_at, order.status);
          const buttonLabel =
            order.status === 'pending'
              ? 'Start preparing'
              : order.status === 'preparing'
              ? 'Mark ready'
              : 'Mark served';
          return (
            <div key={order.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-text-primary">
                  Table {order.tables?.table_number ?? '-'}
                </p>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ background: style.bg, color: style.text }}
                >
                  {order.status === 'ready' ? 'Ready' : timeAgo(order.created_at)}
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                {(order.order_items || []).map((oi) => (
                  <span key={oi.id}>
                    {oi.quantity}x {oi.menu_items?.name ?? 'Item'}
                    <br />
                  </span>
                ))}
              </p>
              <button
                onClick={() => advanceStatus(order)}
                className="w-full bg-background text-text-primary text-sm font-medium py-2 rounded-md hover:bg-primary/10"
              >
                {buttonLabel}
              </button>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ManagerLayout from '../../components/manager/ManagerLayout';

export default function ReportsPage() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, avgOrder: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, tables(table_number), order_items(quantity, menu_items(name))')
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    if (orders) {
      const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setStats({ revenue, orders: orders.length, avgOrder: orders.length ? Math.round(revenue / orders.length) : 0 });
      setRecentOrders(orders.slice(0, 10));
      const itemCount = {};
      orders.forEach(o => {
        o.order_items?.forEach(i => {
          const name = i.menu_items?.name || 'Unknown';
          itemCount[name] = (itemCount[name] || 0) + i.quantity;
        });
      });
      setTopItems(Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 5));
    }
    setLoading(false);
  };

  if (loading) return <ManagerLayout><div className="flex items-center justify-center h-64 text-slate-400">Loading...</div></ManagerLayout>;

  return (
    <ManagerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Aaj ka overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">Aaj ki Revenue</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">Rs. {stats.revenue}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">Total Orders</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.orders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">Average Order</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">Rs. {stats.avgOrder}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Aaj koi order nahi</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Table {order.tables?.table_number}</p>
                    <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">Rs. {order.total_amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'served' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Top Selling Items</h2>
          {topItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Koi data nahi</div>
          ) : (
            <div className="space-y-3">
              {topItems.map(([name, count], index) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                  <span className="flex-1 text-sm text-slate-700">{name}</span>
                  <span className="text-sm font-bold text-slate-900">{count} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}

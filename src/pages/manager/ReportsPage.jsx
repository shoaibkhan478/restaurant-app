import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ManagerLayout from '../../components/manager/ManagerLayout';

export default function ReportsPage() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, avgOrder: 0 });
  const [tableOrders, setTableOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, tables(table_number), order_items(quantity, menu_items(name, price))')
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    if (orders) {
      const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setStats({ revenue, orders: orders.length, avgOrder: orders.length ? Math.round(revenue / orders.length) : 0 });

      // Group by table
      const tableMap = {};
      orders.forEach(o => {
        const tNum = o.tables?.table_number || 'Unknown';
        if (!tableMap[tNum]) {
          tableMap[tNum] = { table_number: tNum, total: 0, dishes: {}, orders: [], status: o.status };
        }
        tableMap[tNum].total += o.total_amount || 0;
        tableMap[tNum].orders.push(o);
        o.order_items?.forEach(i => {
          const name = i.menu_items?.name || 'Unknown';
          const price = i.menu_items?.price || 0;
          if (!tableMap[tNum].dishes[name]) {
            tableMap[tNum].dishes[name] = { qty: 0, price };
          }
          tableMap[tNum].dishes[name].qty += i.quantity;
        });
      });

      setTableOrders(Object.values(tableMap).sort((a, b) => a.table_number - b.table_number));

      // Top items
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

      {/* Stats */}
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
        {/* Table wise orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Tables ka Bill</h2>
          {tableOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Aaj koi order nahi</div>
          ) : (
            <div className="space-y-3">
              {tableOrders.map(table => (
                <div
                  key={table.table_number}
                  onClick={() => setSelectedTable(selectedTable?.table_number === table.table_number ? null : table)}
                  className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-amber-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Table {table.table_number}</p>
                      <p className="text-xs text-slate-400">{Object.keys(table.dishes).length} dishes · {table.orders.length} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">Rs. {table.total}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${table.status === 'served' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {table.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded bill */}
                  {selectedTable?.table_number === table.table_number && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Bill Details</p>
                      {Object.entries(table.dishes).map(([name, { qty, price }]) => (
                        <div key={name} className="flex justify-between text-sm py-1">
                          <span className="text-slate-700">{name} × {qty}</span>
                          <span className="font-medium text-slate-900">Rs. {price * qty}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-amber-600">Rs. {table.total}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Items */}
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
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/shared/DashboardLayout';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, totalTables: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', todayStart.toISOString());

      const { data: tables } = await supabase.from('tables').select('id');

      if (cancelled) return;

      const revenue = (todayOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const pending = (todayOrders || []).filter(
        (o) => o.status === 'pending' || o.status === 'preparing'
      ).length;

      setStats({
        todayOrders: todayOrders ? todayOrders.length : 0,
        todayRevenue: revenue,
        totalTables: tables ? tables.length : 0,
        pendingOrders: pending,
      });
      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout title="Welcome, Shoaib" subtitle="Apna restaurant yahan se manage karein">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Today's orders" value={loading ? '...' : stats.todayOrders} />
        <StatCard label="Today's revenue" value={loading ? '...' : `Rs. ${stats.todayRevenue}`} />
        <StatCard label="Total tables" value={loading ? '...' : stats.totalTables} />
        <StatCard label="Pending orders" value={loading ? '...' : stats.pendingOrders} highlight />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/menu-management" className="block p-5 bg-surface border border-border rounded-lg hover:border-primary transition">
          <h2 className="font-medium text-text-primary mb-1">Menu categories</h2>
          <p className="text-sm text-text-secondary">Starters, mains, drinks vagaira</p>
        </Link>
        <Link to="/menu-items" className="block p-5 bg-surface border border-border rounded-lg hover:border-primary transition">
          <h2 className="font-medium text-text-primary mb-1">Menu items</h2>
          <p className="text-sm text-text-secondary">Food items add ya edit karein</p>
        </Link>
        <Link to="/table-management" className="block p-5 bg-surface border border-border rounded-lg hover:border-primary transition">
          <h2 className="font-medium text-text-primary mb-1">Tables</h2>
          <p className="text-sm text-text-secondary">Restaurant tables manage karein</p>
        </Link>
        <Link to="/order-management" className="block p-5 bg-surface border border-border rounded-lg hover:border-primary transition">
          <h2 className="font-medium text-text-primary mb-1">Orders</h2>
          <p className="text-sm text-text-secondary">Live orders dekhein</p>
        </Link>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-status-preparing/10' : 'bg-background'}`}>
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}
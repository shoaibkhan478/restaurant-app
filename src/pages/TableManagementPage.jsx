import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ManagerLayout from '../../components/manager/ManagerLayout';

const STATUS_CONFIG = {
  empty:    { label: 'Empty',        color: 'bg-slate-100 text-slate-600 border-slate-200',  dot: '⚪' },
  received: { label: 'Order Placed', color: 'bg-blue-50 text-blue-700 border-blue-200',      dot: '🔵' },
  preparing:{ label: 'Preparing',    color: 'bg-orange-50 text-orange-700 border-orange-200',dot: '🟠' },
  ready:    { label: 'Ready',        color: 'bg-green-50 text-green-700 border-green-200',   dot: '🟢' },
};

export default function TableManagementPage() {
  const [tables, setTables]             = useState([]);
  const [orders, setOrders]             = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading]           = useState(true);

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

  const getTableOrder  = (tableId) => orders.find(o => o.table_id === tableId);
  const getTableStatus = (table)   => {
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

  if (loading) return (
    <ManagerLayout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:256, color:'#94a3b8' }}>
        Loading...
      </div>
    </ManagerLayout>
  );

  return (
    <ManagerLayout>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .tables-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .stats-grid  { grid-template-columns: repeat(4, 1fr); }
          .tables-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .tables-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .table-card {
          background: white;
          border-radius: 16px;
          border-width: 2px;
          border-style: solid;
          padding: 14px;
          cursor: pointer;
          transition: box-shadow 0.15s;
        }
        .table-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

        .stat-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 12px 14px;
        }

        .detail-panel {
          position: fixed;
          right: 0; top: 0;
          height: 100%;
          width: 300px;
          background: white;
          border-left: 1px solid #e2e8f0;
          box-shadow: -4px 0 20px rgba(0,0,0,0.08);
          padding: 24px;
          overflow-y: auto;
          z-index: 200;
        }
        @media (max-width: 480px) {
          .detail-panel {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e2e8f0;
            top: auto;
            bottom: 0;
            height: 70vh;
            border-radius: 20px 20px 0 0;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Table Management</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{tables.length} tables total</p>
      </div>

      {/* Stats — 2 cols mobile, 4 cols desktop */}
      <div className="stats-grid">
        {['empty', 'received', 'preparing', 'ready'].map(status => (
          <div key={status} className="stat-card">
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{STATUS_CONFIG[status]?.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
              {tables.filter(t => getTableStatus(t) === status).length}
            </p>
          </div>
        ))}
      </div>

      {/* Tables grid — 2 cols mobile, 3 tablet, 4 desktop */}
      <div className="tables-grid">
        {tables.map(table => {
          const status = getTableStatus(table);
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
          const order  = getTableOrder(table.id);

          // extract border color from tailwind class string for inline style
          const borderColorMap = {
            empty:     '#e2e8f0',
            received:  '#bfdbfe',
            preparing: '#fed7aa',
            ready:     '#bbf7d0',
          };
          const bgColorMap = {
            empty:     '#f8fafc',
            received:  '#eff6ff',
            preparing: '#fff7ed',
            ready:     '#f0fdf4',
          };
          const textColorMap = {
            empty:     '#475569',
            received:  '#1d4ed8',
            preparing: '#c2410c',
            ready:     '#15803d',
          };

          return (
            <div
              key={table.id}
              className="table-card"
              onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
              style={{
                borderColor: borderColorMap[status],
                background:  bgColorMap[status],
                color:       textColorMap[status],
              }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Table {table.table_number}</span>
                <span style={{ fontSize: 16 }}>{config.dot}</span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>{config.label}</p>
              <p style={{ fontSize: 11, margin: '4px 0 0', opacity: 0.7 }}>{table.seats} seats</p>
              {order && (
                <p style={{ fontSize: 12, fontWeight: 700, margin: '8px 0 0' }}>
                  Rs. {order.total_amount || 0}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedTable && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSelectedTable(null)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', zIndex:199 }}
          />
          <div className="detail-panel">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Table {selectedTable.table_number}</h2>
              <button
                onClick={() => setSelectedTable(null)}
                style={{ background:'#f1f5f9', border:'none', borderRadius: 8, width: 32, height: 32, cursor:'pointer', fontSize: 16 }}
              >✕</button>
            </div>

            {(() => {
              const order = getTableOrder(selectedTable.id);
              if (!order) return (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🪑</div>
                  <p style={{ margin: 0 }}>Table khali hai</p>
                </div>
              );
              return (
                <div>
                  <div style={{ background:'#f8fafc', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color:'#64748b', margin: 0 }}>Status</p>
                    <p style={{ fontWeight: 600, textTransform:'capitalize', margin: '4px 0 0' }}>{order.status}</p>
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 600, color:'#374151', marginBottom: 10 }}>Order Items</p>
                  <div style={{ display:'flex', flexDirection:'column', gap: 8, marginBottom: 16 }}>
                    {order.order_items?.map(item => (
                      <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize: 13 }}>
                        <span>{item.quantity}x {item.menu_items?.name}</span>
                        <span style={{ color:'#64748b' }}>Rs. {item.item_price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop:'1px solid #e2e8f0', paddingTop: 12, marginBottom: 16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontWeight: 700 }}>
                      <span>Total</span>
                      <span>Rs. {order.total_amount}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => resetTable(selectedTable.id)}
                    style={{
                      width:'100%', background:'#fff1f2', color:'#dc2626',
                      border:'1px solid #fecaca', borderRadius: 12,
                      padding:'11px 0', fontSize: 13, fontWeight: 600, cursor:'pointer'
                    }}
                  >
                    🔄 Reset Table
                  </button>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </ManagerLayout>
  );
}

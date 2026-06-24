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
    const { data } = await supabase
      .from('orders')
      .select(`id, status, created_at, total_amount, tables(table_number), order_items(id, quantity, menu_items(name))`)
      .in('status', ['received', 'preparing'])
      .order('created_at', { ascending: true });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  const getElapsed = (createdAt) => {
    const total = Math.floor((new Date() - new Date(createdAt)) / 1000);
    return `${Math.floor(total / 60)}m ${total % 60}s`;
  };

  const getTimerStyle = (createdAt) => {
    const mins = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (mins < 10) return { background: 'rgba(34,197,94,0.2)', color: '#4ade80' };
    if (mins < 20) return { background: 'rgba(251,191,36,0.2)', color: '#fbbf24' };
    return { background: 'rgba(239,68,68,0.2)', color: '#f87171' };
  };

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f172a',color:'white'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>👨‍🍳</div>
        <p>Orders load ho rahe hain...</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'white'}}>
      {/* Header */}
      <div style={{background:'#1e293b',borderBottom:'1px solid #334155',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'28px'}}>👨‍🍳</span>
          <div>
            <h1 style={{fontSize:'18px',fontWeight:'bold',margin:0}}>Kitchen Display</h1>
            <p style={{fontSize:'12px',color:'#94a3b8',margin:0}}>{orders.length} active orders</p>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <p style={{fontSize:'24px',fontWeight:'bold',color:'#fbbf24',margin:0,fontFamily:'monospace'}}>
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div style={{padding:'16px'}}>
        {orders.length === 0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',color:'#475569'}}>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>✅</div>
            <p style={{fontSize:'20px',fontWeight:'600'}}>Sab orders complete!</p>
            <p style={{fontSize:'14px',marginTop:'8px'}}>Koi pending order nahi</p>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:'16px'}}>
            {orders.map(order => (
              <div key={order.id} style={{background:'#1e293b',borderRadius:'16px',border:'1px solid #334155',overflow:'hidden'}}>
                {/* Card Header */}
                <div style={{padding:'12px 16px',borderBottom:'1px solid #334155',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontSize:'18px',fontWeight:'bold'}}>Table {order.tables?.table_number}</span>
                    <span style={{
                      fontSize:'11px',padding:'3px 8px',borderRadius:'20px',fontWeight:'600',
                      background: order.status === 'received' ? 'rgba(59,130,246,0.2)' : 'rgba(251,191,36,0.2)',
                      color: order.status === 'received' ? '#60a5fa' : '#fbbf24'
                    }}>
                      {order.status === 'received' ? '🔵 Naya' : '🟡 Ban Raha Hai'}
                    </span>
                  </div>
                  <span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'20px',fontWeight:'bold',fontFamily:'monospace',...getTimerStyle(order.created_at)}}>
                    ⏱ {getElapsed(order.created_at)}
                  </span>
                </div>

                {/* Items */}
                <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:'8px'}}>
                  {order.order_items?.map(item => (
                    <div key={item.id} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{width:'28px',height:'28px',background:'#f97316',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'bold',flexShrink:0}}>
                        {item.quantity}
                      </span>
                      <span style={{fontSize:'14px',color:'#e2e8f0'}}>{item.menu_items?.name}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div style={{padding:'0 16px 16px'}}>
                  {order.status === 'received' && (
                    <button onClick={() => updateStatus(order.id, 'preparing')}
                      style={{width:'100%',background:'#f97316',color:'white',padding:'10px',borderRadius:'12px',fontSize:'14px',fontWeight:'bold',border:'none',cursor:'pointer'}}>
                      🍳 Banana Shuru Karo
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => updateStatus(order.id, 'ready')}
                      style={{width:'100%',background:'#22c55e',color:'white',padding:'10px',borderRadius:'12px',fontSize:'14px',fontWeight:'bold',border:'none',cursor:'pointer'}}>
                      ✅ Ready Hai — Serve Karo!
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
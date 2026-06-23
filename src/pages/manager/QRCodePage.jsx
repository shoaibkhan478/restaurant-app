import { useEffect, useRef, useState } from 'react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { supabase } from '../../lib/supabase';
import QRCode from 'qrcode';

export default function QRCodePage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl] = useState(window.location.origin);
  const canvasRefs = useRef({});

  useEffect(() => {
    supabase.from('tables').select('*').order('table_number').then(({ data }) => {
      setTables(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    tables.forEach(table => {
      const canvas = canvasRefs.current[table.id];
      if (canvas) {
        QRCode.toCanvas(canvas, `${baseUrl}/menu/${table.table_number}`, {
          width: 200, margin: 2,
          color: { dark: '#1e293b', light: '#ffffff' }
        });
      }
    });
  }, [tables]);

  const downloadQR = (table) => {
    const canvas = canvasRefs.current[table.id];
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `table-${table.table_number}-qr.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (loading) return <ManagerLayout><div className="flex items-center justify-center h-64 text-slate-400">Loading...</div></ManagerLayout>;

  return (
    <ManagerLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QR Codes</h1>
          <p className="text-slate-500 text-sm mt-1">Customer in yeh scan karke order dete hain</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition">
          🖨️ Print All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-xs text-slate-500 mb-1">Scan to order</p>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Table {table.table_number}</h3>
            <div className="flex justify-center mb-4">
              <canvas ref={el => canvasRefs.current[table.id] = el} className="rounded-xl" />
            </div>
            <p className="text-xs text-slate-400 mb-3 break-all">{baseUrl}/menu/{table.table_number}</p>
            <button onClick={() => downloadQR(table)}
              className="w-full bg-amber-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
              ⬇️ Download
            </button>
          </div>
        ))}
      </div>
    </ManagerLayout>
  );
}
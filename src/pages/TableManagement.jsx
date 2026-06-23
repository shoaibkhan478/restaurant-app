import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

export default function TableManagement() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [seats, setSeats] = useState(4);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const { data, error: fetchError } = await supabase
        .from('tables')
        .select('*')
        .order('table_number', { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError('Tables load nahi hue: ' + fetchError.message);
      } else {
        setTables(data || []);
      }
      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;

    const exists = tables.some((t) => t.table_number === parseInt(tableNumber));
    if (exists) {
      setError('Yeh table number pehle se mojood hai.');
      return;
    }

    const { data, error: insertError } = await supabase
      .from('tables')
      .insert({
        table_number: parseInt(tableNumber),
        name: 'Table ' + tableNumber,
        seats: parseInt(seats),
        capacity: parseInt(seats),
        status: 'available',
      })
      .select()
      .single();

    if (insertError) {
      setError('Table add nahi hua: ' + insertError.message);
    } else {
      setTables([...tables, data].sort((a, b) => a.table_number - b.table_number));
      setTableNumber('');
      setSeats(4);
      setError('');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Is table ko delete karna chahte hain?');
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError('Delete nahi hua: ' + deleteError.message);
    } else {
      setTables(tables.filter((t) => t.id !== id));
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Table Management</h1>
        <button onClick={() => navigate(-1)} className="text-sm underline text-text-secondary">
          Wapas Jayein
        </button>
      </div>

      {error && (
        <div className="bg-status-soldout/10 text-status-soldout px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <Input
          type="number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Table Number (e.g. 1, 2, 3)"
          min="1"
          required
          className="flex-1"
        />
        <Input
          type="number"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          placeholder="Seats"
          min="1"
          max="20"
          className="w-20"
        />
        <Button type="submit">Add</Button>
      </form>

      <div className="space-y-2">
        {tables.length === 0 && (
          <p className="text-text-secondary text-sm">Abhi tak koi table nahi bani.</p>
        )}
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">Table {table.table_number}</span>
              <span className="text-sm text-text-secondary">
                ({table.seats || table.capacity} seats)
              </span>
              <Badge
                className={
                  table.status === 'available'
                    ? 'bg-status-ready/10 text-status-ready hover:bg-status-ready/10'
                    : 'bg-status-soldout/10 text-status-soldout hover:bg-status-soldout/10'
                }
              >
                {table.status || 'available'}
              </Badge>
            </div>
            <button onClick={() => handleDelete(table.id)} className="text-sm text-status-soldout">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
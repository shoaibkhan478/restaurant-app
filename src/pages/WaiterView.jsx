import { useAuthStore } from '../store/authStore';

export default function WaiterView() {
  const { logout } = useAuthStore();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Waiter View</h1>
      <p className="text-text-secondary mt-2">Assigned tables will appear here.</p>
      <button onClick={logout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Logout</button>
    </div>
  );
}
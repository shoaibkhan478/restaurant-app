export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500">403</h1>
        <p className="text-gray-600 mt-2">Aap ko yahan access nahi hai.</p>
        <a href="/login" className="mt-4 inline-block text-amber-600 underline">Login page pe jao</a>
      </div>
    </div>
  );
}
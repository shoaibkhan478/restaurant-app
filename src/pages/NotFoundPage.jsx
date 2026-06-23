export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-700">404</h1>
        <p className="text-gray-600 mt-2">Yeh page nahi mila.</p>
        <a href="/" className="mt-4 inline-block text-amber-600 underline">Wapas jao</a>
      </div>
    </div>
  );
}
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <button
        onClick={handleGoHome}
        className="text-4xl font-bold text-slate-900 hover:text-slate-700"
      >
        404 - Page Not Found
      </button>
    </div>
  );
}

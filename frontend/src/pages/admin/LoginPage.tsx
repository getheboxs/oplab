import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, ShieldCheck, User } from "lucide-react";
import { loginAdmin } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { token, admin } = await loginAdmin(username, password);
      setSession(token, admin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
            <ShieldCheck className="h-6 w-6 text-purple-600" strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">Portal Admin</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Masuk untuk mengelola praktikum, memantau peserta, dan mengunduh
            rekapitulasi data.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <User className="h-4 w-4 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Memeriksa..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-slate-400">
          Khusus Dosen, Laboran &amp; Asisten
        </p>
      </div>
    </div>
  );
}

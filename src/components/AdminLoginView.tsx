import React, { useState } from "react";
import { Shield, ArrowLeft, Key, Mail, AlertCircle, Loader2 } from "lucide-react";

interface AdminLoginViewProps {
  onNavigateBack: () => void;
  onLoginSuccess: (token: string) => void;
}

export default function AdminLoginView({ onNavigateBack, onLoginSuccess }: AdminLoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Email atau Password admin tidak sesuai.");
      }

      // Store local authentication state
      localStorage.setItem("oplab_admin_token", data.token);
      onLoginSuccess(data.token);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server untuk autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans relative select-none">
      {/* Glow circles */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-950/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-slate-900/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex justify-between items-center">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-medium"
          id="btn-back-to-lobby-admin"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Lobi</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Dosen & Laboran Portal</span>
          <div className="h-2 w-2 rounded-full bg-indigo-500" />
        </div>
      </header>

      {/* Form area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl relative overflow-hidden">
            {/* Top border ambient strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="flex justify-center mb-5">
              <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl border border-indigo-500/20 shadow-inner">
                <Shield size={28} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 text-center">
              Login Admin OPLab
            </h1>
            <p className="text-slate-400 text-sm font-light leading-normal mb-6 text-center">
              Akses khusus dosen dan asisten praktikum untuk mengontrol, memantau, serta mengunduh rekap hasil praktikum mahasiswa.
            </p>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
                <p className="text-rose-400 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <Mail size={12} className="text-slate-400" />
                  Alamat Email Admin
                </label>
                <input
                  type="email"
                  placeholder="admin@oplab.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-750 focus:outline-none transition-all text-sm font-mono"
                  id="input-admin-email"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <Key size={12} className="text-slate-400" />
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-750 focus:outline-none transition-all text-sm font-mono"
                  id="input-admin-password"
                />
              </div>

              <div className="bg-slate-950/65 p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-500 leading-normal mb-2">
                <span className="text-slate-400 font-bold block mb-0.5">💡 Demo Akun Admin Bawaan:</span>
                <span className="block">Email: <span className="text-indigo-400">admin@oplab.id</span></span>
                <span className="block">Sandi: <span className="text-indigo-400">admin123</span></span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl py-3 px-4 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                id="btn-admin-login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Mengautentikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-600 border-t border-slate-900/60 font-mono">
        <p>Seluruh aktivitas login dicatat demi keamanan jaringan laboratorium.</p>
      </footer>
    </div>
  );
}

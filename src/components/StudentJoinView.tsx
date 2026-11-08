import React, { useEffect, useState } from "react";
import { Terminal, ArrowLeft, Key, User, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { Praktikum, Peserta, Submission } from "../types";

interface StudentJoinViewProps {
  onNavigateBack: () => void;
  onJoinSuccess: (peserta: Peserta, praktikum: Praktikum, submission: Submission) => void;
}

export default function StudentJoinView({ onNavigateBack, onJoinSuccess }: StudentJoinViewProps) {
  const [activeSession, setActiveSession] = useState<Praktikum | null>(null);
  const [loadingActive, setLoadingActive] = useState(true);

  // Form states
  const [accessCode, setAccessCode] = useState("");
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/praktikum/active")
      .then((res) => res.json())
      .then((data) => {
        setActiveSession(data);
        if (data) {
          setAccessCode(data.accessCode); // Autofill active code for smoother UX
        }
        setLoadingActive(false);
      })
      .catch((err) => {
        console.error("Error fetching active session:", err);
        setLoadingActive(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessCode.trim()) {
      setError("Kode praktikum wajib diisi!");
      return;
    }
    if (!nim.trim()) {
      setError("NIM wajib diisi!");
      return;
    }
    if (!nama.trim()) {
      setError("Nama lengkap wajib diisi!");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/peserta/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCode: accessCode.trim().toUpperCase(),
          nim: nim.trim(),
          nama: nama.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Terjadi kesalahan saat memvalidasi sesi praktikum.");
      }

      // Success - start the lab!
      onJoinSuccess(data.peserta, data.praktikum, data.submission);
    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans relative">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-slate-900/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex justify-between items-center">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-medium"
          id="btn-back-to-lobby"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Lobi</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Portal Mahasiswa</span>
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Active Lab Card Info */}
          {loadingActive ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 mb-6 animate-pulse flex items-center justify-center">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" />
                <span>Memuat sesi praktikum aktif...</span>
              </div>
            </div>
          ) : activeSession ? (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/20 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 border-l border-b border-emerald-500/20 px-3 py-1 rounded-bl-xl text-[10px] font-mono tracking-widest uppercase font-bold">
                Aktif Sekarang
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{activeSession.mataKuliah}</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2 leading-tight">
                {activeSession.judul}
              </h2>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-400">
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  Bahasa: <span className="text-blue-400 font-bold">{activeSession.bahasa.toUpperCase()}</span>
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  Waktu: <span className="text-white">{activeSession.timer} Menit</span>
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50 capitalize">
                  Kesulitan: <span className={
                    activeSession.tingkatKesulitan === 'pemula' ? 'text-green-400' :
                    activeSession.tingkatKesulitan === 'menengah' ? 'text-amber-400' : 'text-rose-400'
                  }>{activeSession.tingkatKesulitan}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 mb-6 text-center">
              <p className="text-slate-400 text-sm">Tidak ada praktikum aktif saat ini. Silakan hubungi pengawas atau dosen Anda untuk mengaktifkan sesi.</p>
            </div>
          )}

          {/* Core Join Form */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2 text-center sm:text-left">
              Registrasi Praktikum
            </h1>
            <p className="text-slate-400 text-sm font-light leading-normal mb-6 text-center sm:text-left">
              Silakan masukkan NIM, nama lengkap, dan kode akses praktikum untuk mengakses lembar editor kode Anda.
            </p>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
                <p className="text-rose-400 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Access Code Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <Key size={12} className="text-slate-400" />
                  Kode Akses Praktikum
                </label>
                <input
                  type="text"
                  placeholder="Contoh: LAB-JS101"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-mono uppercase text-sm tracking-widest"
                  id="input-access-code"
                />
              </div>

              {/* NIM Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <BookOpen size={12} className="text-slate-400" />
                  Nomor Induk Mahasiswa (NIM)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2209106042"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-mono text-sm"
                  id="input-nim"
                />
              </div>

              {/* Nama Lengkap Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  Nama Lengkap Anda
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Rahmawati"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none transition-all text-sm"
                  id="input-nama"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl py-3 px-4 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
                id="btn-start-lab"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Memverifikasi Registrasi...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Praktikum Sekarang</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-600 border-t border-slate-900/60 font-mono">
        <p>Aplikasi memantau aktivitas Fullscreen dan Visibilitas browser Anda selama pengerjaan.</p>
      </footer>
    </div>
  );
}

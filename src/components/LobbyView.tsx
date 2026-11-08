import React, { useEffect, useState } from "react";
import { Terminal, Shield, User, ChevronRight, Activity, BookOpen } from "lucide-react";
import { Praktikum } from "../types";

interface LobbyViewProps {
  onNavigate: (view: "student-join" | "admin-login") => void;
}

export default function LobbyView({ onNavigate }: LobbyViewProps) {
  const [activeSession, setActiveSession] = useState<Praktikum | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/praktikum/active")
      .then((res) => res.json())
      .then((data) => {
        setActiveSession(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching active session:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Terminal size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg text-white">OPLab</span>
            <span className="text-xs text-slate-400 block -mt-1 font-mono">Online Programming Lab</span>
          </div>
        </div>
        <button
          onClick={() => onNavigate("admin-login")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-700 hover:border-slate-500 rounded-lg transition-all hover:bg-slate-800"
          id="btn-admin-portal"
        >
          <Shield size={16} className="text-slate-400" />
          <span>Portal Admin</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3.5 py-1.5 rounded-full border border-indigo-500/20 text-xs font-semibold mb-4 animate-fade-in">
            <Activity size={12} className="text-indigo-400" />
            <span>Platform Praktikum Mandiri & Aman</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-4">
            Online Programming Lab
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto font-light leading-relaxed">
            Media pengerjaan praktikum pemrograman JavaScript & TypeScript secara daring dengan sistem pengamanan browser dan monitoring real-time yang ketat.
          </p>
        </div>

        {/* Portal Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
          {/* Student Portal Card */}
          <div 
            onClick={() => onNavigate("student-join")}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
            id="card-student"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 group-hover:w-3 transition-all duration-300" />
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/20">
                <User size={24} />
              </div>
              <ChevronRight size={20} className="text-slate-500 group-hover:text-blue-400 transition-all duration-300 group-hover:translate-x-1" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-all duration-300">
              Portal Mahasiswa
            </h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
              Masuk menggunakan Kode Praktikum aktif yang diberikan oleh dosen atau asisten laboratorium untuk memulai pengerjaan praktikum secara mandiri.
            </p>

            <div className="border-t border-slate-800/80 pt-4 mt-auto">
              {loading ? (
                <div className="h-5 bg-slate-800/50 rounded animate-pulse w-3/4" />
              ) : activeSession ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-400 font-mono font-medium">
                    Sesi Aktif: {activeSession.judul}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  <span className="text-xs font-mono">Tidak ada praktikum aktif saat ini</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Portal Card */}
          <div 
            onClick={() => onNavigate("admin-login")}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
            id="card-admin"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 group-hover:w-3 transition-all duration-300" />
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl border border-indigo-500/20">
                <Shield size={24} />
              </div>
              <ChevronRight size={20} className="text-slate-500 group-hover:text-indigo-400 transition-all duration-300 group-hover:translate-x-1" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-all duration-300">
              Portal Admin / Dosen
            </h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed mb-6">
              Kelola aktivitas praktikum, jadwalkan ujian, awasi kecurangan mahasiswa secara real-time, dan unduh data rekapitulasi nilai praktikum dengan mudah.
            </p>

            <div className="border-t border-slate-800/80 pt-4 mt-auto flex items-center gap-2 text-slate-500">
              <BookOpen size={14} className="text-slate-400" />
              <span className="text-xs font-mono">Khusus Dosen, Laboran & Asisten</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900/60 font-mono">
        <p>&copy; {new Date().getFullYear()} OPLab - Google AI Studio & Express Backend Platform</p>
      </footer>
    </div>
  );
}

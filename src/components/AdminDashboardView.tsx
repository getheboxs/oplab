import React, { useEffect, useState } from "react";
import { 
  Users, UserCheck, AlertOctagon, Timer, LogOut, PlusCircle, 
  Trash2, Edit, CheckSquare, Search, Filter, ShieldAlert, 
  Download, Upload, RefreshCw, Code, BookOpen, AlertCircle, Play 
} from "lucide-react";
import { Praktikum, Peserta, ViolationLog, AdminStats } from "../types";

interface AdminDashboardViewProps {
  onLogout: () => void;
}

interface MonitorStudent extends Peserta {
  praktikumJudul: string;
  praktikumBahasa: string;
  submission: {
    kode: string;
    output: string;
    status: string;
    submittedAt: string | null;
  } | null;
  violations: ViolationLog[];
}

export default function AdminDashboardView({ onLogout }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "labs" | "monitor" | "export">("overview");
  const [labs, setLabs] = useState<Praktikum[]>([]);
  const [students, setStudents] = useState<MonitorStudent[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    activeStudentsCount: 0,
    completedStudentsCount: 0,
    averageDuration: 0,
    violationRate: 0,
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabId, setFilterLabId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Selected student for detail view modal
  const [selectedStudent, setSelectedStudent] = useState<MonitorStudent | null>(null);

  // New & Edit Lab Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  
  // Lab form fields
  const [labForm, setLabForm] = useState({
    judul: "",
    mataKuliah: "",
    deskripsi: "",
    bahasa: "javascript" as "javascript" | "typescript",
    tingkatKesulitan: "pemula" as "pemula" | "menengah" | "mahir",
    instruksi: "",
    starterCode: "",
    contohInput: "",
    contohOutput: "",
    timer: 45,
    accessCode: "",
    isActive: false,
    jadwalMulai: new Date().toISOString().substring(0, 16),
    jadwalBerakhir: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().substring(0, 16)
  });

  // Import JSON state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const fetchLabs = () => {
    fetch("/api/praktikum")
      .then((res) => res.json())
      .then((data) => setLabs(data))
      .catch((err) => console.error("Error fetching labs:", err));
  };

  const fetchMonitoringData = (showLoader = false) => {
    if (showLoader) setLoading(true);
    fetch("/api/admin/monitoring")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students);
        setStats(data.stats);
        
        // If details modal is open, refresh that specific student as well to keep it real-time!
        if (selectedStudent) {
          const freshStudent = data.students.find((s: MonitorStudent) => s.id === selectedStudent.id);
          if (freshStudent) {
            setSelectedStudent(freshStudent);
          }
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching monitoring data:", err);
        setLoading(false);
      });
  };

  // Poll for monitoring statistics and active students in real-time (every 3 seconds)
  useEffect(() => {
    fetchLabs();
    fetchMonitoringData(true);

    const interval = setInterval(() => {
      fetchMonitoringData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nim.includes(searchQuery);
    const matchesLab = filterLabId === "all" || s.praktikumId === filterLabId;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesLab && matchesStatus;
  });

  // Handle Create or Update Lab Submit
  const handleLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.judul || !labForm.mataKuliah) {
      alert("Harap lengkapi judul praktikum dan nama mata kuliah!");
      return;
    }

    const payload = {
      ...labForm,
      timer: Number(labForm.timer),
      jadwalMulai: new Date(labForm.jadwalMulai).toISOString(),
      jadwalBerakhir: new Date(labForm.jadwalBerakhir).toISOString()
    };

    try {
      let response;
      if (editingLabId) {
        response = await fetch(`/api/praktikum/${editingLabId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/praktikum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        fetchLabs();
        setIsFormOpen(false);
        setEditingLabId(null);
        // Reset form
        setLabForm({
          judul: "",
          mataKuliah: "",
          deskripsi: "",
          bahasa: "javascript",
          tingkatKesulitan: "pemula",
          instruksi: "",
          starterCode: "",
          contohInput: "",
          contohOutput: "",
          timer: 45,
          accessCode: "",
          isActive: false,
          jadwalMulai: new Date().toISOString().substring(0, 16),
          jadwalBerakhir: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().substring(0, 16)
        });
      }
    } catch (err) {
      alert("Gagal menyimpan data praktikum.");
    }
  };

  // Toggle lab active state directly
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/praktikum/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        fetchLabs();
        fetchMonitoringData(false);
      }
    } catch (err) {
      console.error("Error toggling active lab state:", err);
    }
  };

  // Open Edit Lab Form
  const handleEditLabClick = (lab: Praktikum) => {
    setEditingLabId(lab.id);
    setLabForm({
      judul: lab.judul,
      mataKuliah: lab.mataKuliah,
      deskripsi: lab.deskripsi,
      bahasa: lab.bahasa,
      tingkatKesulitan: lab.tingkatKesulitan,
      instruksi: lab.instruksi,
      starterCode: lab.starterCode,
      contohInput: lab.contohInput,
      contohOutput: lab.contohOutput,
      timer: lab.timer,
      accessCode: lab.accessCode,
      isActive: lab.isActive,
      jadwalMulai: new Date(lab.jadwalMulai).toISOString().substring(0, 16),
      jadwalBerakhir: new Date(lab.jadwalBerakhir).toISOString().substring(0, 16)
    });
    setIsFormOpen(true);
  };

  // Delete Lab
  const handleDeleteLab = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus praktikum ini beserta seluruh riwayat terkait?")) {
      try {
        const response = await fetch(`/api/praktikum/${id}`, { method: "DELETE" });
        if (response.ok) {
          fetchLabs();
        }
      } catch (err) {
        console.error("Failed to delete lab:", err);
      }
    }
  };

  // Import JSON Questions Handler
  const handleImportJson = async () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      const response = await fetch("/api/praktikum/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        fetchLabs();
        setIsImportOpen(false);
        setImportJsonText("");
        alert("Soal praktikum berhasil diimpor!");
      } else {
        throw new Error(data.message || "Gagal mengimpor JSON.");
      }
    } catch (err: any) {
      setImportError(err.message || "Format JSON salah! Pastikan struktur JSON valid sesuai skema.");
    }
  };

  // Client-side CSV Exporter
  const handleExportCsv = () => {
    // Generate CSV contents
    const headers = ["NIM", "Nama Lengkap", "Judul Praktikum", "Waktu Mulai", "Waktu Selesai", "Durasi (Detik)", "Jumlah Pelanggaran", "Status"];
    
    const rows = students.map((s) => [
      s.nim,
      `"${s.nama.replace(/"/g, '""')}"`,
      `"${s.praktikumJudul.replace(/"/g, '""')}"`,
      s.waktuMulai,
      s.waktuSelesai || "Belum Selesai",
      s.durasi,
      s.jumlahPelanggaran,
      s.status.toUpperCase()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OPLab_Rekap_Praktikum_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert seconds to readable MM:SS or HH:MM:SS
  const formatSeconds = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hours > 0) {
      return `${hours}j ${mins}m ${secs}d`;
    }
    return `${mins}m ${secs}d`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* HEADER BAR */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/15 border border-indigo-500/25 p-2 rounded-xl text-indigo-400">
            <RefreshCw size={20} className="animate-spin-slow" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-base text-white">OPLab Admin Panel</span>
            <span className="text-[10px] font-mono text-indigo-400 block -mt-1">Pusat Kendali Pengawasan Real-Time</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchMonitoringData(true)}
            className="p-2 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-lg transition-all border border-slate-700/50 cursor-pointer"
            id="btn-admin-logout"
          >
            <LogOut size={14} />
            <span>Keluar Portal</span>
          </button>
        </div>
      </header>

      {/* ADMIN SUB-NAV TABS */}
      <div className="bg-slate-900/20 border-b border-slate-800 shrink-0">
        <div className="px-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 px-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "overview" ? "border-indigo-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users size={14} />
            <span>Ringkasan Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab("labs")}
            className={`py-3.5 px-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "labs" ? "border-indigo-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckSquare size={14} />
            <span>Manajemen Praktikum</span>
          </button>

          <button
            onClick={() => setActiveTab("monitor")}
            className={`py-3.5 px-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "monitor" ? "border-indigo-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Monitor Real-Time</span>
            {stats.activeStudentsCount > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                {stats.activeStudentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`py-3.5 px-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "export" ? "border-indigo-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download size={14} />
            <span>Rekap & Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* MAIN BODY LAYOUT */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">

        {/* ==================== TAB 1: OVERVIEW RINGKASAN ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Active students */}
              <div className="bg-slate-900/50 border border-rose-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1 w-full bg-rose-500" />
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Mahasiswa Aktif</span>
                  <div className="bg-rose-500/10 text-rose-400 p-2 rounded-xl border border-rose-500/20">
                    <Users size={16} className="animate-pulse" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-white">{stats.activeStudentsCount}</h2>
                <p className="text-xs text-rose-400/80 font-light mt-1 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  <span>Sedang menulis kode saat ini</span>
                </p>
              </div>

              {/* Card 2: Completed students */}
              <div className="bg-slate-900/50 border border-emerald-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Selesai Submit</span>
                  <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
                    <UserCheck size={16} />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-white">{stats.completedStudentsCount}</h2>
                <p className="text-xs text-slate-400 font-light mt-1">
                  Sudah menyelesaikan praktikum
                </p>
              </div>

              {/* Card 3: Violation rate */}
              <div className="bg-slate-900/50 border border-amber-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1 w-full bg-amber-500" />
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Tingkat Pelanggaran</span>
                  <div className="bg-amber-500/10 text-amber-400 p-2 rounded-xl border border-amber-500/20">
                    <AlertOctagon size={16} />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-white">{stats.violationRate}%</h2>
                <p className="text-xs text-slate-400 font-light mt-1">
                  Persentase peserta melanggar aturan
                </p>
              </div>

              {/* Card 4: Avg duration */}
              <div className="bg-slate-900/50 border border-indigo-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1 w-full bg-indigo-500" />
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Durasi Rata-rata</span>
                  <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-xl border border-indigo-500/20">
                    <Timer size={16} />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-white">{stats.averageDuration} Menit</h2>
                <p className="text-xs text-slate-400 font-light mt-1">
                  Rata-rata waktu penyelesaian
                </p>
              </div>
            </div>

            {/* Quick overview panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Recent Violations activity logs list */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[350px]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                    <AlertOctagon size={15} className="text-rose-400 animate-bounce" />
                    <span>Aktivitas Pelanggaran Terbaru</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">Real-Time</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {students.flatMap(s => s.violations.map(v => ({ ...v, studentName: s.nama, studentNim: s.nim })))
                    .sort((a,b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())
                    .slice(0, 10)
                    .map((log) => (
                      <div key={log.id} className="bg-slate-950/60 border border-slate-800/85 p-3 rounded-xl flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-200">{log.studentName}</span>
                            <span className="text-[10px] font-mono text-slate-500">NIM: {log.studentNim}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-light leading-snug">
                            {log.deskripsi}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                            {log.jenis.replace("_", " ")}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 block mt-1">
                            {new Date(log.waktu).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}

                  {students.every(s => s.violations.length === 0) && (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs py-10 font-light">
                      Luar biasa! Belum ada pelanggaran browser yang tercatat saat ini.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Mini active lab status */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[350px]">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2 mb-4 shrink-0">
                  <CheckSquare size={15} className="text-indigo-400" />
                  <span>Sesi Praktikum Aktif</span>
                </h3>

                <div className="flex-1 flex flex-col justify-between">
                  {labs.find(l => l.isActive) ? (
                    (() => {
                      const active = labs.find(l => l.isActive)!;
                      return (
                        <>
                          <div className="space-y-3">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                              {active.mataKuliah}
                            </span>
                            <h2 className="text-base font-bold text-white leading-tight">
                              {active.judul}
                            </h2>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Kode Akses:</span>
                                <span className="text-sm font-mono font-bold text-indigo-400 uppercase tracking-widest">{active.accessCode}</span>
                              </div>
                              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Timer:</span>
                                <span className="text-sm font-mono font-bold text-slate-300">{active.timer} Menit</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-3 font-light mt-1">
                              {active.deskripsi}
                            </p>
                          </div>

                          <div className="border-t border-slate-800/80 pt-4 mt-4 flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-mono">Bahasa: <span className="text-blue-400 font-bold uppercase">{active.bahasa}</span></span>
                            <button
                              onClick={() => setActiveTab("monitor")}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-all"
                            >
                              <span>Buka Monitor Live</span>
                              <span>&rarr;</span>
                            </button>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-center p-4">
                      <p className="text-slate-400 text-sm font-light mb-4">Tidak ada sesi praktikum yang sedang diaktifkan.</p>
                      <button
                        onClick={() => setActiveTab("labs")}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow cursor-pointer"
                      >
                        Aktifkan Soal Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 2: MANAJEMEN PRAKTIKUM ==================== */}
        {activeTab === "labs" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header control */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Bank Soal & Penjadwalan</h2>
                <p className="text-slate-400 text-xs font-light">Buat, impor, dan jadwalkan kegiatan praktikum di laboratorium pemrograman Anda.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload size={14} className="text-slate-400" />
                  <span>Impor Soal JSON</span>
                </button>

                <button
                  onClick={() => {
                    setEditingLabId(null);
                    setLabForm({
                      judul: "",
                      mataKuliah: "",
                      deskripsi: "",
                      bahasa: "javascript",
                      tingkatKesulitan: "pemula",
                      instruksi: "",
                      starterCode: "",
                      contohInput: "",
                      contohOutput: "",
                      timer: 45,
                      accessCode: "",
                      isActive: false,
                      jadwalMulai: new Date().toISOString().substring(0, 16),
                      jadwalBerakhir: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().substring(0, 16)
                    });
                    setIsFormOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  <PlusCircle size={15} />
                  <span>Buat Praktikum Baru</span>
                </button>
              </div>
            </div>

            {/* Practical list cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labs.map((lab) => (
                <div 
                  key={lab.id} 
                  className={`bg-slate-900/40 border rounded-2xl p-5 hover:bg-slate-900/70 transition-all shadow-md relative flex flex-col justify-between ${
                    lab.isActive ? "border-indigo-500/40 shadow-indigo-500/5" : "border-slate-800/80"
                  }`}
                >
                  <div>
                    {/* Upper Metadata */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase">
                          {lab.mataKuliah}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded">
                          Bahasa: <strong className="text-blue-400 uppercase">{lab.bahasa}</strong>
                        </span>
                      </div>

                      {/* Active indicator status toggler */}
                      <button
                        onClick={() => handleToggleActive(lab.id, lab.isActive)}
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                          lab.isActive 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-inner" 
                            : "bg-slate-950/60 text-slate-500 border-slate-800/80 hover:border-slate-700"
                        }`}
                        title="Klik untuk mengaktifkan/menonaktifkan praktikum"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${lab.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                        <span>{lab.isActive ? "AKTIF" : "NONAKTIF"}</span>
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 leading-snug">{lab.judul}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 font-light">{lab.deskripsi}</p>
                  </div>

                  {/* Form Footer Grid Details */}
                  <div className="border-t border-slate-800/80 pt-4 mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap gap-3 font-mono text-[11px] text-slate-500">
                      <div>
                        <span>Kode: </span>
                        <span className="text-indigo-400 font-bold uppercase tracking-wider">{lab.accessCode}</span>
                      </div>
                      <div className="hidden sm:inline-block">•</div>
                      <div>
                        <span>Durasi: </span>
                        <span className="text-slate-300 font-bold">{lab.timer} Menit</span>
                      </div>
                      <div className="hidden sm:inline-block">•</div>
                      <div className="capitalize">
                        <span className={
                          lab.tingkatKesulitan === 'pemula' ? 'text-green-400' :
                          lab.tingkatKesulitan === 'menengah' ? 'text-amber-400' : 'text-rose-400'
                        }>{lab.tingkatKesulitan}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleEditLabClick(lab)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 transition-all cursor-pointer"
                        title="Edit Praktikum"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteLab(lab.id)}
                        className="p-1.5 hover:bg-slate-800/50 text-slate-400 hover:text-rose-400 rounded border border-slate-800 hover:border-rose-500/20 transition-all cursor-pointer"
                        title="Hapus Praktikum"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {labs.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                  <AlertCircle size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Belum ada praktikum terdaftar. Klik tombol di kanan atas untuk membuat.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: MONITOR LIVE REALTIME ==================== */}
        {activeTab === "monitor" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter controls */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full md:max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama atau NIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                <div className="flex items-center gap-1.5">
                  <Filter size={12} className="text-slate-500" />
                  <span className="text-[11px] font-mono text-slate-500">Praktikum:</span>
                </div>
                <select
                  value={filterLabId}
                  onChange={(e) => setFilterLabId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Semua Soal</option>
                  {labs.map(l => (
                    <option key={l.id} value={l.id}>{l.judul.slice(0, 35)}...</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="sedang_mengerjakan">Sedang Mengerjakan</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
            </div>

            {/* Student grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  className="bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-white leading-normal text-sm sm:text-base flex items-center gap-2">
                        <span>{student.nama}</span>
                        <span className="text-xs font-mono text-slate-500 font-light">({student.nim})</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
                        <BookOpen size={11} className="text-slate-500" />
                        <span>{student.praktikumJudul}</span>
                      </p>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      student.status === "sedang_mengerjakan" 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {student.status === "sedang_mengerjakan" ? "MENGERJAKAN" : "SUBMITTED"}
                    </span>
                  </div>

                  {/* Security Stats row */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-850/80 my-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Pelanggaran:</span>
                      <span className={`font-bold ${student.jumlahPelanggaran > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                        {student.jumlahPelanggaran} Kali
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Durasi:</span>
                      <span className="font-semibold text-slate-300">
                        {formatSeconds(student.durasi)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Waktu Mulai:</span>
                      <span className="text-slate-400">
                        {new Date(student.waktuMulai).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Detail trigger */}
                  <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-3">
                    <span className="text-[10px] font-mono text-slate-500">
                      Update terakhir: {student.waktuSelesai ? new Date(student.waktuSelesai).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="text-xs bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/15 hover:border-indigo-600 transition-all font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Code size={12} />
                      <span>Lihat Pekerjaan</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                  <Users size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-light">Tidak ada peserta yang cocok dengan filter pencarian saat ini.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: REKAP & EXPORT CSV ==================== */}
        {activeTab === "export" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Unduh Hasil Praktikum</h2>
                <p className="text-slate-400 text-xs font-light">Ekspor seluruh rekapitulasi data mahasiswa yang mencakup durasi pengerjaan, status, dan riwayat pelanggaran ke dalam format spreadsheet CSV.</p>
              </div>

              <button
                onClick={handleExportCsv}
                disabled={students.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Download size={16} />
                <span>Unduh File CSV (.csv)</span>
              </button>
            </div>

            {/* Table preview */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 font-mono tracking-wider text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3">NIM</th>
                      <th className="px-5 py-3">Nama</th>
                      <th className="px-5 py-3">Praktikum</th>
                      <th className="px-5 py-3">Waktu Mulai</th>
                      <th className="px-5 py-3">Pelanggaran</th>
                      <th className="px-5 py-3">Durasi</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-sans">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-900/20 text-slate-300">
                        <td className="px-5 py-3 font-mono">{student.nim}</td>
                        <td className="px-5 py-3 font-semibold text-white">{student.nama}</td>
                        <td className="px-5 py-3 max-w-[200px] truncate">{student.praktikumJudul}</td>
                        <td className="px-5 py-3 text-slate-400 font-mono">{new Date(student.waktuMulai).toLocaleString()}</td>
                        <td className="px-5 py-3 font-mono">
                          <span className={student.jumlahPelanggaran > 0 ? "text-amber-400 font-bold" : "text-slate-500"}>
                            {student.jumlahPelanggaran} Kali
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono">{formatSeconds(student.durasi)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            student.status === "sedang_mengerjakan" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {student.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {students.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-light">
                          Belum ada rekam data peserta praktikum.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ==================== FORM MODAL: CREATE / EDIT LAB ==================== */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">{editingLabId ? "Edit Sesi Praktikum" : "Buat Sesi Praktikum Baru"}</h2>
              <p className="text-slate-400 text-xs font-light">Lengkapi data di bawah ini untuk didaftarkan ke sistem bank praktikum.</p>
            </div>

            <form onSubmit={handleLabSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Judul */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Judul Praktikum Soal</label>
                  <input
                    type="text"
                    required
                    value={labForm.judul}
                    onChange={(e) => setLabForm({ ...labForm, judul: e.target.value })}
                    placeholder="Contoh: Praktikum 2 - Object Oriented Programming"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Mata Kuliah */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    value={labForm.mataKuliah}
                    onChange={(e) => setLabForm({ ...labForm, mataKuliah: e.target.value })}
                    placeholder="Contoh: Pemrograman Berorientasi Objek"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Access Code */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Kode Akses Sesi</label>
                  <input
                    type="text"
                    value={labForm.accessCode}
                    onChange={(e) => setLabForm({ ...labForm, accessCode: e.target.value })}
                    placeholder="Contoh: LAB-OOP202 (Opsional)"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                  />
                </div>

                {/* Bahasa pemrograman */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Bahasa Pemrograman</label>
                  <select
                    value={labForm.bahasa}
                    onChange={(e) => setLabForm({ ...labForm, bahasa: e.target.value as "javascript" | "typescript" })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>

                {/* Timer */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Timer Pengerjaan (Menit)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={labForm.timer}
                    onChange={(e) => setLabForm({ ...labForm, timer: Number(e.target.value) })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Tingkat Kesulitan</label>
                  <select
                    value={labForm.tingkatKesulitan}
                    onChange={(e) => setLabForm({ ...labForm, tingkatKesulitan: e.target.value as any })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pemula">Pemula</option>
                    <option value="menengah">Menengah</option>
                    <option value="mahir">Mahir</option>
                  </select>
                </div>

                {/* Active status */}
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase mb-2">Status Aktif Sesi</label>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={labForm.isActive}
                      onChange={(e) => setLabForm({ ...labForm, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-indigo-600" />
                    <span className="ml-3 text-xs text-slate-400">Aktifkan sekarang (menonaktifkan soal lain)</span>
                  </label>
                </div>

                {/* Deskripsi */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Deskripsi Masalah</label>
                  <textarea
                    rows={2}
                    value={labForm.deskripsi}
                    onChange={(e) => setLabForm({ ...labForm, deskripsi: e.target.value })}
                    placeholder="Sebutkan detail instruksi persoalan..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                </div>

                {/* Instruksi pengerjaan */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Petunjuk Pengerjaan Soal (Line-by-Line)</label>
                  <textarea
                    rows={2}
                    value={labForm.instruksi}
                    onChange={(e) => setLabForm({ ...labForm, instruksi: e.target.value })}
                    placeholder="1. Buat class bernamakan Car...\n2. Jangan pakai built-in libraries..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Starter Code */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Template Starter Code</label>
                  <textarea
                    rows={5}
                    value={labForm.starterCode}
                    onChange={(e) => setLabForm({ ...labForm, starterCode: e.target.value })}
                    placeholder="// Tulis template kode starter di sini..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 focus:outline-none focus:border-indigo-500 font-mono resize-y"
                  />
                </div>

                {/* Contoh input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Contoh Input Uji</label>
                  <textarea
                    rows={2}
                    value={labForm.contohInput}
                    onChange={(e) => setLabForm({ ...labForm, contohInput: e.target.value })}
                    placeholder="Contoh: Car('Toyota', 'Avanza')"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                  />
                </div>

                {/* Contoh output */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">Contoh Output Uji</label>
                  <textarea
                    rows={2}
                    value={labForm.contohOutput}
                    onChange={(e) => setLabForm({ ...labForm, contohOutput: e.target.value })}
                    placeholder="Contoh: { brand: 'Toyota', model: 'Avanza' }"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow cursor-pointer"
                >
                  Simpan Sesi Praktikum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== IMPORT MODAL: QUESTIONS JSON ==================== */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-4 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">Impor Soal dari File JSON</h2>
              <p className="text-slate-400 text-xs font-light">Masukkan skema array JSON soal yang ingin langsung diunggah ke bank praktikum.</p>
            </div>

            {importError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 block mb-1">Skema format array JSON yang diterima:</label>
              <textarea
                rows={10}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder={`[
  {
    "judul": "Praktikum JSON Impor",
    "mataKuliah": "Pemrograman Dasar",
    "deskripsi": "Deskripsi soal...",
    "bahasa": "javascript",
    "tingkatKesulitan": "pemula",
    "timer": 30,
    "starterCode": "function sol() {\\n  return 1;\\n}"
  }
]`}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono resize-y"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow cursor-pointer"
              >
                Impor Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MONITOR DETAIL DIALOG: VIEW CODE / VIOLATIONS ==================== */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9998] p-4 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                  <span>Pekerjaan: {selectedStudent.nama}</span>
                  <span className="text-xs font-mono text-slate-400">({selectedStudent.nim})</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedStudent.praktikumJudul}</p>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer font-mono"
              >
                Tutup Detail
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2/3 Grid: Active Code Submission Viewer */}
              <div className="lg:col-span-2 flex flex-col space-y-4">
                <div className="flex-1 flex flex-col min-h-[300px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0 text-xs font-mono">
                    <span className="text-slate-300 font-bold">Kode Di-autosave Mahasiswa</span>
                    <span className="text-blue-400 capitalize">{selectedStudent.praktikumBahasa}</span>
                  </div>
                  <pre className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-auto whitespace-pre leading-relaxed select-all">
                    {selectedStudent.submission ? selectedStudent.submission.kode : "// Belum ada baris kode yang ditulis."}
                  </pre>
                </div>

                {/* Console Log Runner Display */}
                <div className="h-[120px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shrink-0 flex flex-col">
                  <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono font-bold text-slate-400">
                    Hasil Running Code Terakhir
                  </div>
                  <pre className="flex-1 p-3 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap select-all">
                    {selectedStudent.submission ? selectedStudent.submission.output || "[Belum dijalankan]" : "[Tidak ada submission]"}
                  </pre>
                </div>
              </div>

              {/* Right 1/3 Grid: Full Violation Activity Logs */}
              <div className="flex flex-col space-y-4 h-full">
                
                {/* Violations statistics overview summary */}
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Statistik Integritas</span>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Total Pelanggaran:</span>
                    <span className={`text-sm font-mono font-bold ${selectedStudent.jumlahPelanggaran > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {selectedStudent.jumlahPelanggaran} Kali
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Durasi Terpakai:</span>
                    <span className="text-xs font-mono text-slate-300 font-semibold">{formatSeconds(selectedStudent.durasi)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Status Penyelesaian:</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      selectedStudent.status === "sedang_mengerjakan" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {selectedStudent.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Violation list */}
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase block mb-2 shrink-0">Riwayat Pelanggaran Browser</span>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {selectedStudent.violations.map((violation) => (
                      <div key={violation.id} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs leading-normal font-light">
                        <div className="flex justify-between items-center mb-1.5 font-mono">
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded uppercase">
                            {violation.jenis.replace("_", " ")}
                          </span>
                          <span className="text-[9px] text-slate-500">{new Date(violation.waktu).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-tight">{violation.deskripsi}</p>
                      </div>
                    ))}

                    {selectedStudent.violations.length === 0 && (
                      <div className="h-full flex items-center justify-center text-slate-600 text-xs py-8 font-light text-center">
                        Sempurna! Mahasiswa ini tidak melakukan pelanggaran apa pun selama praktikum.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

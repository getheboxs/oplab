import React, { useEffect, useState, useRef } from "react";
import { 
  Play, RotateCcw, Send, AlertTriangle, Shield, CheckCircle2, 
  Terminal as CodeIcon, Clock, User, LogOut, Check, Eye, EyeOff, Loader2 
} from "lucide-react";
import { Praktikum, Peserta, Submission } from "../types";

interface StudentWorkspaceViewProps {
  peserta: Peserta;
  praktikum: Praktikum;
  initialSubmission: Submission;
  onFinish: () => void;
}

export default function StudentWorkspaceView({ 
  peserta, 
  praktikum, 
  initialSubmission, 
  onFinish 
}: StudentWorkspaceViewProps) {
  
  const [code, setCode] = useState(initialSubmission.kode || "");
  const [output, setOutput] = useState(initialSubmission.output || "");
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(peserta.durasi || 0);
  const [violationCount, setViolationCount] = useState(peserta.jumlahPelanggaran || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showSecurityLock, setShowSecurityLock] = useState(false);
  const [activeTab, setActiveTab] = useState<"instructions" | "io">("instructions");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [isEditorLocked, setIsEditorLocked] = useState(peserta.status === "selesai");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"dark" | "light">("dark");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCounterRef = useRef<HTMLDivElement>(null);

  const totalTimeSeconds = praktikum.timer * 60;
  const timeLeftSeconds = Math.max(0, totalTimeSeconds - secondsElapsed);

  // Sync scroll of line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineCounterRef.current) {
      lineCounterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Convert time to MM:SS format
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Force Fullscreen helper
  const enterFullscreen = () => {
    const element = document.documentElement as any;
    const requestFS = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
    
    if (requestFS) {
      requestFS.call(element).catch((err: any) => {
        console.error("Error attempting fullscreen:", err);
      });
    }

    // Wajib sembunyikan dialog mode aman ketika tombol dipencet, bahkan pada lingkungan iframe/preview yang membatasi API Fullscreen
    setIsFullscreen(true);
    setShowSecurityLock(false);
  };

  // Log Violation to database
  const logViolation = async (jenis: string, deskripsi: string) => {
    // Optimistic UI update agar pelanggaran langsung tercatat dan terlihat di UI
    setViolationCount((prev) => prev + 1);
    try {
      const response = await fetch(`/api/peserta/${peserta.id}/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis, deskripsi }),
      });
      const data = await response.json();
      if (data.success && typeof data.currentViolations === "number") {
        setViolationCount(data.currentViolations);
      }
    } catch (err) {
      console.error("Failed to log violation:", err);
    }
  };

  // Auto-save logic
  const saveCode = async (currentCode: string, currentOutput: string, currentSecs: number, forceStatus = true) => {
    if (isEditorLocked) return;
    if (forceStatus) setSaveStatus("saving");
    try {
      const response = await fetch(`/api/peserta/${peserta.id}/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: currentCode,
          output: currentOutput,
          secondsElapsed: currentSecs
        }),
      });
      if (response.ok) {
        if (forceStatus) setSaveStatus("saved");
      } else {
        if (forceStatus) setSaveStatus("error");
      }
    } catch (err) {
      if (forceStatus) setSaveStatus("error");
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/peserta/${peserta.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: code,
          output: output,
          secondsElapsed: secondsElapsed
        }),
      });
      if (response.ok) {
        setIsEditorLocked(true);
        setShowSubmittedModal(true);
        // Attempt exiting fullscreen after submit
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      alert("Gagal melakukan pengiriman akhir. Silakan coba kembali.");
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Code directly in browser
  const runCode = () => {
    setIsRunning(true);
    setOutput("");

    setTimeout(() => {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      let logs: string[] = [];

      console.log = (...args) => {
        logs.push(args.map(arg => {
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return "[Object]";
            }
          }
          return String(arg);
        }).join(" "));
      };

      console.warn = console.log;
      console.error = (...args) => {
        logs.push("🔴 ERROR: " + args.join(" "));
      };

      try {
        // Evaluate the student's code
        const runner = new Function(code);
        const result = runner();

        if (result !== undefined) {
          logs.push(`\n[Returned: ${typeof result === "object" ? JSON.stringify(result) : result}]`);
        }
      } catch (err: any) {
        logs.push(`❌ RUNTIME ERROR: ${err.message}`);
        if (err.stack) {
          // Extra cleaner stack info if available
        }
      } finally {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
      }

      const finalOut = logs.length > 0 ? logs.join("\n") : "[Execution completed with no console output]";
      setOutput(finalOut);
      setIsRunning(false);

      // Autosave right after running code to log progress
      saveCode(code, finalOut, secondsElapsed, false);
    }, 400);
  };

  // Reset starter code
  const resetStarterCode = () => {
    if (window.confirm("Apakah Anda yakin ingin me-reset kode ke template starter? Kode saat ini akan hilang.")) {
      const resetVal = praktikum.starterCode || "";
      setCode(resetVal);
      saveCode(resetVal, output, secondsElapsed);
    }
  };

  // Setup security listeners and interval tick
  useEffect(() => {
    if (isEditorLocked) return;

    // Tick duration timer
    const timerInterval = setInterval(() => {
      setSecondsElapsed((prev) => {
        const nextSecs = prev + 1;
        // Autosave every 5 seconds
        if (nextSecs % 5 === 0) {
          saveCode(code, output, nextSecs, false);
        }
        // Force submit if time is out
        if (nextSecs >= totalTimeSeconds) {
          clearInterval(timerInterval);
          setIsEditorLocked(true);
          handleFinalSubmit();
        }
        return nextSecs;
      });
    }, 1000);

    // Prompt user to enter Fullscreen on mount
    setShowSecurityLock(true);

    // Fullscreen event listener
    const onFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && !isEditorLocked) {
        setShowSecurityLock(true);
        logViolation("exit_fullscreen", "Mahasiswa keluar dari mode fullscreen wajib.");
      }
    };

    // Tab Change (Page Visibility API)
    const onVisibilityChange = () => {
      if (document.hidden && !isEditorLocked) {
        logViolation("switch_tab", "Mahasiswa berpindah tab atau meminimalkan browser.");
      }
    };

    // Jendela Fokus (Window Focus API)
    const onBlur = () => {
      setIsFocused(false);
      if (!isEditorLocked) {
        logViolation("lose_focus", "Mahasiswa kehilangan fokus dari jendela browser.");
      }
    };

    const onFocus = () => {
      setIsFocused(true);
    };

    // Anti Copy-Paste-Cut events
    const preventClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("blocked_mouse", `Mencoba tindakan clipboard: ${e.type}`);
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation("blocked_mouse", "Mencoba klik kanan (context menu) pada editor.");
    };

    // Anti Developer Tools & Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === "F12") {
        e.preventDefault();
        logViolation("blocked_key", "Mencoba menekan F12 (Developer Tools).");
        return;
      }

      // Ctrl+Shift+I / Ctrl+Shift+C / Ctrl+Shift+J / Ctrl+Shift+K
      if (e.ctrlKey && e.shiftKey && (
        e.key.toLowerCase() === "i" || 
        e.key.toLowerCase() === "c" || 
        e.key.toLowerCase() === "j" ||
        e.key.toLowerCase() === "k"
      )) {
        e.preventDefault();
        logViolation("blocked_key", `Mencoba shortcut Developer Tools: Ctrl+Shift+${e.key.toUpperCase()}`);
        return;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        logViolation("blocked_key", "Mencoba melihat sumber halaman (Ctrl+U).");
        return;
      }

      // Ctrl+S (Save)
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Trigger manual save
        saveCode(code, output, secondsElapsed, true);
        logViolation("blocked_key", "Mencoba pintasan simpan default Ctrl+S (Telah dialihkan ke auto-save).");
        return;
      }

      // Ctrl+P (Print)
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        logViolation("blocked_key", "Mencoba pintasan cetak halaman (Ctrl+P).");
        return;
      }
    };

    // Register Event Listeners
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("keydown", handleKeyDown);

    // Apply clipboard blockers specifically to the editor container
    const editorArea = document.getElementById("editor-block");
    if (editorArea) {
      editorArea.addEventListener("copy", preventClipboard);
      editorArea.addEventListener("paste", preventClipboard);
      editorArea.addEventListener("cut", preventClipboard);
      editorArea.addEventListener("contextmenu", preventContextMenu);
    }

    return () => {
      clearInterval(timerInterval);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", handleKeyDown);

      if (editorArea) {
        editorArea.removeEventListener("copy", preventClipboard);
        editorArea.removeEventListener("paste", preventClipboard);
        editorArea.removeEventListener("cut", preventClipboard);
        editorArea.removeEventListener("contextmenu", preventContextMenu);
      }
    };
  }, [code, output, secondsElapsed, isEditorLocked]);

  // Generate line numbers text
  const lineNumbers = code.split("\n").map((_, index) => index + 1).join("\n");

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden h-screen">
      
      {/* 1. Fullscreen / Security Mandate Overlay Modal */}
      {showSecurityLock && !isEditorLocked && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center z-[9999] p-6 text-center select-none">
          <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-2xl max-w-md shadow-2xl relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 p-4 rounded-full shadow-lg shadow-amber-500/20">
              <Shield size={36} className="animate-bounce" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mt-4 mb-3">Mode Aman Wajib!</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Untuk menjamin integritas kegiatan praktikum, Anda wajib masuk ke mode <strong>Layar Penuh (Fullscreen)</strong>. Anda tidak diizinkan meninggalkan mode fullscreen hingga praktikum selesai dan diserahkan.
            </p>

            <div className="bg-slate-950/60 p-4 rounded-xl text-left border border-slate-800 text-xs text-slate-400 mb-6 space-y-2">
              <p className="font-semibold text-slate-300">Tindakan Berikut Akan Dicatat Sebagai Pelanggaran:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Keluar dari mode Fullscreen</li>
                <li>Membuka Developer Tools (F12, Inspect Element)</li>
                <li>Berpindah tab atau me-minimize jendela</li>
                <li>Melakukan Klik Kanan / Salin / Tempel Kode</li>
              </ul>
            </div>

            <button
              onClick={enterFullscreen}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              Masuk Mode Fullscreen & Mulai
            </button>
          </div>
        </div>
      )}

      {/* 2. Success Submitted Overlay Modal */}
      {showSubmittedModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center z-[9998] p-6 text-center">
          <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-2xl max-w-md shadow-2xl">
            <div className="inline-flex bg-emerald-500/10 text-emerald-400 p-4 rounded-full mb-4 border border-emerald-500/20">
              <CheckCircle2 size={44} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Praktikum Selesai!</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Hasil pekerjaan praktikum Anda telah berhasil disimpan dan diserahkan ke sistem pengawas laboratorium secara aman.
            </p>

            <div className="bg-slate-950/60 p-4 rounded-xl text-left border border-slate-800 text-xs text-slate-400 mb-6 space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Mahasiswa:</span>
                <span className="text-white">{peserta.nama} ({peserta.nim})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Mata Kuliah:</span>
                <span className="text-white">{praktikum.mataKuliah}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Durasi Pengerjaan:</span>
                <span className="text-white">{formatTime(secondsElapsed)}</span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Pelanggaran:</span>
                <span className={`font-bold ${violationCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {violationCount} Kali
                </span>
              </div>
            </div>

            <button
              onClick={onFinish}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer"
            >
              Kembali ke Laman Depan
            </button>
          </div>
        </div>
      )}

      {/* 3. Global Navbar / Workspace Header */}
      <header className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 border border-blue-500/20 p-1.5 rounded-lg text-blue-400">
            <CodeIcon size={18} />
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-tight">OPLab Workspace</span>
            <div className="flex items-center gap-2 -mt-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">{praktikum.bahasa} runtime</span>
              <span className="text-[10px] text-slate-500 font-mono">•</span>
              <span className="text-[10px] text-slate-400 font-mono">NIM: {peserta.nim}</span>
            </div>
          </div>
        </div>

        {/* Middle Stats Info */}
        <div className="hidden md:flex items-center gap-5 bg-slate-950/80 border border-slate-800/80 px-4 py-1.5 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <User size={12} className="text-slate-500" />
            <span className="text-slate-300 font-sans font-medium">{peserta.nama}</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-slate-500" />
            <span className="text-slate-400">Sisa Waktu:</span>
            <span className={`font-bold ${timeLeftSeconds < 120 ? "text-rose-400 animate-pulse" : "text-blue-400"}`}>
              {formatTime(timeLeftSeconds)}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-slate-500" />
            <span className="text-slate-400">Pelanggaran:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
              violationCount > 3 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : 
              violationCount > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {violationCount}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={12} className="animate-spin text-slate-400" />
                <span>Menyimpan...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check size={12} className="text-emerald-500" />
                <span className="text-slate-400">Tersimpan otomatis</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertTriangle size={12} className="text-rose-500" />
                <span className="text-rose-400">Gagal menyimpan</span>
              </>
            )}
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={submitting || isEditorLocked}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            id="btn-workspace-submit"
          >
            <Send size={13} />
            <span>Kirim Praktikum</span>
          </button>
        </div>
      </header>

      {/* 4. Primary Workspace Workspace Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Mobile Info Strip */}
        <div className="md:hidden flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-slate-500" />
            <span className="text-blue-400 font-bold">{formatTime(timeLeftSeconds)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield size={11} className="text-slate-500" />
            <span className={violationCount > 0 ? "text-amber-400" : "text-emerald-400"}>{violationCount} Pelanggaran</span>
          </div>
          <div className="text-slate-400 truncate max-w-[120px]">
            {peserta.nama}
          </div>
        </div>

        {/* LEFT PANE: Instructions, Info, and Sample I/O */}
        <div className="w-full md:w-[35%] border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden shrink-0">
          
          {/* Tab Selector */}
          <div className="flex border-b border-slate-800/80 bg-slate-900/20 shrink-0">
            <button
              onClick={() => setActiveTab("instructions")}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                activeTab === "instructions" 
                  ? "border-blue-500 text-white bg-slate-900/40" 
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Instruksi Soal
            </button>
            <button
              onClick={() => setActiveTab("io")}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                activeTab === "io" 
                  ? "border-blue-500 text-white bg-slate-900/40" 
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Contoh Input / Output
            </button>
          </div>

          {/* Pane Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            
            {activeTab === "instructions" ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 font-bold tracking-widest uppercase bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    Mata Kuliah
                  </span>
                  <h3 className="text-sm font-semibold text-slate-400 mt-1">{praktikum.mataKuliah}</h3>
                  <h2 className="text-lg font-bold text-white mt-0.5 leading-snug">{praktikum.judul}</h2>
                </div>

                <div className="border-t border-slate-800/80 pt-4">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 mb-2">Deskripsi Soal</h4>
                  <p className="text-slate-300 text-sm font-light leading-relaxed whitespace-pre-wrap">
                    {praktikum.deskripsi}
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-4">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 mb-2">Petunjuk Pengerjaan</h4>
                  <div className="text-slate-300 text-sm font-light leading-relaxed whitespace-pre-wrap">
                    {praktikum.instruksi ? (
                      praktikum.instruksi
                    ) : (
                      <ul className="list-decimal pl-4 space-y-1">
                        <li>Selesaikan kode sesuai dengan instruksi fungsionalitas di atas.</li>
                        <li>Gunakan editor di sebelah kanan untuk menulis dan mengedit solusi Anda.</li>
                        <li>Tekan tombol "Jalankan Kode" untuk melihat output console dan melakukan debug.</li>
                        <li>Klik "Kirim Praktikum" di pojok kanan atas untuk menyelesaikan pengerjaan.</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Spesifikasi Input/Output</h3>
                  <p className="text-xs text-slate-500 font-light mt-0.5">Gunakan data uji coba ini sebagai acuan fungsional kode Anda.</p>
                </div>

                <div className="space-y-4">
                  {praktikum.contohInput && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-[10px] font-mono text-blue-400 font-semibold tracking-wider block mb-1.5 uppercase">
                        Contoh Input
                      </span>
                      <pre className="text-xs font-mono text-slate-300 overflow-x-auto select-all p-2 bg-slate-950 rounded-lg">
                        {praktikum.contohInput}
                      </pre>
                    </div>
                  )}

                  {praktikum.contohOutput && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider block mb-1.5 uppercase">
                        Contoh Output yang Diharapkan
                      </span>
                      <pre className="text-xs font-mono text-slate-300 overflow-x-auto select-all p-2 bg-slate-950 rounded-lg">
                        {praktikum.contohOutput}
                      </pre>
                    </div>
                  )}

                  {!praktikum.contohInput && !praktikum.contohOutput && (
                    <div className="text-center py-6 text-slate-500 text-xs font-light">
                      Tidak ada data uji coba input atau output spesifik yang didefinisikan untuk praktikum ini.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
          
          {/* Integrity Warning Block */}
          <div className="p-4 bg-amber-500/5 border-t border-slate-800 shrink-0">
            <div className="flex gap-2.5">
              <AlertTriangle className="text-amber-500 shrink-0" size={16} />
              <div>
                <span className="text-[10px] font-bold font-mono tracking-wider text-amber-400 uppercase">Perhatian Pengawas</span>
                <p className="text-[11px] text-slate-400 font-light leading-tight mt-0.5">
                  Sistem pengamanan anti-curang berjalan otomatis. Seluruh penekanan tombol keyboard yang diblokir, pergantian jendela, dan pelepasan fullscreen akan langsung dicatat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Code Editor & Console Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900" id="editor-block">
          
          {/* Editor Header Bar */}
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <span className="text-slate-300 font-bold">editor.ts</span>
              <span>-</span>
              <span className="capitalize">{praktikum.bahasa}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset to template */}
              <button
                onClick={resetStarterCode}
                disabled={isEditorLocked}
                className="hover:bg-slate-850 text-slate-400 hover:text-white px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all disabled:opacity-30 cursor-pointer"
                title="Reset Kode ke Starter Template"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>

              <div className="h-3 w-px bg-slate-800" />

              {/* Theme Selector */}
              <button
                onClick={() => setEditorTheme(editorTheme === "dark" ? "light" : "dark")}
                className="hover:bg-slate-850 text-slate-400 hover:text-white px-2 rounded py-1 text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
              >
                {editorTheme === "dark" ? (
                  <>
                    <Eye size={12} />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={12} />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Core Code Editor Input */}
          <div className={`flex-1 flex overflow-hidden relative ${
            editorTheme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
          }`}>
            
            {/* Scroll-Synced Line Numbers Column */}
            <div 
              ref={lineCounterRef}
              className={`w-12 py-4 select-none text-right pr-3 font-mono text-xs overflow-hidden shrink-0 border-r ${
                editorTheme === "dark" ? "bg-slate-950 text-slate-600 border-slate-800" : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
              style={{ whiteSpace: "pre", lineHeight: "20px" }}
            >
              {lineNumbers}
            </div>

            {/* Code Input Area */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              disabled={isEditorLocked}
              placeholder="// Tulis kode JavaScript/TypeScript Anda di sini..."
              className={`flex-1 p-4 font-mono text-xs resize-none focus:outline-none overflow-y-auto leading-5 h-full ${
                editorTheme === "dark" 
                  ? "bg-slate-950 text-emerald-400 placeholder-slate-750 focus:bg-slate-950/80" 
                  : "bg-white text-slate-900 placeholder-slate-400 focus:bg-white"
              } disabled:opacity-80`}
              style={{ 
                tabSize: 2, 
                MozTabSize: 2,
                WebkitTextFillColor: isEditorLocked ? "#64748b" : undefined
              }}
              onKeyDown={(e) => {
                // Support tab indentation in textarea
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const targetVal = e.currentTarget.value;
                  const nextVal = targetVal.substring(0, start) + "  " + targetVal.substring(end);
                  setCode(nextVal);
                  
                  // Reset cursor
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                    }
                  }, 0);
                }
              }}
              id="textarea-code"
            />

            {/* locked badge overlay */}
            {isEditorLocked && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2 rounded-xl font-mono flex items-center gap-2">
                  <Shield size={14} />
                  <span>Editor Terkunci - Sesi Selesai</span>
                </div>
              </div>
            )}
          </div>

          {/* LOWER CONSOLE: Runs outputs */}
          <div className="h-[220px] bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
            {/* Console Header Bar */}
            <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                <CodeIcon size={12} className="text-slate-400" />
                <span>Console Output</span>
              </div>

              <button
                onClick={runCode}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1.5 transition-all shadow active:scale-95 disabled:opacity-40 cursor-pointer"
                id="btn-run-code"
              >
                {isRunning ? (
                  <>
                    <Loader2 size={11} className="animate-spin text-white" />
                    <span>Menjalankan...</span>
                  </>
                ) : (
                  <>
                    <Play size={11} fill="white" />
                    <span>Jalankan Kode</span>
                  </>
                )}
              </button>
            </div>

            {/* Console Log Content Area */}
            <div className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap bg-slate-950 select-all">
              {output ? (
                output
              ) : (
                <span className="text-slate-600 text-xs font-light">Belum ada log aktivitas. Klik tombol "Jalankan Kode" di atas untuk mengevaluasi script Anda.</span>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

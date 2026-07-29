import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  TerminalSquare,
  User,
  Clock3,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  SunMedium,
  Moon,
  Send,
  Play,
  AlertTriangle,
} from "lucide-react";
import type { PraktikumAktif } from "../../services/publicPraktikumService";
import {
  recordViolation,
  submitPraktikum,
  autosaveKode,
} from "../../services/publicPraktikumService";
import { useViolationTracker } from "../../hooks/useViolationTracker";
import { runCodeInWorker } from "../../utils/runCodeInWorker";
import { transpileIfNeeded } from "../../utils/transpileTypeScript";
import type { WorkerLogEntry } from "../../workers/codeRunner.worker";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import SessionEndDialog from "../../components/mahasiswa/SessionEndDialog";

interface WorkspaceSession {
  id_peserta: number;
  nim: string;
  nama: string;
  waktu_mulai: string;
  praktikum: PraktikumAktif;
}

const SESSION_KEY = "oplab_session";
const codeKey = (id: number) => `oplab_code_${id}`;
const violationKey = (id: number) => `oplab_violations_${id}`;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildIframeDoc(code: string): string {
  const safeCode = code.split("</script>").join("<\\/script>");
  return `<!doctype html><html><head><style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;padding:16px;color:#0f172a;font-size:14px;}
  </style></head><body><script>${safeCode}<\/script></body></html>`;
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [code, setCode] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [leftTab, setLeftTab] = useState<"instruksi" | "contoh">("instruksi");
  const [outputTab, setOutputTab] = useState<"console" | "halaman">("console");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<WorkerLogEntry[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [iframeDoc, setIframeDoc] = useState("");

  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [endDialog, setEndDialog] = useState<"timeout" | "success" | null>(null);

  const hasEndedRef = useRef(false);

  useEffect(() => {
    const navState = location.state as WorkspaceSession | null;
    let activeSession = navState;

    if (activeSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
    } else {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) activeSession = JSON.parse(saved) as WorkspaceSession;
    }

    if (!activeSession) {
      navigate("/praktikum");
      return;
    }

    setSession(activeSession);
    const savedCode = localStorage.getItem(codeKey(activeSession.id_peserta));
    setCode(savedCode ?? activeSession.praktikum.starter_code ?? "");
    const savedViolations = localStorage.getItem(violationKey(activeSession.id_peserta));
    setViolationCount(savedViolations ? Number(savedViolations) : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupSession = useCallback((id: number) => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(codeKey(id));
    localStorage.removeItem(violationKey(id));
  }, []);

  const handleSubmit = useCallback(
    async (type: "manual" | "auto") => {
      if (!session || hasEndedRef.current) return;

      if (type === "manual") setIsSubmitting(true);

      try {
        await submitPraktikum(session.id_peserta, code, type);
        hasEndedRef.current = true;

        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => undefined);
        }

        cleanupSession(session.id_peserta);
        setConfirmSubmitOpen(false);
        setEndDialog(type === "auto" ? "timeout" : "success");
      } catch (err) {
        if (type === "manual") {
          setSubmitError(err instanceof Error ? err.message : "Gagal mengirim praktikum.");
        } else {
          hasEndedRef.current = true;
          cleanupSession(session.id_peserta);
          setEndDialog("timeout");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [session, code, cleanupSession]
  );

  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  useEffect(() => {
    if (!session) return;
    const deadline =
      new Date(session.waktu_mulai).getTime() + session.praktikum.durasi_menit * 60_000;

    const tick = () => {
      const remaining = deadline - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0 && !hasEndedRef.current) {
        handleSubmit("auto");
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, handleSubmit]);

  const handleViolation = useCallback(
    (type: string) => {
      if (!session || hasEndedRef.current) return;
      setViolationCount((prev) => {
        const next = prev + 1;
        localStorage.setItem(violationKey(session.id_peserta), String(next));
        return next;
      });
      recordViolation(session.id_peserta, type);
    },
    [session]
  );
  useViolationTracker(!!session && !endDialog, handleViolation);

  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCodeChange(value: string | undefined) {
    if (!session) return;
    const next = value ?? "";
    setCode(next);
    localStorage.setItem(codeKey(session.id_peserta), next);

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      autosaveKode(session.id_peserta, next);
    }, 3000);
  }

  function handleReset() {
    if (!session) return;
    const starter = session.praktikum.starter_code ?? "";
    setCode(starter);
    localStorage.setItem(codeKey(session.id_peserta), starter);
  }

  async function handleRunCode() {
    if (!session) return;
    setIsRunning(true);
    setRuntimeError(null);
    try {
      const transpiled = transpileIfNeeded(code, session.praktikum.bahasa);
      const result = await runCodeInWorker(transpiled);
      setConsoleLogs(result.logs);
      setRuntimeError(result.errorMessage ?? null);
      setIframeDoc(buildIframeDoc(transpiled));

      const outputSummary = result.errorMessage
        ? `Error: ${result.errorMessage}`
        : result.logs.map((log) => log.message).join("\n") || "(tidak ada output console)";
      autosaveKode(session.id_peserta, code, outputSummary);
    } catch (err) {
      setRuntimeError(err instanceof Error ? err.message : "Gagal menjalankan kode.");
    } finally {
      setIsRunning(false);
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-400">
        Memuat sesi praktikum...
      </div>
    );
  }

  const isDark = theme === "dark";
  const bahasaLabel = session.praktikum.bahasa === "typescript" ? "Typescript" : "Javascript";
  const fileExt = session.praktikum.bahasa === "typescript" ? "ts" : "js";
  const instruksiLines = session.praktikum.instruksi
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const isUrgent = remainingMs !== null && remainingMs < 5 * 60_000;

  return (
    <div className={isDark ? "min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-white text-slate-900"}>
      <header
        className={`flex flex-wrap items-center justify-between gap-4 border-b px-6 py-3 ${
          isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 text-white">
            <TerminalSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">OPLab Workspace</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              {session.praktikum.bahasa} RUNTIME &middot; NIM: {session.nim}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-slate-400" />
            {session.nama}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 className={`h-4 w-4 ${isUrgent ? "text-rose-500" : "text-slate-400"}`} />
            Sisa Waktu:{" "}
            <span className={`font-mono font-bold ${isUrgent ? "text-rose-500" : ""}`}>
              {remainingMs !== null ? formatCountdown(remainingMs) : "--:--"}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-slate-400" />
            Pelanggaran:{" "}
            <span className="rounded-md bg-rose-100 px-2 py-0.5 font-mono text-xs font-bold text-rose-600">
              {violationCount}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-emerald-500 sm:flex">
            <CheckCircle2 className="h-4 w-4" />
            Tersimpan otomatis
          </span>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setConfirmSubmitOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
            Kirim Praktikum
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        <aside
          className={`flex w-[380px] shrink-0 flex-col overflow-y-auto border-r ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div className={`flex border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            {(["instruksi", "contoh"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLeftTab(tab)}
                className={`flex-1 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider transition ${
                  leftTab === tab
                    ? "border-b-2 border-brand-500 text-brand-500"
                    : isDark
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "instruksi" ? "Instruksi Soal" : "Contoh Input / Output"}
              </button>
            ))}
          </div>

          <div className="flex-1 px-5 py-5">
            {leftTab === "instruksi" ? (
              <>
                <span className="rounded-md bg-brand-500/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-brand-500">
                  {session.praktikum.mata_kuliah}
                </span>
                <h1 className="mt-3 text-xl font-extrabold leading-snug">
                  {session.praktikum.judul}
                </h1>

                <div className={`my-5 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`} />

                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deskripsi Soal
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {session.praktikum.deskripsi || "Tidak ada deskripsi tambahan."}
                </p>

                <div className={`my-5 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`} />

                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                  Petunjuk Pengerjaan
                </h2>
                <ul className={`mt-2 space-y-1.5 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {instruksiLines.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="text-lg font-extrabold">Spesifikasi Input/Output</h2>
                <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Gunakan data uji coba ini sebagai acuan fungsional kode Anda.
                </p>

                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Contoh Input
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words font-mono text-sm text-sky-500">
                    {session.praktikum.contoh_input || "-"}
                  </p>
                </div>

                <div
                  className={`mt-4 rounded-xl border p-4 ${
                    isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Contoh Output yang Diharapkan
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words font-mono text-sm text-emerald-500">
                    {session.praktikum.contoh_output || "-"}
                  </p>
                </div>
              </>
            )}
          </div>

          <div
            className={`m-4 flex gap-3 rounded-xl border p-4 ${
              isDark ? "border-amber-900/40 bg-amber-950/20" : "border-amber-200 bg-amber-50"
            }`}
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
                Perhatian Pengawas
              </p>
              <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Sistem pengamanan anti-curang berjalan otomatis. Seluruh penekanan tombol keyboard
                yang diblokir, pergantian jendela, dan pelepasan fullscreen akan langsung dicatat.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div
            className={`flex items-center justify-between border-b px-4 py-2.5 ${
              isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
            }`}
          >
            <p className="font-mono text-sm">
              editor.{fileExt} <span className="text-slate-400">- {bahasaLabel}</span>
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                {isDark ? <SunMedium className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {isDark ? "Light Mode" : "Dark Mode"}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              theme={isDark ? "vs-dark" : "light"}
              language={session.praktikum.bahasa === "typescript" ? "typescript" : "javascript"}
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          <div
            className={`flex h-64 shrink-0 flex-col border-t ${
              isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
            }`}
          >
            <div className={`flex items-center justify-between border-b px-4 py-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex gap-1">
                {(["console", "halaman"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setOutputTab(tab)}
                    className={`rounded-md px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide transition ${
                      outputTab === tab
                        ? "bg-brand-500/10 text-brand-500"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {tab === "console" ? "Console Output" : "Output Halaman"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play className="h-3.5 w-3.5" />
                {isRunning ? "Menjalankan..." : "Jalankan Kode"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-sm">
              {outputTab === "console" ? (
                consoleLogs.length === 0 && !runtimeError ? (
                  <p className="text-slate-400">
                    Belum ada log aktivitas. Klik tombol &quot;Jalankan Kode&quot; di atas untuk
                    mengevaluasi script Anda.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {consoleLogs.map((log, idx) => (
                      <p
                        key={idx}
                        className={
                          log.type === "error"
                            ? "text-rose-500"
                            : log.type === "warn"
                            ? "text-amber-500"
                            : isDark
                            ? "text-slate-200"
                            : "text-slate-700"
                        }
                      >
                        {log.message}
                      </p>
                    ))}
                    {runtimeError && <p className="text-rose-500">Error: {runtimeError}</p>}
                  </div>
                )
              ) : iframeDoc ? (
                <iframe
                  title="Output Halaman"
                  sandbox="allow-scripts"
                  srcDoc={iframeDoc}
                  className="h-full w-full rounded-md bg-white"
                />
              ) : (
                <p className="text-slate-400">
                  Belum ada output halaman. Jalankan kode untuk melihat hasil render di sini.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmSubmitOpen}
        title="Kirim Praktikum?"
        description={
          submitError ??
          "Kode Anda akan dikirim sebagai jawaban final dan tidak dapat diubah kembali. Pastikan kode sudah sesuai sebelum mengirim."
        }
        confirmLabel="Kirim"
        isLoading={isSubmitting}
        onCancel={() => setConfirmSubmitOpen(false)}
        onConfirm={() => handleSubmit("manual")}
      />

      <SessionEndDialog
        open={!!endDialog}
        variant={endDialog ?? "success"}
        onClose={() => navigate("/")}
      />
    </div>
  );
}

import { ShieldAlert } from "lucide-react";

interface SafeModeWarningModalProps {
  open: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const violationPoints = [
  "Keluar dari mode Fullscreen",
  "Membuka Developer Tools (F12, Inspect Element)",
  "Berpindah tab atau me-minimize jendela",
  "Melakukan Klik Kanan / Salin / Tempel Kode",
];

export default function SafeModeWarningModal({
  open,
  isSubmitting,
  errorMessage,
  onConfirm,
  onCancel,
}: SafeModeWarningModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
          <ShieldAlert className="h-8 w-8" strokeWidth={2} />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900">Mode Aman Wajib!</h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          Untuk menjamin integritas kegiatan praktikum, Anda wajib masuk ke mode{" "}
          <span className="font-semibold text-slate-700">Layar Penuh (Fullscreen)</span>. Anda
          tidak diizinkan meninggalkan mode fullscreen hingga praktikum selesai dan diserahkan.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
          <p className="text-sm font-bold text-slate-800">
            Tindakan Berikut Akan Dicatat Sebagai Pelanggaran:
          </p>
          <ul className="mt-3 space-y-2">
            {violationPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-left text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Memulai sesi..." : "Masuk Mode Fullscreen & Mulai"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="mt-3 w-full text-sm font-medium text-slate-400 transition hover:text-slate-600"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

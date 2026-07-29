import { Clock3, CheckCircle2 } from "lucide-react";

interface SessionEndDialogProps {
  open: boolean;
  variant: "timeout" | "success";
  onClose: () => void;
}

export default function SessionEndDialog({ open, variant, onClose }: SessionEndDialogProps) {
  if (!open) return null;

  const isTimeout = variant === "timeout";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
            isTimeout ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isTimeout ? <Clock3 className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900">
          {isTimeout ? "Waktu Habis!" : "Praktikum Terkirim"}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {isTimeout
            ? "Waktu pengerjaan telah berakhir. Kode Anda telah dikirim secara otomatis ke sistem."
            : "Kode Anda berhasil dikirim. Terima kasih telah menyelesaikan praktikum ini."}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}

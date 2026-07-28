import { useLocation } from "react-router-dom";
import { Code2 } from "lucide-react";

export default function PraktikumMulaiPlaceholder() {
  const location = useLocation();
  const idPeserta = (location.state as { id_peserta?: number } | null)?.id_peserta;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <Code2 className="h-7 w-7 text-brand-600" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Sesi Praktikum Dimulai</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Lembar editor kode untuk pengerjaan praktikum sedang dalam pengembangan dan akan segera
        hadir pada tahap berikutnya.
      </p>
      {idPeserta && (
        <p className="mt-4 font-mono text-xs text-slate-400">ID Peserta: {idPeserta}</p>
      )}
    </div>
  );
}

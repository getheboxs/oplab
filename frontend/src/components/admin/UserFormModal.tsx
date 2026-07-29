import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { AdminUser } from "../../services/userService";

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: AdminUser | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: {
    username: string;
    nama_lengkap: string;
    email: string;
    password: string;
  }) => void;
}

export default function UserFormModal({
  open,
  mode,
  initialData,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [username, setUsername] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setNamaLengkap(initialData.nama_lengkap);
      setEmail(initialData.email ?? "");
    } else {
      setUsername("");
      setNamaLengkap("");
      setEmail("");
    }
    setPassword("");
  }, [initialData, open]);

  if (!open) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ username, nama_lengkap: namaLengkap, email, password });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {mode === "create" ? "Tambah Akun Pengguna" : "Ubah Akun Pengguna"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Akun ini dapat digunakan untuk masuk ke Portal Admin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Username
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Nama Lengkap
            </span>
            <input
              type="text"
              required
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Password {mode === "edit" && "(kosongkan jika tidak diubah)"}
            </span>
            <input
              type="password"
              required={mode === "create"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="input-field"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

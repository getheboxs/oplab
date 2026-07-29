import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, UserCircle2 } from "lucide-react";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminTabs from "../../components/admin/AdminTabs";
import UserFormModal from "../../components/admin/UserFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type AdminUser,
} from "../../services/userService";

function formatTanggal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { dateStyle: "medium" });
}

export default function UserManagementPage() {
  const { token, admin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchUsers(token);
      setUsers(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat daftar pengguna.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openCreateModal() {
    setModalMode("create");
    setSelected(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(user: AdminUser) {
    setModalMode("edit");
    setSelected(user);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmitForm(values: {
    username: string;
    nama_lengkap: string;
    email: string;
    password: string;
  }) {
    if (!token) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (modalMode === "create") {
        await createUser(token, values);
      } else if (selected) {
        const payload: Partial<typeof values> = {
          username: values.username,
          nama_lengkap: values.nama_lengkap,
          email: values.email,
        };
        if (values.password) payload.password = values.password;
        await updateUser(token, selected.id_admin, payload);
      }
      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan akun.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(token, deleteTarget.id_admin);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus akun.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader onRefresh={loadUsers} />
      <AdminTabs />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Manajemen User</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola akun dosen, laboran, dan asisten yang dapat mengakses Portal Admin.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            Tambah User
          </button>
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-400">
              Memuat data...
            </div>
          ) : users.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-400">
              Belum ada akun pengguna.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((user) => (
                <li
                  key={user.id_admin}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <UserCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {user.nama_lengkap}{" "}
                        {admin?.id_admin === user.id_admin && (
                          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Anda
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        @{user.username} {user.email && `· ${user.email}`}
                      </p>
                      <p className="text-xs text-slate-400">Dibuat {formatTanggal(user.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      title="Ubah"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(user);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        initialData={selected}
        isSubmitting={isSubmitting}
        errorMessage={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Akun?"
        description={
          deleteError ??
          `Akun "${deleteTarget?.nama_lengkap}" akan dihapus permanen dan tidak bisa login kembali.`
        }
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

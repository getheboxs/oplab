import { API_BASE_URL } from "./authService";

export interface AdminUser {
  id_admin: number;
  username: string;
  nama_lengkap: string;
  email: string | null;
  created_at: string;
}

export interface UserFormValues {
  username: string;
  nama_lengkap: string;
  email: string;
  password: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Terjadi kesalahan pada server.");
  return data as T;
}

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function fetchUsers(token: string): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<AdminUser[]>(res);
}

export async function createUser(token: string, values: UserFormValues): Promise<AdminUser> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(values),
  });
  return handleResponse<AdminUser>(res);
}

export async function updateUser(
  token: string,
  id: number,
  values: Partial<UserFormValues>
): Promise<AdminUser> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(values),
  });
  return handleResponse<AdminUser>(res);
}

export async function deleteUser(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<void>(res);
}

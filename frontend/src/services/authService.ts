export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface AdminPublic {
  id_admin: number;
  username: string;
  nama_lengkap: string;
  email: string | null;
}

export interface LoginResponse {
  token: string;
  admin: AdminPublic;
}

export async function loginAdmin(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Gagal masuk. Silakan coba lagi.");
  }

  return data as LoginResponse;
}

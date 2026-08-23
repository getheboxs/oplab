// In unified fullstack architecture, frontend and backend share the same origin.
// We sanitize any localhost URLs so browser calls always use relative paths (/api/...)
const rawApiUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
export const API_BASE_URL =
  !rawApiUrl ||
  rawApiUrl === "/" ||
  rawApiUrl.startsWith("http://localhost") ||
  rawApiUrl.startsWith("http://127.0.0.1") ||
  rawApiUrl.startsWith("https://localhost")
    ? ""
    : rawApiUrl.replace(/\/+$/, "");

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
  const url = `${API_BASE_URL}/api/admin/login`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    throw new Error(
      `Gagal terhubung ke server (${err instanceof Error ? err.message : "Network error"}). Pastikan server aktif.`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Respon server tidak valid (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.message ?? "Gagal masuk. Silakan periksa kembali username dan password.");
  }

  return data as LoginResponse;
}

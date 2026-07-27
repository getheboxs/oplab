export interface Admin {
  id_admin: number;
  username: string;
  password_hash: string;
  nama_lengkap: string;
  email: string | null;
}

export type AdminPublic = Omit<Admin, "password_hash">;

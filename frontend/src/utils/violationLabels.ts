interface ViolationMeta {
  badge: string;
  description: string;
}

const VIOLATION_LABELS: Record<string, ViolationMeta> = {
  keluar_fullscreen: {
    badge: "EXIT FULLSCREEN",
    description: "Mahasiswa keluar dari mode fullscreen.",
  },
  copy: { badge: "COPY", description: "Mahasiswa mencoba menyalin (copy) teks." },
  paste: { badge: "PASTE", description: "Mahasiswa mencoba menempel (paste) teks." },
  cut: { badge: "CUT", description: "Mahasiswa mencoba memotong (cut) teks." },
  drag_drop: { badge: "DRAG & DROP", description: "Mahasiswa mencoba drag & drop konten." },
  klik_kanan: { badge: "RIGHT CLICK", description: "Mahasiswa mencoba klik kanan pada halaman." },
  devtools_attempt: {
    badge: "DEVTOOLS",
    description: "Mahasiswa mencoba membuka developer tools.",
  },
  pindah_tab: { badge: "SWITCH TAB", description: "Mahasiswa berpindah tab/browser." },
  kehilangan_fokus: {
    badge: "LOSE FOCUS",
    description: "Mahasiswa kehilangan fokus dari jendela browser.",
  },
};

export function getViolationMeta(jenis: string): ViolationMeta {
  return VIOLATION_LABELS[jenis] ?? { badge: jenis.toUpperCase(), description: jenis };
}

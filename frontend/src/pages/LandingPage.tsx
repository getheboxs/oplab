import { Activity, User, ShieldCheck, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PortalCard from "../components/PortalCard";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-20">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-600">
            <Activity className="h-4 w-4" />
            Platform Praktikum Mandiri &amp; Aman
          </span>

          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Online Programming Lab
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            Media pengerjaan praktikum pemrograman JavaScript &amp; TypeScript
            secara daring dengan sistem pengamanan browser dan monitoring
            real-time yang ketat.
          </p>
        </section>

        {/* Portal Cards */}
        <section className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
          <PortalCard
            icon={User}
            accent="indigo"
            title="Portal Mahasiswa"
            description="Masuk menggunakan Kode Praktikum aktif yang diberikan oleh dosen atau asisten laboratorium untuk memulai pengerjaan praktikum secara mandiri."
            onClick={() => navigate("/praktikum")}
            footer={
              <span className="flex items-center gap-2 font-mono text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Sesi Aktif: -
              </span>
            }
          />

          <PortalCard
            icon={ShieldCheck}
            accent="purple"
            title="Portal Admin / Dosen"
            description="Kelola aktivitas praktikum, jadwalkan ujian, awasi kecurangan mahasiswa secara real-time, dan unduh data rekapitulasi nilai praktikum dengan mudah."
            onClick={() => navigate("/admin/login")}
            footer={
              <span className="flex items-center gap-2 text-slate-400">
                <BookOpen className="h-4 w-4" />
                Khusus Dosen, Laboran &amp; Asisten
              </span>
            }
          />
        </section>
      </main>

      <footer className="border-t border-slate-100 py-6 text-center">
        <p className="font-mono text-xs text-slate-400">
          © 2026 OPLab — Dibangun untuk Praktikum Pemrograman
        </p>
      </footer>
    </div>
  );
}

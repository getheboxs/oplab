import React, { useState, useEffect } from "react";
import LobbyView from "./components/LobbyView";
import StudentJoinView from "./components/StudentJoinView";
import StudentWorkspaceView from "./components/StudentWorkspaceView";
import AdminLoginView from "./components/AdminLoginView";
import AdminDashboardView from "./components/AdminDashboardView";
import { Peserta, Praktikum, Submission } from "./types";

export default function App() {
  const [view, setView] = useState<
    "lobby" | "student-join" | "student-workspace" | "admin-login" | "admin-dashboard"
  >("lobby");

  // Auth states
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  // Active student workspace data
  const [activeSession, setActiveSession] = useState<{
    peserta: Peserta;
    praktikum: Praktikum;
    submission: Submission;
  } | null>(null);

  // Check login states on mount
  useEffect(() => {
    const token = localStorage.getItem("oplab_admin_token");
    if (token) {
      setAdminToken(token);
      setView("admin-dashboard");
    }

    // Recover student session if any was stored locally to prevent losing page-refresh state!
    const savedStudentSession = localStorage.getItem("oplab_student_session");
    if (savedStudentSession) {
      try {
        const parsed = JSON.parse(savedStudentSession);
        // Verify session is still valid by requesting state from server
        fetch(`/api/peserta/${parsed.peserta.id}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then((data) => {
            if (data.peserta && data.peserta.status === "sedang_mengerjakan") {
              setActiveSession({
                peserta: data.peserta,
                praktikum: parsed.praktikum,
                submission: data.submission,
              });
              setView("student-workspace");
            } else {
              localStorage.removeItem("oplab_student_session");
            }
          })
          .catch(() => {
            localStorage.removeItem("oplab_student_session");
          });
      } catch (e) {
        localStorage.removeItem("oplab_student_session");
      }
    }
  }, []);

  // Handlers
  const handleStudentJoinSuccess = (peserta: Peserta, praktikum: Praktikum, submission: Submission) => {
    const sessionData = { peserta, praktikum, submission };
    localStorage.setItem("oplab_student_session", JSON.stringify(sessionData));
    setActiveSession(sessionData);
    setView("student-workspace");
  };

  const handleStudentFinish = () => {
    localStorage.removeItem("oplab_student_session");
    setActiveSession(null);
    setView("lobby");
  };

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    setView("admin-dashboard");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("oplab_admin_token");
    setAdminToken(null);
    setView("lobby");
  };

  // Render view router
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {view === "lobby" && (
        <LobbyView 
          onNavigate={(target) => setView(target)} 
        />
      )}

      {view === "student-join" && (
        <StudentJoinView
          onNavigateBack={() => setView("lobby")}
          onJoinSuccess={handleStudentJoinSuccess}
        />
      )}

      {view === "student-workspace" && activeSession && (
        <StudentWorkspaceView
          peserta={activeSession.peserta}
          praktikum={activeSession.praktikum}
          initialSubmission={activeSession.submission}
          onFinish={handleStudentFinish}
        />
      )}

      {view === "admin-login" && (
        <AdminLoginView
          onNavigateBack={() => setView("lobby")}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}

      {view === "admin-dashboard" && adminToken && (
        <AdminDashboardView 
          onLogout={handleAdminLogout} 
        />
      )}
    </div>
  );
}

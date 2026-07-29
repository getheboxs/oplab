import { useEffect, useRef } from "react";

type ViolationType =
  | "keluar_fullscreen"
  | "copy"
  | "paste"
  | "cut"
  | "klik_kanan"
  | "devtools_attempt"
  | "pindah_tab";

function isBlockedShortcut(e: KeyboardEvent): boolean {
  if (e.key === "F12") return true;
  if (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key.toUpperCase())) return true;
  if (e.ctrlKey && ["u", "s", "p"].includes(e.key.toLowerCase())) return true;
  return false;
}

export function useViolationTracker(active: boolean, onViolation: (type: ViolationType) => void) {
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Kombinasi shortcut developer tools DIBLOKIR (preventDefault) sekaligus dicatat.
      if (isBlockedShortcut(e)) {
        e.preventDefault();
        onViolationRef.current("devtools_attempt");
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        onViolationRef.current("keluar_fullscreen");
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        onViolationRef.current("pindah_tab");
      }
    }

    function handleContextMenu() {
      // Tidak diblokir, hanya dicatat.
      onViolationRef.current("klik_kanan");
    }

    function handleCopy() {
      onViolationRef.current("copy");
    }
    function handleCut() {
      onViolationRef.current("cut");
    }
    function handlePaste() {
      onViolationRef.current("paste");
    }

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("paste", handlePaste);
    };
  }, [active]);
}

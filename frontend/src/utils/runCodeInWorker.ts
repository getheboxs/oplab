import type { WorkerResultMessage } from "../workers/codeRunner.worker";

const EXECUTION_TIMEOUT_MS = 4000;

export function runCodeInWorker(code: string): Promise<WorkerResultMessage> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("../workers/codeRunner.worker.ts", import.meta.url), {
      type: "module",
    });

    const timeoutId = setTimeout(() => {
      worker.terminate();
      resolve({
        status: "error",
        logs: [],
        errorMessage: `Eksekusi dihentikan: kode berjalan lebih dari ${
          EXECUTION_TIMEOUT_MS / 1000
        } detik (kemungkinan infinite loop).`,
      });
    }, EXECUTION_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<WorkerResultMessage>) => {
      clearTimeout(timeoutId);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      clearTimeout(timeoutId);
      worker.terminate();
      resolve({ status: "error", logs: [], errorMessage: event.message });
    };

    worker.postMessage({ code });
  });
}

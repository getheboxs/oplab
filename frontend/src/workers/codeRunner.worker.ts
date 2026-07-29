export interface WorkerLogEntry {
  type: "log" | "warn" | "error";
  message: string;
}

export interface WorkerResultMessage {
  status: "success" | "error";
  logs: WorkerLogEntry[];
  errorMessage?: string;
}

function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

self.onmessage = (event: MessageEvent<{ code: string }>) => {
  const logs: WorkerLogEntry[] = [];

  const sandboxConsole = {
    log: (...args: unknown[]) => logs.push({ type: "log", message: args.map(safeStringify).join(" ") }),
    warn: (...args: unknown[]) => logs.push({ type: "warn", message: args.map(safeStringify).join(" ") }),
    error: (...args: unknown[]) => logs.push({ type: "error", message: args.map(safeStringify).join(" ") }),
  };

  try {
    const runner = new Function("console", event.data.code);
    runner(sandboxConsole);
    const result: WorkerResultMessage = { status: "success", logs };
    (self as unknown as Worker).postMessage(result);
  } catch (error) {
    const result: WorkerResultMessage = {
      status: "error",
      logs,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    (self as unknown as Worker).postMessage(result);
  }
};

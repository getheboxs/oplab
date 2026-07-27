// Konversi nilai datetime dari MySQL (mis. "2026-08-01T09:00:00.000Z" / "2026-08-01 09:00:00")
// menjadi format yang diterima <input type="datetime-local"> yaitu "YYYY-MM-DDTHH:mm".
export function toDatetimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// Konversi nilai dari <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
// menjadi format DATETIME MySQL ("YYYY-MM-DD HH:mm:00").
export function toMySQLDatetime(value: string): string {
  if (!value) return "";
  return `${value.replace("T", " ")}:00`;
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa karakter ambigu (I, O, 0, 1)

export function generateKodeAkses(length = 8): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

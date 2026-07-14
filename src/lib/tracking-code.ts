const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // بدون کاراکترهای شبیه‌به‌هم (0,O,1,I)

/** کد رهگیری یکتای داخلی بادرو، مثل BD-7K4P9X2Q */
export function generateTrackingCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `BD-${code}`;
}

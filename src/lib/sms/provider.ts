/**
 * لایه انتزاعی ارسال پیامک — هم برای OTP و هم برای اعلان تغییر وضعیت سفارش استفاده می‌شود.
 * برای اتصال به یک provider واقعی (کاوه‌نگار، ملی‌پیامک و ...) کافی است یک کلاس جدید
 * پیاده‌سازی SmsProvider نوشته و در getSmsProvider جایگزین شود.
 */
export interface SmsProvider {
  send(mobile: string, text: string): Promise<{ success: boolean }>;
}

class MockSmsProvider implements SmsProvider {
  async send(mobile: string, text: string): Promise<{ success: boolean }> {
    // در فاز اول به‌جای اتصال به سرویس واقعی، پیامک در کنسول سرور چاپ می‌شود.
    console.log(`[SMS mock -> ${mobile}] ${text}`);
    return { success: true };
  }
}

let cachedProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.SMS_PROVIDER ?? "mock";

  switch (providerName) {
    // در آینده: case "kavenegar": return new KavenegarSmsProvider();
    // در آینده: case "melipayamak": return new MelipayamakSmsProvider();
    default:
      cachedProvider = new MockSmsProvider();
  }

  return cachedProvider;
}

import type { SmsProvider } from "./provider";

/**
 * پیاده‌سازی واقعی SmsProvider با وب‌سرویس REST کاوه‌نگار.
 * مستندات: https://kavenegar.github.io/kavenegar_en/ (متد sms/send.json)
 * نیازمند دو متغیر محیطی: KAVENEGAR_API_KEY و KAVENEGAR_SENDER (شماره خط ارسال).
 */

interface KavenegarSendResponse {
  return: { status: number; message: string };
  entries?: Array<{
    messageid: number;
    message: string;
    status: number;
    statustext: string;
    sender: string;
    receptor: string;
    date: number;
    cost: number;
  }>;
}

export class KavenegarSmsProvider implements SmsProvider {
  private readonly apiKey: string;
  private readonly sender: string;

  constructor() {
    const apiKey = process.env.KAVENEGAR_API_KEY;
    const sender = process.env.KAVENEGAR_SENDER;

    if (!apiKey || !sender) {
      throw new Error(
        "برای SMS_PROVIDER=kavenegar باید KAVENEGAR_API_KEY و KAVENEGAR_SENDER در متغیرهای محیطی تنظیم شوند."
      );
    }

    this.apiKey = apiKey;
    this.sender = sender;
  }

  async send(mobile: string, text: string): Promise<{ success: boolean }> {
    const url = `https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`;

    const body = new URLSearchParams({
      receptor: mobile,
      sender: this.sender,
      message: text,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body,
      });
    } catch (err) {
      console.error(`[SMS kavenegar -> ${mobile}] خطا در اتصال به کاوه‌نگار`, err);
      return { success: false };
    }

    const data = (await response.json().catch(() => null)) as KavenegarSendResponse | null;

    if (!response.ok || !data || data.return.status !== 200) {
      console.error(
        `[SMS kavenegar -> ${mobile}] ارسال ناموفق`,
        data?.return ?? { status: response.status, message: response.statusText }
      );
      return { success: false };
    }

    return { success: true };
  }
}

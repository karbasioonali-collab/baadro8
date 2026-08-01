const REQUEST_TIMEOUT_MS = 10000;

export type ChaparCredentials = {
  baseUrl: string;
  username: string;
  password: string;
};

/** آیا آدرس API یک شرکت، همان چاپار (Chaparnet) شناخته‌شده است؟ */
export function isChaparBaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === "app.krch.ir";
  } catch {
    return false;
  }
}

/**
 * چاپار کلید API جدا ندارد — هر درخواست باید یوزرنیم/رمز را در بدنه بفرستد.
 * چون فرم فعلی ادمین فقط یک فیلد «کلید API» دارد، این مقدار با فرمت
 * "username:password" در Company.apiKey ذخیره و اینجا split می‌شود.
 */
export function parseChaparCredentials(
  apiKey: string | null | undefined
): { username: string; password: string } | null {
  if (!apiKey) return null;
  const idx = apiKey.indexOf(":");
  if (idx === -1) return null;
  const username = apiKey.slice(0, idx).trim();
  const password = apiKey.slice(idx + 1).trim();
  if (!username || !password) return null;
  return { username, password };
}

class ChaparApiError extends Error {}

async function chaparRequest<T>(
  creds: ChaparCredentials,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: { username: creds.username, password: creds.password },
        ...body,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new ChaparApiError(`چاپار HTTP ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ChaparApiError("تایم‌اوت اتصال به API چاپار");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export type ChaparQuoteResult = { total: number; costs?: Record<string, number> };

/**
 * GET_QUOTE — استعلام قیمت. طبق مستندات ارائه‌شده: origin/destination کد شهر
 * چاپار، method نوع سرویس، value ارزش کالا (ریال)، weight وزن (کیلوگرم).
 * خروجی مورد انتظار: order.quote (قیمت کل) + ریز هزینه‌ها.
 * ⚠️ مقدار دقیق `method` (کد نوع سرویس) از مستندات رسمی چاپار تایید نشده —
 * فعلاً با یک مقدار پیش‌فرض فراخوانی می‌شود، باید با پشتیبانی/مستندات چاپار
 * تایید و در صورت نیاز قابل‌تنظیم شود.
 */
export async function getChaparQuote(
  creds: ChaparCredentials,
  params: { origin: string; destination: string; method: string; value: number; weight: number }
): Promise<ChaparQuoteResult | null> {
  const data = await chaparRequest<{
    order?: { quote?: number; costs?: Record<string, number>; cost_breakdown?: Record<string, number> };
  }>(creds, "/get_quote", params);

  const quote = data?.order?.quote;
  if (typeof quote !== "number" || !Number.isFinite(quote)) return null;

  return { total: quote, costs: data.order?.costs ?? data.order?.cost_breakdown };
}

export type ChaparTrackingResult = {
  status: string;
  history: { title: string; date?: string }[];
  origin?: string;
  destination?: string;
  agents?: string[];
  recipient?: string;
  signatureUrl?: string;
};

/**
 * TRACKING — رهگیری مرسوله. ورودی: reference (کد رهگیری)، lang (مثلاً fa).
 * خروجی شامل وضعیت، تاریخچه، مبدا/مقصد، نماینده‌ها، و در صورت تحویل، گیرنده/امضا.
 * چون شکل دقیق پاسخ واقعی چاپار از این sandbox قابل تایید نبود (دسترسی شبکه
 * مسدود است — به infobaadro.md مراجعه شود)، parse با optional chaining و
 * چند نام‌جایگزین محتمل برای هر فیلد نوشته شده تا در برابر تغییرات جزئی شکل
 * پاسخ واقعی مقاوم‌تر باشد؛ در صورت مغایرت باید با پاسخ واقعی اصلاح شود.
 */
export async function getChaparTracking(
  creds: ChaparCredentials,
  params: { reference: string; lang?: string }
): Promise<ChaparTrackingResult | null> {
  const data = await chaparRequest<{
    error?: string;
    status?: string;
    order?: { status?: string };
    history?: { title?: string; status?: string; date?: string; time?: string }[];
    origin?: string;
    destination?: string;
    agents?: string[];
    recipient?: { name?: string; signature?: string };
    receiver?: { name?: string };
    signature?: string;
  }>(creds, "/tracking", { reference: params.reference, lang: params.lang ?? "fa" });

  if (!data || data.error) return null;

  const status = data.status ?? data.order?.status;
  if (!status) return null;

  return {
    status,
    history: Array.isArray(data.history)
      ? data.history.map((h) => ({ title: h.title ?? h.status ?? "", date: h.date ?? h.time }))
      : [],
    origin: data.origin,
    destination: data.destination,
    agents: data.agents,
    recipient: data.recipient?.name ?? data.receiver?.name,
    signatureUrl: data.recipient?.signature ?? data.signature,
  };
}

export type ChaparState = { id: string; name: string };

/** GET_STATE — لیست استان‌ها، برای ساخت نگاشت نام شهر بادرو → کد شهر چاپار */
export async function getChaparStates(creds: ChaparCredentials): Promise<ChaparState[]> {
  const data = await chaparRequest<{ states?: { id?: string | number; name?: string }[]; data?: { id?: string | number; name?: string }[] }>(
    creds,
    "/get_state",
    {}
  );
  const list = data.states ?? data.data ?? [];
  return list
    .filter((s) => s.id != null && s.name)
    .map((s) => ({ id: String(s.id), name: String(s.name) }));
}

export type ChaparCity = { id: string; name: string };

/** GET_CITY — لیست شهرهای یک استان (بر اساس کد استان چاپار) */
export async function getChaparCities(
  creds: ChaparCredentials,
  stateId: string
): Promise<ChaparCity[]> {
  const data = await chaparRequest<{ cities?: { id?: string | number; name?: string }[]; data?: { id?: string | number; name?: string }[] }>(
    creds,
    "/get_city",
    { state: stateId }
  );
  const list = data.cities ?? data.data ?? [];
  return list
    .filter((c) => c.id != null && c.name)
    .map((c) => ({ id: String(c.id), name: String(c.name) }));
}

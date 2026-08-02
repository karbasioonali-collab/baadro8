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

/**
 * fetch عمداً استفاده شده (نه هیچ کتابخانه‌ی خارجی مثل playwright) — یک
 * global استاندارد Node/Next است، بدون هیچ import ثابتی که در صورت نبود
 * یک وابستگی خارجی روی production، بتواند در سطح ماژول throw کند (دقیقاً
 * همان کلاس مشکلی که باعث قطع کل سایت در حادثه‌ی page_automation شد —
 * به infobaadro.md مراجعه شود). خطای هر فراخوانی هم اینجا throw می‌شود و
 * مسئولیت catch کردنش با کد بالادستی (ExternalApiProvider/tracking.ts) است
 * که با safeGetQuote/try-catch محافظت شده.
 */
async function chaparRequest<T>(
  creds: ChaparCredentials,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const fullBody = {
    user: { username: creds.username, password: creds.password },
    ...body,
  };
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullBody),
      signal: controller.signal,
    });

    // خواندن به‌صورت متن خام (نه مستقیم res.json()) عمداً است: اگر پاسخ
    // JSON معتبر نباشد (مثلاً صفحه‌ی خطای HTML)، res.json() خودش throw
    // می‌کند و دیگر نمی‌شد بدنه‌ی خام را دید — با این روش همیشه قابل‌دیدن است.
    const rawText = await res.text();

    // TODO(لاگ موقت تشخیصی): بعد از پیدا شدن علت خالی/نامعتبر برگشتن
    // پاسخ چاپار، این console.error حذف شود. رمز عبور عمداً *** می‌شود.
    console.error("[Chapar] پاسخ خام HTTP", {
      path,
      sentPayload: { ...body, user: { username: creds.username, password: "***REDACTED***" } },
      httpStatus: res.status,
      httpStatusText: res.statusText,
      rawResponseBody: rawText,
    });

    if (!res.ok) {
      throw new ChaparApiError(`چاپار HTTP ${res.status}: ${rawText.slice(0, 500)}`);
    }

    try {
      return JSON.parse(rawText) as T;
    } catch (parseErr) {
      throw new ChaparApiError(
        `پاسخ چاپار JSON معتبر نبود: ${parseErr instanceof Error ? parseErr.message : "نامشخص"}`
      );
    }
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
 * GET_QUOTE از بقیه‌ی endpointهای چاپار متفاوت است — طبق تایید مستقیم
 * پشتیبانی چاپار (نه حدس):
 * - احراز هویت با هدر ثابت `APP-AUTH` است، نه یوزرنیم/رمز در بدنه.
 *   این مقدار یک ثابت سطح‌اپلیکیشن است (مشابه یک app key عمومی)، نه
 *   credential مخصوص حساب بادرو — به همین دلیل هاردکد است، نه از
 *   Company.apiKey خوانده می‌شود.
 * - بدنه multipart/form-data است، با یک فیلد به اسم «input» که مقدارش
 *   خودِ رشته‌ی JSON.stringify‌شده‌ی `{ order: {...} }` است (نه JSON خام).
 * - `sender_code`/`receiver_code` هم طبق تایید پشتیبانی چاپار «۱۰۰۰»
 *   (کد عمومی/پیش‌فرض) است تا وقتی قرارداد بسته و کد اختصاصی گرفته شود.
 */
const CHAPAR_QUOTE_APP_AUTH_HEADER = "aW9zX2N1c3RvbWVyX2FwcDpUUFhAMjAxNg==";

export async function getChaparQuote(
  creds: ChaparCredentials,
  params: { origin: string; destination: string; method: string; value: number; weight: number }
): Promise<ChaparQuoteResult | null> {
  const order = {
    origin: params.origin,
    destination: params.destination,
    weight: String(params.weight),
    value: String(params.value),
    method: params.method,
    sender_code: "1000",
    receiver_code: "1000",
    cod: "0",
  };

  const form = new FormData();
  form.append("input", JSON.stringify({ order }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}/get_quote`, {
      method: "POST",
      headers: { "APP-AUTH": CHAPAR_QUOTE_APP_AUTH_HEADER },
      body: form,
      signal: controller.signal,
    });

    const rawText = await res.text();

    if (!res.ok) {
      throw new ChaparApiError(`چاپار HTTP ${res.status}: ${rawText.slice(0, 500)}`);
    }

    let data: {
      result?: boolean;
      message?: string;
      order?: { quote?: number; costs?: Record<string, number> };
    };
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      throw new ChaparApiError(
        `پاسخ get_quote چاپار JSON معتبر نبود: ${parseErr instanceof Error ? parseErr.message : "نامشخص"}`
      );
    }

    const quote = data.order?.quote;
    if (typeof quote !== "number" || !Number.isFinite(quote)) {
      // لاگ ساده‌ی فقط-مربوط-به-get_quote — پیام دقیق چاپار را نشان می‌دهد.
      console.error("[Chapar] get_quote قیمت معتبر برنگرداند", {
        sentOrder: order,
        chaparResult: data.result,
        chaparMessage: data.message,
      });
      return null;
    }

    return { total: quote, costs: data.order?.costs };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ChaparApiError("تایم‌اوت اتصال به get_quote چاپار");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
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
 * شکل دقیق پاسخ واقعی چاپار تایید نشده، پس parse با optional chaining و
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

/** شکل خام یک آیتم استان/شهر در پاسخ چاپار — شناسه ممکن است id/no/code باشد (چاپار از «no» استفاده می‌کند) */
type RawChaparItem = { id?: string | number; no?: string | number; code?: string | number; name?: string };

/** از هر شکل شناخته‌شده‌ی پاسخ، آرایه‌ی خام آیتم‌ها را استخراج می‌کند؛ اگر هیچ‌کدام نبود [] */
function extractRawList(
  data: {
    states?: RawChaparItem[];
    cities?: RawChaparItem[];
    data?: RawChaparItem[];
    objects?: { state?: RawChaparItem[]; city?: RawChaparItem[] };
  },
  key: "states" | "cities"
): RawChaparItem[] {
  const objectsKey = key === "states" ? "state" : "city";
  return data[key] ?? data.data ?? data.objects?.[objectsKey] ?? [];
}

function mapRawItems(list: RawChaparItem[]): ChaparState[] {
  return list
    .map((item) => {
      const rawId = item.id ?? item.no ?? item.code;
      return rawId != null && item.name ? { id: String(rawId), name: String(item.name) } : null;
    })
    .filter((item): item is ChaparState => item !== null);
}

/**
 * GET_STATE — لیست استان‌ها، برای ساخت نگاشت نام شهر بادرو → کد شهر چاپار.
 * شکل واقعی پاسخ چاپار: `{ result, message, objects: { state: [{no, name}, ...] } }`
 * (تایید‌شده از لاگ production) — با fallback به شکل‌های دیگر (`states`/`data`)
 * که قبلاً حدس زده شده بودند، برای مقاومت در برابر تغییرات بعدی.
 */
export async function getChaparStates(creds: ChaparCredentials): Promise<ChaparState[]> {
  const data = await chaparRequest<{
    states?: RawChaparItem[];
    data?: RawChaparItem[];
    objects?: { state?: RawChaparItem[] };
  }>(creds, "/get_state", {});
  return mapRawItems(extractRawList(data, "states"));
}

export type ChaparCity = { id: string; name: string };

/**
 * GET_CITY — لیست شهرهای یک استان (بر اساس کد استان چاپار).
 * همان شکل `objects.city` مثل `get_state`، با همان fallbackها.
 */
export async function getChaparCities(
  creds: ChaparCredentials,
  stateId: string
): Promise<ChaparCity[]> {
  const data = await chaparRequest<{
    cities?: RawChaparItem[];
    data?: RawChaparItem[];
    objects?: { city?: RawChaparItem[] };
  }>(creds, "/get_city", { state: stateId });
  return mapRawItems(extractRawList(data, "cities"));
}

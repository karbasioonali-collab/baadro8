const REQUEST_TIMEOUT_MS = 10000;

// حداکثر تعداد آیتمی که در هر صفحه درخواست می‌شود. طبق تایید مستندات
// رسمی تاپین، سرور صرف‌نظر از این مقدار ممکن است per-page کوچک‌تری
// برگرداند و `total_count` واقعی را در پاسخ اعلام کند — به همین دلیل کد
// پایین‌تر (fetchTapinPaginatedList) دیگر به کافی‌بودن یک صفحه اعتماد
// نمی‌کند و صفحات بعدی را تا رسیدن به `total_count` می‌گیرد.
const LIST_PAGE_SIZE = 500;

// سقف امن تعداد صفحات — تا اگر `total_count` به هر دلیلی (پاسخ نامعتبر،
// عدد غیرمنتظره بزرگ) قابل‌اعتماد نبود، حلقه‌ی صفحه‌بندی هیچ‌وقت بی‌نهایت
// نشود. ۲۰ صفحه × ۵۰۰ آیتم = تا ۱۰٬۰۰۰ آیتم، خیلی بیشتر از تعداد واقعی
// استان‌ها (۳۱) یا شهرهای یک استان.
const MAX_LIST_PAGES = 20;

export type TapinCredentials = {
  baseUrl: string;
  shopId: string;
  token: string;
};

/** آیا آدرس API یک شرکت، همان تاپین (tapin.ir) شناخته‌شده است؟ */
export function isTapinBaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === "api.tapin.ir";
  } catch {
    return false;
  }
}

/**
 * فرمت ذخیره‌شده در Company.apiKey برای تاپین — دقیقاً همان الگوی
 * parseChaparCredentials در src/lib/chapar/client.ts: دو بخش جدا شده با
 * «:» — بخش اول shop_id، بخش دوم Bearer token.
 */
export function parseTapinCredentials(
  apiKey: string | null | undefined
): { shopId: string; token: string } | null {
  if (!apiKey) return null;
  const idx = apiKey.indexOf(":");
  if (idx === -1) return null;
  const shopId = apiKey.slice(0, idx).trim();
  const token = apiKey.slice(idx + 1).trim();
  if (!shopId || !token) return null;
  return { shopId, token };
}

class TapinApiError extends Error {}

type RawTapinItem = { code?: string | number; title?: string };

/**
 * شکل دقیق بسته‌بندی پاسخ state/tree و city/list (آرایه‌ی خام، یا
 * `{results:[...]}` به سبک DRF pagination، یا `{data:[...]}`) روی
 * production تایید نشده — با چند fallback نوشته شده تا در برابر رایج‌ترین
 * شکل‌های پاسخ صفحه‌بندی‌شده مقاوم باشد.
 */
function extractRawList(data: unknown): RawTapinItem[] {
  if (Array.isArray(data)) return data as RawTapinItem[];
  if (data && typeof data === "object") {
    const obj = data as { results?: RawTapinItem[]; data?: RawTapinItem[]; items?: RawTapinItem[] };
    return obj.results ?? obj.data ?? obj.items ?? [];
  }
  return [];
}

function mapRawItems(list: RawTapinItem[]): { code: string; name: string }[] {
  return list
    .map((item) =>
      item.code != null && item.title ? { code: String(item.code), name: String(item.title) } : null
    )
    .filter((item): item is { code: string; name: string } => item !== null);
}

/**
 * `total_count` را از پاسخ استخراج می‌کند (طبق مستندات رسمی تاپین، هر دو
 * endpoint این فیلد را برمی‌گردانند). چون شکل دقیق بسته‌بندی پاسخ
 * (سطح بالا یا داخل `data`) مثل بقیه‌ی این فایل تایید‌نشده، با همان
 * fallbackهای extractRawList نوشته شده.
 */
function extractTotalCount(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as { total_count?: unknown; data?: { total_count?: unknown } };
  const raw = obj.total_count ?? obj.data?.total_count;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * کلاینت مشترک state/tree و city/list — هر دو JSON ساده با
 * Content-Type: application/json هستند (بر خلاف check-price که چون بادنه
 * نیاز به هدر Authorization دارد و مسیر/شکل درخواستش کاملاً متفاوت است،
 * جدا پیاده‌سازی شده).
 */
async function tapinListRequest<T>(
  creds: TapinCredentials,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await res.text();
    if (!res.ok) {
      throw new TapinApiError(`تاپین HTTP ${res.status}: ${rawText.slice(0, 500)}`);
    }

    try {
      return JSON.parse(rawText) as T;
    } catch (parseErr) {
      throw new TapinApiError(
        `پاسخ تاپین JSON معتبر نبود: ${parseErr instanceof Error ? parseErr.message : "نامشخص"}`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new TapinApiError("تایم‌اوت اتصال به API تاپین");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * تمام صفحات یک لیست صفحه‌بندی‌شده‌ی تاپین (state/tree یا city/list) را
 * جمع می‌کند. بعد از هر صفحه، `total_count` پاسخ چک می‌شود: اگر تعداد
 * آیتم‌های جمع‌شده هنوز کمتر از آن بود، صفحه‌ی بعدی هم گرفته می‌شود — تا
 * سقف MAX_LIST_PAGES. اگر `total_count` در پاسخ نبود، یا یک صفحه هیچ
 * آیتم جدیدی نداد (یعنی سرور واقعاً تمام شده)، حلقه همان‌جا متوقف می‌شود؛
 * در هر دو حالت آنچه تا آن لحظه جمع شده برگردانده می‌شود (نه throw) —
 * منطق کش «فقط غیرخالی» در city-map.ts بدون تغییر باقی مانده و همین‌طور
 * روی خروجی این تابع اعمال می‌شود.
 */
async function fetchTapinPaginatedList(
  creds: TapinCredentials,
  path: string,
  extraBody: Record<string, unknown>
): Promise<RawTapinItem[]> {
  const items: RawTapinItem[] = [];
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const data = await tapinListRequest<unknown>(creds, path, {
      count: LIST_PAGE_SIZE,
      page,
      ...extraBody,
    });

    const pageItems = extractRawList(data);
    if (pageItems.length === 0) break;
    items.push(...pageItems);

    const totalCount = extractTotalCount(data);
    if (totalCount == null || items.length >= totalCount) break;
  }
  return items;
}

export type TapinState = { code: string; name: string };

/** لیست کامل استان‌ها (همه‌ی صفحات)، برای ساخت نگاشت نام استان بادرو → کد استان تاپین. */
export async function getTapinStates(creds: TapinCredentials): Promise<TapinState[]> {
  const items = await fetchTapinPaginatedList(creds, "state/tree/", {});
  return mapRawItems(items);
}

export type TapinCity = { code: string; name: string };

/** لیست کامل شهرهای یک استان (همه‌ی صفحات، بر اساس کد استان تاپین). */
export async function getTapinCities(
  creds: TapinCredentials,
  stateCode: string
): Promise<TapinCity[]> {
  const items = await fetchTapinPaginatedList(creds, "city/list/", { state_code: stateCode });
  return mapRawItems(items);
}

export type TapinQuoteResult = { totalPrice: number };

/**
 * استعلام قیمت (check-price) — طبق مشخصات کارفرما:
 * - هدر Authorization: Bearer <token> (نه در بدنه، بر خلاف state/tree و city/list)
 * - بدنه شامل shop_id، city_code/province_code **مقصد** (تاپین مبدا را از
 *   روی shop_id/تنظیمات حساب فروشگاه تشخیص می‌دهد — مبدا در این endpoint
 *   جداگانه فرستاده نمی‌شود)، package_weight (گرم — بر خلاف چاپار که
 *   کیلوگرم می‌خواهد)، pay_type، order_type، و products.
 *
 * ⚠️ مقادیر pay_type/order_type پیش‌فرض (۱) **حدسی/پیش‌فرض** هستند —
 * مستندات دقیق enum این دو فیلد ارائه نشده بود؛ طبق دستور («بقیه‌ی
 * فیلدهای غیرضروری را با پیش‌فرض/خالی پر کن») همین‌طور فرض شدند. اگر
 * production نشان داد این پیش‌فرض قیمت را اشتباه محاسبه می‌کند یا خطا
 * می‌دهد، باید طبق مستندات/پشتیبانی تاپین اصلاح شود.
 *
 * ⚠️ واحد پول total_price (تومان یا ریال) تایید نشده. این تابع مقدار خام
 * را بدون هیچ تبدیلی برمی‌گرداند — طبق دستور کارفرما باید با یک سفارش
 * تستی واقعی روی production و مقایسه با ماشین‌حساب رسمی تاپین تایید شود
 * (دقیقاً مثل حادثه‌ی مشابه چاپار که در infobaadro.md مستند است)؛ این
 * محیط sandbox دسترسی شبکه‌ی واقعی به API تاپین ندارد، پس این تایید از
 * همین‌جا ممکن نیست.
 */
export async function getTapinQuote(
  creds: TapinCredentials,
  params: {
    destinationCityCode: string;
    destinationProvinceCode: string;
    packageWeightGrams: number;
    declaredValue: number;
  }
): Promise<TapinQuoteResult | null> {
  const body = {
    shop_id: creds.shopId,
    city_code: params.destinationCityCode,
    province_code: params.destinationProvinceCode,
    package_weight: params.packageWeightGrams,
    pay_type: 1,
    order_type: 1,
    products: [
      {
        count: 1,
        price: params.declaredValue,
        weight: params.packageWeightGrams,
        title: "مرسوله",
      },
    ],
    description: "",
    receiver_name: "",
    receiver_mobile: "",
    receiver_address: "",
    receiver_postal_code: "",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}/order/post/check-price/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await res.text();

    // این لاگ عمداً همیشه (نه فقط موقع شکست) چاپ می‌شود و موقت نیست —
    // دقیقاً به همان دلیلی که لاگ خام get_quote چاپار دائمی نگه داشته شده
    // (client.ts چاپار): تنها راه تایید شکل واقعی پاسخ و واحد پول
    // total_price، رصد لاگ‌های production بعد از اولین استفاده‌ی واقعی است.
    console.error("[Tapin] check-price — بدنه‌ی خام کامل پاسخ", {
      sentBody: { ...body, shop_id: "***REDACTED***" },
      httpStatus: res.status,
      rawResponseBody: rawText,
    });

    if (!res.ok) {
      throw new TapinApiError(`تاپین HTTP ${res.status}: ${rawText.slice(0, 500)}`);
    }

    let data: { total_price?: unknown; data?: { total_price?: unknown } };
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      throw new TapinApiError(
        `پاسخ check-price تاپین JSON معتبر نبود: ${parseErr instanceof Error ? parseErr.message : "نامشخص"}`
      );
    }

    const raw = data.total_price ?? data.data?.total_price;
    const totalPrice = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (!Number.isFinite(totalPrice)) {
      console.error("[Tapin] check-price قیمت معتبر برنگرداند (total_price در پاسخ پیدا نشد)", {
        rawResponseBody: rawText,
      });
      return null;
    }

    return { totalPrice };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new TapinApiError("تایم‌اوت اتصال به check-price تاپین");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

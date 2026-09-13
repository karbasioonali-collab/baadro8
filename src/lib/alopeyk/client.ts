const REQUEST_TIMEOUT_MS = 10000;

export type AlopeykCredentials = {
  baseUrl: string;
  token: string;
};

/** آیا آدرس API یک شرکت، همان الوپست (Alopeyk) شناخته‌شده است؟ */
export function isAlopeykBaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === "api.alopeyk.com";
  } catch {
    return false;
  }
}

/**
 * برخلاف چاپار/تاپین (که Company.apiKey را با فرمت username:password یا
 * shop_id:token ذخیره می‌کنند)، الوپست فقط یک توکن ساده لازم دارد — کل
 * مقدار apiKey همان توکن Bearer است، بدون هیچ جداکننده.
 */
export function parseAlopeykCredentials(
  apiKey: string | null | undefined
): { token: string } | null {
  if (!apiKey || !apiKey.trim()) return null;
  return { token: apiKey.trim() };
}

class AlopeykApiError extends Error {}

/**
 * fetch عمداً استفاده شده (نه هیچ کتابخانه‌ی خارجی) — مثل چاپار/تاپین،
 * بدون ریسک شکست بارگذاری ماژول در سطح build استاندالون (به حادثه‌ی
 * page_automation در infobaadro.md مراجعه شود).
 */
async function alopeykGet<T>(creds: AlopeykCredentials, path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${creds.token}` },
      signal: controller.signal,
    });

    const rawText = await res.text();
    if (!res.ok) {
      throw new AlopeykApiError(`الوپست HTTP ${res.status}: ${rawText.slice(0, 500)}`);
    }

    try {
      return JSON.parse(rawText) as T;
    } catch (parseErr) {
      throw new AlopeykApiError(
        `پاسخ الوپست JSON معتبر نبود: ${parseErr instanceof Error ? parseErr.message : "نامشخص"}`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AlopeykApiError("تایم‌اوت اتصال به API الوپست");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export type AlopeykProvince = { code: string; name: string };

/** لیست استان‌ها — طبق مستندات، فعلاً برای calc لازم نیست (calc فقط city_code مقصد می‌خواهد)، ولی برای مراحل بعدی (ثبت سفارش/رهگیری) مستند و آماده نگه داشته شده. */
export async function getAlopeykProvinces(creds: AlopeykCredentials): Promise<AlopeykProvince[]> {
  const data = await alopeykGet<{
    status?: unknown;
    message?: string;
    data?: { state_code?: string | number; state_name?: string }[];
  }>(creds, "client/provinces");

  return (data.data ?? [])
    .map((item) =>
      item.state_code != null && item.state_name
        ? { code: String(item.state_code), name: String(item.state_name) }
        : null
    )
    .filter((x): x is AlopeykProvince => x !== null);
}

export type AlopeykCity = { code: string; name: string; provinceCode: string };

/** لیست کامل شهرها (بدون صفحه‌بندی طبق مستندات — یک لیست تخت). */
export async function getAlopeykCities(creds: AlopeykCredentials): Promise<AlopeykCity[]> {
  const data = await alopeykGet<{
    data?: {
      state_name?: string;
      state_code?: string | number;
      city_name?: string;
      e_city_name?: string;
      city_code?: string | number;
    }[];
  }>(creds, "client/cities");

  return (data.data ?? [])
    .map((item) =>
      item.city_code != null && item.city_name && item.state_code != null
        ? {
            code: String(item.city_code),
            name: String(item.city_name),
            provinceCode: String(item.state_code),
          }
        : null
    )
    .filter((x): x is AlopeykCity => x !== null);
}

export type AlopeykEarliestSlot = {
  pickDate: string;
  pickSlotId: string;
  dropDate: string;
  dropSlotId: string;
};

/**
 * زودترین بازه‌ی زمانی موجود برای pick/drop. طبق تصمیم کارفرما، این لیست
 * به مشتری نمایش داده نمی‌شود — همیشه اولین گزینه‌ی موجود خودکار انتخاب
 * می‌شود.
 *
 * ⚠️ فرض تایید‌نشده: این تابع فرض می‌کند اولین عنصر هر سطح از آرایه‌ها
 * (data[0]، سپس slots[0]، سپس drops[0]، سپس drops[0].drops[0]) واقعاً
 * «زودترین» گزینه است — یعنی پاسخ API از قبل به ترتیب زمانی مرتب شده.
 * اگر تست واقعی نشان داد این فرض غلط است، باید با مقایسه‌ی واقعی مقادیر
 * تاریخ جایگزین شود.
 */
export async function getAlopeykEarliestSlot(
  creds: AlopeykCredentials
): Promise<AlopeykEarliestSlot | null> {
  const data = await alopeykGet<{
    data?: {
      pick_date?: string;
      slots?: {
        id?: string | number;
        drops?: { date?: string; drops?: { id?: string | number }[] }[];
      }[];
    }[];
  }>(creds, "client/time");

  const firstDay = data.data?.[0];
  const firstSlot = firstDay?.slots?.[0];
  const firstDrop = firstSlot?.drops?.[0];
  const firstDropSlot = firstDrop?.drops?.[0];

  if (!firstDay?.pick_date || firstSlot?.id == null || !firstDrop?.date || firstDropSlot?.id == null) {
    return null;
  }

  return {
    pickDate: firstDay.pick_date,
    pickSlotId: String(firstSlot.id),
    dropDate: firstDrop.date,
    dropSlotId: String(firstDropSlot.id),
  };
}

/**
 * نگاشت ابعاد بسته به size الوپست (۱ تا ۷). سایزهای ۱/۲ فقط برای پاکت
 * (فرمت‌های کاغذی A4/A3) هستند؛ بسته‌ها همیشه به یکی از سایزهای ۳ تا ۷
 * نگاشت می‌شوند، یا اگر از حداکثر مجاز (۴۵×۲۵×۲۰) بزرگ‌تر بودند null.
 *
 * تشخیص «آیا ابعاد داخل یک آستانه جا می‌شود» با مرتب‌سازی نزولی هر دو
 * مجموعه‌ی ابعاد (بسته‌ی واقعی و آستانه) و مقایسه‌ی جفت‌به‌جفت انجام
 * می‌شود — یعنی چرخش/جهت بسته را در نظر می‌گیرد (مثلاً بسته‌ای با ابعاد
 * ۱۰×۱۵×۵ همان‌قدر در آستانه‌ی ۱۵×۱۰×۱۰ جا می‌شود که ۱۵×۱۰×۵)، نه فقط
 * تطابق دقیق محور‌به‌محور. این روش استاندارد تشخیص «آیا جعبه‌ی A در
 * جعبه‌ی B جا می‌شود» است؛ مستندات کارفرما روش مقایسه را صریح نگفته بود.
 */
const PACKAGE_SIZE_THRESHOLDS_CM: { size: number; dims: [number, number, number] }[] = [
  { size: 3, dims: [15, 10, 10] },
  { size: 4, dims: [20, 15, 10] },
  { size: 5, dims: [20, 20, 15] },
  { size: 6, dims: [30, 20, 20] },
  { size: 7, dims: [45, 25, 20] },
];

function fitsWithinThreshold(dims: [number, number, number], threshold: [number, number, number]): boolean {
  const sortedDims = [...dims].sort((a, b) => b - a);
  const sortedThreshold = [...threshold].sort((a, b) => b - a);
  return sortedDims.every((d, i) => d <= sortedThreshold[i]);
}

/** برای پاکت size=1 (A4) ثابت برمی‌گرداند؛ برای بسته، کوچک‌ترین سایزی که ابعاد در آن جا می‌شود، یا null اگر از حداکثر مجاز بزرگ‌تر بود یا ابعاد ناقص بود. */
export function mapToAlopeykSize(input: {
  parcelType: "envelope" | "package";
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}): number | null {
  if (input.parcelType === "envelope") {
    return 1;
  }
  if (input.lengthCm == null || input.widthCm == null || input.heightCm == null) {
    return null;
  }
  const dims: [number, number, number] = [input.lengthCm, input.widthCm, input.heightCm];
  for (const { size, dims: threshold } of PACKAGE_SIZE_THRESHOLDS_CM) {
    if (fitsWithinThreshold(dims, threshold)) return size;
  }
  return null;
}

export type AlopeykQuoteResult = { totalPrice: number };

/**
 * استعلام قیمت (POST /client/calc). طبق مستندات تایید‌شده:
 * - هدر Authorization: Bearer <token> (مثل بقیه‌ی endpointهای الوپست).
 * - `drop` برای مرسولات بین‌شهری هم فعلاً اجباری است (نکته‌ی مستقیم
 *   مستندات)، پس همیشه پر می‌شود.
 * - `weight` گرم، `worth` تومان — بدون نیاز به تبدیل واحد (تایید‌شده،
 *   برخلاف چاپار/تاپین که این تبدیل حدسی/کشف‌شده بود).
 *
 * ⚠️ قیمت نهایی: اولویت با `order[0].total_price` (قیمت کل سفارش) است؛
 * اگر نبود fallback به `items[0].price` (قیمت فقط همان آیتم). کدام‌یک
 * واقعاً کامل/درست است (مثلاً آیا total_price شامل هزینه‌ی بسته‌بندی هم
 * می‌شود) هنوز با پاسخ واقعی production تایید نشده.
 */
export async function getAlopeykQuote(
  creds: AlopeykCredentials,
  params: {
    pickDate: string;
    pickSlotId: string;
    dropDate: string;
    dropSlotId: string;
    pickLat: number;
    pickLng: number;
    destinationCityCode: string;
    size: number;
    weightGrams: number;
    worthToman: number;
    packaging: 0 | 1;
  }
): Promise<AlopeykQuoteResult | null> {
  const body = {
    shipment: {
      pick: { method: "customer", date: params.pickDate, slot_id: params.pickSlotId },
      drop: { date: params.dropDate, slot_id: params.dropSlotId },
    },
    pick: { location: { lat: params.pickLat, lng: params.pickLng } },
    items: [
      {
        id: "1",
        parcel: {
          size: params.size,
          weight: params.weightGrams,
          worth: params.worthToman,
          packaging: params.packaging,
        },
        drop: { location: { city_code: params.destinationCityCode } },
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}/client/calc`, {
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
    // همان الگوی لاگ خام دائمی get_quote چاپار/check-price تاپین: تنها
    // راه تایید شکل واقعی پاسخ calc، بدون نیاز به دیپلوی جدید، رصد
    // لاگ‌های production است.
    console.error("[Alopeyk] calc — بدنه‌ی خام کامل درخواست/پاسخ", {
      sentBody: body,
      httpStatus: res.status,
      rawResponseBody: rawText,
    });

    if (!res.ok) {
      throw new AlopeykApiError(`الوپست HTTP ${res.status}: ${rawText.slice(0, 500)}`);
    }

    let data: {
      status?: unknown;
      message?: string;
      data?: {
        items?: { id?: string; price?: number | string }[];
        order?: { total_price?: number | string }[];
      }[];
    };
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      throw new AlopeykApiError(
        `پاسخ calc الوپست JSON معتبر نبود: ${parseErr instanceof Error ? parseErr.message : "نامشخص"}`
      );
    }

    const result = data.data?.[0];

    // TODO(لاگ موقت تشخیصی): برای بررسی گزارش «calc موفق است ولی الوپست در
    // نتایج نهایی دیده نمی‌شود» — نشان می‌دهد شکل واقعی result دقیقاً با
    // فرض کد (data.data یک آرایه، order/items هم آرایه) مطابقت دارد یا نه.
    // بعد از پیدا شدن علت، حذف شود.
    console.log("[Alopeyk] calc — تشخیص محل استخراج قیمت (تشخیصی)", {
      isDataArray: Array.isArray(data.data),
      resultKeys: result ? Object.keys(result) : null,
      hasOrder: result?.order != null,
      isOrderArray: Array.isArray(result?.order),
      orderFirstTotalPrice: result?.order?.[0]?.total_price,
      hasItems: result?.items != null,
      isItemsArray: Array.isArray(result?.items),
      itemsFirstPrice: result?.items?.[0]?.price,
    });

    const raw = result?.order?.[0]?.total_price ?? result?.items?.[0]?.price;
    const totalPrice = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;

    // TODO(لاگ موقت تشخیصی): همراه لاگ بالا — بعد از پیدا شدن علت، حذف شود.
    console.log("[Alopeyk] calc — نتیجه‌ی نهایی استخراج قیمت", {
      rawExtractedValue: raw,
      totalPrice,
      sourceField:
        result?.order?.[0]?.total_price != null
          ? "order[0].total_price"
          : result?.items?.[0]?.price != null
            ? "items[0].price"
            : "هیچ‌کدام یافت نشد",
    });

    if (!Number.isFinite(totalPrice)) {
      console.error("[Alopeyk] calc قیمت معتبر برنگرداند (نه order.total_price نه items.price)", {
        rawResponseBody: rawText,
      });
      return null;
    }

    return { totalPrice };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AlopeykApiError("تایم‌اوت اتصال به calc الوپست");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

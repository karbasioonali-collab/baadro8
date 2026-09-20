// ⚠️ این ماژول عمداً کاملاً مستقل از src/lib/alopeyk/ (شرکت «الوپست»، پستی
// بین‌شهری) نوشته شده — هیچ import ای بین این دو نیست، حتی اگر کد مشابه
// تکرار شود. دلیل: «الوپیک» (پیک موتوری درون‌شهری) و «الوپست» دو company
// جدا در بادرو هستند و کارفرما صریحاً خواسته الوپست زنده روی سایت با این
// تغییر لمس نشود.

const REQUEST_TIMEOUT_MS = 10000;

export type AlopeykPeykCredentials = {
  baseUrl: string;
  token: string;
};

/**
 * ⚠️ نکته‌ی حیاتی معماری: هاست الوپیک («api.alopeyk.com» / سندباکس
 * «sandbox-api.alopeyk.com») دقیقاً همان هاستی است که شرکت «الوپست»
 * (src/lib/alopeyk/client.ts، isAlopeykBaseUrl) از آن استفاده می‌کند —
 * تنها تفاوت واقعی «path» است: الوپست زیر `/alopost-service`، الوپیک
 * مستقیم روی ریشه‌ی دامنه. اگر اینجا فقط hostname چک می‌شد (مثل
 * isAlopeykBaseUrl الوپست)، این دو company با هم قاطی می‌شدند و در
 * دیسپچ external-api-provider.ts یکی به‌جای دیگری اجرا می‌شد. به همین
 * دلیل pathname هم عمداً چک می‌شود تا این دو شرکت با وجود هاست مشترک
 * کاملاً قابل تفکیک بمانند. (external-api-provider.ts هم این تابع را
 * قبل از isAlopeykBaseUrl صدا می‌زند — به کامنت همان‌جا مراجعه شود.)
 */
const ALOPEYK_PEYK_HOSTNAMES = new Set(["api.alopeyk.com", "sandbox-api.alopeyk.com"]);

export function isAlopeykPeykBaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!ALOPEYK_PEYK_HOSTNAMES.has(parsed.hostname)) return false;
    return !parsed.pathname.toLowerCase().includes("alopost-service");
  } catch {
    return false;
  }
}

/** مثل الوپست، کل apiKey همان توکن Bearer است — بدون جداکننده. (پیاده‌سازی مستقل، نه import از alopeyk/client.ts) */
export function parseAlopeykPeykCredentials(
  apiKey: string | null | undefined
): { token: string } | null {
  if (!apiKey || !apiKey.trim()) return null;
  return { token: apiKey.trim() };
}

class AlopeykPeykApiError extends Error {}

export type AlopeykPeykQuoteResult = {
  totalPrice: number;
  distanceMeters?: number;
  durationSeconds?: number;
};

/**
 * استعلام قیمت (POST /api/v2/orders/price/calc) برای حمل بسته با موتورسیکلت.
 *
 * ⚠️⚠️ فقط transport_type="motor_taxi" (حمل بسته، نه مسافر) پیاده و
 * مستند شده — طبق تاکید صریح کارفرما. هیچ مقدار دیگری (cargo، cargo_s،
 * car، car_taxi یا هر transport_type مربوط به جابه‌جایی مسافر) اینجا
 * پیاده یا حتی نام‌گذاری نشده و نباید بشود؛ این‌ها کار بادرو نیستند.
 *
 * هدرهای اجباری روی همه‌ی endpointهای الوپیک (طبق مستندات کارفرما):
 * Authorization: Bearer <token> و X-Requested-With: XMLHttpRequest.
 *
 * ⚠️ شکل دقیق پاسخ (آیا data یک شیء تخت است یا آرایه، دقیقاً کدام
 * فیلدها زیر data هستند) با مستندات کارفرما تایید نشده — کارفرما فقط
 * لیست فیلدهای مورد انتظار (price, distance, duration, credit,
 * user_credit) را داده، نه یک نمونه‌ی کامل JSON. بر اساس درسی که تازه
 * از calc الوپست گرفتیم (پاسخ واقعی، برخلاف مستندات آن endpoint، data
 * را مستقیم به‌شکل شیء تخت برمی‌گرداند نه آرایه)، همین الگو این‌جا هم
 * به‌عنوان محتمل‌ترین حالت در نظر گرفته شده (`data.price`)؛ ولی این
 * صرفاً یک فرض مستندشده است، نه تایید‌شده با پاسخ واقعی این endpoint
 * خاص. دقیقاً به همین دلیل یک لاگ خام دائمی (نه موقت) اضافه شده تا اگر
 * فرض غلط بود، بلافاصله در لاگ production قابل تشخیص باشد — بدون نیاز
 * به یک دور بررسی جداگانه مثل چیزی که برای calc الوپست پیش آمد.
 *
 * واحد `price`: فرض بر تومان (هم‌راستا با بقیه‌ی providerهای بادرو)،
 * ولی این هم با مستندات کارفرما صراحتاً تایید نشده — باید با پاسخ واقعی
 * production تایید/اصلاح شود.
 *
 * کش single-flight: چون چند call site (پیش‌نمایش زنده‌ی صفحه اصلی،
 * صفحه‌ی نتایج) می‌توانند تقریباً هم‌زمان دقیقاً همین مختصات مبدا/مقصد
 * را استعلام بگیرند (همان الگوی race condition که برای شهرهای تاپین
 * پیدا شد)، فراخوانی‌های هم‌زمان با پارامترهای یکسان فقط یک fetch واقعی
 * می‌زنند. برخلاف کش شهر تاپین/الوپست، اینجا **کش نتیجه با TTL نیست** —
 * فقط دی‌دوپ درخواست‌های هم‌زمان (in-flight)، چون قیمت واقعی می‌تواند با
 * گذر زمان/ترافیک تغییر کند و نگه‌داشتن آن برای استفاده‌ی بعدی نادرست
 * است؛ به محض تمام‌شدن یک fetch، دفعه‌ی بعد از صفر واقعاً استعلام گرفته
 * می‌شود.
 */
export async function getAlopeykPeykQuote(
  creds: AlopeykPeykCredentials,
  params: {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }
): Promise<AlopeykPeykQuoteResult | null> {
  const key = calcInFlightKey(creds, params);
  const existing = calcInFlight.get(key);
  if (existing) return existing;

  const promise = fetchAlopeykPeykQuote(creds, params).finally(() => {
    calcInFlight.delete(key);
  });
  calcInFlight.set(key, promise);
  return promise;
}

const calcInFlight = new Map<string, Promise<AlopeykPeykQuoteResult | null>>();

function calcInFlightKey(
  creds: AlopeykPeykCredentials,
  params: { originLat: number; originLng: number; destinationLat: number; destinationLng: number }
): string {
  return [
    creds.baseUrl,
    creds.token,
    params.originLat,
    params.originLng,
    params.destinationLat,
    params.destinationLng,
  ].join("::");
}

async function fetchAlopeykPeykQuote(
  creds: AlopeykPeykCredentials,
  params: {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }
): Promise<AlopeykPeykQuoteResult | null> {
  const body = {
    transport_type: "motor_taxi",
    addresses: [
      { type: "origin", lat: String(params.originLat), lng: String(params.originLng) },
      { type: "destination", lat: String(params.destinationLat), lng: String(params.destinationLng) },
    ],
    has_return: false,
    cashed: false,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}/api/v2/orders/price/calc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await res.text();

    // لاگ خام دائمی (نه موقت) — طبق همان الگوی get_quote چاپار/check-price
    // تاپین/calc الوپست: تنها راه تایید شکل واقعی پاسخ، بدون نیاز به
    // دیپلوی جدید، رصد لاگ‌های production است.
    console.error("[AlopeykPeyk] calc — بدنه‌ی خام کامل درخواست/پاسخ", {
      sentBody: body,
      httpStatus: res.status,
      rawResponseBody: rawText,
    });

    if (!res.ok) {
      throw new AlopeykPeykApiError(`الوپیک HTTP ${res.status}: ${rawText.slice(0, 500)}`);
    }

    let data: {
      status?: unknown;
      message?: string;
      data?: {
        price?: number | string;
        distance?: number | string;
        duration?: number | string;
        credit?: number | string;
        user_credit?: number | string;
      };
    };
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      throw new AlopeykPeykApiError(
        `پاسخ calc الوپیک JSON معتبر نبود: ${parseErr instanceof Error ? parseErr.message : "نامشخص"}`
      );
    }

    const result = data.data;
    const rawPrice = result?.price;
    const totalPrice =
      typeof rawPrice === "number" ? rawPrice : typeof rawPrice === "string" ? Number(rawPrice) : NaN;

    if (!Number.isFinite(totalPrice)) {
      console.error("[AlopeykPeyk] calc قیمت معتبر برنگرداند (data.price یافت نشد)", {
        rawResponseBody: rawText,
      });
      return null;
    }

    const rawDistance = result?.distance;
    const rawDuration = result?.duration;

    return {
      totalPrice,
      distanceMeters:
        typeof rawDistance === "number"
          ? rawDistance
          : typeof rawDistance === "string"
            ? Number(rawDistance)
            : undefined,
      durationSeconds:
        typeof rawDuration === "number"
          ? rawDuration
          : typeof rawDuration === "string"
            ? Number(rawDuration)
            : undefined,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AlopeykPeykApiError("تایم‌اوت اتصال به calc الوپیک");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

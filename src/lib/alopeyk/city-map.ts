import { getAlopeykCities, type AlopeykCredentials } from "./client";

/**
 * نگاشت نام شهر بادرو به city_code الوپست — دقیقاً همان الگوی نهاییِ
 * تاپین/چاپار (کش درون‌حافظه‌ای per-process به‌جای جدول دیتابیس، چون
 * بدون migration نمی‌شد جدول دائمی ساخت) — با هر دو درسی که از حادثه‌های
 * تاپین آموخته شد از همان ابتدا اینجا اعمال شده‌اند:
 * ۱) فقط نتیجه‌ی غیرخالی کش می‌شود (تا یک شکست موقت، نتیجه‌ی خالی را
 *    برای TTL کامل «قفل» نکند).
 * ۲) single-flight: فراخوانی‌های هم‌زمان (مثلاً پیش‌نمایش زنده‌ی صفحه
 *    اصلی + صفحه‌ی /results پشت‌سرهم) منتظر همان یک درخواست در پرواز
 *    می‌مانند، نه این‌که هرکدام مستقل یک fetch جدا بزنند.
 *
 * ⚠️ همان محدودیت چاپار/تاپین اینجا هم صدق می‌کند: با هر ری‌استارت سرور
 * (دیپلوی جدید روی Liara) این کش خالی می‌شود.
 *
 * برخلاف تاپین، لیست شهرهای الوپست صفحه‌بندی/تفکیک‌شده به‌ازای استان
 * نیست — طبق مستندات یک لیست تخت کامل است، پس فقط یک کش (نه دو سطحی
 * استان→شهر) لازم است.
 */

const CITY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const cityCache = new Map<
  string,
  { data: { code: string; name: string; provinceCode: string }[]; expiresAt: number }
>();
const cityFetchInFlight = new Map<
  string,
  Promise<{ code: string; name: string; provinceCode: string }[]>
>();

/** یکسان‌سازی نام — همان الگوی normalize در chapar/tapin/dts. */
function normalize(name: string): string {
  return name
    .replace(/[‌​ ]/g, " ")
    .trim()
    .replace(/[یي]/g, "ی")
    .replace(/[کك]/g, "ک")
    .replace(/\s+/g, " ")
    .replace(/^(استان|شهرستان|شهر)\s+/, "")
    .trim();
}

function credsKey(creds: AlopeykCredentials): string {
  return `${creds.baseUrl}::${creds.token}`;
}

async function getCachedCities(creds: AlopeykCredentials) {
  const key = credsKey(creds);
  const cached = cityCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const existing = cityFetchInFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const cities = await getAlopeykCities(creds);
      if (cities.length > 0) {
        cityCache.set(key, { data: cities, expiresAt: Date.now() + CITY_CACHE_TTL_MS });
      }
      return cities;
    } finally {
      cityFetchInFlight.delete(key);
    }
  })();
  cityFetchInFlight.set(key, promise);
  return promise;
}

export type AlopeykCityResolution = {
  cityCode: string;
  matchedCityName: string;
  matchedProvinceCode: string;
};

/** نام شهر بادرو را می‌گیرد و نگاشت به الوپست را برمی‌گرداند؛ در صورت عدم تطبیق یا خطای شبکه، null (نه throw). */
export async function resolveAlopeykCityCode(
  creds: AlopeykCredentials,
  cityName: string
): Promise<AlopeykCityResolution | null> {
  try {
    const cities = await getCachedCities(creds);
    const match = cities.find((c) => normalize(c.name) === normalize(cityName));
    if (!match) {
      console.error("[Alopeyk] شهر بادرو در لیست client/cities الوپست پیدا نشد", {
        searchedCity: cityName,
        normalizedSearched: normalize(cityName),
        rawCitiesFromAlopeykCount: cities.length,
      });
      return null;
    }
    return {
      cityCode: match.code,
      matchedCityName: match.name,
      matchedProvinceCode: match.provinceCode,
    };
  } catch (err) {
    console.error("[Alopeyk] خطا در دریافت client/cities برای نگاشت شهر", {
      cityName,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

import { getTapinCities, getTapinStates, type TapinCredentials, type TapinCity } from "./client";

/**
 * نگاشت نام استان/شهر بادرو به کد شهر/استان تاپین — دقیقاً همان الگوی
 * src/lib/chapar/city-map.ts (کش درون‌حافظه‌ای per-process به‌جای جدول
 * دیتابیس، چون بدون migration نمی‌شد جدول دائمی ساخت).
 *
 * ⚠️ همان محدودیت چاپار اینجا هم صدق می‌کند: با هر ری‌استارت سرور
 * (دیپلوی جدید روی Liara) این کش خالی می‌شود.
 */

const STATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CITY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const stateCache = new Map<string, { data: { code: string; name: string }[]; expiresAt: number }>();
const cityCache = new Map<
  string,
  { raw: TapinCity[]; map: Map<string, string>; expiresAt: number }
>();

/** یکسان‌سازی نام — همان منطق normalize در chapar/city-map.ts. */
function normalize(name: string): string {
  return name
    .replace(/[‌​ ]/g, " ") // نیم‌فاصله، zero-width space، NBSP
    .trim()
    .replace(/[یي]/g, "ی")
    .replace(/[کك]/g, "ک")
    .replace(/\s+/g, " ")
    .replace(/^(استان|شهرستان|شهر)\s+/, "")
    .trim();
}

function credsKey(creds: TapinCredentials): string {
  return `${creds.baseUrl}::${creds.shopId}`;
}

async function getCachedStates(creds: TapinCredentials) {
  const key = credsKey(creds);
  const cached = stateCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const states = await getTapinStates(creds);
  // فقط نتیجه‌ی غیرخالی کش می‌شود — همان دلیل مستندشده در chapar/city-map.ts
  // (تا یک شکست/خطای موقت، نتیجه‌ی خالی را برای ۶ ساعت "قفل" نکند).
  if (states.length > 0) {
    stateCache.set(key, { data: states, expiresAt: Date.now() + STATE_CACHE_TTL_MS });
  }
  return states;
}

async function getCachedCityMap(creds: TapinCredentials, stateCode: string) {
  const key = `${credsKey(creds)}::${stateCode}`;
  const cached = cityCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const cities = await getTapinCities(creds, stateCode);
  const map = new Map<string, string>();
  for (const c of cities) map.set(normalize(c.name), c.code);
  const entry = { raw: cities, map, expiresAt: Date.now() + CITY_CACHE_TTL_MS };
  if (cities.length > 0) {
    cityCache.set(key, entry);
  }
  return entry;
}

/**
 * نتیجه‌ی کامل نگاشت — چون check-price تاپین هم city_code هم province_code
 * مقصد را می‌خواهد، و province_code همان کد استانی است که قبلاً از
 * state/tree پیدا شده، نیازی به فراخوانی جداگانه نیست.
 */
export type TapinCityResolution = {
  cityCode: string;
  provinceCode: string;
  matchedCityName: string;
  matchedStateName: string;
};

/** نام استان و شهر بادرو را می‌گیرد و نگاشت کامل به تاپین را برمی‌گرداند؛ در صورت عدم تطبیق یا خطای شبکه، null */
export async function resolveTapinCityCode(
  creds: TapinCredentials,
  provinceName: string,
  cityName: string
): Promise<TapinCityResolution | null> {
  try {
    const states = await getCachedStates(creds);
    const state = states.find((s) => normalize(s.name) === normalize(provinceName));
    if (!state) {
      console.error("[Tapin] استان بادرو در لیست state/tree تاپین پیدا نشد", {
        searchedProvince: provinceName,
        normalizedSearched: normalize(provinceName),
        rawStatesFromTapin: states.map((s) => s.name),
      });
      return null;
    }

    const { raw, map } = await getCachedCityMap(creds, state.code);
    const cityCode = map.get(normalize(cityName));
    if (!cityCode) {
      console.error("[Tapin] شهر بادرو در لیست city/list تاپین (برای همین استان) پیدا نشد", {
        province: provinceName,
        searchedCity: cityName,
        normalizedSearched: normalize(cityName),
        tapinStateCode: state.code,
        rawCitiesFromTapin: raw.map((c) => c.name),
      });
      return null;
    }

    const matchedItem = raw.find((c) => c.code === cityCode);
    return {
      cityCode,
      provinceCode: state.code,
      matchedCityName: matchedItem?.name ?? "؟",
      matchedStateName: state.name,
    };
  } catch (err) {
    console.error("[Tapin] خطا در دریافت state/tree یا city/list برای نگاشت شهر", {
      provinceName,
      cityName,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

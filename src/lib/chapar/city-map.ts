import { getChaparCities, getChaparStates, type ChaparCredentials } from "./client";

/**
 * نگاشت نام استان/شهر بادرو به کد شهر چاپار.
 *
 * ⚠️ بدون migration نمی‌شد جدول دائمی برای این نگاشت ساخت (طبق محدودیت این
 * تسک)، پس با یک کش درون‌حافظه‌ای (per-process, TTL چند ساعته) پیاده شده —
 * نه یک جدول دیتابیس. یعنی روی هر ری‌استارت سرور (هر دیپلوی جدید روی Liara)
 * این کش خالی می‌شود و اولین استعلام بعد از هر دیپلوی، یکی-دو round-trip
 * اضافه به API چاپار می‌زند تا کش دوباره ساخته شود. اگر در آینده این کند بودن
 * مشکل شد، راه‌حل درست یک جدول دائمی (مثلاً افزودن ستون کد چاپار به
 * CityDistanceIndex یا یک مدل جدید) است که نیاز به migration دارد.
 */

const STATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CITY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const stateCache = new Map<string, { data: { id: string; name: string }[]; expiresAt: number }>();
const cityCache = new Map<string, { data: Map<string, string>; expiresAt: number }>();

function normalize(name: string): string {
  return name
    .trim()
    .replace(/[یي]/g, "ی")
    .replace(/[کك]/g, "ک")
    .replace(/\s+/g, " ");
}

function credsKey(creds: ChaparCredentials): string {
  return `${creds.baseUrl}::${creds.username}`;
}

async function getCachedStates(creds: ChaparCredentials) {
  const key = credsKey(creds);
  const cached = stateCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const states = await getChaparStates(creds);
  stateCache.set(key, { data: states, expiresAt: Date.now() + STATE_CACHE_TTL_MS });
  return states;
}

async function getCachedCityMap(creds: ChaparCredentials, stateId: string) {
  const key = `${credsKey(creds)}::${stateId}`;
  const cached = cityCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const cities = await getChaparCities(creds, stateId);
  const map = new Map<string, string>();
  for (const c of cities) map.set(normalize(c.name), c.id);
  cityCache.set(key, { data: map, expiresAt: Date.now() + CITY_CACHE_TTL_MS });
  return map;
}

/** نام استان و شهر بادرو را می‌گیرد و کد شهر چاپار را برمی‌گرداند؛ در صورت عدم تطبیق یا خطای شبکه، null */
export async function resolveChaparCityCode(
  creds: ChaparCredentials,
  provinceName: string,
  cityName: string
): Promise<string | null> {
  try {
    const states = await getCachedStates(creds);
    const state = states.find((s) => normalize(s.name) === normalize(provinceName));
    if (!state) return null;

    const cityMap = await getCachedCityMap(creds, state.id);
    return cityMap.get(normalize(cityName)) ?? null;
  } catch (err) {
    // TODO(لاگ موقت تشخیصی): بعد از پیدا شدن علت این‌که چاپار توی نتایج
    // ظاهر نمی‌شود، این console.error حذف شود.
    console.error("[Chapar] خطا در دریافت get_state/get_city برای نگاشت شهر", {
      provinceName,
      cityName,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

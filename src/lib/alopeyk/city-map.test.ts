import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAlopeykCityCode } from "./city-map";

function withMockFetch<T>(impl: typeof fetch, fn: () => Promise<T>): Promise<T> {
  const realFetch = global.fetch;
  global.fetch = impl;
  return fn().finally(() => {
    global.fetch = realFetch;
  });
}

function withSilencedConsoleError<T>(fn: () => Promise<T>): Promise<T> {
  const real = console.error;
  console.error = () => {};
  return fn().finally(() => {
    console.error = real;
  });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

test("resolveAlopeykCityCode — تطبیق موفق + کش (فقط ۱ fetch برای ۲ فراخوانی متوالی)", async () => {
  let fetchCount = 0;
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        fetchCount++;
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: [{ state_name: "تهران", state_code: "1", city_name: "شهرری", city_code: "10" }],
            }),
        } as Response;
      },
      async () => {
        const creds = { baseUrl: "https://api.alopeyk.com/alopost-service", token: "tok-cache-1" };
        const r1 = await resolveAlopeykCityCode(creds, "شهرری");
        const r2 = await resolveAlopeykCityCode(creds, "شهرری");
        assert.equal(fetchCount, 1);
        assert.equal(r1?.cityCode, "10");
        assert.equal(r2?.cityCode, "10");
      }
    )
  );
});

test("resolveAlopeykCityCode — نتیجه‌ی خالی کش نمی‌شود (هر بار fetch جدید)", async () => {
  let fetchCount = 0;
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        fetchCount++;
        return { ok: true, status: 200, text: async () => JSON.stringify({ data: [] }) } as Response;
      },
      async () => {
        const creds = { baseUrl: "https://api.alopeyk.com/alopost-service", token: "tok-cache-2" };
        await resolveAlopeykCityCode(creds, "شهرری");
        await resolveAlopeykCityCode(creds, "شهرری");
        assert.equal(fetchCount, 2);
      }
    )
  );
});

test("resolveAlopeykCityCode — single-flight: فراخوانی هم‌زمان فقط ۱ fetch واقعی می‌زند", async () => {
  let fetchCount = 0;
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        fetchCount++;
        await delay(20);
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: [{ state_name: "تهران", state_code: "1", city_name: "شهرری", city_code: "10" }],
            }),
        } as Response;
      },
      async () => {
        const creds = { baseUrl: "https://api.alopeyk.com/alopost-service", token: "tok-cache-3" };
        const [a, b] = await Promise.all([
          resolveAlopeykCityCode(creds, "شهرری"),
          resolveAlopeykCityCode(creds, "شهرری"),
        ]);
        assert.equal(fetchCount, 1);
        assert.equal(a?.cityCode, "10");
        assert.equal(b?.cityCode, "10");
      }
    )
  );
});

test("resolveAlopeykCityCode — خطای شبکه/شهر ناشناخته → null، بدون throw", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        throw new Error("connect ECONNREFUSED");
      },
      async () => {
        const creds = { baseUrl: "https://api.alopeyk.com/alopost-service", token: "tok-cache-4" };
        const r = await resolveAlopeykCityCode(creds, "شهرری");
        assert.equal(r, null);
      }
    )
  );

  await withSilencedConsoleError(() =>
    withMockFetch(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: [{ state_name: "تهران", state_code: "1", city_name: "تبریز", city_code: "10" }],
            }),
        }) as Response,
      async () => {
        const creds = { baseUrl: "https://api.alopeyk.com/alopost-service", token: "tok-cache-5" };
        const r = await resolveAlopeykCityCode(creds, "شهر ناموجود");
        assert.equal(r, null);
      }
    )
  );
});

test("resolveAlopeykCityCode — normalize نام (ي عربی) را نادیده می‌گیرد", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              data: [{ state_name: "تهران", state_code: "1", city_name: "تبريز", city_code: "10" }],
            }),
        }) as Response,
      async () => {
        const creds = { baseUrl: "https://api.alopeyk.com/alopost-service", token: "tok-cache-6" };
        const r = await resolveAlopeykCityCode(creds, "تبریز");
        assert.equal(r?.cityCode, "10");
      }
    )
  );
});

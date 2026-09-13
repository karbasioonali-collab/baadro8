import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAlopeykBaseUrl,
  parseAlopeykCredentials,
  mapToAlopeykSize,
  getAlopeykProvinces,
  getAlopeykCities,
  getAlopeykEarliestSlot,
  getAlopeykQuote,
} from "./client";

const baseCreds = { baseUrl: "https://api.alopeyk.com/alopost-service", token: "tok_secret_abc123" };

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

test("isAlopeykBaseUrl تشخیص درست hostname", () => {
  assert.equal(isAlopeykBaseUrl("https://api.alopeyk.com/alopost-service"), true);
  assert.equal(isAlopeykBaseUrl("https://app.krch.ir/v1"), false);
  assert.equal(isAlopeykBaseUrl(null), false);
});

test("parseAlopeykCredentials — کل apiKey همان توکن است (بدون جداکننده)", () => {
  assert.equal(parseAlopeykCredentials("tok_secret_abc123")?.token, "tok_secret_abc123");
  assert.equal(parseAlopeykCredentials("  tok  ")?.token, "tok");
  assert.equal(parseAlopeykCredentials(""), null);
  assert.equal(parseAlopeykCredentials(null), null);
});

test("mapToAlopeykSize — پاکت همیشه size=1", () => {
  assert.equal(mapToAlopeykSize({ parcelType: "envelope" }), 1);
});

test("mapToAlopeykSize — بسته با ابعاد مناسب هر آستانه", () => {
  assert.equal(mapToAlopeykSize({ parcelType: "package", lengthCm: 15, widthCm: 10, heightCm: 10 }), 3);
  assert.equal(
    mapToAlopeykSize({ parcelType: "package", lengthCm: 10, widthCm: 15, heightCm: 10 }),
    3,
    "چرخش ابعاد نباید نتیجه را عوض کند"
  );
  assert.equal(mapToAlopeykSize({ parcelType: "package", lengthCm: 16, widthCm: 10, heightCm: 10 }), 4);
  assert.equal(mapToAlopeykSize({ parcelType: "package", lengthCm: 45, widthCm: 25, heightCm: 20 }), 7);
});

test("mapToAlopeykSize — بسته بزرگ‌تر از حداکثر مجاز یا ابعاد ناقص → null", () => {
  assert.equal(mapToAlopeykSize({ parcelType: "package", lengthCm: 50, widthCm: 30, heightCm: 25 }), null);
  assert.equal(mapToAlopeykSize({ parcelType: "package" }), null);
  assert.equal(mapToAlopeykSize({ parcelType: "package", lengthCm: 10, widthCm: 10 }), null);
});

test("getAlopeykProvinces/getAlopeykCities — parse موفق و خالی", async () => {
  await withMockFetch(
    async () =>
      ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [{ state_code: "1", state_name: "تهران" }] }),
      }) as Response,
    async () => {
      const provinces = await getAlopeykProvinces(baseCreds);
      assert.equal(provinces.length, 1);
      assert.deepEqual(provinces[0], { code: "1", name: "تهران" });
    }
  );

  await withMockFetch(
    async () =>
      ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            data: [{ state_name: "تهران", state_code: "1", city_name: "تهران", city_code: "101" }],
          }),
      }) as Response,
    async () => {
      const cities = await getAlopeykCities(baseCreds);
      assert.equal(cities.length, 1);
      assert.deepEqual(cities[0], { code: "101", name: "تهران", provinceCode: "1" });
    }
  );

  await withMockFetch(
    async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ data: [] }) }) as Response,
    async () => {
      const cities = await getAlopeykCities(baseCreds);
      assert.equal(cities.length, 0);
    }
  );
});

test("getAlopeykEarliestSlot — انتخاب اولین گزینه‌ی هر سطح، و null امن روی پاسخ خالی", async () => {
  await withMockFetch(
    async () =>
      ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            data: [
              {
                pick_date: "2026-08-10",
                slots: [{ id: "slot1", drops: [{ date: "2026-08-11", drops: [{ id: "dropslot1" }] }] }],
              },
            ],
          }),
      }) as Response,
    async () => {
      const slot = await getAlopeykEarliestSlot(baseCreds);
      assert.deepEqual(slot, {
        pickDate: "2026-08-10",
        pickSlotId: "slot1",
        dropDate: "2026-08-11",
        dropSlotId: "dropslot1",
      });
    }
  );

  await withMockFetch(
    async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ data: [] }) }) as Response,
    async () => {
      const slot = await getAlopeykEarliestSlot(baseCreds);
      assert.equal(slot, null);
    }
  );
});

type CapturedCalcBody = {
  pick: { location: { lat: number; lng: number } };
  shipment: { pick: { method: string; slot_id: string }; drop: { slot_id: string } };
  items: {
    parcel: { weight: number; worth: number; size: number; packaging: number };
    drop: { location: { city_code: string } };
  }[];
};

test("getAlopeykQuote — بدنه‌ی درخواست دقیقاً طبق مستندات ساخته می‌شود", async () => {
  let capturedBody: CapturedCalcBody | undefined;
  let capturedUrl: string | undefined;
  let capturedHeaders: Record<string, string> | undefined;

  await withSilencedConsoleError(() =>
    withMockFetch(
      async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = JSON.parse(init?.body as string) as CapturedCalcBody;
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({ data: { items: [{ id: "1", price: 50000 }], order: [{ total_price: 55000 }] } }),
        } as Response;
      },
      async () => {
        const quote = await getAlopeykQuote(baseCreds, {
          pickDate: "2026-08-10",
          pickSlotId: "s1",
          dropDate: "2026-08-11",
          dropSlotId: "d1",
          pickLat: 35.7,
          pickLng: 51.4,
          destinationCityCode: "101",
          size: 3,
          weightGrams: 2000,
          worthToman: 500000,
          packaging: 0,
        });

        assert.ok(capturedBody);
        assert.ok(capturedHeaders);
        assert.equal(capturedUrl, "https://api.alopeyk.com/alopost-service/client/calc");
        assert.equal(capturedHeaders.Authorization, "Bearer tok_secret_abc123");
        assert.equal(capturedBody.pick.location.lat, 35.7);
        assert.equal(capturedBody.pick.location.lng, 51.4);
        assert.equal(capturedBody.shipment.pick.method, "customer");
        assert.equal(capturedBody.shipment.pick.slot_id, "s1");
        assert.equal(capturedBody.shipment.drop.slot_id, "d1");
        assert.equal(capturedBody.items[0].parcel.weight, 2000);
        assert.equal(capturedBody.items[0].parcel.worth, 500000);
        assert.equal(capturedBody.items[0].parcel.size, 3);
        assert.equal(capturedBody.items[0].parcel.packaging, 0);
        assert.equal(
          capturedBody.items[0].drop.location.city_code,
          "101",
          "drop باید همیشه پر باشد، حتی برای مسیر بین‌شهری"
        );
        assert.equal(quote?.totalPrice, 55000, "اولویت با data.order[0].total_price است");
      }
    )
  );
});

test("getAlopeykQuote — fallback به data.items[0].price وقتی order نبود", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: { items: [{ id: "1", price: 42000 }] } }),
        }) as Response,
      async () => {
        const quote = await getAlopeykQuote(baseCreds, {
          pickDate: "d",
          pickSlotId: "s",
          dropDate: "d",
          dropSlotId: "s",
          pickLat: 1,
          pickLng: 1,
          destinationCityCode: "1",
          size: 1,
          weightGrams: 500,
          worthToman: 100000,
          packaging: 0,
        });
        assert.equal(quote?.totalPrice, 42000);
      }
    )
  );
});

// رگرسیون واقعی production (۱۴۰۵/۰۶/۲۲): calc موفق بود ولی الوپست در نتایج
// نهایی دیده نمی‌شد، چون کد فرض کرده بود data یک آرایه است (طبق مستندات:
// data: [{items, order}])، در حالی که پاسخ واقعی الوپست data را مستقیم به
// شکل شیء تخت {items: [...]} برمی‌گرداند (بدون order، و بدون لایه‌ی آرایه‌ی
// بیرونی). این تست دقیقاً همان نمونه‌ی واقعی گزارش‌شده را mock می‌کند تا این
// رگرسیون دیگر برنگردد.
test("getAlopeykQuote — رگرسیون: نمونه‌ی واقعی production که data شیء تخت است نه آرایه", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              status: 1,
              message: "ok",
              data: {
                items: [
                  {
                    id: "1",
                    price: 151900,
                    breakdown: { base: 151900 },
                    parcel: { size: 5, weight: 2000, worth: 100000 },
                  },
                ],
              },
            }),
        }) as Response,
      async () => {
        const quote = await getAlopeykQuote(baseCreds, {
          pickDate: "2026-08-10",
          pickSlotId: "s1",
          dropDate: "2026-08-11",
          dropSlotId: "d1",
          pickLat: 35.7,
          pickLng: 51.4,
          destinationCityCode: "101",
          size: 5,
          weightGrams: 2000,
          worthToman: 100000,
          packaging: 0,
        });
        assert.equal(
          quote?.totalPrice,
          151900,
          "با data شیء تخت (بدون order)، باید از data.items[0].price استخراج شود"
        );
      }
    )
  );
});

test("getAlopeykQuote — بدون هیچ قیمت معتبر → null، نه throw", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () =>
        ({ ok: true, status: 200, text: async () => JSON.stringify({ status: 0, message: "no route", data: {} }) }) as Response,
      async () => {
        const quote = await getAlopeykQuote(baseCreds, {
          pickDate: "d",
          pickSlotId: "s",
          dropDate: "d",
          dropSlotId: "s",
          pickLat: 1,
          pickLng: 1,
          destinationCityCode: "1",
          size: 1,
          weightGrams: 500,
          worthToman: 100000,
          packaging: 0,
        });
        assert.equal(quote, null);
      }
    )
  );
});

test("getAlopeykQuote — خطای HTTP و خطای شبکه throw می‌کنند (برای safeGetQuote بالادستی)", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => ({ ok: false, status: 500, text: async () => "Internal Server Error" }) as Response,
      async () => {
        await assert.rejects(() =>
          getAlopeykQuote(baseCreds, {
            pickDate: "d",
            pickSlotId: "s",
            dropDate: "d",
            dropSlotId: "s",
            pickLat: 1,
            pickLng: 1,
            destinationCityCode: "1",
            size: 1,
            weightGrams: 500,
            worthToman: 100000,
            packaging: 0,
          })
        );
      }
    )
  );

  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        throw new Error("connect ECONNREFUSED");
      },
      async () => {
        await assert.rejects(
          () =>
            getAlopeykQuote(baseCreds, {
              pickDate: "d",
              pickSlotId: "s",
              dropDate: "d",
              dropSlotId: "s",
              pickLat: 1,
              pickLng: 1,
              destinationCityCode: "1",
              size: 1,
              weightGrams: 500,
              worthToman: 100000,
              packaging: 0,
            }),
          /ECONNREFUSED/
        );
      }
    )
  );
});

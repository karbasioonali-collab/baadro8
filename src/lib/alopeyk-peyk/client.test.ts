import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAlopeykPeykBaseUrl,
  parseAlopeykPeykCredentials,
  getAlopeykPeykQuote,
} from "./client";

const baseCreds = { baseUrl: "https://api.alopeyk.com", token: "peyk_tok_abc123" };

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

test("isAlopeykPeykBaseUrl — هاست production/سندباکس را می‌شناسد", () => {
  assert.equal(isAlopeykPeykBaseUrl("https://api.alopeyk.com"), true);
  assert.equal(isAlopeykPeykBaseUrl("https://sandbox-api.alopeyk.com"), true);
  assert.equal(isAlopeykPeykBaseUrl("https://app.krch.ir/v1"), false);
  assert.equal(isAlopeykPeykBaseUrl(null), false);
});

test("isAlopeykPeykBaseUrl — از الوپست (همان هاست، مسیر alopost-service) تفکیک می‌شود", () => {
  assert.equal(
    isAlopeykPeykBaseUrl("https://api.alopeyk.com/alopost-service"),
    false,
    "این آدرس مال شرکت الوپست است، نباید به‌عنوان الوپیک شناسایی شود"
  );
  assert.equal(
    isAlopeykPeykBaseUrl("https://api.alopeyk.com/ALOPOST-SERVICE/"),
    false,
    "بدون حساسیت به حروف بزرگ/کوچک یا اسلش انتهایی"
  );
});

test("parseAlopeykPeykCredentials — کل apiKey همان توکن است (بدون جداکننده)", () => {
  assert.equal(parseAlopeykPeykCredentials("peyk_tok_abc123")?.token, "peyk_tok_abc123");
  assert.equal(parseAlopeykPeykCredentials("  tok  ")?.token, "tok");
  assert.equal(parseAlopeykPeykCredentials(""), null);
  assert.equal(parseAlopeykPeykCredentials(null), null);
});

test("getAlopeykPeykQuote — بدنه‌ی درخواست دقیقاً طبق مستندات ساخته می‌شود (فقط motor_taxi)", async () => {
  type CapturedBody = {
    transport_type: string;
    addresses: { type: string; lat: string; lng: string }[];
    has_return: boolean;
    cashed: boolean;
  };
  let capturedBody: CapturedBody | undefined;
  let capturedUrl: string | undefined;
  let capturedHeaders: Record<string, string> | undefined;

  await withSilencedConsoleError(() =>
    withMockFetch(
      async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = JSON.parse(init?.body as string) as CapturedBody;
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              status: "success",
              message: null,
              object: { final_price: 38000, distance: 4200, duration: 720, hurry: 45000 },
            }),
        } as Response;
      },
      async () => {
        const quote = await getAlopeykPeykQuote(baseCreds, {
          originLat: 35.7,
          originLng: 51.4,
          destinationLat: 35.75,
          destinationLng: 51.45,
        });

        assert.ok(capturedBody);
        assert.ok(capturedHeaders);
        assert.equal(capturedUrl, "https://api.alopeyk.com/api/v2/orders/price/calc");
        assert.equal(capturedHeaders.Authorization, "Bearer peyk_tok_abc123");
        assert.equal(capturedHeaders["X-Requested-With"], "XMLHttpRequest");
        assert.equal(capturedBody.transport_type, "motor_taxi");
        assert.equal(capturedBody.has_return, false);
        assert.equal(capturedBody.cashed, false);
        assert.deepEqual(capturedBody.addresses, [
          { type: "origin", lat: "35.7", lng: "51.4" },
          { type: "destination", lat: "35.75", lng: "51.45" },
        ]);
        assert.equal(quote?.totalPrice, 38000, "قیمت باید از object.final_price بیاید");
        assert.equal(quote?.distanceMeters, 4200);
        assert.equal(quote?.durationSeconds, 720);
        assert.equal(quote?.hurryPrice, 45000, "hurry باید نگه‌داشته شود (فقط اطلاعاتی)");
      }
    )
  );
});

// رگرسیون واقعی production (۱۴۰۵/۰۷/۰۱): calc موفق بود ولی الوپیک در نتایج
// نهایی دیده نمی‌شد، چون کد فرض کرده بود قیمت زیر data.price است، در حالی
// که پاسخ واقعی الوپیک قیمت را زیر object.final_price برمی‌گرداند (بدون
// هیچ فیلد data). این تست دقیقاً همان نمونه‌ی واقعی گزارش‌شده را mock
// می‌کند تا این رگرسیون دیگر برنگردد.
test("getAlopeykPeykQuote — رگرسیون: نمونه‌ی واقعی production (object.final_price، نه data.price)", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () =>
        ({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              status: "success",
              message: null,
              object: {
                addresses: [
                  { type: "origin", lat: "35.7", lng: "51.4" },
                  { type: "destination", lat: "35.75", lng: "51.45" },
                ],
                distance: 1132.5,
                final_price: 226500,
                hurry: 272000,
                discount: 0,
                discount_coupon: [],
                scheduled: false,
              },
            }),
        }) as Response,
      async () => {
        const quote = await getAlopeykPeykQuote(baseCreds, {
          originLat: 35.7,
          originLng: 51.4,
          destinationLat: 35.75,
          destinationLng: 51.45,
        });
        assert.equal(quote?.totalPrice, 226500, "با پاسخ واقعی، باید از object.final_price استخراج شود");
        assert.equal(quote?.distanceMeters, 1132.5);
        assert.equal(quote?.hurryPrice, 272000, "hurry نگه‌داشته می‌شود ولی روی totalPrice اثر ندارد");
      }
    )
  );
});

test("getAlopeykPeykQuote — بدون object.final_price معتبر → null، نه throw", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () =>
        ({ ok: true, status: 200, text: async () => JSON.stringify({ status: "error", message: "no route", object: {} }) }) as Response,
      async () => {
        const quote = await getAlopeykPeykQuote(baseCreds, {
          originLat: 1,
          originLng: 1,
          destinationLat: 2,
          destinationLng: 2,
        });
        assert.equal(quote, null);
      }
    )
  );
});

test("getAlopeykPeykQuote — خطای HTTP و خطای شبکه throw می‌کنند (برای safeGetQuote بالادستی)", async () => {
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => ({ ok: false, status: 500, text: async () => "Internal Server Error" }) as Response,
      async () => {
        await assert.rejects(() =>
          getAlopeykPeykQuote(baseCreds, {
            originLat: 1,
            originLng: 1,
            destinationLat: 2,
            destinationLng: 2,
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
            getAlopeykPeykQuote(baseCreds, {
              originLat: 1,
              originLng: 1,
              destinationLat: 2,
              destinationLng: 2,
            }),
          /ECONNREFUSED/
        );
      }
    )
  );
});

test("getAlopeykPeykQuote — single-flight: فراخوانی هم‌زمان با مختصات یکسان فقط ۱ fetch واقعی می‌زند", async () => {
  let fetchCount = 0;
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        fetchCount++;
        await delay(20);
        return { ok: true, status: 200, text: async () => JSON.stringify({ object: { final_price: 12000 } }) } as Response;
      },
      async () => {
        const params = { originLat: 10, originLng: 20, destinationLat: 30, destinationLng: 40 };
        const [a, b] = await Promise.all([
          getAlopeykPeykQuote(baseCreds, params),
          getAlopeykPeykQuote(baseCreds, params),
        ]);
        assert.equal(fetchCount, 1);
        assert.equal(a?.totalPrice, 12000);
        assert.equal(b?.totalPrice, 12000);
      }
    )
  );
});

test("getAlopeykPeykQuote — بعد از پایان یک fetch، درخواست بعدی واقعاً دوباره fetch می‌زند (کش دائمی نیست)", async () => {
  let fetchCount = 0;
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        fetchCount++;
        return { ok: true, status: 200, text: async () => JSON.stringify({ object: { final_price: 5000 } }) } as Response;
      },
      async () => {
        const params = { originLat: 11, originLng: 21, destinationLat: 31, destinationLng: 41 };
        await getAlopeykPeykQuote(baseCreds, params);
        await getAlopeykPeykQuote(baseCreds, params);
        assert.equal(fetchCount, 2, "برخلاف کش شهر، اینجا نتیجه نباید بین درخواست‌های جدا cache شود");
      }
    )
  );
});

test("getAlopeykPeykQuote — مختصات متفاوت هم‌زمان → single-flight دخالت نمی‌کند (۲ fetch جدا)", async () => {
  let fetchCount = 0;
  await withSilencedConsoleError(() =>
    withMockFetch(
      async () => {
        fetchCount++;
        await delay(10);
        return { ok: true, status: 200, text: async () => JSON.stringify({ object: { final_price: 9000 } }) } as Response;
      },
      async () => {
        await Promise.all([
          getAlopeykPeykQuote(baseCreds, { originLat: 1, originLng: 1, destinationLat: 2, destinationLng: 2 }),
          getAlopeykPeykQuote(baseCreds, { originLat: 5, originLng: 5, destinationLat: 6, destinationLng: 6 }),
        ]);
        assert.equal(fetchCount, 2);
      }
    )
  );
});

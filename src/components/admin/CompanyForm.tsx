"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCompanyAction, type CompanyFormInput } from "@/actions/admin/companies";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { CompanyFormValue } from "./company-form-types";

type WeightTier = { minWeight: number; maxWeight: number; price: number };
type DistanceFactor = { minDistance: number; maxDistance: number; factor: number };

export function CompanyForm({ initial }: { initial: CompanyFormValue }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<CompanyFormValue>(initial);
  const [citiesText, setCitiesText] = useState(initial.coveredCities.join("، "));

  function set<K extends keyof CompanyFormValue>(key: K, v: CompanyFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  function updateWeightTier(idx: number, patch: Partial<WeightTier>) {
    setValue((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        weightTiers: prev.tiers.weightTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
      },
    }));
  }

  function updateDistanceFactor(idx: number, patch: Partial<DistanceFactor>) {
    setValue((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        distanceFactors: prev.tiers.distanceFactors.map((f, i) =>
          i === idx ? { ...f, ...patch } : f
        ),
      },
    }));
  }

  function setAutomationConfig(patch: Partial<CompanyFormValue["automationConfig"]>) {
    setValue((prev) => ({
      ...prev,
      automationConfig: { ...prev.automationConfig, ...patch },
    }));
  }

  function setFieldSelector(
    key: keyof CompanyFormValue["automationConfig"]["fieldSelectors"],
    v: string
  ) {
    setValue((prev) => ({
      ...prev,
      automationConfig: {
        ...prev.automationConfig,
        fieldSelectors: { ...prev.automationConfig.fieldSelectors, [key]: v },
      },
    }));
  }

  function handleSubmit() {
    if (value.name.trim().length < 2) {
      toast.show("نام شرکت الزامی است", "error");
      return;
    }
    if (value.username.trim().length < 3) {
      toast.show("نام کاربری باید حداقل ۳ حرف باشد", "error");
      return;
    }
    if (!value.hasAccount && value.password.length < 4) {
      toast.show("رمز عبور باید حداقل ۴ کاراکتر باشد", "error");
      return;
    }

    const input: CompanyFormInput = {
      id: value.id,
      name: value.name,
      logoUrl: value.logoUrl || undefined,
      type: value.type,
      active: value.active,
      commissionType: value.commissionType,
      commissionValue: Number(value.commissionValue),
      contractInfo: value.contractInfo || undefined,
      trackingMethod: value.trackingMethod,
      trackingEndpoint: value.trackingEndpoint || undefined,
      pricingSourceType: value.pricingSourceType,
      coveredCities: citiesText
        .split(/[،,]/)
        .map((c) => c.trim())
        .filter(Boolean),
      ruleType: value.ruleType,
      formulaParams: value.ruleType === "formula" ? value.formulaParams : undefined,
      tiers: value.ruleType === "tiered" ? value.tiers : undefined,
      apiBaseUrl: value.apiBaseUrl || undefined,
      apiKey: value.apiKey || undefined,
      automationConfig: value.automationConfig,
      username: value.username,
      password: value.password || undefined,
    };

    startTransition(async () => {
      const result = await saveCompanyAction(input);
      if (!result.ok) {
        toast.show(result.error ?? "خطا در ذخیره‌سازی", "error");
        return;
      }
      toast.show("شرکت با موفقیت ذخیره شد", "success");
      router.push("/admin/companies");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">اطلاعات پایه</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="نام شرکت" value={value.name} onChange={(e) => set("name", e.target.value)} />
          <Input
            label="آدرس لوگو (اختیاری)"
            value={value.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            dir="ltr"
          />
          <Select
            label="نوع سرویس"
            value={value.type}
            onChange={(e) => set("type", e.target.value as CompanyFormValue["type"])}
          >
            <option value="intercity">پستی بین‌شهری</option>
            <option value="intracity">پیک درون‌شهری</option>
          </Select>
          <Select
            label="وضعیت"
            value={value.active ? "1" : "0"}
            onChange={(e) => set("active", e.target.value === "1")}
          >
            <option value="1">فعال</option>
            <option value="0">غیرفعال</option>
          </Select>
          <Select
            label="نحوه دریافت قیمت"
            value={value.pricingSourceType}
            onChange={(e) =>
              set("pricingSourceType", e.target.value as CompanyFormValue["pricingSourceType"])
            }
          >
            <option value="internal_formula">فرمول داخلی</option>
            <option value="external_api">API شرکت</option>
            {/* «ربات استعلام خودکار» عمداً از این لیست حذف شده — روی production باعث
                Internal Server Error در کل چرخه‌ی ثبت سفارش شد چون Playwright/Chromium
                روی سرور Liara نصب نیست. تا رفع این مشکل (بخش infobaadro.md مربوطه)،
                این گزینه نباید برای هیچ شرکتی قابل‌انتخاب باشد. */}
            {value.pricingSourceType === "page_automation" && (
              <option value="page_automation">
                ربات استعلام خودکار (غیرفعال — لطفاً روش دیگری انتخاب کنید)
              </option>
            )}
          </Select>
          <Select
            label="روش استعلام کد رهگیری"
            value={value.trackingMethod}
            onChange={(e) =>
              set("trackingMethod", e.target.value as CompanyFormValue["trackingMethod"])
            }
          >
            <option value="internal">داخلی (سفارش‌های ثبت‌شده در بادرو)</option>
            <option value="external_url">لینک استعلام شرکت</option>
            <option value="api">API شرکت (به‌زودی)</option>
          </Select>
          {value.trackingMethod === "external_url" && (
            <Input
              label="لینک استعلام شرکت"
              value={value.trackingEndpoint}
              onChange={(e) => set("trackingEndpoint", e.target.value)}
              dir="ltr"
            />
          )}
        </div>

        {value.type === "intracity" && (
          <div className="mt-4">
            <label className="text-sm font-medium text-neutral-700">
              شهرهای تحت پوشش (با ویرگول جدا کنید)
            </label>
            <textarea
              value={citiesText}
              onChange={(e) => setCitiesText(e.target.value)}
              rows={2}
              placeholder="تهران، مشهد، اصفهان"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="text-sm font-medium text-neutral-700">
            اطلاعات تماس/قرارداد (داخلی، غیرعمومی)
          </label>
          <textarea
            value={value.contractInfo}
            onChange={(e) => set("contractInfo", e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">ورود پنل شرکت</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="نام کاربری"
            value={value.username}
            onChange={(e) => set("username", e.target.value)}
            dir="ltr"
          />
          <Input
            label={value.hasAccount ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
            type="password"
            value={value.password}
            onChange={(e) => set("password", e.target.value)}
            dir="ltr"
          />
        </div>
        {!value.hasAccount && (
          <p className="mt-2 text-xs text-neutral-500">
            این شرکت هنوز حساب ورود پنل ندارد — با ذخیره‌ی این فرم، حساب ساخته می‌شود.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">کمیسیون بادرو</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="نوع کمیسیون"
            value={value.commissionType}
            onChange={(e) => set("commissionType", e.target.value as CompanyFormValue["commissionType"])}
          >
            <option value="percent">درصدی</option>
            <option value="fixed">مبلغ ثابت</option>
          </Select>
          <Input
            label={value.commissionType === "percent" ? "درصد کمیسیون" : "مبلغ کمیسیون (تومان)"}
            type="number"
            value={value.commissionValue}
            onChange={(e) => set("commissionValue", Number(e.target.value))}
            dir="ltr"
          />
        </div>
      </div>

      {value.pricingSourceType === "internal_formula" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">فرمول قیمت</h3>
          <Select
            label="نوع فرمول"
            value={value.ruleType}
            onChange={(e) => set("ruleType", e.target.value as CompanyFormValue["ruleType"])}
          >
            <option value="formula">فرمول ریاضی ساده</option>
            <option value="tiered">جدول پله‌ای</option>
          </Select>

          {value.ruleType === "formula" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input
                label="قیمت پایه (تومان)"
                type="number"
                dir="ltr"
                value={value.formulaParams.basePrice}
                onChange={(e) =>
                  set("formulaParams", { ...value.formulaParams, basePrice: Number(e.target.value) })
                }
              />
              <Input
                label="هزینه هر کیلوگرم (تومان)"
                type="number"
                dir="ltr"
                value={value.formulaParams.pricePerKg}
                onChange={(e) =>
                  set("formulaParams", { ...value.formulaParams, pricePerKg: Number(e.target.value) })
                }
              />
              <Input
                label="هزینه هر کیلومتر فاصله (تومان)"
                type="number"
                dir="ltr"
                value={value.formulaParams.pricePerKm}
                onChange={(e) =>
                  set("formulaParams", { ...value.formulaParams, pricePerKm: Number(e.target.value) })
                }
              />
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-neutral-700">جدول پله‌ای وزن</h4>
                  <button
                    type="button"
                    onClick={() =>
                      set("tiers", {
                        ...value.tiers,
                        weightTiers: [
                          ...value.tiers.weightTiers,
                          { minWeight: 0, maxWeight: 0, price: 0 },
                        ],
                      })
                    }
                    className="text-xs text-brand-blue-600 hover:underline"
                  >
                    + افزودن ردیف
                  </button>
                </div>
                {value.tiers.weightTiers.map((t, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      type="number"
                      placeholder="از (کیلوگرم)"
                      value={t.minWeight}
                      onChange={(e) => updateWeightTier(i, { minWeight: Number(e.target.value) })}
                      className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                      dir="ltr"
                    />
                    <input
                      type="number"
                      placeholder="تا (کیلوگرم)"
                      value={t.maxWeight}
                      onChange={(e) => updateWeightTier(i, { maxWeight: Number(e.target.value) })}
                      className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                      dir="ltr"
                    />
                    <input
                      type="number"
                      placeholder="قیمت (تومان)"
                      value={t.price}
                      onChange={(e) => updateWeightTier(i, { price: Number(e.target.value) })}
                      className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        set("tiers", {
                          ...value.tiers,
                          weightTiers: value.tiers.weightTiers.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-xs text-danger"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-neutral-700">ضریب فاصله</h4>
                  <button
                    type="button"
                    onClick={() =>
                      set("tiers", {
                        ...value.tiers,
                        distanceFactors: [
                          ...value.tiers.distanceFactors,
                          { minDistance: 0, maxDistance: 0, factor: 1 },
                        ],
                      })
                    }
                    className="text-xs text-brand-blue-600 hover:underline"
                  >
                    + افزودن ردیف
                  </button>
                </div>
                {value.tiers.distanceFactors.map((f, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      type="number"
                      placeholder="از (کیلومتر)"
                      value={f.minDistance}
                      onChange={(e) => updateDistanceFactor(i, { minDistance: Number(e.target.value) })}
                      className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                      dir="ltr"
                    />
                    <input
                      type="number"
                      placeholder="تا (کیلومتر)"
                      value={f.maxDistance}
                      onChange={(e) => updateDistanceFactor(i, { maxDistance: Number(e.target.value) })}
                      className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                      dir="ltr"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="ضریب"
                      value={f.factor}
                      onChange={(e) => updateDistanceFactor(i, { factor: Number(e.target.value) })}
                      className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        set("tiers", {
                          ...value.tiers,
                          distanceFactors: value.tiers.distanceFactors.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-xs text-danger"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {value.pricingSourceType === "external_api" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">اطلاعات API شرکت</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="آدرس API"
              value={value.apiBaseUrl}
              onChange={(e) => set("apiBaseUrl", e.target.value)}
              dir="ltr"
            />
            <Input
              label="کلید API"
              type="password"
              value={value.apiKey}
              onChange={(e) => set("apiKey", e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
      )}

      {value.pricingSourceType === "page_automation" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">تنظیمات ربات استعلام خودکار</h3>
          <p className="mb-4 text-xs text-neutral-500">
            ربات با Playwright صفحه‌ی زیر را باز می‌کند، فیلدها را طبق selectorهای زیر پر
            می‌کند، چک‌باکس‌های لازم را تیک می‌زند، دکمه‌ی محاسبه را کلیک و قیمت را از
            selector نتیجه می‌خواند. برای پیدا کردن selector دقیق هر فیلد، صفحه‌ی شرکت را
            در مرورگر با Inspect Element باز کنید.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="آدرس صفحه استعلام قیمت شرکت"
                value={value.automationConfig.url}
                onChange={(e) => setAutomationConfig({ url: e.target.value })}
                dir="ltr"
              />
            </div>
            <Input
              label="Selector فیلد مبدا"
              value={value.automationConfig.fieldSelectors.origin}
              onChange={(e) => setFieldSelector("origin", e.target.value)}
              dir="ltr"
            />
            <Input
              label="Selector فیلد مقصد"
              value={value.automationConfig.fieldSelectors.destination}
              onChange={(e) => setFieldSelector("destination", e.target.value)}
              dir="ltr"
            />
            <Input
              label="Selector فیلد وزن"
              value={value.automationConfig.fieldSelectors.weight}
              onChange={(e) => setFieldSelector("weight", e.target.value)}
              dir="ltr"
            />
            <Select
              label="واحد وزن مورد انتظار صفحه"
              value={value.automationConfig.weightUnit}
              onChange={(e) =>
                setAutomationConfig({
                  weightUnit: e.target.value as CompanyFormValue["automationConfig"]["weightUnit"],
                })
              }
            >
              <option value="kg">کیلوگرم</option>
              <option value="gram">گرم</option>
            </Select>
            <Input
              label="Selector فیلد ارزش کالا"
              value={value.automationConfig.fieldSelectors.declaredValue}
              onChange={(e) => setFieldSelector("declaredValue", e.target.value)}
              dir="ltr"
            />
            <Input
              label="Selector فیلد طول (سانتی‌متر)"
              value={value.automationConfig.fieldSelectors.length}
              onChange={(e) => setFieldSelector("length", e.target.value)}
              dir="ltr"
            />
            <Input
              label="Selector فیلد عرض (سانتی‌متر)"
              value={value.automationConfig.fieldSelectors.width}
              onChange={(e) => setFieldSelector("width", e.target.value)}
              dir="ltr"
            />
            <Input
              label="Selector فیلد ارتفاع (سانتی‌متر)"
              value={value.automationConfig.fieldSelectors.height}
              onChange={(e) => setFieldSelector("height", e.target.value)}
              dir="ltr"
            />
            <Input
              label="Selector فیلد نوع محتوا"
              value={value.automationConfig.fieldSelectors.contentType}
              onChange={(e) => setFieldSelector("contentType", e.target.value)}
              dir="ltr"
            />
            <Input
              label="مقدار ثابت نوع محتوا"
              value={value.automationConfig.contentTypeValue}
              onChange={(e) => setAutomationConfig({ contentTypeValue: e.target.value })}
              placeholder="مثلاً کالای تجاری — بادرو این را از مشتری نمی‌گیرد"
            />
            <Input
              label="Selector دکمه ثبت/محاسبه"
              value={value.automationConfig.submitSelector}
              onChange={(e) => setAutomationConfig({ submitSelector: e.target.value })}
              dir="ltr"
            />
            <div className="sm:col-span-2">
              <Input
                label="Selector محل نمایش نتیجه (قیمت)"
                value={value.automationConfig.resultSelector}
                onChange={(e) => setAutomationConfig({ resultSelector: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-neutral-700">
                چک‌باکس‌هایی که باید همیشه تیک بخورند
              </h4>
              <button
                type="button"
                onClick={() =>
                  setAutomationConfig({
                    checkboxSelectors: [...value.automationConfig.checkboxSelectors, ""],
                  })
                }
                className="text-xs text-brand-blue-600 hover:underline"
              >
                + افزودن چک‌باکس
              </button>
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              مثلاً «قبول از محل مشتری» یا «مرسوله نیاز به بسته‌بندی ندارد»
            </p>
            {value.automationConfig.checkboxSelectors.map((sel, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 mb-2">
                <input
                  value={sel}
                  onChange={(e) =>
                    setAutomationConfig({
                      checkboxSelectors: value.automationConfig.checkboxSelectors.map((s, idx) =>
                        idx === i ? e.target.value : s
                      ),
                    })
                  }
                  placeholder="Selector چک‌باکس"
                  className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAutomationConfig({
                      checkboxSelectors: value.automationConfig.checkboxSelectors.filter(
                        (_, idx) => idx !== i
                      ),
                    })
                  }
                  className="text-xs text-danger"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-neutral-700">
                فیلدهای خاص این شرکت با مقدار ثابت
              </h4>
              <button
                type="button"
                onClick={() =>
                  setAutomationConfig({
                    extraStaticFields: [
                      ...value.automationConfig.extraStaticFields,
                      { selector: "", value: "" },
                    ],
                  })
                }
                className="text-xs text-brand-blue-600 hover:underline"
              >
                + افزودن فیلد
              </button>
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              برای فیلدهایی که در لیست بالا نیستند ولی صفحه شرکت به آن‌ها نیاز دارد.
            </p>
            {value.automationConfig.extraStaticFields.map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                <input
                  value={f.selector}
                  onChange={(e) =>
                    setAutomationConfig({
                      extraStaticFields: value.automationConfig.extraStaticFields.map((x, idx) =>
                        idx === i ? { ...x, selector: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="Selector"
                  className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                  dir="ltr"
                />
                <input
                  value={f.value}
                  onChange={(e) =>
                    setAutomationConfig({
                      extraStaticFields: value.automationConfig.extraStaticFields.map((x, idx) =>
                        idx === i ? { ...x, value: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="مقدار ثابت"
                  className="h-10 rounded-lg border border-neutral-200 px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAutomationConfig({
                      extraStaticFields: value.automationConfig.extraStaticFields.filter(
                        (_, idx) => idx !== i
                      ),
                    })
                  }
                  className="text-xs text-danger"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button size="lg" loading={pending} onClick={handleSubmit} className="w-full sm:w-auto">
        ذخیره شرکت
      </Button>
    </div>
  );
}

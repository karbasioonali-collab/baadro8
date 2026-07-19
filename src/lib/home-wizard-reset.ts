// رویداد سراسری برای ریست ویزارد صفحه اصلی (HomeServiceFlow) وقتی کاربر
// از وسط یکی از مراحل (پیک موتوری/ارسال پستی) روی لینک «صفحه اصلی» کلیک
// می‌کند — چون هر دو در آدرس "/" هستند، Link ناوبری واقعی انجام نمی‌دهد،
// پس ریست باید دستی و از طریق این رویداد انجام شود.
export const HOME_WIZARD_RESET_EVENT = "badro:reset-home-wizard";

export function dispatchHomeWizardReset() {
  window.dispatchEvent(new Event(HOME_WIZARD_RESET_EVENT));
}

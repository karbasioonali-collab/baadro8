import { ChangePasswordForm } from "@/components/company/ChangePasswordForm";

export default function CompanySettingsPage() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h3 className="font-semibold text-neutral-800 mb-4">تغییر رمز عبور</h3>
      <ChangePasswordForm />
    </div>
  );
}

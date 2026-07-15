import type { Metadata } from "next";
import { Phone, Mail, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = { title: "تماس با ما" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-6">تماس با ما</h1>
        <p className="text-neutral-600 leading-7 mb-8">
          سوالی دارید یا می‌خواهید به‌عنوان شرکت طرف قرارداد با بادرو همکاری کنید؟
          از راه‌های زیر با ما در تماس باشید.
        </p>

        <div className="space-y-4">
          <Card className="p-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue-600">
              <Phone className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-sm text-neutral-500">شماره تماس</div>
              <div className="font-medium text-neutral-800" dir="ltr">
                021-91234567
              </div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-600">
              <Mail className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-sm text-neutral-500">ایمیل</div>
              <div className="font-medium text-neutral-800" dir="ltr">
                info@badro.ir
              </div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <MapPin className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-sm text-neutral-500">آدرس</div>
              <div className="font-medium text-neutral-800">
                تهران، خیابان ولیعصر، دفتر مرکزی بادرو
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6 h-fit">
        <ContactForm />
      </Card>
    </div>
  );
}

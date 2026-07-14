// لیست استان‌ها و شهرستان‌های ایران به همراه شاخص فاصله تقریبی از تهران (کیلومتر)
// این فایل به‌عنوان مرجع ثابت جغرافیایی استفاده می‌شود (غیرقابل ویرایش از پنل ادمین).
// شاخص فاصله (CityDistanceIndex) در دیتابیس seed می‌شود و از پنل ادمین قابل ویرایش است.

export type IranCity = {
  name: string;
  distanceFromTehranKm: number;
};

export type IranProvince = {
  name: string;
  cities: IranCity[];
};

export const IRAN_PROVINCES: IranProvince[] = [
  {
    name: "تهران",
    cities: [
      { name: "تهران", distanceFromTehranKm: 0 },
      { name: "ری", distanceFromTehranKm: 10 },
      { name: "شمیرانات", distanceFromTehranKm: 15 },
      { name: "اسلامشهر", distanceFromTehranKm: 25 },
      { name: "شهریار", distanceFromTehranKm: 35 },
      { name: "ورامین", distanceFromTehranKm: 55 },
      { name: "پاکدشت", distanceFromTehranKm: 40 },
      { name: "دماوند", distanceFromTehranKm: 65 },
      { name: "پردیس", distanceFromTehranKm: 30 },
      { name: "رباط‌کریم", distanceFromTehranKm: 40 },
      { name: "پیشوا", distanceFromTehranKm: 60 },
      { name: "فیروزکوه", distanceFromTehranKm: 130 },
    ],
  },
  {
    name: "البرز",
    cities: [
      { name: "کرج", distanceFromTehranKm: 35 },
      { name: "فردیس", distanceFromTehranKm: 40 },
      { name: "نظرآباد", distanceFromTehranKm: 60 },
      { name: "ساوجبلاغ", distanceFromTehranKm: 55 },
      { name: "طالقان", distanceFromTehranKm: 90 },
      { name: "اشتهارد", distanceFromTehranKm: 60 },
    ],
  },
  {
    name: "قم",
    cities: [
      { name: "قم", distanceFromTehranKm: 140 },
    ],
  },
  {
    name: "مرکزی",
    cities: [
      { name: "اراک", distanceFromTehranKm: 280 },
      { name: "ساوه", distanceFromTehranKm: 130 },
      { name: "خمین", distanceFromTehranKm: 350 },
      { name: "محلات", distanceFromTehranKm: 260 },
      { name: "دلیجان", distanceFromTehranKm: 230 },
      { name: "تفرش", distanceFromTehranKm: 230 },
      { name: "شازند", distanceFromTehranKm: 310 },
    ],
  },
  {
    name: "قزوین",
    cities: [
      { name: "قزوین", distanceFromTehranKm: 150 },
      { name: "تاکستان", distanceFromTehranKm: 190 },
      { name: "البرز", distanceFromTehranKm: 160 },
      { name: "بوئین‌زهرا", distanceFromTehranKm: 175 },
    ],
  },
  {
    name: "گیلان",
    cities: [
      { name: "رشت", distanceFromTehranKm: 330 },
      { name: "بندر انزلی", distanceFromTehranKm: 370 },
      { name: "لاهیجان", distanceFromTehranKm: 300 },
      { name: "لنگرود", distanceFromTehranKm: 320 },
      { name: "آستارا", distanceFromTehranKm: 400 },
      { name: "رودسر", distanceFromTehranKm: 280 },
      { name: "صومعه‌سرا", distanceFromTehranKm: 350 },
      { name: "فومن", distanceFromTehranKm: 350 },
      { name: "تالش", distanceFromTehranKm: 380 },
      { name: "آستانه اشرفیه", distanceFromTehranKm: 310 },
    ],
  },
  {
    name: "مازندران",
    cities: [
      { name: "ساری", distanceFromTehranKm: 250 },
      { name: "بابل", distanceFromTehranKm: 220 },
      { name: "آمل", distanceFromTehranKm: 190 },
      { name: "قائم‌شهر", distanceFromTehranKm: 235 },
      { name: "بابلسر", distanceFromTehranKm: 230 },
      { name: "نور", distanceFromTehranKm: 165 },
      { name: "چالوس", distanceFromTehranKm: 200 },
      { name: "نوشهر", distanceFromTehranKm: 210 },
      { name: "رامسر", distanceFromTehranKm: 260 },
      { name: "تنکابن", distanceFromTehranKm: 240 },
      { name: "بهشهر", distanceFromTehranKm: 300 },
      { name: "محمودآباد", distanceFromTehranKm: 210 },
    ],
  },
  {
    name: "گلستان",
    cities: [
      { name: "گرگان", distanceFromTehranKm: 400 },
      { name: "گنبد کاووس", distanceFromTehranKm: 470 },
      { name: "علی‌آباد کتول", distanceFromTehranKm: 380 },
      { name: "آق‌قلا", distanceFromTehranKm: 430 },
      { name: "کردکوی", distanceFromTehranKm: 415 },
      { name: "بندر ترکمن", distanceFromTehranKm: 430 },
      { name: "مینودشت", distanceFromTehranKm: 450 },
    ],
  },
  {
    name: "اردبیل",
    cities: [
      { name: "اردبیل", distanceFromTehranKm: 590 },
      { name: "مشگین‌شهر", distanceFromTehranKm: 630 },
      { name: "پارس‌آباد", distanceFromTehranKm: 700 },
      { name: "خلخال", distanceFromTehranKm: 480 },
      { name: "گرمی", distanceFromTehranKm: 670 },
    ],
  },
  {
    name: "آذربایجان شرقی",
    cities: [
      { name: "تبریز", distanceFromTehranKm: 620 },
      { name: "مراغه", distanceFromTehranKm: 660 },
      { name: "میانه", distanceFromTehranKm: 480 },
      { name: "مرند", distanceFromTehranKm: 680 },
      { name: "اهر", distanceFromTehranKm: 620 },
      { name: "بناب", distanceFromTehranKm: 640 },
      { name: "سراب", distanceFromTehranKm: 590 },
      { name: "شبستر", distanceFromTehranKm: 660 },
      { name: "بستان‌آباد", distanceFromTehranKm: 570 },
      { name: "جلفا", distanceFromTehranKm: 740 },
    ],
  },
  {
    name: "آذربایجان غربی",
    cities: [
      { name: "ارومیه", distanceFromTehranKm: 780 },
      { name: "خوی", distanceFromTehranKm: 740 },
      { name: "میاندوآب", distanceFromTehranKm: 700 },
      { name: "بوکان", distanceFromTehranKm: 750 },
      { name: "مهاباد", distanceFromTehranKm: 760 },
      { name: "سلماس", distanceFromTehranKm: 770 },
      { name: "پیرانشهر", distanceFromTehranKm: 830 },
      { name: "نقده", distanceFromTehranKm: 790 },
      { name: "سردشت", distanceFromTehranKm: 850 },
      { name: "شاهین‌دژ", distanceFromTehranKm: 680 },
      { name: "تکاب", distanceFromTehranKm: 620 },
    ],
  },
  {
    name: "زنجان",
    cities: [
      { name: "زنجان", distanceFromTehranKm: 330 },
      { name: "ابهر", distanceFromTehranKm: 260 },
      { name: "خدابنده", distanceFromTehranKm: 380 },
      { name: "خرمدره", distanceFromTehranKm: 280 },
      { name: "ماه‌نشان", distanceFromTehranKm: 400 },
    ],
  },
  {
    name: "همدان",
    cities: [
      { name: "همدان", distanceFromTehranKm: 340 },
      { name: "ملایر", distanceFromTehranKm: 310 },
      { name: "نهاوند", distanceFromTehranKm: 370 },
      { name: "تویسرکان", distanceFromTehranKm: 360 },
      { name: "اسدآباد", distanceFromTehranKm: 370 },
      { name: "کبودراهنگ", distanceFromTehranKm: 310 },
      { name: "بهار", distanceFromTehranKm: 320 },
    ],
  },
  {
    name: "کردستان",
    cities: [
      { name: "سنندج", distanceFromTehranKm: 500 },
      { name: "سقز", distanceFromTehranKm: 610 },
      { name: "مریوان", distanceFromTehranKm: 590 },
      { name: "بانه", distanceFromTehranKm: 660 },
      { name: "قروه", distanceFromTehranKm: 450 },
      { name: "بیجار", distanceFromTehranKm: 400 },
      { name: "کامیاران", distanceFromTehranKm: 530 },
      { name: "دیواندره", distanceFromTehranKm: 540 },
    ],
  },
  {
    name: "کرمانشاه",
    cities: [
      { name: "کرمانشاه", distanceFromTehranKm: 525 },
      { name: "اسلام‌آباد غرب", distanceFromTehranKm: 570 },
      { name: "سنقر", distanceFromTehranKm: 460 },
      { name: "کنگاور", distanceFromTehranKm: 440 },
      { name: "پاوه", distanceFromTehranKm: 620 },
      { name: "هرسین", distanceFromTehranKm: 500 },
      { name: "صحنه", distanceFromTehranKm: 480 },
      { name: "قصر شیرین", distanceFromTehranKm: 610 },
      { name: "سرپل ذهاب", distanceFromTehranKm: 590 },
    ],
  },
  {
    name: "ایلام",
    cities: [
      { name: "ایلام", distanceFromTehranKm: 605 },
      { name: "دهلران", distanceFromTehranKm: 720 },
      { name: "آبدانان", distanceFromTehranKm: 690 },
      { name: "ایوان", distanceFromTehranKm: 570 },
      { name: "دره‌شهر", distanceFromTehranKm: 650 },
      { name: "مهران", distanceFromTehranKm: 700 },
    ],
  },
  {
    name: "لرستان",
    cities: [
      { name: "خرم‌آباد", distanceFromTehranKm: 480 },
      { name: "بروجرد", distanceFromTehranKm: 375 },
      { name: "دورود", distanceFromTehranKm: 430 },
      { name: "الیگودرز", distanceFromTehranKm: 400 },
      { name: "کوهدشت", distanceFromTehranKm: 550 },
      { name: "ازنا", distanceFromTehranKm: 410 },
      { name: "پلدختر", distanceFromTehranKm: 560 },
    ],
  },
  {
    name: "خوزستان",
    cities: [
      { name: "اهواز", distanceFromTehranKm: 830 },
      { name: "آبادان", distanceFromTehranKm: 940 },
      { name: "خرمشهر", distanceFromTehranKm: 920 },
      { name: "دزفول", distanceFromTehranKm: 720 },
      { name: "اندیمشک", distanceFromTehranKm: 700 },
      { name: "ماهشهر", distanceFromTehranKm: 900 },
      { name: "بهبهان", distanceFromTehranKm: 830 },
      { name: "شوشتر", distanceFromTehranKm: 780 },
      { name: "ایذه", distanceFromTehranKm: 780 },
      { name: "شوش", distanceFromTehranKm: 740 },
      { name: "رامهرمز", distanceFromTehranKm: 850 },
      { name: "مسجدسلیمان", distanceFromTehranKm: 790 },
      { name: "هندیجان", distanceFromTehranKm: 950 },
      { name: "امیدیه", distanceFromTehranKm: 880 },
    ],
  },
  {
    name: "چهارمحال و بختیاری",
    cities: [
      { name: "شهرکرد", distanceFromTehranKm: 520 },
      { name: "بروجن", distanceFromTehranKm: 560 },
      { name: "فارسان", distanceFromTehranKm: 540 },
      { name: "لردگان", distanceFromTehranKm: 600 },
      { name: "اردل", distanceFromTehranKm: 570 },
    ],
  },
  {
    name: "کهگیلویه و بویراحمد",
    cities: [
      { name: "یاسوج", distanceFromTehranKm: 730 },
      { name: "گچساران", distanceFromTehranKm: 800 },
      { name: "دهدشت", distanceFromTehranKm: 780 },
    ],
  },
  {
    name: "بوشهر",
    cities: [
      { name: "بوشهر", distanceFromTehranKm: 1030 },
      { name: "برازجان", distanceFromTehranKm: 970 },
      { name: "گناوه", distanceFromTehranKm: 930 },
      { name: "کنگان", distanceFromTehranKm: 1130 },
      { name: "دیر", distanceFromTehranKm: 1180 },
      { name: "دیلم", distanceFromTehranKm: 880 },
      { name: "دشتستان", distanceFromTehranKm: 960 },
    ],
  },
  {
    name: "فارس",
    cities: [
      { name: "شیراز", distanceFromTehranKm: 930 },
      { name: "مرودشت", distanceFromTehranKm: 900 },
      { name: "جهرم", distanceFromTehranKm: 1040 },
      { name: "کازرون", distanceFromTehranKm: 850 },
      { name: "فسا", distanceFromTehranKm: 1010 },
      { name: "لار", distanceFromTehranKm: 1170 },
      { name: "داراب", distanceFromTehranKm: 1080 },
      { name: "آباده", distanceFromTehranKm: 700 },
      { name: "اقلید", distanceFromTehranKm: 780 },
      { name: "فیروزآباد", distanceFromTehranKm: 1000 },
      { name: "لامرد", distanceFromTehranKm: 1230 },
      { name: "استهبان", distanceFromTehranKm: 1030 },
    ],
  },
  {
    name: "کرمان",
    cities: [
      { name: "کرمان", distanceFromTehranKm: 1000 },
      { name: "رفسنجان", distanceFromTehranKm: 900 },
      { name: "سیرجان", distanceFromTehranKm: 930 },
      { name: "جیرفت", distanceFromTehranKm: 1220 },
      { name: "بم", distanceFromTehranKm: 1100 },
      { name: "زرند", distanceFromTehranKm: 950 },
      { name: "کهنوج", distanceFromTehranKm: 1330 },
      { name: "شهربابک", distanceFromTehranKm: 850 },
    ],
  },
  {
    name: "هرمزگان",
    cities: [
      { name: "بندرعباس", distanceFromTehranKm: 1290 },
      { name: "میناب", distanceFromTehranKm: 1350 },
      { name: "بندر لنگه", distanceFromTehranKm: 1400 },
      { name: "قشم", distanceFromTehranKm: 1350 },
      { name: "رودان", distanceFromTehranKm: 1310 },
      { name: "حاجی‌آباد", distanceFromTehranKm: 1170 },
      { name: "کیش", distanceFromTehranKm: 1370 },
      { name: "بستک", distanceFromTehranKm: 1420 },
    ],
  },
  {
    name: "سیستان و بلوچستان",
    cities: [
      { name: "زاهدان", distanceFromTehranKm: 1605 },
      { name: "زابل", distanceFromTehranKm: 1500 },
      { name: "چابهار", distanceFromTehranKm: 1900 },
      { name: "ایرانشهر", distanceFromTehranKm: 1750 },
      { name: "سراوان", distanceFromTehranKm: 1780 },
      { name: "خاش", distanceFromTehranKm: 1700 },
      { name: "کنارک", distanceFromTehranKm: 1950 },
    ],
  },
  {
    name: "یزد",
    cities: [
      { name: "یزد", distanceFromTehranKm: 630 },
      { name: "میبد", distanceFromTehranKm: 590 },
      { name: "اردکان", distanceFromTehranKm: 570 },
      { name: "بافق", distanceFromTehranKm: 730 },
      { name: "مهریز", distanceFromTehranKm: 660 },
      { name: "تفت", distanceFromTehranKm: 650 },
    ],
  },
  {
    name: "اصفهان",
    cities: [
      { name: "اصفهان", distanceFromTehranKm: 430 },
      { name: "کاشان", distanceFromTehranKm: 245 },
      { name: "نجف‌آباد", distanceFromTehranKm: 410 },
      { name: "خمینی‌شهر", distanceFromTehranKm: 420 },
      { name: "شاهین‌شهر", distanceFromTehranKm: 400 },
      { name: "نطنز", distanceFromTehranKm: 330 },
      { name: "گلپایگان", distanceFromTehranKm: 350 },
      { name: "خوانسار", distanceFromTehranKm: 380 },
      { name: "فولادشهر", distanceFromTehranKm: 450 },
      { name: "مبارکه", distanceFromTehranKm: 460 },
      { name: "نائین", distanceFromTehranKm: 550 },
      { name: "اردستان", distanceFromTehranKm: 380 },
      { name: "فریدون‌شهر", distanceFromTehranKm: 500 },
      { name: "سمیرم", distanceFromTehranKm: 570 },
      { name: "شهرضا", distanceFromTehranKm: 520 },
    ],
  },
  {
    name: "سمنان",
    cities: [
      { name: "سمنان", distanceFromTehranKm: 220 },
      { name: "شاهرود", distanceFromTehranKm: 400 },
      { name: "دامغان", distanceFromTehranKm: 340 },
      { name: "گرمسار", distanceFromTehranKm: 110 },
      { name: "مهدی‌شهر", distanceFromTehranKm: 200 },
    ],
  },
  {
    name: "خراسان رضوی",
    cities: [
      { name: "مشهد", distanceFromTehranKm: 900 },
      { name: "نیشابور", distanceFromTehranKm: 800 },
      { name: "سبزوار", distanceFromTehranKm: 670 },
      { name: "تربت حیدریه", distanceFromTehranKm: 940 },
      { name: "کاشمر", distanceFromTehranKm: 800 },
      { name: "قوچان", distanceFromTehranKm: 1000 },
      { name: "تربت جام", distanceFromTehranKm: 1030 },
      { name: "چناران", distanceFromTehranKm: 870 },
      { name: "فریمان", distanceFromTehranKm: 950 },
      { name: "سرخس", distanceFromTehranKm: 990 },
      { name: "گناباد", distanceFromTehranKm: 780 },
      { name: "خواف", distanceFromTehranKm: 1020 },
    ],
  },
  {
    name: "خراسان شمالی",
    cities: [
      { name: "بجنورد", distanceFromTehranKm: 780 },
      { name: "شیروان", distanceFromTehranKm: 850 },
      { name: "اسفراین", distanceFromTehranKm: 700 },
      { name: "جاجرم", distanceFromTehranKm: 640 },
      { name: "فاروج", distanceFromTehranKm: 820 },
    ],
  },
  {
    name: "خراسان جنوبی",
    cities: [
      { name: "بیرجند", distanceFromTehranKm: 1100 },
      { name: "قاین", distanceFromTehranKm: 1030 },
      { name: "فردوس", distanceFromTehranKm: 900 },
      { name: "طبس", distanceFromTehranKm: 780 },
      { name: "نهبندان", distanceFromTehranKm: 1300 },
    ],
  },
];

export function getProvinceNames(): string[] {
  return IRAN_PROVINCES.map((p) => p.name);
}

export function getCitiesOfProvince(provinceName: string): IranCity[] {
  return IRAN_PROVINCES.find((p) => p.name === provinceName)?.cities ?? [];
}

export function getAllCities(): { province: string; city: IranCity }[] {
  return IRAN_PROVINCES.flatMap((p) =>
    p.cities.map((city) => ({ province: p.name, city }))
  );
}

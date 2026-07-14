export function AddressCard({
  title,
  address,
}: {
  title: string;
  address: {
    province: string;
    city: string;
    street: string;
    alley: string | null;
    plaque: string;
    floor: string | null;
    description: string | null;
    postalCode: string | null;
    lat: number | null;
    lng: number | null;
  };
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h4 className="font-semibold text-neutral-800 mb-2">{title}</h4>
      <div className="text-sm text-neutral-600 leading-7">
        {address.province}، {address.city}، {address.street}
        {address.alley && `، کوچه ${address.alley}`}، پلاک {address.plaque}
        {address.floor && `، طبقه ${address.floor}`}
        {address.postalCode && (
          <div dir="ltr" className="mt-1">
            کد پستی: {address.postalCode}
          </div>
        )}
        {address.description && (
          <div className="mt-1 text-neutral-500">{address.description}</div>
        )}
        {address.lat != null && address.lng != null && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${address.lat}&mlon=${address.lng}#map=16/${address.lat}/${address.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-brand-blue-600 hover:underline"
          >
            مشاهده روی نقشه
          </a>
        )}
      </div>
    </div>
  );
}

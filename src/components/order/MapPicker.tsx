"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-7.58 7-13A7 7 0 0 0 5 9c0 5.42 7 13 7 13z" fill="#2F8BC0" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="white"/>
  </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
});

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** نمونه‌ی نقشه را برای استفاده بیرون از MapContainer (دکمه «موقعیت من») در یک ref قرار می‌دهد. */
function MapInstanceBridge({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const center = useMemo<[number, number]>(
    () => (lat != null && lng != null ? [lat, lng] : TEHRAN_CENTER),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handlePick = useCallback(
    (la: number, ln: number) => onChange(la, ln),
    [onChange]
  );

  const mapRef = useRef<L.Map | null>(null);
  const toast = useToast();
  const [locating, setLocating] = useState(false);

  function handleLocateMe() {
    if (!navigator.geolocation) {
      toast.show("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange(latitude, longitude);
        mapRef.current?.setView([latitude, longitude], 16);
        setLocating(false);
      },
      () => {
        toast.show("دسترسی به موقعیت مکانی امکان‌پذیر نشد", "error");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: 260, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          <MapInstanceBridge mapRef={mapRef} />
          {lat != null && lng != null && <Marker position={[lat, lng]} icon={pinIcon} />}
        </MapContainer>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={locating}
        onClick={handleLocateMe}
        className="self-start"
      >
        <LocateFixed className="size-4" />
        موقعیت من
      </Button>
    </div>
  );
}

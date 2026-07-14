"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

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

  return (
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
        {lat != null && lng != null && <Marker position={[lat, lng]} icon={pinIcon} />}
      </MapContainer>
    </div>
  );
}

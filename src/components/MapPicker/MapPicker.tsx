"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Google Maps-style red pin using SVG DivIcon
const createGooglePin = () => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:36px;height:48px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" width="36" height="48">
        <defs>
          <radialGradient id="pinGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stop-color="#ff5252"/>
            <stop offset="100%" stop-color="#c62828"/>
          </radialGradient>
        </defs>
        <!-- Pin body -->
        <path d="M12 0C7.06 0 3 4.06 3 9c0 6.75 9 17 9 17s9-10.25 9-17C21 4.06 16.94 0 12 0z" fill="url(#pinGrad)" stroke="#b71c1c" stroke-width="0.5"/>
        <!-- White inner circle -->
        <circle cx="12" cy="9" r="4.5" fill="white" opacity="0.95"/>
        <!-- Red dot inside -->
        <circle cx="12" cy="9" r="2.5" fill="#e53935"/>
      </svg>
      <!-- Pulse ring -->
      <div style="
        position:absolute;
        bottom:-4px;
        left:50%;
        transform:translateX(-50%);
        width:16px;height:8px;
        border-radius:50%;
        background:rgba(229,57,53,0.3);
        animation:gmPulse 1.5s ease-out infinite;
      "></div>
    </div>
    <style>
      @keyframes gmPulse {
        0%{transform:translateX(-50%) scale(1);opacity:0.6}
        100%{transform:translateX(-50%) scale(2.2);opacity:0}
      }
    </style>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -50],
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultPosition?: [number, number];
  centerPoint?: [number, number];
  externalPin?: [number, number] | null;
}

function MapUpdater({ centerPoint }: { centerPoint?: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (centerPoint) {
      map.flyTo(centerPoint, 17);
    }
  }, [centerPoint, map]);
  return null;
}

function LocationMarker({ position, setPosition, onLocationSelect, externalPin }: { 
  position: L.LatLng | null, 
  setPosition: (pos: L.LatLng) => void,
  onLocationSelect: (lat: number, lng: number) => void,
  externalPin?: [number, number] | null,
}) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Use externalPin if no map click yet
  const pinPosition = externalPin ? L.latLng(externalPin[0], externalPin[1]) : position;
  if (pinPosition === null) return null;

  return (
    <Marker position={pinPosition} icon={createGooglePin()}>
      <Popup>
        <div style={{ textAlign: 'center', fontSize: '13px', minWidth: '160px' }}>
          <div style={{ fontWeight: 700, color: '#e53935', marginBottom: '4px' }}>📍 Lokasi Dipilih</div>
          <div style={{ color: '#555', fontSize: '11px' }}>
            {pinPosition.lat.toFixed(6)}, {pinPosition.lng.toFixed(6)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapPicker({ onLocationSelect, defaultPosition = [-6.200000, 106.816666], centerPoint, externalPin }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  return (
    <div style={{ height: '320px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--color-border)', zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater centerPoint={centerPoint} />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} externalPin={externalPin} />
      </MapContainer>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
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
        <path d="M12 0C7.06 0 3 4.06 3 9c0 6.75 9 17 9 17s9-10.25 9-17C21 4.06 16.94 0 12 0z" fill="url(#pinGrad)" stroke="#b71c1c" stroke-width="0.5"/>
        <circle cx="12" cy="9" r="4.5" fill="white" opacity="0.95"/>
        <circle cx="12" cy="9" r="2.5" fill="#e53935"/>
      </svg>
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

// Blue GPS dot icon for "my location"
const createGPSIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="width:24px;height:24px;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 2px 8px rgba(66,133,244,0.6);"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:rgba(66,133,244,0.15);animation:gpsPulse 2s ease-out infinite;"></div>
    </div>
    <style>@keyframes gpsPulse{0%{transform:translate(-50%,-50%) scale(1);opacity:0.6}100%{transform:translate(-50%,-50%) scale(2);opacity:0}}</style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -16],
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
      map.flyTo(centerPoint, 18); // Zoom 18 = detail jalan (max aman OSM)
    }
  }, [centerPoint, map]);
  return null;
}

// Tombol "Lokasi Saya" yang floating di dalam peta
function LocateMeButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung GPS');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 18); // Zoom 18 = detail aman
        onLocate(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) setError('Izin lokasi ditolak. Aktifkan di browser.');
        else setError('Tidak bisa mendapatkan lokasi GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map, onLocate]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        pointerEvents: 'none',
      }}
    >
      {error && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '12px',
          color: '#856404',
          maxWidth: '200px',
          textAlign: 'right',
          pointerEvents: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          ⚠️ {error}
        </div>
      )}
      <button
        onClick={handleLocate}
        disabled={loading}
        style={{
          pointerEvents: 'auto',
          backgroundColor: loading ? '#ccc' : 'white',
          color: loading ? '#999' : '#1a73e8',
          border: '2px solid #e8eaed',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8f9fa'; }}
        onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white'; }}
        title="Gunakan lokasi GPS saya"
      >
        {loading ? (
          <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Mendeteksi...</>
        ) : (
          <><span>📍</span> Lokasi Saya</>
        )}
      </button>
    </div>
  );
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
      // Zoom in ke minimal 17 agar lokasi lebih akurat
      const currentZoom = map.getZoom();
      map.flyTo(e.latlng, Math.max(currentZoom, 17));
    },
  });

  const pinPosition = externalPin ? L.latLng(externalPin[0], externalPin[1]) : position;
  if (pinPosition === null) return null;

  return (
    <Marker
      position={pinPosition}
      icon={createGooglePin()}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const latlng: L.LatLng = marker.getLatLng();
          setPosition(latlng);
          onLocationSelect(latlng.lat, latlng.lng);
        },
      }}
    >
      <Popup>
        <div style={{ textAlign: 'center', fontSize: '13px', minWidth: '160px' }}>
          <div style={{ fontWeight: 700, color: '#e53935', marginBottom: '4px' }}>📍 Lokasi Dipilih</div>
          <div style={{ color: '#555', fontSize: '11px', marginBottom: '6px' }}>
            {pinPosition.lat.toFixed(6)}, {pinPosition.lng.toFixed(6)}
          </div>
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
            💡 Seret pin untuk koreksi lokasi
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Instruksi overlay saat belum ada pin
function MapInstructionOverlay({ hasPin }: { hasPin: boolean }) {
  if (hasPin) return null;
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 500,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '13px',
      fontWeight: 600,
      color: '#333',
      pointerEvents: 'none',
      textAlign: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
    }}>
      <div style={{ fontSize: '28px' }}>👆</div>
      <div>Ketuk peta untuk menandai lokasi</div>
      <div style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>atau gunakan tombol "Lokasi Saya" di pojok kanan bawah</div>
    </div>
  );
}

export default function MapPicker({ onLocationSelect, defaultPosition = [-6.200000, 106.816666], centerPoint, externalPin }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [gpsPosition, setGpsPosition] = useState<L.LatLng | null>(null);

  const hasPin = !!(externalPin || position);

  const handleLocate = useCallback((lat: number, lng: number) => {
    const latlng = L.latLng(lat, lng);
    setGpsPosition(latlng);
    setPosition(latlng);
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  return (
    <div style={{
      position: 'relative',
      height: '420px',
      width: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid var(--color-border)',
      zIndex: 1,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      {/* Instruksi overlay */}
      <MapInstructionOverlay hasPin={hasPin} />

      <MapContainer
        center={defaultPosition}
        zoom={17}
        minZoom={5}
        maxZoom={20}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* OSM dengan maxNativeZoom=19: zoom 20 upscale tile-19, tidak abu-abu */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
          maxNativeZoom={19}
        />
        <MapUpdater centerPoint={centerPoint} />
        <LocationMarker
          position={position}
          setPosition={setPosition}
          onLocationSelect={onLocationSelect}
          externalPin={externalPin}
        />

        {/* Tombol GPS floating */}
        <LocateMeButton onLocate={handleLocate} />

        {/* Zoom control custom (pojok kiri bawah, lebih besar) */}
        <div
          className="leaflet-bottom leaflet-left"
          style={{ marginBottom: '16px', marginLeft: '16px' }}
        >
          <div className="leaflet-control leaflet-bar" style={{ border: 'none', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <a
              className="leaflet-control-zoom-in"
              href="#"
              title="Perbesar"
              style={{ width: '36px', height: '36px', lineHeight: '36px', fontSize: '18px', display: 'block', textAlign: 'center', backgroundColor: 'white', color: '#333', borderBottom: '1px solid #e0e0e0', textDecoration: 'none', fontWeight: 700 }}
              onClick={(e) => { e.preventDefault(); }}
            >+</a>
            <a
              className="leaflet-control-zoom-out"
              href="#"
              title="Perkecil"
              style={{ width: '36px', height: '36px', lineHeight: '36px', fontSize: '20px', display: 'block', textAlign: 'center', backgroundColor: 'white', color: '#333', textDecoration: 'none', fontWeight: 700 }}
              onClick={(e) => { e.preventDefault(); }}
            >−</a>
          </div>
        </div>
      </MapContainer>
    </div>
  );
}

// src/components/TaskMap.jsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API;

export default function TaskMap({ tasks = [] }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);

  // init once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-73.9851, 40.7589], // fallback
      zoom: 11,
      projection: "mercator",       // ← no 3D globe
      pitch: 0,
      bearing: 0,
      dragRotate: false,            // ← don’t rotate into tilt
      pitchWithRotate: false,
      cooperativeGestures: true,
      antialias: true,
    });

    // no globe fog
    mapRef.current.on("style.load", () => {
      try { mapRef.current.setFog(null); } catch {}
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // render markers on task changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // clear old
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // active tasks only with valid coords
    const active = (tasks || []).filter(t => {
      const s = String(t?.status || "").toLowerCase();
      if (s === "completed" || s === "paid") return false;
      const lat = Number(t?.latitude);
      const lng = Number(t?.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });

    if (!active.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    active.forEach((t) => {
      const lat = Number(t.latitude);
      const lng = Number(t.longitude);

      // use built-in pin to avoid CSS drift; anchor at the *tip*
      const marker = new mapboxgl.Marker({ color: "#3b82f6", anchor: "bottom", offset: [0, -2] })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(popupHTML(t))
        )
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });

    try {
      if (active.length === 1) {
        map.easeTo({ center: [Number(active[0].longitude), Number(active[0].latitude)], zoom: 12, duration: 0 });
      } else {
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });
      }
    } catch {}
  }, [tasks]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: "520px", borderRadius: 12, overflow: "hidden" }}
    />
  );
}

function popupHTML(t) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return `
  <div style="
    min-width:260px;max-width:300px;
    background:#ffffff;color:#111827;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;
    border-radius:10px;padding:8px 10px;box-sizing:border-box;">
    <div style="font-weight:600;margin-bottom:4px">${esc(t.title) || "Task"}</div>
    ${t.location ? `<div style="font-size:12px;opacity:.8">${esc(t.location)}</div>` : ""}
    ${
      t.description
        ? `<div style="font-size:12px;margin-top:6px;opacity:.9;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${esc(t.description)}</div>`
        : ""
    }
    <div style="font-size:12px;margin-top:6px"><b>Reward:</b> ${t.reward ?? "-"} ETH</div>
    ${t.deadline ? `<div style="font-size:12px"><b>Deadline:</b> ${esc(t.deadline)}</div>` : ""}
    ${t.status ? `<div style="font-size:12px"><b>Status:</b> ${esc(t.status)}</div>` : ""}
  </div>`;
}

// src/components/TaskMap.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API || "";

export default function TaskMap({ tasks = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Helpers
  const getLngLat = (t) => {
    const lat = Number(t?.latitude ?? t?.lat);
    const lng = Number(t?.longitude ?? t?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : null; // [lng, lat]
  };
  const isFinished = (t) => {
    const s = (t?.status || "").toString().toLowerCase();
    return s === "paid" || s === "completed";
  };
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  };

  const addMarkers = () => {
    if (!mapRef.current) return;
    clearMarkers();

    const bounds = new mapboxgl.LngLatBounds();
    let added = 0;

    tasks.forEach((t) => {
      if (isFinished(t)) return;
      const lnglat = getLngLat(t);
      if (!lnglat) return;

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
        `<div style="min-width:200px">
          <div style="font-weight:600;margin-bottom:4px">${t.title ?? "Task"}</div>
          ${t.location ? `<div style="font-size:12px;opacity:.8">${t.location}</div>` : ""}
          <div style="font-size:12px;margin-top:6px"><b>Reward:</b> ${t.reward ?? "-"} ETH</div>
          ${t.deadline ? `<div style="font-size:12px"><b>Deadline:</b> ${t.deadline}</div>` : ""}
        </div>`
      );

      // default marker (no custom element: most stable)
      const marker = new mapboxgl.Marker()
        .setLngLat(lnglat)
        .setPopup(popup)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
      bounds.extend(lnglat);
      added++;
    });

    if (added > 0 && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 400 });
    }
    // Ensure proper layout after any tab visibility change
    setTimeout(() => mapRef.current && mapRef.current.resize(), 0);
  };

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center: first valid task location or NYC
    let center = [-74.006, 40.7128];
    for (const t of tasks) {
      const lnglat = getLngLat(t);
      if (lnglat) { center = lnglat; break; }
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center,
      zoom: 10,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      addMarkers();
      mapRef.current.resize();
    });

    return () => {
      clearMarkers();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once

  // Update markers on task changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapRef.current.isStyleLoaded?.()) addMarkers();
    else mapRef.current.once?.("load", addMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[520px] rounded-xl overflow-hidden"
    />
  );
}

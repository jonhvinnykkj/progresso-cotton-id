import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Bale } from "@shared/schema";

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface BalesMapProps {
  bales: Bale[];
  selectedStatus?: string;
}

export function BalesMap({ bales, selectedStatus = "all" }: BalesMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Brazil
    const map = L.map(mapContainerRef.current).setView([-15.7801, -47.9292], 5);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers and polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Filter bales
    const filteredBales = bales.filter(
      (bale) => selectedStatus === "all" || bale.status === selectedStatus
    );

    if (filteredBales.length === 0) return;

    const bounds: L.LatLngExpression[] = [];

    // Add markers and trajectories for each bale
    filteredBales.forEach((bale) => {
      const trajectory: L.LatLngExpression[] = [];

      // Status color mapping
      const getColor = (status: string) => {
        switch (status) {
          case "campo":
            return "#2d7a5f";
          case "patio":
            return "#f59e0b";
          case "beneficiado":
            return "#3b82f6";
          default:
            return "#6b7280";
        }
      };

      // Campo marker
      if (bale.campoLatitude && bale.campoLongitude) {
        const lat = parseFloat(bale.campoLatitude);
        const lng = parseFloat(bale.campoLongitude);
        trajectory.push([lat, lng]);
        bounds.push([lat, lng]);

        const campoIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${getColor("campo")}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([lat, lng], { icon: campoIcon })
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>${bale.numero} - ${bale.talhao}</strong><br/>
              <span style="color: ${getColor("campo")}">● Campo</span><br/>
              <small>${bale.campoTimestamp ? new Date(bale.campoTimestamp).toLocaleString("pt-BR") : ""}</small>
            </div>
          `);
      }

      // Patio marker
      if (bale.patioLatitude && bale.patioLongitude) {
        const lat = parseFloat(bale.patioLatitude);
        const lng = parseFloat(bale.patioLongitude);
        trajectory.push([lat, lng]);
        bounds.push([lat, lng]);

        const patioIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${getColor("patio")}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([lat, lng], { icon: patioIcon })
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>${bale.numero} - ${bale.talhao}</strong><br/>
              <span style="color: ${getColor("patio")}">● Pátio</span><br/>
              <small>${bale.patioTimestamp ? new Date(bale.patioTimestamp).toLocaleString("pt-BR") : ""}</small>
            </div>
          `);
      }

      // Beneficiado marker
      if (bale.beneficiadoLatitude && bale.beneficiadoLongitude) {
        const lat = parseFloat(bale.beneficiadoLatitude);
        const lng = parseFloat(bale.beneficiadoLongitude);
        trajectory.push([lat, lng]);
        bounds.push([lat, lng]);

        const beneficiadoIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${getColor("beneficiado")}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([lat, lng], { icon: beneficiadoIcon })
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>${bale.numero} - ${bale.talhao}</strong><br/>
              <span style="color: ${getColor("beneficiado")}">● Beneficiado</span><br/>
              <small>${bale.beneficiadoTimestamp ? new Date(bale.beneficiadoTimestamp).toLocaleString("pt-BR") : ""}</small>
            </div>
          `);
      }

      // Draw trajectory line
      if (trajectory.length > 1) {
        L.polyline(trajectory, {
          color: "#6b7280",
          weight: 2,
          opacity: 0.5,
          dashArray: "5, 5",
        }).addTo(map);
      }
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
  }, [bales, selectedStatus]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-md"
      data-testid="bales-map"
      style={{ minHeight: "500px" }}
    />
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_LAYERS, DEFAULT_BD_CENTER } from '../../lib/geo';
import { 
  Navigation, 
  Store, 
  MapPin, 
  Clock, 
  Compass, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Phone, 
  ExternalLink,
  Loader2,
  Bike,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Route as RouteIcon,
  HelpCircle,
  Move
} from 'lucide-react';
import { Badge, Button } from '../../design-system';
import api from '../../lib/axios';

export interface LocationPoint {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  phone?: string;
}

interface DeliveryRouteMapProps {
  pickup: LocationPoint;
  dropoff: LocationPoint;
  initialRiderLocation?: { lat: number; lng: number } | null;
  currentStatus?: string; // 'RIDER_ASSIGNED' | 'ON_THE_WAY' | 'PICKED_UP' | 'DELIVERED'
  height?: string;
  className?: string;
  orderId?: number | string;
}

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  type: string;
  modifier?: string;
  streetName?: string;
  stage: 'TO_RESTAURANT' | 'TO_CUSTOMER';
}

// Helper: Haversine distance in km
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Estimate travel time
function estimateTravelTime(distanceKm: number, baseBufferMins: number = 2): { minutes: number; label: string } {
  if (distanceKm <= 0) return { minutes: 3, label: '~3 mins' };
  const travelMins = Math.round((distanceKm / 22) * 60);
  const total = Math.max(3, travelMins + baseBufferMins);
  if (total >= 60) {
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return { minutes: total, label: `~${hours}h ${mins > 0 ? `${mins}m` : ''}` };
  }
  return { minutes: total, label: `~${total} mins` };
}

// Helper: Parse maneuver icon
function getManeuverIcon(type: string, modifier?: string) {
  const mod = modifier?.toLowerCase() || '';
  if (mod.includes('right') || mod.includes('slight right')) {
    return <CornerUpRight size={15} className="text-amber-400 shrink-0" />;
  }
  if (mod.includes('left') || mod.includes('slight left')) {
    return <CornerUpLeft size={15} className="text-amber-400 shrink-0" />;
  }
  if (type === 'arrive') {
    return <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />;
  }
  if (type === 'depart') {
    return <Bike size={15} className="text-blue-400 shrink-0" />;
  }
  return <ArrowUp size={15} className="text-blue-400 shrink-0" />;
}

export const DeliveryRouteMap: React.FC<DeliveryRouteMapProps> = ({
  pickup,
  dropoff,
  initialRiderLocation,
  currentStatus = 'ON_THE_WAY',
  height = '380px',
  className = '',
  orderId
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);

  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);
  
  // Safe Fallback Target Coordinates
  const safePickupLat = Number(pickup?.lat) || DEFAULT_BD_CENTER[0];
  const safePickupLng = Number(pickup?.lng) || DEFAULT_BD_CENTER[1];
  const safeDropoffLat = Number(dropoff?.lat) || (safePickupLat + 0.012);
  const safeDropoffLng = Number(dropoff?.lng) || (safePickupLng + 0.010);

  // Calculate default rider location:
  // If initialRiderLocation is provided AND within 6km of the pickup store, use it.
  // Otherwise, default rider to ~900m away in the same neighborhood so the route is realistic!
  const getInitialRiderCoords = () => {
    if (initialRiderLocation?.lat && initialRiderLocation?.lng) {
      const dist = calculateHaversineKm(initialRiderLocation.lat, initialRiderLocation.lng, safePickupLat, safePickupLng);
      if (dist <= 6.0) {
        return { lat: initialRiderLocation.lat, lng: initialRiderLocation.lng };
      }
    }
    // Realistic city offset (~900m southwest on road)
    return {
      lat: parseFloat((safePickupLat - 0.0075).toFixed(6)),
      lng: parseFloat((safePickupLng - 0.0065).toFixed(6))
    };
  };

  // Live Rider State
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number }>(getInitialRiderCoords);
  const [followRiderMode, setFollowRiderMode] = useState<boolean>(false);
  const [isGpsLive, setIsGpsLive] = useState<boolean>(false);

  // Leg Metrics
  const [leg1Metrics, setLeg1Metrics] = useState<{ distanceKm: number; etaLabel: string }>({
    distanceKm: 0,
    etaLabel: '~5 mins'
  });
  const [leg2Metrics, setLeg2Metrics] = useState<{ distanceKm: number; etaLabel: string }>({
    distanceKm: 0,
    etaLabel: '~5 mins'
  });

  // Steps
  const [navSteps, setNavSteps] = useState<NavigationStep[]>([]);
  const [showStepsDrawer, setShowStepsDrawer] = useState<boolean>(false);
  const [activeLegView, setActiveLegView] = useState<'ALL' | 'LEG1' | 'LEG2'>('ALL');

  const isHeadingToStore = currentStatus === 'RIDER_ASSIGNED' || currentStatus === 'ON_THE_WAY';

  // 1. Device GPS Tracking
  useEffect(() => {
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setIsGpsLive(true);
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRiderCoords(newPos);

          // Update marker position on map directly if present
          if (riderMarkerRef.current) {
            riderMarkerRef.current.setLatLng([newPos.lat, newPos.lng]);
          }

          if (followRiderMode && mapInstanceRef.current) {
            mapInstanceRef.current.panTo([newPos.lat, newPos.lng], { animate: true });
          }

          // Optionally save to backend
          api.put('/orders/rider/location', { latitude: newPos.lat, longitude: newPos.lng }).catch(() => {});
        },
        (err) => {
          console.log('Browser geolocation status:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [followRiderMode]);

  // 2. Render Map & Both Road Legs (OSRM)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true
    });
    mapInstanceRef.current = map;

    // Tile Layer
    const tileLayerUrl = mapType === 'satellite' ? MAP_LAYERS.googleHybrid.url : MAP_LAYERS.googleStreets.url;
    const tileLayerSubdomains = mapType === 'satellite' ? MAP_LAYERS.googleHybrid.subdomains : MAP_LAYERS.googleStreets.subdomains;
    
    L.tileLayer(tileLayerUrl, {
      maxZoom: 20,
      subdomains: tileLayerSubdomains as any
    }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    // ==========================================
    // 🛵 MARKER 0: RIDER CURRENT START POSITION (THEME PRIMARY COLOR)
    // ==========================================
    const riderHtml = `
      <div class="relative flex items-center justify-center cursor-move group">
        <div class="absolute -inset-3 bg-[#d70f64]/35 rounded-full animate-ping"></div>
        <div class="relative flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#8a0a40] via-[#d70f64] to-[#f43f5e] text-white shadow-2xl border-2 border-white transform group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#d70f64] rotate-45 border-r border-b border-white"></div>
        <span class="absolute -bottom-6 bg-[#8a0a40] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
          🛵 0. Rider (You)
        </span>
      </div>
    `;

    const riderIcon = L.divIcon({
      html: riderHtml,
      className: 'custom-rider-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 38],
      popupAnchor: [0, -38]
    });

    const riderMarker = L.marker([riderCoords.lat, riderCoords.lng], { 
      icon: riderIcon,
      draggable: true,
      title: 'Drag to adjust your starting position'
    }).addTo(layersGroup);
    riderMarkerRef.current = riderMarker;

    riderMarker.on('dragend', (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      setRiderCoords({ lat, lng });
      api.put('/orders/rider/location', { latitude: lat, longitude: lng }).catch(() => {});
    });

    riderMarker.bindPopup(`
      <div class="p-2 space-y-1 font-sans text-xs">
        <div class="flex items-center gap-1.5 text-[#d70f64] font-black uppercase text-[10px]">
          <span>🛵 Rider Starting Position</span>
        </div>
        <p class="text-gray-700 font-bold">Your current live location.</p>
        <p class="text-[10px] text-gray-500">Tip: You can drag this pin on the map to test different start roads.</p>
      </div>
    `);

    // ==========================================
    // 🏬 MARKER 1: RESTAURANT PICKUP POINT
    // ==========================================
    const pickupHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
        <div class="absolute -inset-2.5 bg-amber-500/35 rounded-full animate-ping"></div>
        <div class="relative flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 text-white shadow-2xl border-2 border-white transform group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-600 rotate-45 border-r border-b border-white"></div>
        <span class="absolute -bottom-6 bg-amber-700 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
          🏬 1. Store Pickup
        </span>
      </div>
    `;

    const pickupIcon = L.divIcon({
      html: pickupHtml,
      className: 'custom-pickup-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 38],
      popupAnchor: [0, -38]
    });

    const pickupMarker = L.marker([safePickupLat, safePickupLng], { icon: pickupIcon }).addTo(layersGroup);
    pickupMarker.bindPopup(`
      <div class="p-2 space-y-1 font-sans text-xs min-w-[200px]">
        <div class="flex items-center gap-1.5 text-amber-600 font-extrabold uppercase text-[10px]">
          <span>🏬 Step 1: Restaurant Pickup</span>
        </div>
        <h4 class="font-black text-sm text-gray-900">${pickup?.name || 'Restaurant'}</h4>
        <p class="text-gray-600 text-xs">${pickup?.address || 'Pickup Address'}</p>
        ${pickup?.phone ? `<a href="tel:${pickup.phone}" class="inline-block mt-1 font-bold text-amber-600">📞 ${pickup.phone}</a>` : ''}
      </div>
    `);

    // ==========================================
    // 📍 MARKER 2: CUSTOMER DROPOFF POINT
    // ==========================================
    const dropoffHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
        <div class="absolute -inset-2.5 bg-emerald-500/35 rounded-full animate-ping"></div>
        <div class="relative flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-2xl border-2 border-white transform group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-600 rotate-45 border-r border-b border-white"></div>
        <span class="absolute -bottom-6 bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
          📍 2. Dropoff Customer
        </span>
      </div>
    `;

    const dropoffIcon = L.divIcon({
      html: dropoffHtml,
      className: 'custom-dropoff-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 38],
      popupAnchor: [0, -38]
    });

    const dropoffMarker = L.marker([safeDropoffLat, safeDropoffLng], { icon: dropoffIcon }).addTo(layersGroup);
    dropoffMarker.bindPopup(`
      <div class="p-2.5 space-y-2 font-sans text-xs min-w-[220px]">
        <div class="flex items-center gap-1.5 text-emerald-600 font-extrabold uppercase text-[10px]">
          <span>📍 Step 2: Customer Destination</span>
        </div>
        <h4 class="font-black text-sm text-gray-900">${dropoff?.name || 'Customer'}</h4>
        <p class="text-gray-600 text-xs">${dropoff?.address || 'Delivery Address'}</p>
        <div class="pt-1 flex items-center gap-2">
          <a href="tel:${dropoff?.phone || '+8801571323156'}" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs hover:bg-emerald-700">
            📞 Call: ${dropoff?.phone || '+880 1571-323156'}
          </a>
          <a href="https://wa.me/${(dropoff?.phone || '+8801571323156').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-bold text-xs hover:bg-gray-200">
            💬 WhatsApp
          </a>
        </div>
      </div>
    `);

    // Auto-Fit Map Bounds to Include all 3 Points
    const bounds = L.latLngBounds([
      [riderCoords.lat, riderCoords.lng],
      [safePickupLat, safePickupLng],
      [safeDropoffLat, safeDropoffLng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

    // =======================================================
    // 🛣️ FETCH REAL ROAD STREET ROUTES FOR BOTH LEGS (OSRM)
    // =======================================================
    setIsRoutingLoading(true);

    // Leg 1: Rider -> Restaurant Pickup
    const osrmLeg1Url = `https://router.project-osrm.org/route/v1/driving/${riderCoords.lng},${riderCoords.lat};${safePickupLng},${safePickupLat}?overview=full&geometries=geojson&steps=true`;
    
    // Leg 2: Restaurant Pickup -> Customer Dropoff
    const osrmLeg2Url = `https://router.project-osrm.org/route/v1/driving/${safePickupLng},${safePickupLat};${safeDropoffLng},${safeDropoffLat}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    Promise.all([
      fetch(osrmLeg1Url, { signal: controller.signal }).then((r) => r.json()).catch(() => null),
      fetch(osrmLeg2Url, { signal: controller.signal }).then((r) => r.json()).catch(() => null)
    ])
      .then(([leg1Data, leg2Data]) => {
        clearTimeout(timeoutId);
        setIsRoutingLoading(false);
        if (!mapInstanceRef.current || !layersGroupRef.current) return;

        const allSteps: NavigationStep[] = [];

        // ---------------------------------------------------------------------
        // Draw Leg 1 (Rider -> Restaurant: Theme Brand Primary #d70f64 Route)
        // ---------------------------------------------------------------------
        if (leg1Data?.routes?.[0]?.geometry?.coordinates) {
          const route1 = leg1Data.routes[0];
          const coords1 = route1.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          const dist1Km = parseFloat((route1.distance / 1000).toFixed(1));
          const eta1 = estimateTravelTime(dist1Km);
          setLeg1Metrics({ distanceKm: dist1Km, etaLabel: eta1.label });

          // Extract steps for Leg 1
          if (route1.legs?.[0]?.steps) {
            route1.legs[0].steps.forEach((st: any) => {
              if (st.distance > 0 || st.maneuver.type === 'arrive') {
                let text = st.name ? `Along ${st.name}` : 'Continue on road';
                if (st.maneuver.type === 'depart') text = `Depart towards ${pickup?.name} ${st.name ? `on ${st.name}` : ''}`;
                else if (st.maneuver.type === 'arrive') text = `Arrive at Restaurant: ${pickup?.name}`;
                else if (st.maneuver.type === 'turn') text = `Turn ${st.maneuver.modifier || ''} ${st.name ? `onto ${st.name}` : ''}`;
                
                allSteps.push({
                  instruction: text,
                  distanceMeters: Math.round(st.distance),
                  durationSeconds: Math.round(st.duration),
                  type: st.maneuver.type,
                  modifier: st.maneuver.modifier,
                  streetName: st.name,
                  stage: 'TO_RESTAURANT'
                });
              }
            });
          }

          // Leg 1 Road Casing (Theme dark glow #700833)
          L.polyline(coords1, {
            color: '#700833',
            weight: isHeadingToStore ? 11 : 7,
            opacity: isHeadingToStore ? 0.65 : 0.35,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(layersGroupRef.current);

          // Leg 1 Main Road Line (Theme Primary #d70f64)
          L.polyline(coords1, {
            color: '#d70f64',
            weight: isHeadingToStore ? 6.5 : 4.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(layersGroupRef.current);

          // Leg 1 Animated Motion Overlay (Brand Pink-White Dash)
          L.polyline(coords1, {
            color: '#fed7e2',
            weight: 2.5,
            dashArray: '6, 10',
            opacity: 0.95,
            lineCap: 'round'
          }).addTo(layersGroupRef.current);

        } else {
          // Fallback straight line Leg 1
          drawFallbackLine(layersGroupRef.current, [riderCoords.lat, riderCoords.lng], [safePickupLat, safePickupLng], '#d70f64', isHeadingToStore);
          const d1 = calculateHaversineKm(riderCoords.lat, riderCoords.lng, safePickupLat, safePickupLng);
          setLeg1Metrics({ distanceKm: parseFloat(d1.toFixed(1)), etaLabel: estimateTravelTime(d1).label });
        }

        // ----------------------------------------------------
        // Draw Leg 2 (Restaurant -> Customer: Emerald / Secondary Route)
        // ----------------------------------------------------
        if (leg2Data?.routes?.[0]?.geometry?.coordinates) {
          const route2 = leg2Data.routes[0];
          const coords2 = route2.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          const dist2Km = parseFloat((route2.distance / 1000).toFixed(1));
          const eta2 = estimateTravelTime(dist2Km);
          setLeg2Metrics({ distanceKm: dist2Km, etaLabel: eta2.label });

          // Extract steps for Leg 2
          if (route2.legs?.[0]?.steps) {
            route2.legs[0].steps.forEach((st: any) => {
              if (st.distance > 0 || st.maneuver.type === 'arrive') {
                let text = st.name ? `Along ${st.name}` : 'Continue on road';
                if (st.maneuver.type === 'depart') text = `Depart from ${pickup?.name} towards ${dropoff?.name}`;
                else if (st.maneuver.type === 'arrive') text = `Arrive at Customer: ${dropoff?.name}`;
                else if (st.maneuver.type === 'turn') text = `Turn ${st.maneuver.modifier || ''} ${st.name ? `onto ${st.name}` : ''}`;

                allSteps.push({
                  instruction: text,
                  distanceMeters: Math.round(st.distance),
                  durationSeconds: Math.round(st.duration),
                  type: st.maneuver.type,
                  modifier: st.maneuver.modifier,
                  streetName: st.name,
                  stage: 'TO_CUSTOMER'
                });
              }
            });
          }

          // Leg 2 Road Casing
          L.polyline(coords2, {
            color: !isHeadingToStore ? '#700833' : '#065f46',
            weight: !isHeadingToStore ? 11 : 6,
            opacity: !isHeadingToStore ? 0.65 : 0.35,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(layersGroupRef.current);

          // Leg 2 Main Road Line (Theme Primary #d70f64 when active, else emerald #10b981)
          L.polyline(coords2, {
            color: !isHeadingToStore ? '#d70f64' : '#10b981',
            weight: !isHeadingToStore ? 6.5 : 4.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(layersGroupRef.current);

          // Leg 2 Animated Dash Motion Overlay
          L.polyline(coords2, {
            color: !isHeadingToStore ? '#fed7e2' : '#d1fae5',
            weight: 2.5,
            dashArray: '6, 10',
            opacity: 0.95,
            lineCap: 'round'
          }).addTo(layersGroupRef.current);

        } else {
          // Fallback straight line Leg 2
          drawFallbackLine(layersGroupRef.current, [safePickupLat, safePickupLng], [safeDropoffLat, safeDropoffLng], !isHeadingToStore ? '#d70f64' : '#10b981', !isHeadingToStore);
          const d2 = calculateHaversineKm(safePickupLat, safePickupLng, safeDropoffLat, safeDropoffLng);
          setLeg2Metrics({ distanceKm: parseFloat(d2.toFixed(1)), etaLabel: estimateTravelTime(d2).label });
        }

        setNavSteps(allSteps);
      })
      .catch(() => {
        setIsRoutingLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [riderCoords, safePickupLat, safePickupLng, safeDropoffLat, safeDropoffLng, mapType, isHeadingToStore]);

  const drawFallbackLine = (group: L.LayerGroup, start: [number, number], end: [number, number], color: string, isActive: boolean) => {
    L.polyline([start, end], {
      color: '#1e293b',
      weight: isActive ? 8 : 5,
      opacity: 0.4
    }).addTo(group);

    L.polyline([start, end], {
      color,
      weight: isActive ? 5 : 3.5,
      dashArray: '8, 8',
      opacity: 0.95
    }).addTo(group);
  };

  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([
      [riderCoords.lat, riderCoords.lng],
      [safePickupLat, safePickupLng],
      [safeDropoffLat, safeDropoffLng]
    ]);
    mapInstanceRef.current.flyToBounds(bounds, { padding: [60, 60], duration: 0.8 });
  }, [riderCoords, safePickupLat, safePickupLng, safeDropoffLat, safeDropoffLng]);

  const toggleFollowRider = () => {
    const next = !followRiderMode;
    setFollowRiderMode(next);
    if (next && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([riderCoords.lat, riderCoords.lng], 17, { duration: 1 });
    } else {
      handleRecenter();
    }
  };

  // Google Navigation URLs
  const navToStoreUrl = `https://www.google.com/maps/dir/?api=1&origin=${riderCoords.lat},${riderCoords.lng}&destination=${safePickupLat},${safePickupLng}&travelmode=driving`;
  const navToCustomerUrl = `https://www.google.com/maps/dir/?api=1&origin=${safePickupLat},${safePickupLng}&destination=${safeDropoffLat},${safeDropoffLng}&travelmode=driving`;
  const fullTripUrl = `https://www.google.com/maps/dir/?api=1&origin=${riderCoords.lat},${riderCoords.lng}&destination=${safeDropoffLat},${safeDropoffLng}&waypoints=${safePickupLat},${safePickupLng}&travelmode=driving`;

  const totalDist = (leg1Metrics.distanceKm + leg2Metrics.distanceKm).toFixed(1);
  const activeSteps = navSteps.filter(s => activeLegView === 'ALL' ? true : activeLegView === 'LEG1' ? s.stage === 'TO_RESTAURANT' : s.stage === 'TO_CUSTOMER');

  // Next immediate turn step
  const nextActiveStep = navSteps.find(s => isHeadingToStore ? s.stage === 'TO_RESTAURANT' : s.stage === 'TO_CUSTOMER') || navSteps[0];

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-border/80 shadow-xl bg-card transition-all ${className}`}>
      
      {/* ========================================================================= */}
      {/* 🧭 TOP NEXT ROAD MANEUVER BANNER (SHOWS WHICH ROAD RIDER FOLLOWS TO PICKUP) */}
      {/* ========================================================================= */}
      <div className={`text-white px-4 py-3 flex items-center justify-between gap-3 shadow-md z-20 relative transition-all ${
        isHeadingToStore 
          ? 'bg-gradient-to-r from-[#700833] via-[#b80c53] to-[#d70f64] border-b border-white/20' 
          : 'bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 border-b border-emerald-500/30'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 border ${
            isHeadingToStore ? 'bg-white/20 border-white/40 text-white' : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
          }`}>
            {isHeadingToStore ? <Store size={18} /> : <MapPin size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                isHeadingToStore ? 'text-pink-200' : 'text-emerald-300'
              }`}>
                {isHeadingToStore ? '🛵 Road to Store Pickup' : '📍 Road to Customer Dropoff'}
              </span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-black text-white">
                {isHeadingToStore ? `${leg1Metrics.distanceKm} km • ${leg1Metrics.etaLabel}` : `${leg2Metrics.distanceKm} km • ${leg2Metrics.etaLabel}`}
              </span>
            </div>
            <h4 className="text-xs font-black text-white truncate leading-tight mt-0.5">
              {nextActiveStep ? nextActiveStep.instruction : (isHeadingToStore ? `Follow road to ${pickup?.name}` : `Follow road to ${dropoff?.name}`)}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowStepsDrawer(!showStepsDrawer)}
            className="flex items-center gap-1.5 text-[11px] font-black text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-all shadow-xs"
          >
            <RouteIcon size={13} />
            <span className="hidden sm:inline">Road Steps</span>
            <span>({navSteps.length})</span>
            {showStepsDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div 
        ref={mapContainerRef} 
        style={{ height: isExpanded ? '540px' : height }} 
        className="w-full transition-all duration-300 z-0"
      />

      {/* ========================================================================= */}
      {/* 🗺️ DUAL-LEG STATS & CONTROLS OVERLAY ON MAP */}
      {/* ========================================================================= */}
      <div className="absolute top-16 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        
        {/* Dual Leg Route Badges */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-background/95 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 shadow-2xl">
          {/* Leg 1 Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
            isHeadingToStore ? 'bg-primary/15 text-primary border border-primary/30 ring-1 ring-primary/20' : 'bg-muted/40 text-muted-foreground'
          }`}>
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span>1. Store: {leg1Metrics.distanceKm}km</span>
            <span className="text-[10px] opacity-80">({leg1Metrics.etaLabel})</span>
          </div>

          <span className="text-muted-foreground text-xs font-bold">➔</span>

          {/* Leg 2 Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
            !isHeadingToStore ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 ring-1 ring-emerald-500/20' : 'bg-muted/40 text-muted-foreground'
          }`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>2. Drop: {leg2Metrics.distanceKm}km</span>
            <span className="text-[10px] opacity-80">({leg2Metrics.etaLabel})</span>
          </div>

          {isRoutingLoading && (
            <Loader2 size={12} className="animate-spin text-primary ml-1" />
          )}
        </div>

        {/* Map Control Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-background/95 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 shadow-2xl">
          
          {/* Follow Rider Toggle */}
          <button
            type="button"
            onClick={toggleFollowRider}
            title={followRiderMode ? 'Stop Tracking' : 'Center on Rider Location'}
            className={`p-1.5 rounded-xl transition-all flex items-center gap-1 px-2 text-xs font-black ${
              followRiderMode ? 'bg-blue-600 text-white shadow-md animate-pulse' : 'hover:bg-muted text-foreground'
            }`}
          >
            <Crosshair size={13} />
            <span className="text-[10px] hidden sm:inline">{followRiderMode ? 'Following' : 'Follow Me'}</span>
          </button>

          {/* Layer Toggle */}
          <button
            type="button"
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
            title="Toggle Satellite / Street View"
            className="p-1.5 rounded-xl hover:bg-muted text-foreground transition-colors text-xs font-bold flex items-center gap-1 px-2"
          >
            <Layers size={13} />
            <span className="text-[10px] hidden sm:inline">{mapType === 'streets' ? 'Satellite' : 'Streets'}</span>
          </button>
          
          {/* Recenter Full Trip */}
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter Full Route"
            className="p-1.5 rounded-xl hover:bg-muted text-foreground transition-colors"
          >
            <Navigation size={13} />
          </button>

          {/* Expand Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(!isExpanded);
              setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
                handleRecenter();
              }, 310);
            }}
            title={isExpanded ? 'Collapse Map' : 'Expand Map'}
            className="p-1.5 rounded-xl hover:bg-muted text-foreground transition-colors"
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📜 TURN-BY-TURN ROAD DIRECTIONS DRAWER */}
      {/* ========================================================================= */}
      {showStepsDrawer && (
        <div className="absolute inset-x-3 top-32 bottom-20 bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-4 overflow-y-auto z-20 animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
                <RouteIcon size={14} className="text-primary" /> Turn-by-Turn Road Route Steps
              </h4>
              <p className="text-[10px] text-muted-foreground">Follow these exact streets to navigate to pickup and dropoff.</p>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowStepsDrawer(false)}
              className="px-2 py-1 bg-muted hover:bg-muted/80 rounded-lg text-foreground text-xs font-black"
            >
              ✕ Close
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1.5 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setActiveLegView('ALL')}
              className={`px-3 py-1 rounded-lg border transition-colors ${
                activeLegView === 'ALL' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border text-muted-foreground'
              }`}
            >
              All Steps ({navSteps.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLegView('LEG1')}
              className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                activeLegView === 'LEG1' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
              }`}
            >
              <Store size={12} /> Store Leg ({leg1Metrics.distanceKm} km)
            </button>
            <button
              type="button"
              onClick={() => setActiveLegView('LEG2')}
              className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                activeLegView === 'LEG2' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <MapPin size={12} /> Dropoff Leg ({leg2Metrics.distanceKm} km)
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {activeSteps.map((step, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  step.stage === 'TO_RESTAURANT' ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
                }`}
              >
                <div className="mt-0.5">
                  {getManeuverIcon(step.type, step.modifier)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                      step.stage === 'TO_RESTAURANT' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {step.stage === 'TO_RESTAURANT' ? 'Store Pickup Leg' : 'Customer Leg'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-0.5">{step.instruction}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 font-medium">
                    <span>{step.distanceMeters > 1000 ? `${(step.distanceMeters / 1000).toFixed(1)} km` : `${step.distanceMeters} m`}</span>
                    <span>•</span>
                    <span>~{Math.max(1, Math.round(step.durationSeconds / 60))} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧭 BOTTOM FLOATING ACTION BAR WITH DIRECT NAVIGATION BUTTONS */}
      {/* ========================================================================= */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10">
        <div className="pointer-events-auto bg-background/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-border/80 shadow-2xl flex items-center justify-between gap-2.5">
          
          {/* Target Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
              isHeadingToStore ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
            }`}>
              {isHeadingToStore ? <Store size={18} /> : <MapPin size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground truncate">
                  {isHeadingToStore ? '1. Store Pickup' : '2. Customer Dropoff'}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-muted/60 text-foreground">
                  {isHeadingToStore ? `${leg1Metrics.distanceKm} km • ${leg1Metrics.etaLabel}` : `${leg2Metrics.distanceKm} km • ${leg2Metrics.etaLabel}`}
                </span>
              </div>
              <h4 className="text-xs font-black text-foreground truncate mt-0.5">
                {isHeadingToStore ? (pickup?.name || 'Restaurant') : (dropoff?.name || 'Customer Destination')}
              </h4>
            </div>
          </div>

          {/* Action Buttons Cluster (Icon Only) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Phone Call Button */}
            {isHeadingToStore ? (
              pickup?.phone && (
                <a
                  href={`tel:${pickup.phone}`}
                  className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 transition-colors inline-flex items-center justify-center shadow-2xs active:scale-95"
                  title={`Call Merchant: ${pickup.phone}`}
                >
                  <Phone size={15} className="text-amber-600 dark:text-amber-400 fill-current" />
                </a>
              )
            ) : (
              <a
                href={`tel:${dropoff?.phone || '+8801571323156'}`}
                className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-95 inline-flex items-center justify-center shadow-md shadow-emerald-600/25"
                title={`Call Customer: ${dropoff?.phone || '+880 1571-323156'}`}
              >
                <Phone size={15} className="fill-current" />
              </a>
            )}

            {/* Direct Google Maps Navigation Button */}
            <a
              href={isHeadingToStore ? navToStoreUrl : navToCustomerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-xl font-black shadow-md transition-transform active:scale-95 inline-flex items-center justify-center text-white bg-primary hover:bg-primary/90 shadow-primary/25"
              title={isHeadingToStore ? 'Navigate to Store Pickup in Google Maps' : 'Navigate to Customer in Google Maps'}
            >
              <Navigation size={15} className="fill-current" />
            </a>

            {/* Full Trip Waypoints Button */}
            <a
              href={fullTripUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Full Trip Waypoints in Google Maps"
              className="h-9 w-9 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-colors inline-flex items-center justify-center shrink-0 shadow-2xs active:scale-95"
            >
              <RouteIcon size={15} className="text-primary" />
            </a>
          </div>

        </div>
      </div>

    </div>
  );
};

export default DeliveryRouteMap;

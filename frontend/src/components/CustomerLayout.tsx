import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCustomerStore, Zone } from '../store/useCustomerStore';
import api from '../lib/axios';
import { 
  UtensilsCrossed, 
  MapPin, 
  ShoppingCart, 
  User as UserIcon, 
  LogOut, 
  ChevronDown,
  LogIn,
  UserPlus,
  Compass,
  Loader2,
  Search,
  X,
  ClipboardList,
  Layers,
  Navigation,
  Building2,
  Map as MapIcon,
  Check
} from 'lucide-react';
import { Button, Input, Modal, toast } from '../design-system';
import {
  BANGLADESH_BOUNDS,
  DEFAULT_BD_CENTER,
  MAP_LAYERS,
  searchBangladeshLocations,
  reverseGeocodeBangladesh,
  GeoSearchResult
} from '../lib/geo';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { selectedZone, setSelectedZone, selectedAddress, setSelectedAddress, cart, setCartScope } = useCustomerStore();
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch available zones for selector dropdown
  useEffect(() => {
    api.get('/delivery-zones')
      .then((res) => {
        if (res.data?.success) {
          const activeZones = (res.data.deliveryZones || []).filter(
            (z: any) => z.status === 'ACTIVE'
          );
          setZones(activeZones);
          
          // Auto-select first zone if none selected yet
          if (!selectedZone && activeZones.length > 0) {
            setSelectedZone(activeZones[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch zones:', err);
      });
  }, [selectedZone, setSelectedZone]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone);
    setIsDropdownOpen(false);
    toast.success(`Delivery zone switched to ${zone.name}`);
  };

  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // Map search & autocomplete state
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'googleStreets' | 'googleHybrid' | 'osm'>('googleStreets');
  const searchTimeoutRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Mandatory address focus modal state
  const [showAddressPrompt, setShowAddressPrompt] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address: '',
    latitude: '23.7516',
    longitude: '90.3786',
  });
  const [submittingAddress, setSubmittingAddress] = useState(false);
  const [isLocationCovered, setIsLocationCovered] = useState<boolean>(true);
  const [matchingZoneName, setMatchingZoneName] = useState<string | null>(null);

  // Saved Addresses State array
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [isAddressManagerOpen, setIsAddressManagerOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any>(null);

  // Map refs
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const tileLayerRef = useRef<any>(null);

  // Distance calculator (Haversine formula in KM)
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Checks coordinates against active zones list
  const checkCoordinatesCoverage = (latStr: string, lngStr: string) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) {
      setIsLocationCovered(false);
      setMatchingZoneName(null);
      return;
    }

    let covered = false;
    let zoneName: string | null = null;

    for (const zone of zones) {
      const zoneLat = Number(zone.latitude || 0);
      const zoneLng = Number(zone.longitude || 0);
      const zoneRadius = Number(zone.radiusKm || 0);

      const dist = getDistanceKm(lat, lng, zoneLat, zoneLng);
      if (dist <= zoneRadius) {
        covered = true;
        zoneName = zone.name;
        break;
      }
    }

    setIsLocationCovered(covered);
    setMatchingZoneName(zoneName);
  };

  // Reverse geocoding (coordinates -> structured Bangladesh address)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const result = await reverseGeocodeBangladesh(lat, lng);
      if (result && result.shortAddress) {
        setAddressForm((prev) => ({
          ...prev,
          address: result.shortAddress,
        }));
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }
  };

  // Re-verify coverage when coords or zones list updates
  useEffect(() => {
    if (zones.length > 0) {
      checkCoordinatesCoverage(addressForm.latitude, addressForm.longitude);
    }
  }, [addressForm.latitude, addressForm.longitude, zones]);

  // Handle autocomplete input changes
  const handleMapSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMapSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 2) {
      setIsSearchingMap(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchBangladeshLocations(val);
          setSearchResults(results);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Location autocomplete search error:', err);
        } finally {
          setIsSearchingMap(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearchingMap(false);
    }
  };

  // Select location from autocomplete suggestions
  const handleSelectLocation = (item: GeoSearchResult) => {
    const newLat = item.lat.toFixed(6);
    const newLng = item.lng.toFixed(6);

    setAddressForm((prev) => ({
      ...prev,
      latitude: newLat,
      longitude: newLng,
      address: item.displayName || `${item.title}, ${item.subtitle}`,
    }));

    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([item.lat, item.lng]);
      const zoom = item.category === 'street' || item.category === 'building' ? 17 : 15;
      mapRef.current.setView([item.lat, item.lng], zoom, { animate: true });
    }

    setMapSearchQuery(item.title);
    setShowSuggestions(false);
    checkCoordinatesCoverage(newLat, newLng);
    toast.success(`Pinned: ${item.title}`);
  };

  // Dismiss suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Switch map layer (Google Streets / Google Satellite / OSM)
  const switchMapLayer = (layerKey: 'googleStreets' | 'googleHybrid' | 'osm') => {
    setActiveLayer(layerKey);
    if (mapRef.current && tileLayerRef.current) {
      const L = (window as any).L;
      if (!L) return;
      mapRef.current.removeLayer(tileLayerRef.current);
      const cfg = MAP_LAYERS[layerKey];
      const newTile = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
        subdomains: (cfg as any).subdomains || ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(mapRef.current);
      tileLayerRef.current = newTile;
    }
  };

  // Check if authenticated customer has any addresses on mount or when logging in
  const fetchUserAddresses = () => {
    if (isAuthenticated && user && user.role === 'CUSTOMER') {
      api.get('/user-addresses')
        .then((res) => {
          if (res.data?.success) {
            const list = res.data.addresses || [];
            setUserAddresses(list);
            
            // Check if there are no addresses at all
            const hasAddr = list.length > 0;
            setShowAddressPrompt(!hasAddr);
            
            // Set active address (keep manually selected address if it still exists in the fetched list)
            if (hasAddr) {
              const stillExists = list.find((a: any) => selectedAddress && a.id === selectedAddress.id);
              if (stillExists) {
                setSelectedAddress(stillExists);
              } else {
                const defAddr = list.find((a: any) => a.isDefault) || list[0];
                setSelectedAddress(defAddr);
              }
            } else {
              setSelectedAddress(null);
            }
          }
        })
        .catch(() => {});
    } else {
      setUserAddresses([]);
      setSelectedAddress(null);
      setShowAddressPrompt(false);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, [isAuthenticated, user]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Listen for query params to force opening address configure modal
  useEffect(() => {
    if (searchParams.get('add-address') === 'true') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('add-address');
      setSearchParams(newParams, { replace: true });
      // Open modal
      setAddressToEdit(null);
      setAddressForm({
        label: '',
        address: '',
        latitude: '23.7516',
        longitude: '90.3786',
      });
      setShowAddressPrompt(true);
    }
  }, [searchParams, setSearchParams]);

  // Auto-determine active zone from the chosen address
  useEffect(() => {
    if (selectedAddress && zones.length > 0) {
      const lat = Number(selectedAddress.latitude);
      const lng = Number(selectedAddress.longitude);
      
      let matchingZone: Zone | null = null;
      for (const zone of zones) {
        const zoneLat = Number(zone.latitude || 0);
        const zoneLng = Number(zone.longitude || 0);
        const zoneRadius = Number(zone.radiusKm || 0);

        const dist = getDistanceKm(lat, lng, zoneLat, zoneLng);
        if (dist <= zoneRadius) {
          matchingZone = zone;
          break;
        }
      }
      
      if (matchingZone && (!selectedZone || selectedZone.id !== matchingZone.id)) {
        setSelectedZone(matchingZone);
        toast.info(`Delivery zone auto-updated to ${matchingZone.name}`);
      }
    }
  }, [selectedAddress, zones]);

  // Sync cart scope with active address/zone
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'CUSTOMER' && selectedAddress) {
      setCartScope(`address_${selectedAddress.id}`);
    } else if (selectedZone) {
      setCartScope(`zone_${selectedZone.id}`);
    } else {
      setCartScope('guest');
    }
  }, [selectedAddress, selectedZone, isAuthenticated, user]);

  // Initialize and teardown the Leaflet Map with Bangladesh Bounds & Google Maps Layer
  useEffect(() => {
    if (!showAddressPrompt) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
      return;
    }

    // Set a short delay to allow Modal Portal rendering and transitions to complete
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      // If map is already initialized, trigger container resize re-render
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        return;
      }

      const bangladeshBounds = L.latLngBounds(BANGLADESH_BOUNDS[0], BANGLADESH_BOUNDS[1]);
      const initialLat = parseFloat(addressForm.latitude) || DEFAULT_BD_CENTER[0];
      const initialLng = parseFloat(addressForm.longitude) || DEFAULT_BD_CENTER[1];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        maxBounds: bangladeshBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 7,
        maxZoom: 20,
      }).setView([initialLat, initialLng], 14);

      // Place zoom controls at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Google Maps Streets layer default
      const layerCfg = MAP_LAYERS[activeLayer] || MAP_LAYERS.googleStreets;
      const tileLayer = L.tileLayer(layerCfg.url, {
        attribution: layerCfg.attribution,
        maxZoom: layerCfg.maxZoom,
        subdomains: (layerCfg as any).subdomains || ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      zones.forEach((zone) => {
        const zoneLat = Number(zone.latitude || 0);
        const zoneLng = Number(zone.longitude || 0);
        const zoneRadius = Number(zone.radiusKm || 0);

        L.circle([zoneLat, zoneLng], {
          color: '#d70f64', // BiteSpeed brand rose pink
          fillColor: '#d70f64',
          fillOpacity: 0.1,
          weight: 1.5,
          radius: zoneRadius * 1000,
          interactive: false, // Prevents intercepting clicks so click-to-pin works everywhere!
        }).addTo(map);
      });

      // Render custom CSS pulsed pin marker
      const customMarkerIcon = L.divIcon({
        html: `<div class="h-6 w-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-lg animate-pulse"><div class="h-2 w-2 rounded-full bg-white"></div></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customMarkerIcon,
      }).addTo(map);

      // Drag event
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        map.panTo(position); // Pan to dragged coordinates
        setAddressForm((prev) => ({
          ...prev,
          latitude: position.lat.toFixed(6),
          longitude: position.lng.toFixed(6),
        }));
        reverseGeocode(position.lat, position.lng);
      });

      // Map click event
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        map.panTo([lat, lng]); // Pan to clicked coordinates
        setAddressForm((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
        reverseGeocode(lat, lng);
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Invalidate sizes after animation rendering finishes
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [showAddressPrompt, zones]);

  // Sync marker position when inputs are manually updated or detected by browser GPS
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const lat = parseFloat(addressForm.latitude);
      const lng = parseFloat(addressForm.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const curLatLng = markerRef.current.getLatLng();
        if (curLatLng.lat !== lat || curLatLng.lng !== lng) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.panTo([lat, lng]);
        }
      }
    }
  }, [addressForm.latitude, addressForm.longitude]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.address.trim()) {
      toast.error('Please enter your full delivery address.');
      return;
    }
    if (!isLocationCovered) {
      toast.error('Cannot save address: Your location is outside our delivery zones.');
      return;
    }
    setSubmittingAddress(true);
    try {
      if (addressToEdit) {
        // Edit mode
        const res = await api.put(`/user-addresses/${addressToEdit.id}`, {
          label: addressForm.label,
          address: addressForm.address,
          latitude: parseFloat(addressForm.latitude),
          longitude: parseFloat(addressForm.longitude),
          isDefault: addressToEdit.isDefault,
        });

        if (res.data?.success) {
          toast.success('Address updated successfully!');
          setShowAddressPrompt(false);
          setAddressToEdit(null);
          fetchUserAddresses();
        }
      } else {
        // Create mode
        const res = await api.post('/user-addresses', {
          label: addressForm.label || 'Home',
          address: addressForm.address,
          latitude: parseFloat(addressForm.latitude),
          longitude: parseFloat(addressForm.longitude),
          isDefault: true,
        });

        if (res.data?.success) {
          toast.success('Primary delivery address configured successfully!');
          setShowAddressPrompt(false);
          fetchUserAddresses();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const useBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setAddressForm(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }));
          reverseGeocode(lat, lng);
          toast.success('Fetched GPS coordinates!');
        },
        () => {
          toast.error('Location permission denied.');
        }
      );
    } else {
      toast.error('Browser does not support geolocation.');
    }
  };

  const handleMapSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    setIsSearchingMap(true);
    setShowSuggestions(false);
    try {
      const results = await searchBangladeshLocations(mapSearchQuery);
      if (results && results.length > 0) {
        handleSelectLocation(results[0]);
      } else {
        toast.error('Location not found in Bangladesh. Try adding street name (e.g. "Road 11, Banani").');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve search query.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md select-none">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight shrink-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-rose-500 bg-clip-text text-transparent">
              BiteSpeed
            </span>
          </Link>

          {/* Delivery Zone / Address Selector Dropdown */}
          <div className="relative mx-4 flex-1 max-w-[240px]">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-xs font-bold text-foreground transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {isAuthenticated && user && user.role === 'CUSTOMER'
                    ? (selectedAddress ? `Deliver to: ${selectedAddress.label}` : 'Select Address')
                    : (selectedZone ? `Deliver to: ${selectedZone.name}` : 'Select Delivery Zone')
                  }
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-lg p-1.5 z-50 animate-fade-in">
                {isAuthenticated && user && user.role === 'CUSTOMER' ? (
                  <>
                    {userAddresses.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-2">No saved addresses</p>
                    ) : (
                      userAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddress(addr);
                            setIsDropdownOpen(false);
                            toast.success(`Delivery address switched to "${addr.label}"`);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 ${
                            selectedAddress?.id === addr.id ? 'text-primary bg-primary/5' : 'text-foreground/80'
                          }`}
                        >
                          <div className="truncate flex-1">
                            <p className="font-bold text-[11px]">{addr.label}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{addr.address}</p>
                          </div>
                          {selectedAddress?.id === addr.id && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </button>
                      ))
                    )}
                    <div className="border-t border-border/40 my-1" />
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsAddressManagerOpen(true);
                      }}
                      className="w-full text-center py-1.5 text-[10px] font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer rounded-lg"
                    >
                      + Manage Addresses
                    </button>
                  </>
                ) : (
                  zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => handleZoneSelect(zone)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-muted/50 transition-colors flex items-center justify-between ${
                        selectedZone?.id === zone.id ? 'text-primary bg-primary/5' : 'text-foreground/80'
                      }`}
                    >
                      <span>{zone.name}</span>
                      {selectedZone?.id === zone.id && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="relative h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
              title="View Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground font-bold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-xs animate-scale-in">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {/* Auth Button Controls */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/orders"
                  className="h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  title="My Orders"
                >
                  <ClipboardList className="h-4.5 w-4.5" />
                </Link>
                <span className="text-xs font-bold text-foreground/80 max-w-[100px] truncate hidden md:inline">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="h-9 w-9 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold px-3" leftIcon={<LogIn className="h-3.5 w-3.5" />}>
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" variant="primary" className="h-8 text-xs font-semibold px-3" leftIcon={<UserPlus className="h-3.5 w-3.5" />}>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>

      {/* Rich Premium Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 pt-16 pb-12 w-full mt-auto select-none">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          
          {/* Top Row: Logo brand & Social media */}
          <div className="flex flex-col sm:flex-row justify-between items-center pb-8 border-b border-slate-900 gap-6">
            <div className="flex items-center gap-2.5 tracking-tight">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-black text-white">
                BiteSpeed <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent text-sm font-semibold tracking-normal ml-1">Online Food Delivery</span>
              </span>
            </div>
            
            {/* Social Links / Developer Portfolios */}
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/rahulroynipon/online_food_delivery_system" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="h-9 w-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/50 transition-all"
                title="GitHub Repository"
              >
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </a>
              <a 
                href="#" 
                className="h-9 w-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/50 transition-all"
                title="Developer Portfolio"
              >
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/><path d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/><path d="M9 6h6"/><path d="M9 12h6"/><path d="M9 18h6"/></svg>
              </a>
            </div>
          </div>

          {/* Bottom Grid: Info, Navigation, System Architecture, & Contributor detail */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-xs leading-relaxed">
            
            {/* Column 1: System Purpose & Core Concepts */}
            <div className="space-y-4">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">Project Scope</span>
              <p className="text-slate-400/80 font-normal leading-relaxed">
                A multi-role online logistics platform providing coordinate-bounded food delivery.
              </p>
              <div className="text-[10px] text-slate-500 font-normal space-y-1">
                <p>• Haversine formula zone validation</p>
                <p>• Role-based authentication controls</p>
              </div>
            </div>

            {/* Column 2: Architecture Stack */}
            <div className="space-y-3.5">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">Platform Stack</span>
              <div className="flex flex-col gap-2 font-normal text-slate-400/85">
                <div>
                  <p className="font-semibold text-slate-300">Frontend</p>
                  <p className="text-[11px] text-slate-500">React, TypeScript, TailwindCSS, Zustand</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Backend</p>
                  <p className="text-[11px] text-slate-500">Node.js, Express, Sequelize ORM</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Database</p>
                  <p className="text-[11px] text-slate-500">PostgreSQL Relational Storage</p>
                </div>
              </div>
            </div>

            {/* Column 3: Site Modules Navigation */}
            <div className="space-y-3.5 flex flex-col">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">System Portals</span>
              <Link to="/admin" className="hover:text-primary transition-colors">Administrator Console</Link>
              <Link to="/restaurant" className="hover:text-primary transition-colors">Restaurant Merchant Panel</Link>
              <Link to="/partner" className="hover:text-primary transition-colors">Become a Delivery Partner</Link>
              <Link to="/restaurants" className="hover:text-primary transition-colors">Customer Browse Hub</Link>
              <Link to="/cart" className="hover:text-primary transition-colors">Active Orders Cart</Link>
            </div>

            {/* Column 4: Credits and Developer details */}
            <div className="space-y-3.5">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">Development Team</span>
              <div className="space-y-2.5 font-normal">
                <p className="text-slate-300 select-all font-semibold">
                  Developer: <span className="text-white font-bold">Rahul Roy</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Developed as a comprehensive project demonstrating secure web application architectures.
                </p>
                <div className="pt-2 border-t border-slate-900 mt-2 text-[10px] text-slate-600">
                  <p>&copy; {new Date().getFullYear()} BiteSpeed. All rights reserved.</p>
                  <p>All system architectures implemented.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* Mandatory Set Address Focus Modal */}
      <Modal open={showAddressPrompt} onClose={() => {}} size="xl" className="!p-0 border border-border bg-card overflow-y-auto md:overflow-hidden max-h-[92vh] md:max-h-[500px]">
        <div className="flex flex-col md:flex-row h-auto md:h-[500px] w-full text-foreground relative">
          
          {/* Close button (only visible if user has saved addresses already) */}
          {userAddresses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowAddressPrompt(false);
                setAddressToEdit(null);
              }}
              className="absolute top-3 right-3 z-[1001] h-8 w-8 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Left Column: Leaflet Map Container */}
          <div className="w-full md:w-1/2 h-[260px] md:h-full relative bg-muted/40 border-r border-border/80 shrink-0 overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '100%' }} />
            
            {/* Top Bar: Search Bar with Autocomplete & Layer Switcher */}
            <div ref={searchContainerRef} className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 bg-card/95 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-md">
                <form onSubmit={handleMapSearchSubmit} className="flex-1 flex items-center gap-1.5 relative">
                  <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search street, road, area in Bangladesh..."
                      value={mapSearchQuery}
                      onChange={handleMapSearchInputChange}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowSuggestions(true);
                      }}
                      className="w-full bg-background border border-border rounded-lg pl-8 pr-7 py-1.5 text-[11px] font-medium text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/60 transition-all"
                    />
                    {isSearchingMap ? (
                      <Loader2 className="absolute right-2.5 h-3.5 w-3.5 text-primary animate-spin pointer-events-none" />
                    ) : mapSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMapSearchQuery('');
                          setSearchResults([]);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[10px] font-bold transition-colors cursor-pointer select-none flex items-center gap-1 shrink-0"
                  >
                    Find
                  </button>
                </form>

                {/* Layer Switcher Button */}
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => switchMapLayer('googleStreets')}
                    title="Google Streets Map"
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeLayer === 'googleStreets'
                        ? 'bg-card text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MapIcon className="h-3 w-3" />
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMapLayer('googleHybrid')}
                    title="Google Satellite Hybrid"
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeLayer === 'googleHybrid'
                        ? 'bg-card text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="h-3 w-3" />
                    Satellite
                  </button>
                </div>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && (
                <div className="w-full max-h-56 overflow-y-auto bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl p-1 animate-fade-in divide-y divide-border/40">
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectLocation(item)}
                        className="w-full text-left p-2 hover:bg-primary/10 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer group"
                      >
                        <div className="mt-0.5 p-1 rounded-md bg-muted group-hover:bg-primary/20 shrink-0">
                          {item.category === 'street' ? (
                            <Navigation className="h-3.5 w-3.5 text-rose-500" />
                          ) : item.category === 'building' ? (
                            <Building2 className="h-3.5 w-3.5 text-amber-500" />
                          ) : item.category === 'neighborhood' ? (
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <MapIcon className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {item.title}
                            </p>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground font-semibold shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[10px] text-muted-foreground">
                      No locations found in Bangladesh. Try searching road number or area.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Status Pill */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-card/95 border border-border/80 rounded-xl px-2.5 py-1.5 text-[10px] text-foreground/80 font-semibold select-none flex items-center gap-1.5 backdrop-blur-xs shadow-sm">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              🇧🇩 Drag pin or click map to select delivery coordinates
            </div>
          </div>

          {/* Right Column: Address Form Options & Status */}
          <div className="w-full md:w-1/2 p-5 md:p-6 flex flex-col justify-between overflow-y-visible md:overflow-y-auto space-y-5 md:space-y-6">
            {/* Header Icon & Intro */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Configure Delivery Address</h3>
                  <p className="text-[10px] text-muted-foreground font-medium leading-normal mt-0.5">
                    Search or pin your coordinates inside active delivery zones to order food.
                  </p>
                </div>
              </div>
            </div>

            {/* Address input form */}
            <form onSubmit={handleAddressSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Address Label Input */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Address Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Home, Office, Apartment 4B"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm(p => ({ ...p, label: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                    required
                  />
                </div>

                {/* Address text details */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center select-none">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Full Address Details</label>
                    <button
                      type="button"
                      onClick={useBrowserLocation}
                      className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      GPS Autofill
                    </button>
                  </div>
                  <textarea
                    placeholder="Drop a pin, click on the map, or use GPS to autofill details..."
                    value={addressForm.address}
                    onChange={(e) => setAddressForm(p => ({ ...p, address: e.target.value }))}
                    required
                    rows={3}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all resize-none"
                  />
                </div>

                {/* Service area check alert badge */}
                <div className="pt-1">
                  {isLocationCovered ? (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center gap-1.5 animate-fade-in select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Location covered by <span className="underline font-black">{matchingZoneName}</span> zone.</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 flex items-center gap-1.5 animate-fade-in select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>Outside Service Area: Choose coordinates inside green zone circles.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save trigger button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full font-bold h-11 text-xs select-none shadow-md"
                disabled={submittingAddress || !isLocationCovered}
              >
                {submittingAddress ? (
                  <span className="flex items-center gap-1 justify-center">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Address...
                  </span>
                ) : (
                  'Set Primary Address'
                )}
              </Button>
            </form>
          </div>

        </div>
      </Modal>

      {/* Address Manager Modal */}
      <Modal open={isAddressManagerOpen} onClose={() => setIsAddressManagerOpen(false)} size="md">
        <Modal.Panel className="border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-primary" />
              Manage Delivery Addresses
            </h3>
            <button
              onClick={() => {
                setAddressToEdit(null);
                setAddressForm({
                  label: '',
                  address: '',
                  latitude: '23.7516',
                  longitude: '90.3786',
                });
                setIsAddressManagerOpen(false);
                setShowAddressPrompt(true);
              }}
              className="text-[10px] bg-primary hover:bg-primary/90 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer border-none"
            >
              + Add Address
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {userAddresses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No addresses found.</p>
            ) : (
              userAddresses.map((addr) => (
                <div key={addr.id} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  addr.isDefault 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border/85 bg-background/50'
                }`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-foreground">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{addr.address}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Make Default */}
                    {!addr.isDefault && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.put(`/user-addresses/${addr.id}`, { isDefault: true });
                            if (res.data?.success) {
                              toast.success('Default address switched.');
                              fetchUserAddresses();
                            }
                          } catch (e) {
                            toast.error('Failed to update default address.');
                          }
                        }}
                        className="text-[9px] font-bold text-primary hover:underline cursor-pointer border-none bg-transparent outline-none"
                        title="Set as Default"
                      >
                        Set Default
                      </button>
                    )}
                    {/* Edit */}
                    <button
                      onClick={() => {
                        setAddressToEdit(addr);
                        setAddressForm({
                          label: addr.label,
                          address: addr.address,
                          latitude: String(addr.latitude),
                          longitude: String(addr.longitude),
                        });
                        setIsAddressManagerOpen(false);
                        setShowAddressPrompt(true);
                      }}
                      className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete "${addr.label}" address?`)) {
                          try {
                            await api.delete(`/user-addresses/${addr.id}`);
                            toast.success('Address deleted.');
                            fetchUserAddresses();
                          } catch (e) {
                            toast.error('Failed to delete address.');
                          }
                        }
                      }}
                      className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-red-500/10 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal.Panel>
      </Modal>
    </div>
  );
}

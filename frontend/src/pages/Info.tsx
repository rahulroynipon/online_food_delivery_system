import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import api from '../lib/axios';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Tabs, 
  Alert,
  Select,
  Modal,
  toast
} from '../design-system';
import { 
  UtensilsCrossed, 
  Store, 
  Bike, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MapPin,
  FileText,
  Navigation,
  Map as MapIcon,
  Loader2,
  Search,
  Building2,
  X
} from 'lucide-react';
import {
  BANGLADESH_BOUNDS,
  DEFAULT_BD_CENTER,
  MAP_LAYERS,
  searchBangladeshLocations,
  reverseGeocodeBangladesh,
  GeoSearchResult
} from '../lib/geo';

interface RestaurantFormValues {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  description: string;
  address: string;
  deliveryZoneId: number | string;
  latitude: number | string;
  longitude: number | string;
}

interface RiderFormValues {
  fullName: string;
  email: string;
  phone: string;
  vehicleType: 'BICYCLE' | 'MOTORBIKE' | 'CAR';
  licenseNumber?: string;
}

export default function Info() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Available delivery zones state
  const [zones, setZones] = useState<{ id: number; name: string }[]>([]);

  // Fetch active delivery zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await api.get('/delivery-zones');
        if (response.data && response.data.deliveryZones) {
          const activeZones = response.data.deliveryZones.filter(
            (z: any) => z.status === 'ACTIVE'
          );
          setZones(activeZones);
        }
      } catch (err) {
        console.error('Failed to fetch delivery zones:', err);
      }
    };
    fetchZones();
  }, []);

  // Forms
  const {
    register: registerRestaurant,
    handleSubmit: handleRestaurantSubmit,
    formState: { errors: restaurantErrors },
    reset: resetRestaurant,
    control: controlRestaurant,
    setValue: setValueRestaurant,
    watch: watchRestaurant
  } = useForm<RestaurantFormValues>({
    defaultValues: {
      deliveryZoneId: '',
      address: '',
      latitude: '',
      longitude: ''
    }
  });

  const {
    register: registerRider,
    handleSubmit: handleRiderSubmit,
    formState: { errors: riderErrors },
    reset: resetRider,
    watch: watchRider,
    control: controlRider
  } = useForm<RiderFormValues>({
    defaultValues: {
      vehicleType: 'MOTORBIKE'
    },
    shouldUnregister: true
  });

  const selectedVehicle = watchRider('vehicleType');

  // Location detection and Map modal state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const searchTimeoutRef = React.useRef<any>(null);
  const searchBoxRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const zoneCircleRef = React.useRef<any>(null);

  const selectedZoneId = watchRestaurant('deliveryZoneId');
  const selectedZone = zones.find(z => String(z.id) === String(selectedZoneId));

  const handleMoveMapToZone = () => {
    const currentZoneId = watchRestaurant('deliveryZoneId');
    const currentZone = zones.find(z => String(z.id) === String(currentZoneId));

    if (!currentZone || !currentZone.latitude || !currentZone.longitude) {
      toast.error('Please select a Primary Delivery Zone first.');
      return;
    }

    const zoneLat = parseFloat(String(currentZone.latitude));
    const zoneLng = parseFloat(String(currentZone.longitude));

    if (mapRef.current) {
      if (zoneCircleRef.current) {
        mapRef.current.fitBounds(zoneCircleRef.current.getBounds(), { padding: [30, 30], animate: true });
      } else {
        mapRef.current.flyTo([zoneLat, zoneLng], 15, { animate: true });
      }
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([zoneLat, zoneLng]);
    }

    setSelectedLatLng({ lat: zoneLat, lng: zoneLng });
    setIsGeocoding(true);
    reverseGeocodeBangladesh(zoneLat, zoneLng)
      .then(res => {
        if (res && res.shortAddress) {
          setTempAddress(res.shortAddress);
        }
      })
      .catch((err) => console.error('Reverse geocode error:', err))
      .finally(() => setIsGeocoding(false));

    toast.success(`Map centered to ${currentZone.name} delivery zone`);
  };

  const initMap = async () => {
    setIsMapLoading(true);
    try {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Leaflet load failed'));
          document.body.appendChild(script);
        });
      }

      let startLat = DEFAULT_BD_CENTER[0];
      let startLng = DEFAULT_BD_CENTER[1];

      const currentZoneId = watchRestaurant('deliveryZoneId');
      const currentZone = zones.find(z => String(z.id) === String(currentZoneId));

      if (selectedLatLng) {
        startLat = selectedLatLng.lat;
        startLng = selectedLatLng.lng;
      } else if (currentZone && currentZone.latitude && currentZone.longitude) {
        startLat = parseFloat((currentZone as any).latitude);
        startLng = parseFloat((currentZone as any).longitude);
      }

      setTimeout(() => {
        const L = (window as any).L;
        if (!L) return;

        if (mapRef.current) {
          mapRef.current.remove();
        }

        const bangladeshBounds = L.latLngBounds(BANGLADESH_BOUNDS[0], BANGLADESH_BOUNDS[1]);
        const mapInstance = L.map('leaflet-map-container', {
          maxBounds: bangladeshBounds,
          maxBoundsViscosity: 1.0,
          minZoom: 7,
          maxZoom: 20
        }).setView([startLat, startLng], 14);
        mapRef.current = mapInstance;

        L.tileLayer(MAP_LAYERS.googleStreets.url, {
          attribution: MAP_LAYERS.googleStreets.attribution,
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(mapInstance);

        // Draw Selected Zone geofence if present
        if (currentZone && (currentZone as any).latitude && (currentZone as any).longitude && (currentZone as any).radiusKm) {
          const zoneLat = parseFloat((currentZone as any).latitude);
          const zoneLng = parseFloat((currentZone as any).longitude);
          const zoneRadius = parseFloat((currentZone as any).radiusKm);

          const zoneCircle = L.circle([zoneLat, zoneLng], {
            color: '#d70f64',
            fillColor: '#d70f64',
            fillOpacity: 0.08,
            radius: zoneRadius * 1000,
            weight: 2,
            dashArray: '6, 6'
          }).addTo(mapInstance);
          zoneCircleRef.current = zoneCircle;

          // Center and fit view to the zone if selecting location first time
          if (!selectedLatLng) {
            mapInstance.fitBounds(zoneCircle.getBounds(), { padding: [20, 20] });
          }
        } else {
          zoneCircleRef.current = null;
        }

        const markerInstance = L.marker([startLat, startLng], { draggable: true }).addTo(mapInstance);
        markerRef.current = markerInstance;

        const updateCoords = async (lat: number, lng: number) => {
          setSelectedLatLng({ lat, lng });
          setIsGeocoding(true);
          try {
            const res = await reverseGeocodeBangladesh(lat, lng);
            if (res && res.shortAddress) {
              setTempAddress(res.shortAddress);
            }
          } catch (err) {
            console.error('Error reverse geocoding coordinates:', err);
          } finally {
            setIsGeocoding(false);
          }
        };

        if (!tempAddress && !selectedLatLng) {
          updateCoords(startLat, startLng);
        }

        mapInstance.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          markerInstance.setLatLng([lat, lng]);
          updateCoords(lat, lng);
        });

        markerInstance.on('dragend', () => {
          const { lat, lng } = markerInstance.getLatLng();
          updateCoords(lat, lng);
        });

        setIsMapLoading(false);
      }, 300);

    } catch (err) {
      console.error('Failed to load map:', err);
      toast.error('Failed to load interactive map. Please try again.');
      setIsMapLoading(false);
    }
  };

  const handleOpenMap = () => {
    setIsMapModalOpen(true);
    initMap();
  };

  const handleCloseMap = () => {
    setIsMapModalOpen(false);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markerRef.current = null;
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 2) {
      setIsSearchingLocation(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchBangladeshLocations(val);
          setSearchResults(results);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearchingLocation(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearchingLocation(false);
    }
  };

  const handleSelectSearchResult = (item: GeoSearchResult) => {
    setSelectedLatLng({ lat: item.lat, lng: item.lng });
    setTempAddress(item.displayName || `${item.title}, ${item.subtitle}`);

    if (mapRef.current) {
      const zoom = item.category === 'street' || item.category === 'building' ? 17 : 15;
      mapRef.current.setView([item.lat, item.lng], zoom);
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([item.lat, item.lng]);
    }
    setSearchQuery(item.title);
    setShowSuggestions(false);
    toast.success(`Location set: ${item.title}`);
  };

  const handleMapSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingLocation(true);
    setShowSuggestions(false);
    try {
      const results = await searchBangladeshLocations(searchQuery);
      if (results && results.length > 0) {
        handleSelectSearchResult(results[0]);
      } else {
        toast.error('Location not found in Bangladesh. Try searching road name (e.g. "Road 11, Banani").');
      }
    } catch (err) {
      console.error('Map search error:', err);
      toast.error('Failed to search location. Please try again.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLatLng({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setValueRestaurant('address', data.display_name, { shouldValidate: true });
            setValueRestaurant('latitude', latitude, { shouldValidate: true });
            setValueRestaurant('longitude', longitude, { shouldValidate: true });
            setTempAddress(data.display_name);
            toast.success('Location auto-detected successfully!');
          } else {
            toast.error('Failed to resolve coordinates to an address.');
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setValueRestaurant('address', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, { shouldValidate: true });
          setValueRestaurant('latitude', latitude, { shouldValidate: true });
          setValueRestaurant('longitude', longitude, { shouldValidate: true });
          toast.info('Coordinates set as address.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('Unable to retrieve location. Please enable location access in your browser.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onRestaurantSubmit = async (data: RestaurantFormValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      // Ensure phone contains prefix +88
      const formattedPhone = data.phone.startsWith('+88') ? data.phone : `+88${data.phone}`;
      
      // Cast deliveryZoneId to integer
      const payload = {
        ...data,
        phone: formattedPhone,
        deliveryZoneId: parseInt(data.deliveryZoneId as string, 10)
      };
      await api.post('/onboarding/restaurant', payload);
      setIsSubmitted(true);
      resetRestaurant();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit application. Please check your inputs.';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRiderSubmit = async (data: RiderFormValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      // Ensure phone contains prefix +88
      const formattedPhone = data.phone.startsWith('+88') ? data.phone : `+88${data.phone}`;
      
      const payload = {
        ...data,
        phone: formattedPhone
      };
      await api.post('/onboarding/rider', payload);
      setIsSubmitted(true);
      resetRider();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit application. Please check your inputs.';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-primary/10 via-background to-background px-4 relative overflow-hidden">
        {/* Glow decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <Card className="w-full max-w-md text-center p-8 backdrop-blur-md bg-card/60 border-border/80 shadow-2xl rounded-2xl animate-fade-in relative z-10">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Application Received!</CardTitle>
          <CardDescription className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Thank you for applying to join the BiteSpeed network. Our onboarding operations team will review your application details and get in touch with you via email or phone within 2-3 business days.
          </CardDescription>
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="primary" fullWidth onClick={() => setIsSubmitted(false)}>
              Apply Again
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate('/login')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial from-primary/5 via-background to-background text-foreground select-none relative overflow-hidden">
      {/* Glow decorative background elements */}
      <div className="absolute top-1/4 left-[-100px] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-4000" />
      <div className="absolute bottom-1/4 right-[-100px] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse duration-6000" />

      {/* Top Navigation */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/login')}>
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              BiteSpeed
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/login')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Side: Business Pitch & Benefits */}
        <div className="lg:col-span-5 space-y-8 animate-fade-in">
          <div>
            <span className="inline-flex items-center text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 border border-primary/20 animate-pulse">
              Onboarding Program 2026
            </span>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-none bg-linear-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Partner with <span className="text-primary">BiteSpeed</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              We connect local businesses and riders to thousands of hungry customers in real-time. Join the ecosystem designed for speed, growth, and flexibility.
            </p>
          </div>

          {/* Premium Feature Benefit Cards */}
          <div className="grid grid-cols-1 gap-4">
            {/* Benefit Card 1 */}
            <div className="p-5 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-md hover:bg-card/50 hover:border-border/80 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">Boost Business Revenue</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Restaurants partnering with BiteSpeed increase overall delivery orders and average ticket size by up to 35%.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefit Card 2 */}
            <div className="p-5 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-md hover:bg-card/50 hover:border-border/80 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="font-extrabold text-xl leading-none select-none">৳</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">Flexible Earnings for Riders</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Riders choose their own hours, complete deliveries at competitive rates, and keep 100% of customer tips.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefit Card 3 */}
            <div className="p-5 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-md hover:bg-card/50 hover:border-border/80 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">Fast Onboarding Verification</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Our signup verification process is fast. Complete your details and get approved to operate within 48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Form Application */}
        <div className="lg:col-span-7">
          <Card className="shadow-2xl rounded-2xl bg-card/45 backdrop-blur-md border-border/60 overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-muted/15 pb-6">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">Partner & Driver Onboarding</CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground">Select your partner type below and complete the application details</CardDescription>

              {/* Tabs list switcher */}
              <div className="mt-5">
                <Tabs value={activeTab} onValueChange={setActiveTab} variant="pill" rounded="full">
                  <Tabs.List className="bg-muted/80 p-1 w-full max-w-sm border border-border/30 shadow-inner">
                    <Tabs.Trigger value="restaurant" icon={<Store className="h-4 w-4" />} className="flex-1 font-semibold text-sm">
                      Restaurant
                    </Tabs.Trigger>
                    <Tabs.Trigger value="rider" icon={<Bike className="h-4 w-4" />} className="flex-1 font-semibold text-sm">
                      Delivery Rider
                    </Tabs.Trigger>
                  </Tabs.List>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Submission Error Banner */}
              {submissionError && (
                <Alert 
                  severity="error" 
                  title="Submission Error" 
                  className="rounded-2xl mb-6 animate-fade-in shadow-md shadow-danger/5"
                >
                  {submissionError}
                </Alert>
              )}

              {/* Tab 1: Restaurant Onboarding Form */}
              {activeTab === 'restaurant' && (
                <form onSubmit={handleRestaurantSubmit(onRestaurantSubmit)} className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Restaurant Name"
                      placeholder="e.g. Burger Palace"
                      error={restaurantErrors.restaurantName?.message}
                      {...registerRestaurant('restaurantName', { required: 'Restaurant name is required' })}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <Input
                      label="Owner / Contact Person"
                      placeholder="e.g. John Doe"
                      error={restaurantErrors.ownerName?.message}
                      {...registerRestaurant('ownerName', { required: 'Owner name is required' })}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Contact Email"
                      type="email"
                      placeholder="e.g. contact@burgerpalace.com"
                      error={restaurantErrors.email?.message}
                      {...registerRestaurant('email', { 
                        required: 'Email address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address'
                        }
                      })}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <Input
                      label="Contact Phone"
                      prefix="+88"
                      placeholder="01700000000"
                      error={restaurantErrors.phone?.message}
                      {...registerRestaurant('phone', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^01[3-9]\d{8}$/,
                          message: 'Phone number must be an 11-digit mobile number starting with 01'
                        }
                      })}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  <Input
                    label="Description / About Restaurant"
                    placeholder="e.g. Authentic hand-tossed Neapolitan pizzas and Italian pasta"
                    error={restaurantErrors.description?.message}
                    {...registerRestaurant('description', { required: 'Description is required' })}
                    disabled={isSubmitting}
                    className="w-full"
                    leftIcon={<FileText className="h-4 w-4" />}
                  />

                  <div className="w-full">
                    <Controller
                      name="deliveryZoneId"
                      control={controlRestaurant}
                      rules={{ required: 'Delivery zone is required' }}
                      render={({ field }) => (
                        <Select
                          label="Primary Delivery Zone"
                          required
                          placeholder="Select a Delivery Zone"
                          options={zones.map(zone => ({
                            value: String(zone.id),
                            label: zone.name
                          }))}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(val) => field.onChange(val)}
                          error={restaurantErrors.deliveryZoneId?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-sm font-medium text-foreground flex items-center gap-0.5 select-none">
                      Business Location Address
                      <span className="font-bold text-[var(--color-danger)]">*</span>
                    </label>

                    {/* Display card */}
                    <div className="flex flex-col justify-center p-4 rounded-xl border border-border/40 bg-card/65 shadow-xs transition-all relative overflow-hidden min-h-[105px]">
                      {watchRestaurant('address') ? (
                        <div className="space-y-2.5 animate-fade-in">
                          <div className="flex items-start gap-2.5">
                            <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground leading-relaxed">
                                {watchRestaurant('address')}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase tracking-wider">
                                Lat: {Number(watchRestaurant('latitude')).toFixed(6)} | Lng: {Number(watchRestaurant('longitude')).toFixed(6)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                            <Button 
                              type="button" 
                              size="xs" 
                              variant="outline" 
                              onClick={handleOpenMap}
                              leftIcon={<MapIcon className="h-3.5 w-3.5" />}
                            >
                              Change Location
                            </Button>
                            {selectedZone && (
                              <Button 
                                type="button" 
                                size="xs" 
                                variant="outline" 
                                onClick={() => {
                                  handleOpenMap();
                                  setTimeout(() => handleMoveMapToZone(), 350);
                                }}
                                leftIcon={<Navigation className="h-3.5 w-3.5 text-primary" />}
                                className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold"
                              >
                                Move to {selectedZone.name} Zone
                              </Button>
                            )}
                            <Button 
                              type="button" 
                              size="xs" 
                              variant="ghost" 
                              onClick={handleAutoDetectLocation}
                              loading={isDetectingLocation}
                              leftIcon={<Navigation className="h-3.5 w-3.5" />}
                            >
                              Auto-Detect
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-2 animate-fade-in">
                          <p className="text-xs text-muted-foreground mb-3 font-medium">
                            No location selected. Please select from map or auto-detect.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              onClick={handleOpenMap}
                              leftIcon={<MapIcon className="h-4 w-4" />}
                              className="shadow-sm"
                            >
                              Select on Map
                            </Button>
                            {selectedZone && (
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  handleOpenMap();
                                  setTimeout(() => handleMoveMapToZone(), 350);
                                }}
                                leftIcon={<Navigation className="h-4 w-4 text-primary" />}
                                className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold shadow-sm"
                              >
                                Move to {selectedZone.name} Zone
                              </Button>
                            )}
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost" 
                              onClick={handleAutoDetectLocation}
                              loading={isDetectingLocation}
                              leftIcon={<Navigation className="h-4 w-4" />}
                            >
                              Auto-Detect
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Coordinates Validation Errors */}
                    {(restaurantErrors.address?.message || restaurantErrors.latitude?.message || restaurantErrors.longitude?.message) && (
                      <p className="text-xs font-medium text-[var(--color-danger)] mt-1">
                        {restaurantErrors.address?.message || restaurantErrors.latitude?.message || restaurantErrors.longitude?.message}
                      </p>
                    )}

                    {/* Hidden registers for form control */}
                    <input type="hidden" {...registerRestaurant('address', { required: 'Please select a location on the map' })} />
                    <input type="hidden" {...registerRestaurant('latitude', { required: 'Please select a location on the map' })} />
                    <input type="hidden" {...registerRestaurant('longitude', { required: 'Please select a location on the map' })} />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={isSubmitting}
                    leftIcon={<Store className="h-4 w-4" />}
                    className="mt-4 py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Submit Restaurant Partner Application
                  </Button>
                </form>
              )}

              {/* Tab 2: Rider Onboarding Form */}
              {activeTab === 'rider' && (
                <form onSubmit={handleRiderSubmit(onRiderSubmit)} className="space-y-5 animate-fade-in">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Alex Rider"
                    error={riderErrors.fullName?.message}
                    {...registerRider('fullName', { required: 'Full name is required' })}
                    disabled={isSubmitting}
                    className="w-full"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="e.g. alex@rider.com"
                      error={riderErrors.email?.message}
                      {...registerRider('email', { 
                        required: 'Email address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address'
                        }
                      })}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <Input
                      label="Phone Number"
                      prefix="+88"
                      placeholder="01700000000"
                      error={riderErrors.phone?.message}
                      {...registerRider('phone', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^01[3-9]\d{8}$/,
                          message: 'Phone number must be an 11-digit mobile number starting with 01'
                        }
                      })}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Vehicle Type Selection using custom Select */}
                    <div className="w-full">
                      <Controller
                        name="vehicleType"
                        control={controlRider}
                        rules={{ required: 'Vehicle type is required' }}
                        render={({ field }) => (
                          <Select
                            label="Vehicle Type"
                            required
                            placeholder="Select Vehicle Type"
                            options={[
                              { value: 'BICYCLE', label: 'Bicycle' },
                              { value: 'MOTORBIKE', label: 'Motorcycle / Scooter' },
                              { value: 'CAR', label: 'Car' }
                            ]}
                            value={field.value}
                            onValueChange={(val) => field.onChange(val)}
                            error={riderErrors.vehicleType?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </div>

                    {/* Driver License field - required for Motorbike and Car */}
                    <div className="w-full min-h-[76px]">
                      {selectedVehicle !== 'BICYCLE' && (
                        <Input
                          label="Driver License Number"
                          placeholder="e.g. DL-99887766"
                          error={riderErrors.licenseNumber?.message}
                          {...registerRider('licenseNumber', {
                            validate: (value) => {
                              if (!value) {
                                return 'License number is required for motor vehicles';
                              }
                              return true;
                            }
                          })}
                          disabled={isSubmitting}
                          className="w-full animate-fade-in"
                        />
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={isSubmitting}
                    leftIcon={<Bike className="h-4 w-4" />}
                    className="mt-4 py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Submit Delivery Rider Application
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Modal open={isMapModalOpen} onClose={handleCloseMap} size='lg'  title="Select Business Location">
        <Modal.Content className="space-y-4 ">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground leading-relaxed">
              Click on the map, drag the pin, or search for your address to select your restaurant's exact location.
            </div>
            {selectedZone && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={handleMoveMapToZone}
                leftIcon={<Navigation className="h-3.5 w-3.5 text-primary" />}
                className="shrink-0 font-bold bg-primary/5 border-primary/25 hover:bg-primary/15 text-primary"
              >
                Focus {selectedZone.name} Zone
              </Button>
            )}
          </div>
          
          <div ref={searchBoxRef} className="relative flex flex-col gap-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search street, road, area in Bangladesh..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleMapSearch();
                    }
                  }}
                  disabled={isMapLoading}
                  className="w-full"
                  leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleMapSearch}
                disabled={isMapLoading || isSearchingLocation || !searchQuery.trim()}
                loading={isSearchingLocation}
                className="px-5 shrink-0"
                leftIcon={<Search className="h-4 w-4" />}
              >
                Search
              </Button>
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-[48px] left-0 right-0 z-50 max-h-48 overflow-y-auto bg-card border border-border shadow-xl rounded-xl p-1 divide-y divide-border/40 animate-fade-in">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left p-2 hover:bg-primary/10 rounded-lg transition-colors flex items-start gap-2 cursor-pointer group"
                    >
                      <div className="mt-0.5 p-1 rounded-md bg-muted group-hover:bg-primary/20 shrink-0">
                        {item.category === 'street' ? (
                          <Navigation className="h-3 w-3 text-rose-500" />
                        ) : item.category === 'building' ? (
                          <Building2 className="h-3 w-3 text-amber-500" />
                        ) : item.category === 'neighborhood' ? (
                          <MapPin className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <MapIcon className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate group-hover:text-primary">
                            {item.title}
                          </p>
                          <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
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
                  <div className="p-2 text-center text-[10px] text-muted-foreground">
                    No locations found in Bangladesh.
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="relative">
            <div 
              id="leaflet-map-container" 
              className="h-[320px] w-full rounded-2xl border border-border/60 shadow-inner z-10 bg-muted/20"
            />
            {selectedZone && (
              <button
                type="button"
                onClick={handleMoveMapToZone}
                title={`Center map to ${selectedZone.name} delivery zone`}
                className="absolute bottom-3 right-3 z-[1000] px-3 py-1.5 rounded-xl bg-card/95 hover:bg-card border border-border shadow-lg text-xs font-bold text-primary flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <Navigation className="h-3.5 w-3.5 text-primary" />
                <span>Focus {selectedZone.name} Zone</span>
              </button>
            )}
            {isMapLoading && (
              <div className="absolute inset-0 bg-card/60 backdrop-blur-xs flex items-center justify-center z-20 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Loading interactive map...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Selected Address</span>
              {isGeocoding && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            </div>
            <p className="text-xs font-medium text-foreground min-h-[36px] leading-relaxed">
              {tempAddress || 'Locating target location...'}
            </p>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="ghost" onClick={handleCloseMap} disabled={isMapLoading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setValueRestaurant('address', tempAddress, { shouldValidate: true });
              if (selectedLatLng) {
                setValueRestaurant('latitude', selectedLatLng.lat, { shouldValidate: true });
                setValueRestaurant('longitude', selectedLatLng.lng, { shouldValidate: true });
              }
              handleCloseMap();
            }}
            disabled={isMapLoading || isGeocoding || !tempAddress}
          >
            Confirm Location
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

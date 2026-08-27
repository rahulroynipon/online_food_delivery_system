import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Button, toast, Badge, Modal, DataTable, Avatar, Input, Select, type DataTableColumn } from '../../design-system';
import { 
  MapPin, 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Info,
  Map,
  Compass,
  Navigation
} from 'lucide-react';
import api from '../../lib/axios';

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    status: 'ACTIVE',
    latitude: '',
    longitude: '',
    radiusKm: '5.0'
  });

  // Modal Map Search State
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [isSearchingMapLocation, setIsSearchingMapLocation] = useState(false);

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<any>(null);

  const handleModalMapSearch = async () => {
    if (!modalSearchQuery.trim()) return;
    setIsSearchingMapLocation(true);
    try {
      const response = await api.get('/delivery-zones/geocode', {
        params: { q: modalSearchQuery }
      });
      const data = response.data?.results;
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        setForm(prev => ({
          ...prev,
          latitude: String(latitude.toFixed(6)),
          longitude: String(longitude.toFixed(6))
        }));

        if (modalMarkerRef.current) {
          modalMarkerRef.current.setLatLng([latitude, longitude]);
        }
        if (modalCircleRef.current) {
          modalCircleRef.current.setLatLng([latitude, longitude]);
        }
        if (modalMapRef.current && modalCircleRef.current) {
          modalMapRef.current.fitBounds(modalCircleRef.current.getBounds());
        }
        toast.success('Location found on map!');
      } else {
        toast.error('Location not found. Try a different search query.');
      }
    } catch (err) {
      console.error('Map search error:', err);
      toast.error('Failed to search location.');
    } finally {
      setIsSearchingMapLocation(false);
    }
  };

  // Map Refs
  const mainMapRef = useRef<any>(null);
  const mainMapContainerRef = useRef<HTMLDivElement>(null);
  const modalMapRef = useRef<any>(null);
  const modalMarkerRef = useRef<any>(null);
  const modalCircleRef = useRef<any>(null);

  // Load Leaflet Asset Libraries
  useEffect(() => {
    if ((window as any).L) {
      setIsLeafletLoaded(true);
    }
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const response = await api.get('/delivery-zones');
      if (response.data?.success) {
        setZones(response.data.deliveryZones || []);
      }
    } catch {
      toast.error('Failed to load delivery zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Sync main map display
  useEffect(() => {
    if (!isLeafletLoaded || !mainMapContainerRef.current || zones.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    // Destroy existing map instance to re-initialize cleanly
    if (mainMapRef.current) {
      mainMapRef.current.remove();
      mainMapRef.current = null;
    }

    const defaultLat = 23.8103;
    const defaultLng = 90.4125;
    
    // Find average lat/lng or default to Dhaka center
    const activeZonesWithCoords = zones.filter(z => z.status === 'ACTIVE' && z.latitude && z.longitude);
    const startLat = activeZonesWithCoords.length > 0
      ? activeZonesWithCoords.reduce((acc, curr) => acc + parseFloat(curr.latitude), 0) / activeZonesWithCoords.length
      : defaultLat;
    const startLng = activeZonesWithCoords.length > 0
      ? activeZonesWithCoords.reduce((acc, curr) => acc + parseFloat(curr.longitude), 0) / activeZonesWithCoords.length
      : defaultLng;

    const bangladeshBounds = L.latLngBounds([20.3, 87.8], [26.8, 92.8]);
    const mapInstance = L.map(mainMapContainerRef.current, {
      maxBounds: bangladeshBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 8
    }).setView([startLat, startLng], 12);
    mainMapRef.current = mapInstance;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Plot circles for all active zones
    const circleLayers: any[] = [];
    zones.forEach(zone => {
      if (zone.latitude && zone.longitude) {
        const isActive = zone.status === 'ACTIVE';
        const color = isActive ? '#d70f64' : '#64748b'; // Brand primary or Slate
        const circle = L.circle([parseFloat(zone.latitude), parseFloat(zone.longitude)], {
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          radius: parseFloat(zone.radiusKm || 5.0) * 1000 // Convert km to meters
        }).addTo(mapInstance);

        circle.bindPopup(`
          <div style="font-family: sans-serif; padding: 2px;">
            <p style="margin: 0; font-weight: bold; font-size: 13px; color: #1e293b;">${zone.name}</p>
            <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">
              Radius: ${zone.radiusKm || 5.0} km &bull; Status: ${zone.status}
            </p>
          </div>
        `);
        circleLayers.push(circle);
      }
    });

    // Fit map bounds to show all plotted circles
    if (circleLayers.length > 0) {
      const group = L.featureGroup(circleLayers);
      mapInstance.fitBounds(group.getBounds(), { padding: [20, 20] });
    }

    // Force Leaflet recalculation
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 200);

    return () => {
      if (mainMapRef.current) {
        mainMapRef.current.remove();
        mainMapRef.current = null;
      }
    };
  }, [isLeafletLoaded, zones]);

  const handleOpenAdd = () => {
    setModalMode('ADD');
    setSelectedZone(null);
    setForm({
      name: '',
      status: 'ACTIVE',
      latitude: '23.8103',
      longitude: '90.4125',
      radiusKm: '5.0'
    });
    setModalSearchQuery('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone: any) => {
    setModalMode('EDIT');
    setSelectedZone(zone);
    setForm({
      name: zone.name || '',
      status: zone.status || 'ACTIVE',
      latitude: zone.latitude ? String(zone.latitude) : '23.8103',
      longitude: zone.longitude ? String(zone.longitude) : '90.4125',
      radiusKm: zone.radiusKm ? String(zone.radiusKm) : '5.0'
    });
    setModalSearchQuery('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');

    try {
      const payload = {
        name: form.name,
        status: form.status,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        radiusKm: form.radiusKm ? parseFloat(form.radiusKm) : null,
      };

      if (modalMode === 'ADD') {
        const response = await api.post('/delivery-zones', payload);
        if (response.data?.success) {
          toast.success('Delivery zone created successfully!');
          setIsModalOpen(false);
          fetchZones();
        }
      } else {
        const response = await api.put(`/delivery-zones/${selectedZone.slug}`, payload);
        if (response.data?.success) {
          toast.success('Delivery zone updated successfully!');
          setIsModalOpen(false);
          fetchZones();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save delivery zone.');
    } finally {
      setActionLoading(null);
    }
  };

  // Modal Map initialization
  useEffect(() => {
    if (!isModalOpen || !isLeafletLoaded) return;
    
    // Small timeout to allow the modal element to mount completely in the DOM
    const timer = setTimeout(() => {
      const L = (window as any).L;
      const mapEl = document.getElementById('modal-map-container');
      if (!L || !mapEl) return;

      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
      }

      const startLat = parseFloat(form.latitude) || 23.8103;
      const startLng = parseFloat(form.longitude) || 90.4125;
      const startRadius = parseFloat(form.radiusKm) || 5.0;

      const bangladeshBounds = L.latLngBounds([20.3, 87.8], [26.8, 92.8]);
      const mapInstance = L.map(mapEl, {
        maxBounds: bangladeshBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 8
      }).setView([startLat, startLng], 12);
      modalMapRef.current = mapInstance;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      // Marker
      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(mapInstance);
      modalMarkerRef.current = marker;

      // Circle representing radius
      const circle = L.circle([startLat, startLng], {
        color: '#d70f64', // brand primary
        fillColor: '#d70f64',
        fillOpacity: 0.15,
        radius: startRadius * 1000 // Convert km to meters
      }).addTo(mapInstance);
      modalCircleRef.current = circle;

      // Update function
      const updateCoords = (lat: number, lng: number) => {
        setForm(prev => ({
          ...prev,
          latitude: String(lat.toFixed(6)),
          longitude: String(lng.toFixed(6))
        }));
        circle.setLatLng([lat, lng]);
      };

      marker.on('drag', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        updateCoords(lat, lng);
      });

      mapInstance.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateCoords(lat, lng);
      });

    }, 300);

    return () => {
      clearTimeout(timer);
      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
      }
      modalMarkerRef.current = null;
      modalCircleRef.current = null;
    };
  }, [isModalOpen, isLeafletLoaded]);

  const handleRadiusChange = (val: string) => {
    setForm(prev => ({ ...prev, radiusKm: val }));
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && modalCircleRef.current) {
      modalCircleRef.current.setRadius(parsed * 1000);
    }
  };

  const handleLatitudeChange = (val: string) => {
    setForm(prev => ({ ...prev, latitude: val }));
    const lat = parseFloat(val);
    const lng = parseFloat(form.longitude);
    if (!isNaN(lat) && !isNaN(lng) && modalMarkerRef.current && modalCircleRef.current) {
      modalMarkerRef.current.setLatLng([lat, lng]);
      modalCircleRef.current.setLatLng([lat, lng]);
      if (modalMapRef.current) {
        modalMapRef.current.panTo([lat, lng]);
      }
    }
  };

  const handleLongitudeChange = (val: string) => {
    setForm(prev => ({ ...prev, longitude: val }));
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(val);
    if (!isNaN(lat) && !isNaN(lng) && modalMarkerRef.current && modalCircleRef.current) {
      modalMarkerRef.current.setLatLng([lat, lng]);
      modalCircleRef.current.setLatLng([lat, lng]);
      if (modalMapRef.current) {
        modalMapRef.current.panTo([lat, lng]);
      }
    }
  };

  const handleOpenDelete = (zone: any) => {
    setZoneToDelete(zone);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return;

    setActionLoading(`delete-${zoneToDelete.slug}`);
    try {
      const response = await api.delete(`/delivery-zones/${zoneToDelete.slug}`);
      if (response.data?.success) {
        toast.success('Delivery zone deleted successfully.');
        setIsDeleteModalOpen(false);
        fetchZones();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete delivery zone.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="soft" color="success" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="soft" color="neutral" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Inactive</Badge>;
      default:
        return <Badge variant="soft" color="neutral" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">{status}</Badge>;
    }
  };

  // Filter & Search Logic
  const filteredZones = zones.filter((z) => {
    const matchesStatus = statusFilter === 'ALL' || z.status === statusFilter;
    const matchesSearch = z.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          z.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns: DataTableColumn<any>[] = [
    {
      id: 'zone',
      label: 'Delivery Zone',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src="" 
            alt={row.name} 
            fallback={<Map size={14} />} 
            size="md"
          />
          <div>
            <p className="font-extrabold text-sm text-foreground">{row.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
              slug: {row.slug}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'coordinates',
      label: 'Center Coordinates',
      cell: ({ row }) => row.latitude && row.longitude ? (
        <div className="text-xs font-medium font-mono text-muted-foreground">
          {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">Not set</span>
      )
    },
    {
      id: 'radius',
      label: 'Coverage Radius',
      cell: ({ row }) => row.radiusKm ? (
        <Badge variant="soft" color="primary" className="font-bold text-[10px] tracking-wide uppercase px-2 py-0.5">
          {row.radiusKm} km
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">Not set</span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      cell: ({ row }) => getStatusBadge(row.status)
    },
    {
      id: 'date',
      label: 'Created Date',
      cell: ({ row }) => new Date(row.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    },
    {
      id: 'actions',
      label: '',
      align: 'right' as const,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenEdit(row)}
            leftIcon={<Edit size={12} />}
            className="font-semibold border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenDelete(row)}
            leftIcon={<Trash2 size={12} />}
            className="font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Delivery Zones</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage regional boundaries and active delivery coverage areas.</p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus size={16} />}
          className="font-bold w-fit shadow-xs bg-primary text-white hover:bg-primary/95"
        >
          Add Zone
        </Button>
      </div>

      {/* Global Interactive Zones Map */}
      <Card className="border border-border/40 shadow-xs bg-card overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={mainMapContainerRef} 
            className="h-[300px] w-full z-10 bg-muted/20 relative"
          >
            {!isLeafletLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/85 z-20 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-semibold">Initializing interactive map...</span>
              </div>
            )}
            {isLeafletLoaded && zones.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/85 z-20 p-4">
                <Compass className="h-8 w-8 text-muted-foreground/45 mb-2" />
                <p className="text-xs font-bold text-foreground">No Active Zones Configured</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Created zones with geocoding coords will show up here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/40 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
            const count = status === 'ALL' 
              ? zones.length 
              : zones.filter(z => z.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-card text-foreground shadow-xs font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search zone name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/20 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all text-foreground"
          />
        </div>
      </div>

      {/* Table Container */}
      <Card className="border border-border/40 shadow-xs bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Loading zones...</span>
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="text-center py-20">
              <Map className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No zones found</h4>
              <p className="text-xs text-muted-foreground mt-1">There are no coverage zones matching the filters.</p>
            </div>
          ) : (
            <DataTable
              data={filteredZones}
              columns={columns}
              pagination={false}
              searchable={false}
              toolbar={null}
            />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
          <Modal.Header 
            title={modalMode === 'ADD' ? 'Add Delivery Zone' : 'Edit Zone Details'} 
            description={modalMode === 'ADD' ? 'Establish a new regional boundary for store delivery coverage.' : 'Modify coverage zone name and active status.'}
          />
          <form onSubmit={handleSubmit}>
            <Modal.Content className="space-y-4">
              <Input
                label="Zone Name"
                required
                placeholder="e.g. Uttara Zone, Banani & Gulshan"
                leftIcon={<MapPin size={15} className="text-muted-foreground" />}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Center Latitude"
                  required
                  placeholder="e.g. 23.8103"
                  leftIcon={<Navigation size={14} className="text-muted-foreground" />}
                  value={form.latitude}
                  onChange={(e) => handleLatitudeChange(e.target.value)}
                />
                <Input
                  label="Center Longitude"
                  required
                  placeholder="e.g. 90.4125"
                  leftIcon={<Navigation size={14} className="text-muted-foreground" />}
                  value={form.longitude}
                  onChange={(e) => handleLongitudeChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <Input
                  label="Coverage Radius (KM)"
                  required
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  leftIcon={<Compass size={14} className="text-muted-foreground" />}
                  value={form.radiusKm}
                  onChange={(e) => handleRadiusChange(e.target.value)}
                />
                
                <Select
                  label="Status"
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                  options={[
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'INACTIVE', label: 'INACTIVE' }
                  ]}
                />
              </div>

              {/* Modal Geocoding Map Container */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label="Search Map Location"
                      placeholder="e.g. Banani, Dhaka"
                      leftIcon={<Search size={14} className="text-muted-foreground" />}
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleModalMapSearch}
                    loading={isSearchingMapLocation}
                    className="h-9 shrink-0"
                  >
                    Locate
                  </Button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">Zone Geofence Map</label>
                  <div 
                    id="modal-map-container" 
                    className="h-[200px] w-full rounded-xl border border-border/40 overflow-hidden z-10"
                  >
                    {!isLeafletLoaded && (
                      <div className="h-full flex items-center justify-center bg-muted/10 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-[10px] text-muted-foreground font-semibold">Loading map assets...</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                  Drag the marker or click on the map to define the zone center point. Use the radius input above to adjust coverage size.
                </p>
              </div>
            </Modal.Content>
            
            <Modal.Footer>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Info size={12} />
                  <span>Zones serve as boundary filters for stores and rider operations.</span>
                </div>
                <div className="flex gap-2.5">
                  <Button
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="font-semibold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs shadow-xs"
                    loading={actionLoading === 'submit'}
                    disabled={actionLoading !== null}
                  >
                    {modalMode === 'ADD' ? 'Create Zone' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {zoneToDelete && (
        <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
          <Modal.Header 
            title="Delete Delivery Zone" 
            description="Are you sure you want to delete this zone? It will immediately stop onboarding under this region."
          />
          <Modal.Content>
            <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
              <Avatar 
                src="" 
                alt={zoneToDelete.name} 
                fallback={<Map size={14} />} 
                size="md"
              />
              <div>
                <p className="font-extrabold text-sm text-foreground">{zoneToDelete.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">slug: {zoneToDelete.slug}</p>
              </div>
            </div>
          </Modal.Content>
          <Modal.Footer>
            <div className="flex gap-2.5 justify-end w-full">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                className="font-semibold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs border-transparent shadow-xs"
                loading={actionLoading === `delete-${zoneToDelete.slug}`}
                disabled={actionLoading !== null}
                onClick={handleConfirmDelete}
              >
                Delete Zone
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

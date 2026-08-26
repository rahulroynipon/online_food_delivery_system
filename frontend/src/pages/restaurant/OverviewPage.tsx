import React, { useState, useEffect } from 'react';
import { Card, CardContent, toast } from '../../design-system';
import { ClipboardList, Activity, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

export default function OverviewPage() {
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Local active food and orders counts for dashboard metrics
  const [activeFoodsCount, setActiveFoodsCount] = useState(3);
  const [ordersCount, setOrdersCount] = useState(4);

  // Fetch restaurant profile details
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/onboarding/my-restaurant');
      if (response.data?.success) {
        setRestaurantProfile(response.data.restaurant);
      }
    } catch {
      toast.error('Could not retrieve merchant store profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Overview Dashboard</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Manage store details, coordinates, and view metrics.</p>
      </div>

      {/* Status Banner */}
      {restaurantProfile && restaurantProfile.status !== 'ACTIVE' && (
        <div className="flex gap-3.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold">Store Application Pending Verification</p>
            <p className="mt-1 leading-normal opacity-85">
              Your restaurant application is currently under verification. Our onboarding team is reviewing your address, zone boundary, and merchant contacts. You can configure your menu items and test order workflows below.
            </p>
          </div>
        </div>
      )}

      {/* Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border border-border/40 shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Today's Orders</p>
              <p className="text-2xl font-black text-foreground mt-1.5">{ordersCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ClipboardList size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Active Foods</p>
              <p className="text-2xl font-black text-foreground mt-1.5">{activeFoodsCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Activity size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Today's Revenue</p>
              <p className="text-2xl font-black text-foreground mt-1.5">$50.44</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <DollarSign size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details Card */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-xs text-muted-foreground font-semibold">Fetching store details...</span>
        </div>
      ) : restaurantProfile ? (
        <Card className="border border-border/40 shadow-xs bg-card">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-border/10 pb-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl font-bold">
                {restaurantProfile.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{restaurantProfile.name}</h3>
                <p className="text-xs text-muted-foreground italic mt-0.5">{restaurantProfile.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Business Address</p>
                <p className="text-foreground text-xs mt-1 leading-relaxed">{restaurantProfile.address || 'N/A'}</p>
              </div>

              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Store Owner</p>
                <p className="text-foreground text-xs mt-1">{restaurantProfile.user?.name || 'N/A'}</p>
              </div>

              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Contact Credentials</p>
                <p className="text-foreground text-xs mt-1 font-bold">{restaurantProfile.user?.email}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">{restaurantProfile.user?.phone}</p>
              </div>

              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Delivery Zone coordinates</p>
                <p className="text-foreground text-xs mt-1 font-mono">
                  Lat: {Number(restaurantProfile.latitude).toFixed(6)}
                </p>
                <p className="text-foreground text-xs font-mono">
                  Lng: {Number(restaurantProfile.longitude).toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

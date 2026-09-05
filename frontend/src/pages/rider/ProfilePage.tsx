import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Avatar, toast } from '../../design-system';
import { 
  Bike, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Star, 
  Award, 
  CheckCircle2, 
  Loader2,
  Calendar,
  Layers,
  MapPin,
  RefreshCw
} from 'lucide-react';
import api from '../../lib/axios';

export default function RiderProfilePage() {
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/onboarding/my-rider');
      if (res.data?.success) {
        setRider(res.data.rider);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await api.put('/onboarding/my-rider/toggle-availability');
      if (res.data?.success) {
        setRider((prev: any) => prev ? { ...prev, isAvailable: res.data.isAvailable } : prev);
        toast.success(res.data.message);
      }
    } catch {
      toast.error('Failed to toggle availability status.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-semibold">Loading rider profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Rider Profile & Vehicle</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your rider account credentials, vehicle information, and availability status.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchProfile}
          leftIcon={<RefreshCw size={13} />}
          className="font-bold text-xs"
        >
          Refresh Profile
        </Button>
      </div>

      {/* Main Profile Card */}
      <Card className="border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20">
              {rider?.user?.name ? rider.user.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-foreground">{rider?.user?.name || 'Rider'}</h3>
                <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2 py-0.5">
                  Verified Rider
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Mail size={12} /> {rider?.user?.email || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={rider?.isAvailable ? 'primary' : 'outline'}
              onClick={handleToggleAvailability}
              disabled={toggling}
              className={`font-bold text-xs ${rider?.isAvailable ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              {toggling ? <Loader2 size={13} className="animate-spin" /> : rider?.isAvailable ? '🟢 Online & Available' : '⚪ Offline'}
            </Button>
          </div>
        </div>

        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Vehicle & Operational Info */}
          <div className="space-y-4">
            <span className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-2">
              <Bike size={15} /> Vehicle Information
            </span>

            <div className="space-y-3 text-xs bg-muted/20 p-4 rounded-2xl border border-border/50">
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">Vehicle Type</span>
                <span className="font-extrabold text-foreground uppercase">{rider?.vehicleType || 'MOTORBIKE'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">License Plate / ID</span>
                <span className="font-mono font-bold text-foreground">{rider?.licenseNumber || 'Verified ID'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-semibold">Rider Rating</span>
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <Star size={13} fill="currentColor" /> {Number(rider?.rating || 5.0).toFixed(1)} / 5.0
                </span>
              </div>
            </div>
          </div>

          {/* Account & Contact Details */}
          <div className="space-y-4">
            <span className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-2">
              <ShieldCheck size={15} /> Account Verification
            </span>

            <div className="space-y-3 text-xs bg-muted/20 p-4 rounded-2xl border border-border/50">
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">Phone Number</span>
                <span className="font-bold text-foreground">{rider?.user?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">Account Status</span>
                <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2 py-0.5">
                  {rider?.user?.status || 'ACTIVE'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-semibold">Joined BiteSpeed</span>
                <span className="font-medium text-foreground">
                  {rider?.createdAt ? new Date(rider.createdAt).toLocaleDateString() : 'Active Member'}
                </span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}

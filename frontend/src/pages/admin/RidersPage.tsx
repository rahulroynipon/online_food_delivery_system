import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, toast } from '../../design-system';
import { Bike, Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/axios';

export default function RidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/onboarding/applications');
      if (response.data?.success) {
        setRiders(response.data.riders || []);
      }
    } catch {
      toast.error('Failed to load rider applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.post(`/onboarding/applications/rider/${id}/approve`);
      toast.success('Rider application approved!');
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve rider.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(`reject-${id}`);
    try {
      await api.post(`/onboarding/applications/rider/${id}/reject`);
      toast.info('Rider application rejected.');
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject rider.');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = riders.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Rider Onboarding</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Manage new delivery rider applications and registration requests.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-semibold text-muted-foreground">Loading applications...</span>
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl bg-muted/5">
          <Bike className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-foreground">No Pending Rider Applications</h4>
          <p className="text-xs text-muted-foreground mt-1">Newly submitted rider partner applications will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pending.map((app) => (
            <Card key={app.id} className="border border-border/50 shadow-sm bg-card flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/10">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="font-extrabold text-base text-foreground">{app.user?.name}</CardTitle>
                    <span className="inline-flex items-center text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wide mt-1.5">
                      Pending Review
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Contact Details</p>
                  <p className="text-foreground font-semibold">{app.user?.email}</p>
                  <p className="text-muted-foreground">{app.user?.phone}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-xl border border-border/30">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Vehicle Type</p>
                    <p className="text-foreground font-semibold capitalize mt-0.5">{app.vehicleType?.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">License Number</p>
                    <p className="text-foreground font-mono mt-0.5">{app.vehicleNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-3 border-t border-border/10">
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                    loading={actionLoading === `approve-${app.id}`}
                    disabled={actionLoading !== null}
                    onClick={() => handleApprove(app.id)}
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                  >Approve</Button>
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
                    loading={actionLoading === `reject-${app.id}`}
                    disabled={actionLoading !== null}
                    onClick={() => handleReject(app.id)}
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

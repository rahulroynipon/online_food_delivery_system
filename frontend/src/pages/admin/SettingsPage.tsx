import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent } from '../../design-system';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Admin Profile & Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Manage administrative credentials and security role.</p>
      </div>

      <Card className="border-border/50 shadow-sm max-w-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-border/10 pb-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{user?.name}</h3>
              <p className="text-xs text-muted-foreground">Security Role: {user?.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email Address</p>
              <p className="text-foreground text-xs mt-1 truncate">{user?.email}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone Number</p>
              <p className="text-foreground text-xs mt-1">{(user as any)?.phone || 'N/A'}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Account Status</p>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 mt-1">
                {(user as any)?.status}
              </span>
            </div>
            <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin Portal Access</p>
              <p className="text-foreground text-xs mt-1">Granted (Full Access)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

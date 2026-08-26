import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../design-system';
import { ArrowUpRight, ClipboardList, TrendingUp, DollarSign, Store, Wallet } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Dashboard Overview</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time performance index and core platform metrics.</p>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Orders</span>
              <h3 className="text-3xl font-black text-foreground mt-1">1,250</h3>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
                <ArrowUpRight size={12} className="mr-0.5" /> +12% this week
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ClipboardList size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Revenue</span>
              <h3 className="text-3xl font-black text-foreground mt-1">৳85,000</h3>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
                <ArrowUpRight size={12} className="mr-0.5" /> +8.4% monthly
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <TrendingUp size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Commission</span>
              <h3 className="text-3xl font-black text-foreground mt-1">৳12,750</h3>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
                <ArrowUpRight size={12} className="mr-0.5" /> 15% Platform Cut
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <DollarSign size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Restaurant Payable</span>
              <h3 className="text-2xl font-black text-foreground mt-1">৳60,000</h3>
              <p className="text-[10px] text-muted-foreground mt-2">Net payout waiting next settlement batch</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <Store size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Rider Earnings</span>
              <h3 className="text-2xl font-black text-foreground mt-1">৳10,000</h3>
              <p className="text-[10px] text-muted-foreground mt-2">Aggregated rider delivery fee payouts</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Wallet size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/10">
          <CardTitle className="text-base font-bold">Recent Orders</CardTitle>
          <CardDescription>Listing last active platform order actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/10">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-medium text-foreground">
                <tr className="hover:bg-muted/15 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary">#1024</td>
                  <td className="px-6 py-4">Kacchi Bhai</td>
                  <td className="px-6 py-4">৳560</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Delivered</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/15 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary">#1023</td>
                  <td className="px-6 py-4">Burger Express</td>
                  <td className="px-6 py-4">৳420</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">Preparing</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/15 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary">#1022</td>
                  <td className="px-6 py-4">Chillox Banani</td>
                  <td className="px-6 py-4">৳750</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full">On Way</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

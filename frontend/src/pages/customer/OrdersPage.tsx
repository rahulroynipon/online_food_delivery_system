import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import { Card, CardContent, Button } from '../../design-system';
import { ShoppingBag, ArrowRight, Calendar, Store, Clock, RefreshCw, AlertCircle, Loader2, Star } from 'lucide-react';
import api from '../../lib/axios';

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/customer');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CustomerOrdersPage mounted, fetching orders...');
    fetchOrders();
  }, []);

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in select-none">
        
        {/* Title Header */}
        <div className="flex justify-between items-center pb-2 border-b border-border/10">
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">Your Orders</h1>
            <p className="text-xs text-muted-foreground mt-0.5">View your active delivery status and past order histories.</p>
          </div>
          <button 
            onClick={fetchOrders} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[10px] font-bold text-foreground cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border/40 rounded-3xl space-y-4">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-foreground">No orders placed yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Explore menus and order your favorite foods to see them here.</p>
            </div>
            <Button onClick={() => navigate('/restaurants')} variant="primary" size="sm">
              Browse Restaurants
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const dateStr = new Date(order.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <Card key={order.id} className="border border-border/40 hover:border-primary/20 transition-all shadow-xs">
                  <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    
                    {/* Left: Info */}
                    <div className="space-y-2.5 min-w-0 flex-1">
                      
                      {/* Top: Restaurant & Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded-md">
                          Order #{order.id}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'DELIVERED' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : order.status === 'CANCELLED'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-amber-500/10 text-amber-500 animate-pulse'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Store detail */}
                      <div className="flex items-center gap-2 text-sm font-black text-foreground">
                        <Store className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="truncate">{order.restaurant?.name}</h3>
                      </div>

                      {/* Billing items description */}
                      <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed truncate max-w-md">
                        {order.items?.map((item: any) => `${item.quantity}× ${item.foodName}`).join(', ')}
                      </p>

                      {/* Date & Time */}
                      <div className="flex gap-4 text-[10px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {timeStr}
                        </span>
                      </div>

                    </div>

                    {/* Right: Price & Tracking CTA */}
                    <div className="flex md:flex-col justify-between items-center md:items-end w-full md:w-auto gap-2.5 shrink-0 pt-3 md:pt-0 border-t border-border/10 md:border-none">
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Bill</p>
                        <p className="text-base font-extrabold text-primary mt-0.5">৳{parseFloat(order.total).toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === 'DELIVERED' && (
                          <Button
                            onClick={() => navigate(`/order-tracking?id=${order.id}`)}
                            variant="secondary"
                            size="xs"
                            leftIcon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                            className="font-bold py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/20 cursor-pointer"
                          >
                            Rate & Review
                          </Button>
                        )}
                        <Button
                          onClick={() => navigate(`/order-tracking?id=${order.id}`)}
                          variant={order.status === 'DELIVERED' || order.status === 'CANCELLED' ? 'outline' : 'primary'}
                          size="xs"
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                          className="font-bold py-1.5 px-3.5 cursor-pointer"
                        >
                          {order.status === 'DELIVERED' || order.status === 'CANCELLED' ? 'Details' : 'Track'}
                        </Button>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </CustomerLayout>
  );
}

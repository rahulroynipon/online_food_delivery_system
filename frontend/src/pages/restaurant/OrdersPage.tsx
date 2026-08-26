import React, { useState } from 'react';
import { Card, CardContent, Button, Badge, toast } from '../../design-system';
import { ClipboardList, CheckCircle2 } from 'lucide-react';

export default function OrdersPage() {
  // Mock Orders state
  const [orders, setOrders] = useState<any[]>([
    { id: 101, customerName: 'Nipon Roy', items: '2x Double Cheese Beef Burger, 1x Premium Chocolate Shake', total: 22.97, status: 'PENDING', date: new Date().toLocaleTimeString() },
    { id: 102, customerName: 'Fahim Ahmed', items: '1x Pepperoni Supreme Pizza', total: 12.49, status: 'PREPARING', date: new Date().toLocaleTimeString() },
    { id: 103, customerName: 'Nabil Hasan', items: '1x Crispy Chicken Wings (8pcs)', total: 7.99, status: 'READY', date: new Date().toLocaleTimeString() },
    { id: 104, customerName: 'Tasnim Jahan', items: '1x Double Cheese Beef Burger, 1x Crispy Chicken Wings', total: 16.98, status: 'DELIVERED', date: new Date().toLocaleTimeString() }
  ]);

  const handleUpdateOrderStatus = (orderId: number, nextStatus: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        toast.info(`Order #${orderId} marked as ${nextStatus}`);
        return { ...o, status: nextStatus };
      }
      return o;
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Incoming Orders</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Manage live orders, preparation progress and handoffs.</p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              <ClipboardList size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs font-semibold">No active orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order: any) => (
            <Card key={order.id} className="border border-border/40 shadow-xs bg-card">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-foreground">Order #{order.id}</span>
                    <span className="text-[10px] text-muted-foreground">{order.date}</span>
                    <Badge
                      variant="soft"
                      color={
                        order.status === 'PENDING' ? 'warning' :
                        order.status === 'PREPARING' ? 'primary' :
                        order.status === 'READY' ? 'success' : 'neutral'
                      }
                      className="font-bold text-[9px] px-2 py-0.5"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-extrabold text-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">{order.items}</p>
                  <p className="text-xs font-black text-foreground">Total payout: ${Number(order.total).toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {order.status === 'PENDING' && (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs font-semibold border-transparent"
                    >
                      Accept & Prepare
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold border-transparent"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <CheckCircle2 size={14} />
                      <span>Waiting for delivery rider...</span>
                    </div>
                  )}
                  {order.status === 'DELIVERED' && (
                    <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">Settled</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

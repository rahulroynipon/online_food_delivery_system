import React, { useState } from 'react';
import { Card, CardContent, Button, Badge, DataTable, Select, Input, Modal, toast } from '../../design-system';
import { Plus, Power, UtensilsCrossed } from 'lucide-react';

export default function MenuPage() {
  // Mock Menu Foods state
  const [foods, setFoods] = useState<any[]>([
    { id: 1, name: 'Double Cheese Beef Burger', description: 'Two flame-grilled beef patties, cheddar slices, special burger sauce, pickles, fresh buns.', price: 8.99, status: 'ACTIVE', category: 'Burgers' },
    { id: 2, name: 'Pepperoni Supreme Pizza', description: 'Authentic sourdough pizza base, marinara sauce, loaded pepperoni, mozzarella cheese, dried oregano.', price: 12.49, status: 'ACTIVE', category: 'Pizza' },
    { id: 3, name: 'Crispy Chicken Wings (8pcs)', description: 'Jumbo chicken wings coated in hot buffalo sauce, served with celery sticks and ranch dip.', price: 7.99, status: 'ACTIVE', category: 'Appetizers' },
    { id: 4, name: 'Premium Chocolate Shake', description: 'Rich chocolate ice cream milkshake topped with whipped cream, cocoa dust, and chocolate drizzle.', price: 4.99, status: 'INACTIVE', category: 'Beverages' }
  ]);

  // Modal State for menu item
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Burgers',
    status: 'ACTIVE'
  });

  const handleToggleFoodStatus = (id: number) => {
    setFoods(prev => prev.map(f => {
      if (f.id === id) {
        const nextStatus = f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        toast.success(`Successfully set ${f.name} as ${nextStatus}`);
        return { ...f, status: nextStatus };
      }
      return f;
    }));
  };

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.price) {
      toast.error('Please enter name and price.');
      return;
    }
    const newFood = {
      id: Date.now(),
      name: foodForm.name,
      description: foodForm.description,
      price: parseFloat(foodForm.price),
      category: foodForm.category,
      status: foodForm.status
    };
    setFoods(prev => [newFood, ...prev]);
    setIsFoodModalOpen(false);
    toast.success(`${foodForm.name} added to your menu successfully!`);
    setFoodForm({ name: '', description: '', price: '', category: 'Burgers', status: 'ACTIVE' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Store Menu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage food dishes, descriptions, prices and storefront visibility.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsFoodModalOpen(true)}
          leftIcon={<Plus size={16} />}
          className="font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
        >
          Add Food Item
        </Button>
      </div>

      {/* Foods List Table */}
      <Card className="border border-border/40 shadow-xs bg-card">
        <CardContent className="p-0">
          <DataTable
            data={foods}
            pagination={false}
            searchable={false}
            toolbar={null}
            columns={[
              {
                id: 'dish',
                label: 'Dish / Item Name',
                cell: ({ row }: { row: any }) => (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <UtensilsCrossed size={14} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-foreground">{row.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic max-w-sm">{row.description || 'No description'}</p>
                    </div>
                  </div>
                )
              },
              {
                id: 'category',
                label: 'Category',
                cell: ({ row }: { row: any }) => (
                  <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">
                    {row.category}
                  </Badge>
                )
              },
              {
                id: 'price',
                label: 'Base Price',
                cell: ({ row }: { row: any }) => (
                  <span className="font-bold text-foreground">${Number(row.price).toFixed(2)}</span>
                )
              },
              {
                id: 'status',
                label: 'Status',
                cell: ({ row }: { row: any }) => (
                  row.status === 'ACTIVE'
                    ? <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2 py-0.5">Active</Badge>
                    : <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">Hidden</Badge>
                )
              },
              {
                id: 'actions',
                label: '',
                align: 'right' as const,
                cell: ({ row }: { row: any }) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleToggleFoodStatus(row.id)}
                      leftIcon={<Power size={12} />}
                      className={`font-semibold ${
                        row.status === 'ACTIVE'
                          ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white'
                          : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {row.status === 'ACTIVE' ? 'Hide' : 'Activate'}
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* Add Food Modal */}
      {isFoodModalOpen && (
        <Modal open={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)} size="md">
          <Modal.Header
            title="Add Food Item"
            description="Create a new dish entry on your store storefront menu."
          />
          <form onSubmit={handleAddFood}>
            <Modal.Content className="space-y-4">
              <Input
                label="Item Name"
                required
                placeholder="e.g. Garlic Parmesan Wings"
                value={foodForm.name}
                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
              />
              <Input
                label="Price ($ USD)"
                required
                type="number"
                step="0.01"
                placeholder="e.g. 9.99"
                value={foodForm.price}
                onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
              />
              <Select
                label="Category"
                value={foodForm.category}
                onValueChange={(val) => setFoodForm({ ...foodForm, category: val })}
                options={[
                  { value: 'Burgers', label: 'Burgers' },
                  { value: 'Pizza', label: 'Pizza' },
                  { value: 'Appetizers', label: 'Appetizers' },
                  { value: 'Beverages', label: 'Beverages' }
                ]}
              />
              <Input
                label="Description"
                placeholder="Describe the ingredients and preparation details..."
                value={foodForm.description}
                onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
              />
            </Modal.Content>
            <Modal.Footer>
              <div className="flex gap-2 justify-end w-full">
                <Button variant="ghost" size="sm" onClick={() => setIsFoodModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
                  Add to Menu
                </Button>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}
    </div>
  );
}

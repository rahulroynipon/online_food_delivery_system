import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge, DataTable, Modal, toast } from '../../design-system';
import { Plus, Edit, Trash2, Loader2, UtensilsCrossed, Power } from 'lucide-react';
import api from '../../lib/axios';

export default function MenuPage() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // States for delete action
  const [deleteTargetFood, setDeleteTargetFood] = useState<any | null>(null);
  const [foodsStatusFilter, setFoodsStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL || 'http://localhost:5005/api/v1';
    return `${base}/${imagePath}`;
  };

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const response = await api.get('/foods');
      if (response.data?.success) {
        setFoods(response.data.foods || []);
      }
    } catch {
      toast.error('Could not retrieve store menu items.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFoodStatus = async (food: any) => {
    const nextStatus = food.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await api.put(`/foods/${food.id}/status`);
      if (response.data?.success) {
        toast.success(`Successfully set ${food.name} storefront status to ${nextStatus}.`);
        fetchFoods();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle storefront status.');
    }
  };

  const handleDeleteFood = async () => {
    if (!deleteTargetFood) return;
    try {
      const response = await api.delete(`/foods/${deleteTargetFood.id}`);
      if (response.data?.success) {
        toast.success('Food item deleted from menu successfully.');
        fetchFoods();
        setDeleteTargetFood(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete food item.');
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Store Menu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage food dishes, descriptions, prices and storefront visibility.</p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/restaurant/menu/create')}
          leftIcon={<Plus size={16} />}
          className="font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent"
        >
          Add Food Item
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading menu items...</span>
        </div>
      ) : (
        <>
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
              const count = status === 'ALL'
                ? foods.length
                : foods.filter((f: any) => f.status === status).length;
              const isSelected = foodsStatusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setFoodsStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Foods List Table */}
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardContent className="p-0">
              <DataTable
                data={foodsStatusFilter === 'ALL' ? foods : foods.filter((f: any) => f.status === foodsStatusFilter)}
                pagination={false}
                searchable={false}
                toolbar={null}
                columns={[
                  {
                    id: 'dish',
                    label: 'Dish / Item Name',
                    cell: ({ row }: { row: any }) => (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                          {row.image ? (
                            <img src={getImageUrl(row.image)} alt={row.name} className="h-full w-full object-cover" />
                          ) : (
                            <UtensilsCrossed size={14} className="text-muted-foreground" />
                          )}
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
                    label: 'Category Mapping',
                    cell: ({ row }: { row: any }) => (
                      <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">
                        {row.restaurantCategory?.name || 'Uncategorized'}
                      </Badge>
                    )
                  },
                  {
                    id: 'price',
                    label: 'Pricing & Variants',
                    cell: ({ row }: { row: any }) => (
                      <div className="space-y-1 py-1">
                        {row.variants && row.variants.length > 0 ? (
                          <>
                            {row.variants.slice(0, 2).map((v: any) => (
                              <div key={v.id} className="text-[11px] leading-tight">
                                <span className="font-semibold text-muted-foreground">{v.name}:</span>{' '}
                                <span className="font-extrabold text-foreground">৳{Number(v.price).toFixed(2)}</span>
                              </div>
                            ))}
                            {row.variants.length > 2 && (
                              <div className="text-[9px] font-bold text-muted-foreground mt-0.5 italic">
                                +{row.variants.length - 2} more options
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-rose-500 font-semibold italic">No variants configured</span>
                        )}
                      </div>
                    )
                  },
                  {
                    id: 'addons',
                    label: 'Add-ons / Extras',
                    cell: ({ row }: { row: any }) => (
                      <div className="flex flex-wrap gap-1 py-1 max-w-[200px]">
                        {row.addons && row.addons.length > 0 ? (
                          <>
                            {row.addons.slice(0, 3).map((a: any) => (
                              <Badge key={a.id} variant="soft" color="primary" className="text-[8px] px-1.5 py-px font-semibold uppercase">
                                +{a.name}
                              </Badge>
                            ))}
                            {row.addons.length > 3 && (
                              <Badge variant="soft" color="neutral" className="text-[8px] px-1.5 py-px font-semibold uppercase">
                                +{row.addons.length - 3} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">None</span>
                        )}
                      </div>
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
                          variant={row.status === 'ACTIVE' ? 'tertiary' : 'primary'}
                          onClick={() => handleToggleFoodStatus(row)}
                          leftIcon={<Power size={12} />}
                          className="font-semibold"
                        >
                          {row.status === 'ACTIVE' ? 'Hide' : 'Activate'}
                        </Button>
                        <Button
                          size="xs"
                          variant="tertiary"
                          onClick={() => navigate(`/restaurant/menu/edit/${row.slug}`)}
                          leftIcon={<Edit size={12} />}
                          className="font-semibold"
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="danger-soft"
                          onClick={() => setDeleteTargetFood(row)}
                          leftIcon={<Trash2 size={12} />}
                          className="font-semibold"
                        >
                          Delete
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Confirm Delete Modal */}
      {deleteTargetFood && (
        <Modal open={!!deleteTargetFood} onClose={() => setDeleteTargetFood(null)} size="sm">
          <Modal.Header
            title="Confirm Deletion"
            description={`Are you absolutely sure you want to permanently delete "${deleteTargetFood.name}"? This action is irreversible.`}
          />
          <Modal.Footer>
            <div className="flex gap-2 justify-end w-full">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTargetFood(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteFood}
                className="bg-rose-500 hover:bg-rose-600 text-white shadow-xs border-transparent"
              >
                Delete Item
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

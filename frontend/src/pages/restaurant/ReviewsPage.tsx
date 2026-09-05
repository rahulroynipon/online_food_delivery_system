import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../../design-system';
import { Star, Utensils, MessageSquare, Sparkles, RefreshCw, Loader2, ThumbsUp, Filter, Calendar } from 'lucide-react';
import api from '../../lib/axios';

export default function RestaurantReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalReviews: number;
    averageRating: number;
    ratingBreakdown: Record<number, number>;
    popularTags: Array<{ tag: string; count: number }>;
  } | null>(null);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/my-restaurant');
      if (res.data?.success) {
        setStats(res.data.stats);
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load merchant reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = starFilter
    ? reviews.filter((r) => r.foodRating === starFilter)
    : reviews;

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/10">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Customer Food Reviews</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real customer feedback and star ratings submitted after order deliveries.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviews}
          className="font-bold text-xs"
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Reviews
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Loading customer reviews...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Average Rating Card */}
            <Card className="border border-border/50 bg-gradient-to-br from-amber-500/10 via-card to-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Average Rating</span>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-foreground">
                      {stats?.averageRating ? stats.averageRating.toFixed(1) : '5.0'}
                    </h3>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    From {stats?.totalReviews || 0} reviews
                  </p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Sparkles size={20} />
                </div>
              </CardContent>
            </Card>

            {/* Total Reviews */}
            <Card className="border border-border/50 bg-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Feedback</span>
                  <h3 className="text-2xl font-black text-foreground">{stats?.totalReviews || 0}</h3>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <ThumbsUp size={11} /> Verified customer ratings
                  </p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <MessageSquare size={20} />
                </div>
              </CardContent>
            </Card>

            {/* 5-Star Count */}
            <Card className="border border-border/50 bg-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">5-Star Ratings</span>
                  <h3 className="text-2xl font-black text-foreground">{stats?.ratingBreakdown[5] || 0}</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Exceptional ratings</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Star size={20} className="fill-current" />
                </div>
              </CardContent>
            </Card>

            {/* Quality Compliments */}
            <Card className="border border-border/50 bg-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Top Compliment</span>
                  <h3 className="text-sm font-extrabold text-foreground truncate max-w-[140px]">
                    {stats?.popularTags[0]?.tag || 'Delicious Taste'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {stats?.popularTags[0]?.count || 0} customer mentions
                  </p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Utensils size={20} />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Popular Compliments Tags Row */}
          {stats?.popularTags && stats.popularTags.length > 0 && (
            <Card className="border border-border/40 p-5 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Customer Compliment Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.popularTags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    {tag}
                    <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-full font-black">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Star Filter Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-2">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            <button
              onClick={() => setStarFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                starFilter === null
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Reviews ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setStarFilter(starFilter === s ? null : s)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  starFilter === s
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{s}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                <span>({stats?.ratingBreakdown[s] || 0})</span>
              </button>
            ))}
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <Card className="p-12 text-center bg-card/40 border border-dashed border-border/60 rounded-3xl space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Star className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-foreground">No customer reviews match criteria</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Customer ratings will appear here as soon as orders are delivered and reviewed.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => (
                <Card key={rev.id} className="border border-border/40 hover:border-primary/20 transition-all shadow-xs">
                  <CardContent className="p-5 space-y-3.5">
                    
                    {/* Header: Customer & Stars */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm shadow-xs">
                          {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-foreground">{rev.user?.name || 'Verified Customer'}</h4>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(rev.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} • Order #{rev.orderId}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= rev.foodRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-muted/20 text-muted-foreground/20'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 ml-1">
                          {rev.foodRating}.0 / 5.0
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items summary */}
                    {rev.order?.items && rev.order.items.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/20 text-[11px] text-muted-foreground font-semibold flex items-center gap-2">
                        <Utensils className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                          <strong className="text-foreground">Customer Ordered: </strong>
                          {rev.order.items.map((it: any) => `${it.quantity}× ${it.foodName}`).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Compliment tags */}
                    {rev.foodTags && rev.foodTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {rev.foodTags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Written comment */}
                    {rev.foodReview && (
                      <p className="text-xs text-foreground/90 font-medium italic bg-card p-3 rounded-xl border border-border/30 leading-relaxed">
                        "{rev.foodReview}"
                      </p>
                    )}

                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}

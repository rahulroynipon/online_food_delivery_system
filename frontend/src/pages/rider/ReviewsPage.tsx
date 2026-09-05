import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../../design-system';
import { Star, Bike, MessageSquare, Sparkles, RefreshCw, Loader2, ThumbsUp, Filter, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../../lib/axios';

export default function RiderReviewsPage() {
  const navigate = useNavigate();
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
      const res = await api.get('/reviews/my-rider');
      if (res.data?.success) {
        setStats(res.data.stats);
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load rider reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = starFilter
    ? reviews.filter((r) => r.riderRating === starFilter)
    : reviews;

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/10">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Customer Delivery Reviews</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customer ratings, delivery compliments, and feedback received after completed dropoffs.
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
          <p className="text-xs text-muted-foreground font-semibold">Loading delivery reviews...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Average Rating Card */}
            <Card className="border border-border/50 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Rider Rating</span>
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
            <Card className="border border-border/50 bg-card shadow-xs">
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
            <Card className="border border-border/50 bg-card shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">5-Star Trips</span>
                  <h3 className="text-2xl font-black text-foreground">{stats?.ratingBreakdown[5] || 0}</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Exceptional deliveries</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Star size={20} className="fill-current" />
                </div>
              </CardContent>
            </Card>

            {/* Top Courier Compliment */}
            <Card className="border border-border/50 bg-card shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Top Compliment</span>
                  <h3 className="text-sm font-extrabold text-foreground truncate max-w-[140px]">
                    {stats?.popularTags[0]?.tag || 'Super Fast Delivery'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {stats?.popularTags[0]?.count || 0} customer mentions
                  </p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Bike size={20} />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Popular Compliments Tags Row */}
          {stats?.popularTags && stats.popularTags.length > 0 && (
            <Card className="border border-border/50 p-5 space-y-2.5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                Customer Badges & Compliments
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {stats.popularTags.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20"
                  >
                    <span>{item.tag}</span>
                    <span className="h-4 min-w-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.count}
                    </span>
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-muted-foreground mr-1" />
              <button
                onClick={() => setStarFilter(null)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  starFilter === null
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Reviews ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  onClick={() => setStarFilter(starFilter === s ? null : s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    starFilter === s
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{s}</span>
                  <Star size={11} className="fill-current" />
                  <span className="text-[10px] opacity-80">({stats?.ratingBreakdown[s] || 0})</span>
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </span>
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-border/60">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground">No Reviews Found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {starFilter
                  ? `No ${starFilter}-star reviews found. Try clearing your rating filter.`
                  : 'You have not received any customer reviews yet. Complete more delivery trips to start earning feedback!'}
              </p>
              {starFilter && (
                <Button variant="outline" size="sm" onClick={() => setStarFilter(null)} className="mt-4 font-bold text-xs">
                  Clear Star Filter
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredReviews.map((rev) => (
                <Card key={rev.id} className="border border-border/50 hover:border-primary/30 transition-all shadow-xs">
                  <CardContent className="p-5 space-y-3">
                    
                    {/* Top Row: Customer info, Rating, Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm flex items-center justify-center shrink-0">
                          {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-foreground">
                              {rev.user?.name || 'Customer'}
                            </h4>
                            {rev.order?.id && (
                              <button
                                onClick={() => navigate(`/rider/history/${rev.order.id}`)}
                                className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                              >
                                Order #{rev.order.id}
                              </button>
                            )}
                          </div>
                          {rev.order?.deliveryAddressText && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-sm mt-0.5">
                              {rev.order.deliveryAddressText.split(', Lat/Lng:')[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stars & Date */}
                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={
                                s <= rev.riderRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-slate-100 text-slate-200'
                              }
                            />
                          ))}
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 ml-1">
                            {rev.riderRating}.0
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Compliment Tags */}
                    {rev.riderTags && rev.riderTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rev.riderTags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Review Text */}
                    {rev.riderReview && (
                      <p className="text-xs text-foreground/90 italic bg-muted/30 p-3 rounded-xl border border-border/30">
                        "{rev.riderReview}"
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

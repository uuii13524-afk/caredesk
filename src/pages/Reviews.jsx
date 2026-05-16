import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format } from "date-fns";

function StarRating({ rating, size = "sm" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => base44.entities.Review.list("-date", 100),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length)
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0,
  }));

  const staffRatings = staff.map(s => {
    const staffReviews = reviews.filter(r => r.staff_id === s.id);
    const avg = staffReviews.length > 0
      ? staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length
      : null;
    return { ...s, avg, reviewCount: staffReviews.length };
  }).filter(s => s.avg !== null).sort((a, b) => b.avg - a.avg);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">レビュー</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold">{avgRating.toFixed(1)}</p>
                <StarRating rating={Math.round(avgRating)} size="lg" />
                <p className="text-sm text-muted-foreground mt-1">{reviews.length}件のレビュー</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {distribution.map(d => (
                  <div key={d.stars} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{d.stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="w-5 text-muted-foreground">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {staffRatings.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">スタッフ別評価</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staffRatings.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.reviewCount}件</p>
                  </div>
                  <StarRating rating={Math.round(s.avg)} />
                  <span className="text-sm font-semibold">{s.avg.toFixed(1)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">すべてのレビュー</h2>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p>まだレビューはありません</p>
          </div>
        ) : (
          reviews.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-sm">{r.patient_name || "匿名"}</p>
                      {r.staff_name && <span className="text-xs text-muted-foreground">→ {r.staff_name}</span>}
                    </div>
                    <StarRating rating={r.rating} />
                    {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                  </div>
                  {r.date && <p className="text-xs text-muted-foreground shrink-0">{r.date}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
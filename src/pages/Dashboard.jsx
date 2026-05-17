import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Users, Star, AlertTriangle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import TodayAppointments from "@/components/dashboard/TodayAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const getToken = () => localStorage.getItem("jwt_token");
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...options.headers },
  });
  if (!res.ok) throw new Error("APIエラー");
  return res.json();
}

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const thisMonth = format(new Date(), "yyyy-MM");

  const { data: clinics = [] } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => apiFetch("/api/clinics"),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiFetch("/api/appointments?sort=-appointment_date&limit=200"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => apiFetch("/api/patients"),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => apiFetch("/api/reviews"),
  });

  const clinic = clinics[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === today);
  const thisMonthApts = appointments.filter(a => a.appointment_date?.startsWith(thisMonth));
  const cancelledThisMonth = thisMonthApts.filter(a => a.status === "cancelled").length;
  const totalThisMonth = thisMonthApts.length;
  const cancellationRate = totalThisMonth > 0 ? Math.round((cancelledThisMonth / totalThisMonth) * 100) : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.review_rating || 0), 0) / reviews.length).toFixed(1)
    : "0";

  const lapsedPatients = patients.filter(p => p.is_lapsed).length;
  const newPatientsThisMonth = patients.filter(p => p.created_date?.startsWith(thisMonth)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{clinic?.name || "院"} ダッシュボード</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "yyyy年MM月dd日")}
          </p>
        </div>
        {clinic && (
          <Badge variant="outline" className={
            clinic.subscription_status === "trial" ? "bg-accent/10 text-accent border-accent/20" :
            clinic.subscription_status === "active" ? "bg-primary/10 text-primary border-primary/20" :
            "bg-destructive/10 text-destructive border-destructive/20"
          }>
            {clinic.subscription_status === "trial" ? `トライアル中 • 終了: ${clinic.trial_end_date || "近日"}` :
             clinic.subscription_status === "active" ? "契約中" : clinic.subscription_status}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="本日の予約" value={todayAppointments.length} icon={Calendar} />
        <StatCard title="患者総数" value={patients.length} icon={Users} />
        <StatCard title="新規患者" value={newPatientsThisMonth} subtitle="今月" icon={Users} />
        <StatCard title="平均評価" value={avgRating} subtitle={`${reviews.length}件のレビュー`} icon={Star} />
      </div>

      {/* Alerts */}
      {lapsedPatients > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {lapsedPatients}名の来院が途絶えています
              </p>
              <p className="text-xs text-amber-700">3週間以上来院がありません。フォローアップをご検討ください。</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayAppointments appointments={todayAppointments} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">クイック統計</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">キャンセル率</span>
              <span className="text-sm font-semibold">{cancellationRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">患者総数</span>
              <span className="text-sm font-semibold">{patients.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">来院が途絶えた患者</span>
              <span className="text-sm font-semibold text-amber-600">{lapsedPatients}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">今月の予約総数</span>
              <span className="text-sm font-semibold">{totalThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">今月のキャンセル</span>
              <span className="text-sm font-semibold text-amber-600">{cancelledThisMonth}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, subWeeks, isAfter } from "date-fns";
import { Calendar, Users, CreditCard, Star, AlertTriangle, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import TodayAppointments from "@/components/dashboard/TodayAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  const { data: clinics = [] } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => base44.entities.Clinic.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date", 200),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => base44.entities.Review.list(),
  });

  const clinic = clinics[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const thisMonthInvoices = invoices.filter(i => i.date?.startsWith(format(new Date(), "yyyy-MM")));
  const monthlyRevenue = thisMonthInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "0";
  const lapsedPatients = patients.filter(p => p.is_lapsed).length;
  
  const cancelledThisMonth = appointments.filter(a => 
    a.date?.startsWith(format(new Date(), "yyyy-MM")) && a.status === "cancelled"
  ).length;
  const totalThisMonth = appointments.filter(a => a.date?.startsWith(format(new Date(), "yyyy-MM"))).length;
  const cancellationRate = totalThisMonth > 0 ? Math.round((cancelledThisMonth / totalThisMonth) * 100) : 0;

  const newPatientsThisMonth = patients.filter(p => 
    p.created_date?.startsWith(format(new Date(), "yyyy-MM"))
  ).length;

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
        <StatCard title="今月の売上" value={`¥${monthlyRevenue.toLocaleString()}`} icon={CreditCard} />
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
              <span className="text-sm text-muted-foreground">未払い請求</span>
              <span className="text-sm font-semibold text-amber-600">
                {invoices.filter(i => i.payment_status === "未払い").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, CreditCard, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  trial: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-accent/10 text-accent border-accent/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-muted text-muted-foreground",
};

export default function SuperAdmin() {
  const qc = useQueryClient();

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["all-clinics"],
    queryFn: () => base44.entities.Clinic.list("-created_date"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["all-patients"],
    queryFn: () => base44.entities.Patient.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["all-appointments"],
    queryFn: () => base44.entities.Appointment.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Clinic.update(id, data),
    onSuccess: () => qc.invalidateQueries(["all-clinics"]),
  });

  const activeCount = clinics.filter(c => c.subscription_status === "active").length;
  const trialCount = clinics.filter(c => c.subscription_status === "trial").length;
  const mrr = clinics.filter(c => c.subscription_status === "active").reduce((s, c) => s + (c.monthly_fee || 3000), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">スーパー管理者ダッシュボード</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">院の総数</p>
              <p className="text-2xl font-bold">{clinics.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">契約中の院</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">月次収益（MRR）</p>
              <p className="text-2xl font-bold">¥{mrr.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">患者総数</p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinics Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">全院一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="space-y-2">
              {clinics.map(clinic => {
                const clinicPatients = patients.filter(p => p.clinic_id === clinic.id).length;
                const clinicApts = appointments.filter(a => a.clinic_id === clinic.id).length;
                return (
                  <div key={clinic.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{clinic.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{clinic.owner_email}</span>
                        <span>/{clinic.slug}</span>
                        {clinic.created_date && <span>登録日: {clinic.created_date.slice(0, 10)}</span>}
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{clinicPatients}名</span>
                      <span>{clinicApts}件</span>
                    </div>
                    <Select
                      value={clinic.subscription_status}
                      onValueChange={(v) => updateMutation.mutate({ id: clinic.id, data: { subscription_status: v } })}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">トライアル</SelectItem>
                        <SelectItem value="active">契約中</SelectItem>
                        <SelectItem value="cancelled">解約</SelectItem>
                        <SelectItem value="suspended">停止中</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className={`text-xs ${statusColors[clinic.subscription_status] || ""}`}>
                      {clinic.subscription_status}
                    </Badge>
                  </div>
                );
              })}
              {clinics.length === 0 && (
                <p className="text-center text-muted-foreground py-8">登録された院はまだありません</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trial Clinics Alert */}
      {trialCount > 0 && (
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-800">
              {trialCount}院がトライアル中
            </p>
            <div className="mt-2 space-y-1">
              {clinics.filter(c => c.subscription_status === "trial").map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.name}</span>
                  <span>終了日: {c.trial_end_date || "未設定"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
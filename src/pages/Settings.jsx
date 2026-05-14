import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, CreditCard, Clock } from "lucide-react";

export default function Settings() {
  const qc = useQueryClient();
  const { data: clinics = [] } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => base44.entities.Clinic.list(),
  });

  const clinic = clinics[0];

  const [form, setForm] = useState({
    name: "", slug: "", address: "", phone: "", email: "",
  });

  useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name || "",
        slug: clinic.slug || "",
        address: clinic.address || "",
        phone: clinic.phone || "",
        email: clinic.email || "",
      });
    }
  }, [clinic]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Clinic.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["clinics"]); toast.success("設定を保存しました"); },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Clinic.create(data),
    onSuccess: () => { qc.invalidateQueries(["clinics"]); toast.success("院を作成しました"); },
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (clinic) updateMutation.mutate({ id: clinic.id, data: form });
    else createMutation.mutate(form);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* Subscription Status */}
      {clinic && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> サブスクリプション
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">ステータス</span>
              <Badge variant="outline" className={
                clinic.subscription_status === "trial" ? "bg-accent/10 text-accent border-accent/20" :
                clinic.subscription_status === "active" ? "bg-primary/10 text-primary border-primary/20" :
                "bg-destructive/10 text-destructive"
              }>
                {clinic.subscription_status}
              </Badge>
            </div>
            {clinic.trial_end_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">トライアル終了日</span>
                <span className="text-sm font-medium">{clinic.trial_end_date}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">月額料金</span>
              <span className="text-sm font-medium">¥{(clinic.monthly_fee || 3000).toLocaleString()}/月</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
              オンライン予約URL:{" "}
                <span className="font-medium text-foreground">/book/{clinic.slug}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" /> 院の基本情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>院名 *</Label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>URLスラッグ *</Label>
                <Input value={form.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s/g, "-"))} required placeholder="my-clinic" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>電話番号</Label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>メールアドレス</Label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>住所</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending}>
                {updateMutation.isPending || createMutation.isPending ? "保存中..." : "設定を保存"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
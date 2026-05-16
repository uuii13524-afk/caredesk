import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  "未払い": "bg-amber-50 text-amber-700 border-amber-200",
  "支払済": "bg-accent/10 text-accent border-accent/20",
  "保険": "bg-primary/10 text-primary border-primary/20",
};

export default function Billing() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const qc = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-date", 200),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => { qc.invalidateQueries(["invoices"]); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["invoices"]); setShowForm(false); setEditing(null); },
  });

  const filtered = filterStatus === "all" ? invoices : invoices.filter(i => i.payment_status === filterStatus);
  const thisMonth = format(new Date(), "yyyy-MM");
  const monthRevenue = invoices
    .filter(i => i.date?.startsWith(thisMonth) && i.payment_status === "支払済")
    .reduce((s, i) => s + (i.amount || 0), 0);
  const pendingAmount = invoices
    .filter(i => i.payment_status === "未払い")
    .reduce((s, i) => s + (i.amount || 0), 0);
  const insuranceAmount = invoices
    .filter(i => i.date?.startsWith(thisMonth) && i.payment_status === "保険")
    .reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">請求管理</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> 新規請求
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">今月の売上</p>
              <p className="text-xl font-bold">¥{monthRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">未収金（未払い）</p>
              <p className="text-xl font-bold text-amber-700">¥{pendingAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">保険請求（今月）</p>
              <p className="text-xl font-bold">¥{insuranceAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "未払い", "支払済", "保険"].map(s => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? "すべて" : s}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => (
            <div
              key={inv.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => { setEditing(inv); setShowForm(true); }}
            >
              <div className="min-w-[80px]">
                <p className="text-sm font-medium">{inv.date}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{inv.patient_name}</p>
                {inv.treatment_type && <p className="text-xs text-muted-foreground">{inv.treatment_type}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">¥{(inv.amount || 0).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className={statusColors[inv.payment_status] || ""}>
                {inv.payment_status}
              </Badge>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">請求書が見つかりません</div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "請求書を編集" : "新規請求書"}</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            initial={editing}
            patients={patients}
            onSubmit={(data) => {
              if (editing) updateMutation.mutate({ id: editing.id, data });
              else createMutation.mutate(data);
            }}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceForm({ initial, patients, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    patient_id: initial?.patient_id || "",
    patient_name: initial?.patient_name || "",
    date: initial?.date || new Date().toISOString().slice(0, 10),
    treatment_type: initial?.treatment_type || "",
    amount: initial?.amount || "",
    payment_status: initial?.payment_status || "未払い",
    payment_method: initial?.payment_method || "",
    notes: initial?.notes || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePatient = (id) => {
    const p = patients.find(p => p.id === id);
    set("patient_id", id);
    if (p) set("patient_name", p.name);
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="space-y-1">
        <Label>患者</Label>
        <Select value={form.patient_id} onValueChange={handlePatient}>
          <SelectTrigger><SelectValue placeholder="患者を選択" /></SelectTrigger>
          <SelectContent>
            {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {!form.patient_id && (
          <Input placeholder="または患者名を入力" value={form.patient_name} onChange={e => set("patient_name", e.target.value)} className="mt-1" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>日付 *</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>金額（¥） *</Label>
          <Input type="number" value={form.amount} onChange={e => set("amount", parseFloat(e.target.value))} required />
        </div>
      </div>

      <div className="space-y-1">
        <Label>施術種別</Label>
        <Input value={form.treatment_type} onChange={e => set("treatment_type", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>支払いステータス</Label>
          <Select value={form.payment_status} onValueChange={v => set("payment_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="未払い">未払い</SelectItem>
              <SelectItem value="支払済">支払済</SelectItem>
              <SelectItem value="保険">保険</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>支払い方法</Label>
          <Input value={form.payment_method} onChange={e => set("payment_method", e.target.value)} placeholder="現金 / カード" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>備考</Label>
        <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" disabled={loading}>{loading ? "保存中..." : "請求書を保存"}</Button>
      </div>
    </form>
  );
}
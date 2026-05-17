import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, FileText } from "lucide-react";

const getToken = () => localStorage.getItem("jwt_token");
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...options.headers },
  });
  if (!res.ok) throw new Error("APIエラー");
  return res.json();
}

export default function TreatmentRecords() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["treatment-records-all"],
    queryFn: () => apiFetch("/api/treatment-records?sort=-record_date&limit=200"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => apiFetch("/api/patients"),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => apiFetch("/api/staff"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiFetch("/api/treatment-records", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries(["treatment-records-all"]); setShowForm(false); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/api/treatment-records/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries(["treatment-records-all"]); setShowForm(false); setEditing(null); },
  });

  const filtered = records.filter(r => {
    const patient = patients.find(p => p.id === r.patient_id);
    return patient?.name?.toLowerCase().includes(search.toLowerCase()) || r.record_date?.includes(search);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">施術記録</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> 新規記録
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="患者名または日付で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const patient = patients.find(p => p.id === r.patient_id);
            const staffMember = staff.find(s => s.id === r.staff_id);
            return (
              <Card
                key={r.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => { setEditing(r); setShowForm(true); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{patient?.name || "不明"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{r.record_date}</p>
                      {staffMember && <p className="text-xs text-muted-foreground">{staffMember.name}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {r.symptoms && <p><span className="font-medium text-foreground">症状: </span>{r.symptoms}</p>}
                    {r.body_areas && <p><span className="font-medium text-foreground">部位: </span>{r.body_areas}</p>}
                    {r.treatment_details && (
                      <p className="line-clamp-2"><span className="font-medium text-foreground">施術: </span>{r.treatment_details}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">記録が見つかりません</div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "記録を編集" : "新規施術記録"}</DialogTitle>
          </DialogHeader>
          <TreatmentForm
            initial={editing}
            patients={patients}
            staff={staff}
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

function TreatmentForm({ initial, patients, staff, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    patient_id: initial?.patient_id || "",
    staff_id: initial?.staff_id || "",
    record_date: initial?.record_date || new Date().toISOString().slice(0, 10),
    symptoms: initial?.symptoms || "",
    treatment_details: initial?.treatment_details || "",
    body_areas: initial?.body_areas || "",
    next_appointment_notes: initial?.next_appointment_notes || "",
    insurance_claim_reason: initial?.insurance_claim_reason || "",
    insurance_body_parts: initial?.insurance_body_parts || "",
    treatment_days: initial?.treatment_days || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>患者 *</Label>
          <Select value={form.patient_id} onValueChange={v => set("patient_id", v)} required>
            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
            <SelectContent>
              {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>担当スタッフ</Label>
          <Select value={form.staff_id} onValueChange={v => set("staff_id", v)}>
            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
            <SelectContent>
              {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>施術日 *</Label>
        <Input type="date" value={form.record_date} onChange={e => set("record_date", e.target.value)} required />
      </div>

      <div className="space-y-1">
        <Label>症状 (Symptoms)</Label>
        <Textarea rows={2} value={form.symptoms} onChange={e => set("symptoms", e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>部位 (Body Areas)</Label>
        <Input value={form.body_areas} onChange={e => set("body_areas", e.target.value)} placeholder="腰・肩・膝" />
      </div>

      <div className="space-y-1">
        <Label>施術内容 (Treatment Details)</Label>
        <Textarea rows={3} value={form.treatment_details} onChange={e => set("treatment_details", e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>次回予約 (Next Visit Notes)</Label>
        <Input value={form.next_appointment_notes} onChange={e => set("next_appointment_notes", e.target.value)} />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-semibold mb-3">保険関連情報</p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>負傷原因 (Injury Reason)</Label>
            <Input value={form.insurance_claim_reason} onChange={e => set("insurance_claim_reason", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>保険部位</Label>
              <Input value={form.insurance_body_parts} onChange={e => set("insurance_body_parts", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>施術日数</Label>
              <Input type="number" value={form.treatment_days} onChange={e => set("treatment_days", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" disabled={loading}>{loading ? "保存中..." : "記録を保存"}</Button>
      </div>
    </form>
  );
}

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Minus } from "lucide-react";

const statusColors = {
  active: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  expired: "bg-muted text-muted-foreground border-border",
};

export default function Courses() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const qc = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses-all"],
    queryFn: () => base44.entities.Course.list("-created_date"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => { qc.invalidateQueries(["courses-all"]); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["courses-all"]); setShowForm(false); setEditing(null); },
  });

  const consumeSession = (course) => {
    if (course.remaining_sessions <= 0) return;
    const remaining = course.remaining_sessions - 1;
    updateMutation.mutate({
      id: course.id,
      data: { remaining_sessions: remaining, status: remaining === 0 ? "completed" : "active" },
    });
  };

  const filtered = filterStatus === "all" ? courses : courses.filter(c => c.status === filterStatus);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">コース・回数券管理</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> 新規コース
        </Button>
      </div>

      <div className="flex gap-2">
        {[
          { key: "all", label: "すべて" },
          { key: "active", label: "利用中" },
          { key: "completed", label: "完了" },
          { key: "expired", label: "期限切れ" },
        ].map(s => (
          <Button
            key={s.key}
            variant={filterStatus === s.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s.key)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const patient = patients.find(p => p.id === c.patient_id);
            const progress = c.total_sessions > 0 ? ((c.total_sessions - c.remaining_sessions) / c.total_sessions) * 100 : 0;
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{c.name}</p>
                          <Badge variant="outline" className={statusColors[c.status] || ""}>{c.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{patient?.name || c.patient_name}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{c.total_sessions - (c.remaining_sessions || 0)}回使用済</span>
                            <span>残り{c.remaining_sessions || 0}回 / 計{c.total_sessions}回</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        {c.total_price && (
                          <p className="text-xs text-muted-foreground mt-1">¥{c.total_price.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {c.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => consumeSession(c)}
                          className="gap-1 text-xs"
                          disabled={c.remaining_sessions <= 0}
                        >
                          <Minus className="w-3 h-3" /> 1回使用
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setShowForm(true); }}>
                        編集
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">コースが見つかりません</div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "コースを編集" : "新規コース"}</DialogTitle>
          </DialogHeader>
          <CourseForm
            initial={editing}
            patients={patients}
            onSubmit={(data) => {
              if (editing) updateMutation.mutate({ id: editing.id, data });
              else createMutation.mutate({ ...data, remaining_sessions: data.total_sessions });
            }}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseForm({ initial, patients, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    patient_id: initial?.patient_id || "",
    patient_name: initial?.patient_name || "",
    name: initial?.name || "",
    total_sessions: initial?.total_sessions || 10,
    remaining_sessions: initial?.remaining_sessions || initial?.total_sessions || 10,
    total_price: initial?.total_price || "",
    status: initial?.status || "active",
    purchase_date: initial?.purchase_date || new Date().toISOString().slice(0, 10),
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
        <Label>患者 *</Label>
        <Select value={form.patient_id} onValueChange={handlePatient} required>
          <SelectTrigger><SelectValue placeholder="患者を選択" /></SelectTrigger>
          <SelectContent>
            {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>コース名 *</Label>
        <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="例: 10回コース" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>総回数</Label>
          <Input type="number" value={form.total_sessions} onChange={e => set("total_sessions", parseInt(e.target.value))} min={1} />
        </div>
        <div className="space-y-1">
          <Label>合計金額（¥）</Label>
          <Input type="number" value={form.total_price} onChange={e => set("total_price", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>購入日</Label>
          <Input type="date" value={form.purchase_date} onChange={e => set("purchase_date", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>ステータス</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">利用中</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="expired">期限切れ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" disabled={loading}>{loading ? "保存中..." : "コースを保存"}</Button>
      </div>
    </form>
  );
}
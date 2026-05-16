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
import { Switch } from "@/components/ui/switch";
import { Plus, User, Mail, Phone } from "lucide-react";

export default function Staff() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Staff.create(data),
    onSuccess: () => { qc.invalidateQueries(["staff"]); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Staff.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["staff"]); setShowForm(false); setEditing(null); },
  });

  const roleColors = {
    therapist: "bg-primary/10 text-primary",
    receptionist: "bg-accent/10 text-accent",
    admin: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">スタッフ管理</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> スタッフを追加
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map(s => (
            <Card
              key={s.id}
              className={`cursor-pointer hover:border-primary/30 transition-colors ${!s.is_active ? "opacity-60" : ""}`}
              onClick={() => { setEditing(s); setShowForm(true); }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{s.name}</p>
                      {!s.is_active && <Badge variant="secondary">休職中</Badge>}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge className={roleColors[s.role] || ""}>{s.role}</Badge>
                      {s.specialization && <Badge variant="outline">{s.specialization}</Badge>}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {s.email && (
                        <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</p>
                      )}
                      {s.phone && (
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {staff.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">スタッフが登録されていません</div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "スタッフを編集" : "スタッフを追加"}</DialogTitle>
          </DialogHeader>
          <StaffForm
            initial={editing}
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

function StaffForm({ initial, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    role: initial?.role || "therapist",
    specialization: initial?.specialization || "",
    is_active: initial?.is_active !== false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="space-y-1">
        <Label>氏名 *</Label>
        <Input value={form.name} onChange={e => set("name", e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>メールアドレス</Label>
          <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>電話番号</Label>
          <Input value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>役職</Label>
          <Select value={form.role} onValueChange={v => set("role", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="therapist">施術師</SelectItem>
              <SelectItem value="receptionist">受付</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>専門分野</Label>
          <Input value={form.specialization} onChange={e => set("specialization", e.target.value)} placeholder="例：鍼灸師" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} id="active" />
        <Label htmlFor="active">在籍中</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" disabled={loading}>{loading ? "保存中..." : "保存"}</Button>
      </div>
    </form>
  );
}
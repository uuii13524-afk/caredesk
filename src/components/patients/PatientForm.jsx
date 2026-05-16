import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PatientForm({ initial, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    name_kana: initial?.name_kana || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    date_of_birth: initial?.date_of_birth || "",
    gender: initial?.gender || "",
    address: initial?.address || "",
    insurance_type: initial?.insurance_type || "自費",
    medical_history: initial?.medical_history || "",
    intake_notes: initial?.intake_notes || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>氏名 *</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>フリガナ</Label>
          <Input value={form.name_kana} onChange={e => set("name_kana", e.target.value)} placeholder="カナ" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>電話番号 *</Label>
          <Input value={form.phone} onChange={e => set("phone", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>メールアドレス</Label>
          <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>生年月日</Label>
          <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>性別</Label>
          <Select value={form.gender} onValueChange={v => set("gender", v)}>
            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">男性</SelectItem>
              <SelectItem value="female">女性</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>保険種別</Label>
        <Select value={form.insurance_type} onValueChange={v => set("insurance_type", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="国民健康保険">国民健康保険</SelectItem>
            <SelectItem value="社会保険">社会保険</SelectItem>
            <SelectItem value="自費">自費</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>住所</Label>
        <Input value={form.address} onChange={e => set("address", e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>既往歴</Label>
        <Textarea rows={2} value={form.medical_history} onChange={e => set("medical_history", e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>問診票</Label>
        <Textarea rows={2} value={form.intake_notes} onChange={e => set("intake_notes", e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" disabled={loading}>{loading ? "保存中..." : "患者を保存"}</Button>
      </div>
    </form>
  );
}
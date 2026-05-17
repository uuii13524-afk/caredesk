import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIMES = Array.from({ length: 26 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const DEFAULT_TREATMENTS = ["初診", "再診", "マッサージ", "鍼灸", "骨盤矯正"];

function parseTreatmentMenu(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (typeof parsed[0] === "string") {
      return parsed.map(name => ({ name, price: 0 }));
    }
    return parsed.map(item => ({ name: item.name, price: item.price || 0 }));
  } catch {
    return null;
  }
}

export default function AppointmentForm({ initial, patients, staff, clinic, onSubmit, loading, onCancel, isEditing, onStatusChange }) {
  const treatmentMenu = useMemo(() => parseTreatmentMenu(clinic?.treatment_menu), [clinic?.treatment_menu]);

  const treatments = treatmentMenu ? treatmentMenu.map(t => t.name) : DEFAULT_TREATMENTS;

  const getPriceForTreatment = (type) => {
    if (!treatmentMenu) return null;
    const item = treatmentMenu.find(t => t.name === type);
    return item ? item.price : null;
  };

  const initialTreatment = initial?.treatment_type || "再診";
  const initialPrice = (() => {
    if (initial?.price && Number(initial.price) > 0) return initial.price;
    const menuPrice = getPriceForTreatment(initialTreatment);
    return menuPrice !== null ? menuPrice : (initial?.price || "");
  })();

  const [form, setForm] = useState({
    patient_id: initial?.patient_id || "",
    patient_name: initial?.patient_name || "",
    patient_phone: initial?.patient_phone || "",
    staff_id: initial?.staff_id || "",
    staff_name: initial?.staff_name || "",
    appointment_date: initial?.appointment_date || "",
    appointment_time: initial?.appointment_time || "09:00",
    treatment_type: initialTreatment,
    status: initial?.status || "confirmed",
    notes: initial?.notes || "",
    price: initialPrice,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePatientChange = (id) => {
    const p = patients.find(p => p.id === id);
    if (p) {
      setForm(f => ({ ...f, patient_id: id, patient_name: p.name, patient_phone: p.phone || "" }));
    } else {
      set("patient_id", id);
    }
  };

  const handleStaffChange = (id) => {
    const s = staff.find(s => s.id === id);
    if (s) {
      setForm(f => ({ ...f, staff_id: id, staff_name: s.name }));
    } else {
      set("staff_id", id);
    }
  };

  const handleTreatmentChange = (type) => {
    const menuPrice = getPriceForTreatment(type);
    setForm(f => ({
      ...f,
      treatment_type: type,
      price: menuPrice !== null ? menuPrice : f.price,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>患者</Label>
        <Select value={form.patient_id} onValueChange={handlePatientChange}>
          <SelectTrigger>
            <SelectValue placeholder="患者を選択" />
          </SelectTrigger>
          <SelectContent>
            {patients.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name} ({p.phone})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!form.patient_id && (
          <Input
            placeholder="または患者名を入力"
            value={form.patient_name}
            onChange={e => set("patient_name", e.target.value)}
            className="mt-1"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>日付 *</Label>
          <Input type="date" value={form.appointment_date} onChange={e => set("appointment_date", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>時間 *</Label>
          <Select value={form.appointment_time} onValueChange={v => set("appointment_time", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>施術種別</Label>
          <Select value={form.treatment_type} onValueChange={handleTreatmentChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {treatments.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>担当スタッフ</Label>
          <Select value={form.staff_id} onValueChange={handleStaffChange}>
            <SelectTrigger><SelectValue placeholder="指定なし" /></SelectTrigger>
            <SelectContent>
              {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>料金（¥）</Label>
          <Input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" />
        </div>
        {isEditing && (
          <div className="space-y-1">
            <Label>ステータス</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">予約確定</SelectItem>
                <SelectItem value="completed">来院済</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
                <SelectItem value="no_show">無断キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>備考</Label>
        <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" disabled={loading}>{loading ? "保存中..." : "保存"}</Button>
      </div>
    </form>
  );
}

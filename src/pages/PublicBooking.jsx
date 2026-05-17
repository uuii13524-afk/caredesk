import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Activity, AlertCircle } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];
const DEFAULT_TREATMENTS = [
  { name: "初診", price: 0 },
  { name: "再診", price: 0 },
  { name: "マッサージ", price: 0 },
  { name: "鍼灸", price: 0 },
  { name: "骨盤矯正", price: 0 },
];
const DAYS_AHEAD = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i + 1));

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

export default function PublicBooking() {
  const { slug } = useParams();

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [existingApts, setExistingApts] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    treatment_type: "",
    appointment_date: "",
    appointment_time: "",
    patient_name: "",
    patient_kana: "",
    patient_phone: "",
    patient_dob: "",
    intake_notes: "",
    notes: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const clinicRes = await fetch(`${API_BASE}/public/clinics/${slug}`);
        if (!clinicRes.ok) {
          setError("院が見つかりませんでした。");
          return;
        }
        const clinicData = await clinicRes.json();
        setClinic(clinicData);

        const aptsRes = await fetch(`${API_BASE}/public/clinics/${slug}/appointments`);
        const aptsData = aptsRes.ok ? await aptsRes.json() : [];
        setExistingApts(aptsData);
      } catch (e) {
        setError("院の情報を読み込めませんでした。");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const treatmentMenu = parseTreatmentMenu(clinic?.treatment_menu) || DEFAULT_TREATMENTS;

  const isTimeBooked = (date, time) =>
    existingApts.some(a =>
      a.appointment_date === date &&
      a.appointment_time === time &&
      a.status !== "cancelled"
    );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/public/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinic.id,
          patient_name: form.patient_name,
          patient_kana: form.patient_kana,
          patient_phone: form.patient_phone,
          patient_dob: form.patient_dob || null,
          appointment_date: form.appointment_date,
          appointment_time: form.appointment_time,
          treatment_type: form.treatment_type,
          intake_notes: form.intake_notes,
          notes: form.notes,
          status: "confirmed",
        }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">院が見つかりません</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold mb-2">ご予約が確定しました！</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {clinic.name}でのご来院をお待ちしております。
            </p>
            <div className="text-left space-y-2 bg-muted/50 rounded-lg p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">お名前</span>
                <span className="font-medium">{form.patient_name}</span>
              </div>
              {form.patient_kana && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">フリガナ</span>
                  <span className="font-medium">{form.patient_kana}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">電話番号</span>
                <span className="font-medium">{form.patient_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">日付</span>
                <span className="font-medium">{form.appointment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">時間</span>
                <span className="font-medium">{form.appointment_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">施術内容</span>
                <span className="font-medium">{form.treatment_type}</span>
              </div>
            </div>
            {clinic.phone && (
              <p className="text-xs text-muted-foreground mt-4">
                ご質問はお電話ください: {clinic.phone}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium opacity-80">オンライン予約</span>
        </div>
        <h1 className="text-2xl font-bold">{clinic?.name}</h1>
        {clinic?.address && <p className="text-sm opacity-80 mt-1">{clinic.address}</p>}
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Treatment */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">施術内容を選択</h2>
            <div className="grid grid-cols-1 gap-3">
              {treatmentMenu.map(t => (
                <button
                  key={t.name}
                  onClick={() => { set("treatment_type", t.name); setStep(2); }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors hover:border-primary ${form.treatment_type === t.name ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <span className="font-medium">{t.name}</span>
                  {t.price > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">¥{t.price.toLocaleString()}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">日時を選択</h2>

            <div>
              <Label className="mb-2 block">日付を選択</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {DAYS_AHEAD.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isSelected = form.appointment_date === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => { set("appointment_date", dateStr); set("appointment_time", ""); }}
                      className={`p-2 rounded-lg border text-center text-xs transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                    >
                      <p className="font-medium">{format(day, "EEE")}</p>
                      <p className="text-lg font-bold">{format(day, "d")}</p>
                      <p>{format(day, "MMM")}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.appointment_date && (
              <div>
                <Label className="mb-2 block">時間を選択</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIMES.map(t => {
                    const booked = isTimeBooked(form.appointment_date, t);
                    const isSelected = form.appointment_time === t;
                    return (
                      <button
                        key={t}
                        disabled={booked}
                        onClick={() => set("appointment_time", t)}
                        className={`p-2 rounded-lg border text-sm font-medium transition-colors ${booked ? "opacity-40 cursor-not-allowed bg-muted" : isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                      >
                        {booked ? <s>{t}</s> : t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">戻る</Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
                disabled={!form.appointment_date || !form.appointment_time}
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Patient Info */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">お客様情報の入力</h2>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">施術内容</span>
                <span className="font-medium">{form.treatment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">日付</span>
                <span className="font-medium">{form.appointment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">時間</span>
                <span className="font-medium">{form.appointment_time}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label>お名前 *</Label>
              <Input
                value={form.patient_name}
                onChange={e => set("patient_name", e.target.value)}
                placeholder="山田 太郎"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>フリガナ</Label>
              <Input
                value={form.patient_kana}
                onChange={e => set("patient_kana", e.target.value)}
                placeholder="ヤマダ タロウ"
              />
            </div>

            <div className="space-y-1">
              <Label>電話番号 *</Label>
              <Input
                value={form.patient_phone}
                onChange={e => set("patient_phone", e.target.value)}
                placeholder="090-0000-0000"
                type="tel"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>生年月日</Label>
              <Input
                value={form.patient_dob}
                onChange={e => set("patient_dob", e.target.value)}
                type="date"
              />
            </div>

            <div className="space-y-1">
              <Label>問診票</Label>
              <Textarea
                value={form.intake_notes}
                onChange={e => set("intake_notes", e.target.value)}
                placeholder="症状・お悩みなどがあればご記入ください..."
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <Label>備考（任意）</Label>
              <Input
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="ご要望など..."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">戻る</Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={!form.patient_name || !form.patient_phone || loading}
              >
                {loading ? "予約中..." : "予約を確定する"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

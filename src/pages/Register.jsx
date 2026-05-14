import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle, ArrowLeft } from "lucide-react";
import { addDays, format } from "date-fns";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clinicName: "",
    slug: "",
    ownerEmail: "",
    phone: "",
    address: "",
  });
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const trialEnd = format(addDays(new Date(), 30), "yyyy-MM-dd");
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.clinicName,
          slug: data.slug,
          owner_email: data.ownerEmail,
          phone: data.phone,
          address: data.address,
          subscription_status: "trial",
          trial_end_date: trialEnd,
          monthly_fee: 3000,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "登録に失敗しました");
      }
      return res.json();
    },
    onSuccess: () => setDone(true),
  });

  const handleSlug = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 30);
    set("clinicName", name);
    set("slug", slug);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold mb-2">院の登録が完了しました！</h2>
            <p className="text-muted-foreground text-sm mb-6">
              30日間の無料トライアルが開始されました。ログインして院の管理を始めましょう。
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2 mb-6">
              <p>
                <span className="text-muted-foreground">院名:</span>{" "}
                <span className="font-medium">{form.clinicName}</span>
              </p>
              <p>
                <span className="text-muted-foreground">予約URL:</span>{" "}
                <span className="font-medium">/book/{form.slug}</span>
              </p>
              <p>
                <span className="text-muted-foreground">トライアル終了日:</span>{" "}
                <span className="font-medium">
                  {format(addDays(new Date(), 30), "yyyy年MM月dd日")}
                </span>
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/login")}>
              ダッシュボードへログイン
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CareDesk</span>
          </Link>
          <h1 className="text-2xl font-bold">院を登録する</h1>
          <p className="text-muted-foreground text-sm mt-2">30日間無料トライアル。クレジットカード不要。</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(form);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label>院名 *</Label>
                <Input
                  value={form.clinicName}
                  onChange={(e) => handleSlug(e.target.value)}
                  placeholder="田中整骨院"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>URLスラッグ *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">/book/</span>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    placeholder="tanaka-clinic"
                    required
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">オンライン予約ページのURLに使用されます</p>
              </div>

              <div className="space-y-1">
                <Label>オーナーのメールアドレス *</Label>
                <Input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => set("ownerEmail", e.target.value)}
                  placeholder="owner@clinic.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>電話番号</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="03-0000-0000"
                />
              </div>

              <div className="space-y-1">
                <Label>住所</Label>
                <Input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="東京都〇〇区..."
                />
              </div>

              {createMutation.isError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {createMutation.error?.message || "登録に失敗しました"}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "登録中..." : "無料トライアルを開始"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                すでにアカウントをお持ちですか？{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary hover:underline"
                >
                  ログイン
                </button>
              </p>
            </form>
          </CardContent>
        </Card>

        <Link
          to="/"
          className="flex items-center justify-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> トップに戻る
        </Link>
      </div>
    </div>
  );
}

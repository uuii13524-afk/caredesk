import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "ログインに失敗しました");
      }
      const data = await res.json();
      localStorage.setItem("jwt_token", data.access_token);
      await checkUserAuth();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CareDesk</span>
          </Link>
          <h1 className="text-2xl font-bold">ログイン</h1>
          <p className="text-sm text-muted-foreground mt-1">院の管理画面にアクセス</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="owner@clinic.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <Label>パスワード</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          アカウントをお持ちでない方は{" "}
          <Link to="/register" className="text-primary hover:underline">
            無料登録
          </Link>
        </p>
        <Link
          to="/"
          className="flex items-center justify-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← トップに戻る
        </Link>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, X } from "lucide-react";

const getToken = () => localStorage.getItem("jwt_token");

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...options.headers },
  });
  if (!res.ok) throw new Error("APIエラー");
  return res.json();
}

export default function Settings() {
  const qc = useQueryClient();
  const { data: clinics = [] } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => apiFetch("/api/clinics"),
  });
  const clinic = clinics[0];
  const [form, setForm] = useState({ name: "", slug: "", address: "", phone: "", email: "" });
  const [menus, setMenus] = useState([]);
  const [newMenu, setNewMenu] = useState("");

  useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name || "",
        slug: clinic.slug || "",
        address: clinic.address || "",
        phone: clinic.phone || "",
        email: clinic.email || "",
      });
      try {
        setMenus(clinic.treatment_menu ? JSON.parse(clinic.treatment_menu) : ["初診", "再診", "マッサージ", "鍼灸", "骨盤矯正"]);
      } catch {
        setMenus(["初診", "再診", "マッサージ", "鍼灸", "骨盤矯正"]);
      }
    }
  }, [clinic]);

  const updateMutation = useMutation({
    mutationFn: (data) => apiFetch(`/api/clinics/${clinic.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries(["clinics"]); toast.success("設定を保存しました"); },
    onError: () => toast.error("保存に失敗しました"),
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({ ...form, treatment_menu: JSON.stringify(menus) });
  };

  const addMenu = () => {
    if (newMenu.trim() && !menus.includes(newMenu.trim())) {
      setMenus([...menus, newMenu.trim()]);
      setNewMenu("");
    }
  };

  const removeMenu = (item) => setMenus(menus.filter(m => m !== item));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">院の設定</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>院名</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>URLスラッグ</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/book/</span>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="flex-1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>電話番号</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>住所</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>メールアドレス</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>施術メニュー</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {menus.map(m => (
                <Badge key={m} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {m}
                  <button type="button" onClick={() => removeMenu(m)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMenu}
                onChange={e => setNewMenu(e.target.value)}
                placeholder="例：整体、温熱療法..."
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addMenu())}
              />
              <Button type="button" variant="outline" onClick={addMenu}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "保存中..." : "設定を保存"}
        </Button>
      </form>
    </div>
  );
}

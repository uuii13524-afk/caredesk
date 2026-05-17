import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const DEFAULT_MENUS = [
  { name: "初診", price: 0 },
  { name: "再診", price: 0 },
  { name: "マッサージ", price: 0 },
  { name: "鍼灸", price: 0 },
  { name: "骨盤矯正", price: 0 },
];

export default function Settings() {
  const qc = useQueryClient();
  const { data: clinics = [] } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => apiFetch("/api/clinics"),
  });
  const clinic = clinics[0];
  const [form, setForm] = useState({ name: "", slug: "", address: "", phone: "", email: "" });
  const [menus, setMenus] = useState(DEFAULT_MENUS);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

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
        const parsed = clinic.treatment_menu ? JSON.parse(clinic.treatment_menu) : DEFAULT_MENUS;
        // 旧形式（文字列配列）の場合はオブジェクトに変換
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          setMenus(parsed.map(name => ({ name, price: 0 })));
        } else {
          setMenus(parsed);
        }
      } catch {
        setMenus(DEFAULT_MENUS);
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
    if (newName.trim() && !menus.find(m => m.name === newName.trim())) {
      setMenus([...menus, { name: newName.trim(), price: parseInt(newPrice) || 0 }]);
      setNewName("");
      setNewPrice("");
    }
  };

  const removeMenu = (name) => setMenus(menus.filter(m => m.name !== name));

  const updatePrice = (name, price) => {
    setMenus(menus.map(m => m.name === name ? { ...m, price: parseInt(price) || 0 } : m));
  };

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
          <CardHeader><CardTitle>施術メニュー・料金</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {menus.map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">{m.name}</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={m.price}
                      onChange={e => updatePrice(m.name, e.target.value)}
                      className="w-28 text-right"
                      placeholder="0"
                    />
                    <span className="text-sm text-muted-foreground">円</span>
                  </div>
                  <button type="button" onClick={() => removeMenu(m.name)} className="hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="施術名"
                className="flex-1"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addMenu())}
              />
              <Input
                type="number"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                placeholder="料金"
                className="w-28"
              />
              <span className="text-sm text-muted-foreground self-center">円</span>
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

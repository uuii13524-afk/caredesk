import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, User, Phone, ChevronRight, AlertCircle } from "lucide-react";
import PatientForm from "@/components/patients/PatientForm";
import PatientDetail from "@/components/patients/PatientDetail";
import { format, differenceInYears, parseISO } from "date-fns";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const qc = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.create(data),
    onSuccess: () => { qc.invalidateQueries(["patients"]); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Patient.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["patients"]); setEditingPatient(null); setShowForm(false); },
  });

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_kana?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const handleSubmit = (data) => {
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (selected) {
    return (
      <PatientDetail
        patient={selected}
        onBack={() => setSelected(null)}
        onEdit={(p) => { setEditingPatient(p); setShowForm(true); setSelected(null); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">患者管理</h1>
        <Button onClick={() => { setEditingPatient(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> 患者を追加
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="氏名・フリガナ・電話番号で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length}名</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(patient => {
            const age = patient.date_of_birth
              ? differenceInYears(new Date(), parseISO(patient.date_of_birth))
              : null;
            return (
              <Card
                key={patient.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelected(patient)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{patient.name}</p>
                        {patient.name_kana && (
                          <p className="text-xs text-muted-foreground">{patient.name_kana}</p>
                        )}
                        {patient.is_lapsed && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />来院途絶
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />{patient.phone}
                        </span>
                        {age !== null && <span>{age}歳</span>}
                        <span>{patient.insurance_type || "自費"}</span>
                        {patient.total_visits > 0 && (
                          <span>{patient.total_visits}回来院</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              患者が見つかりません
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditingPatient(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatient ? "患者情報を編集" : "新規患者登録"}</DialogTitle>
          </DialogHeader>
          <PatientForm
            initial={editingPatient}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setShowForm(false); setEditingPatient(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
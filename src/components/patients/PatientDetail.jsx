import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Calendar, FileText } from "lucide-react";
import { format, differenceInYears, parseISO } from "date-fns";

export default function PatientDetail({ patient, onBack, onEdit }) {
  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", patient.id],
    queryFn: () => base44.entities.Appointment.filter({ patient_id: patient.id }, "-date", 20),
  });

  const { data: records = [] } = useQuery({
    queryKey: ["treatment-records", patient.id],
    queryFn: () => base44.entities.TreatmentRecord.filter({ patient_id: patient.id }, "-date", 10),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", patient.id],
    queryFn: () => base44.entities.Course.filter({ patient_id: patient.id }),
  });

  const age = patient.date_of_birth
    ? differenceInYears(new Date(), parseISO(patient.date_of_birth))
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1">{patient.name}</h1>
        <Button variant="outline" size="sm" onClick={() => onEdit(patient)} className="gap-1">
          <Pencil className="w-4 h-4" /> 編集
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">患者情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {patient.name_kana && <p className="text-muted-foreground">{patient.name_kana}</p>}
            {age !== null && <p>{age}歳 · {patient.gender === "male" ? "男性" : patient.gender === "female" ? "女性" : patient.gender || "—"}</p>}
            {patient.phone && (
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{patient.phone}</p>
            )}
            {patient.email && (
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{patient.email}</p>
            )}
            {patient.address && (
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{patient.address}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Badge variant="outline">{patient.insurance_type || "自費"}</Badge>
              {patient.total_visits > 0 && <Badge variant="secondary">{patient.total_visits}回来院</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">医療メモ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {patient.medical_history && (
              <div>
                <p className="font-medium text-muted-foreground text-xs mb-1">既往歴</p>
                <p>{patient.medical_history}</p>
              </div>
            )}
            {patient.intake_notes && (
              <div>
                <p className="font-medium text-muted-foreground text-xs mb-1">問診票</p>
                <p>{patient.intake_notes}</p>
              </div>
            )}
            {!patient.medical_history && !patient.intake_notes && (
              <p className="text-muted-foreground">メモはありません</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Courses */}
      {courses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">コース・回数券</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">残り{c.remaining_sessions}/{c.total_sessions}回</p>
                </div>
                <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Appointments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" /> 予約履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">予約履歴はありません</p>
          ) : (
            <div className="space-y-2">
              {appointments.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{a.date}</span>
                    <span className="text-muted-foreground ml-2">{a.time}</span>
                    <span className="text-muted-foreground ml-2">· {a.treatment_type}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatment Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" /> 施術記録
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">施術記録はありません</p>
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="text-sm p-3 rounded-lg bg-muted/50">
                  <p className="font-medium mb-1">{r.date}</p>
                  {r.symptoms && <p><span className="text-muted-foreground">症状: </span>{r.symptoms}</p>}
                  {r.body_areas && <p><span className="text-muted-foreground">部位: </span>{r.body_areas}</p>}
                  {r.treatment_details && <p><span className="text-muted-foreground">施術: </span>{r.treatment_details}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
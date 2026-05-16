import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import AppointmentForm from "@/components/appointments/AppointmentForm";

const STATUS_COLORS = {
  confirmed: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-accent/15 text-accent border-accent/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-muted text-muted-foreground border-border",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

const getToken = () => localStorage.getItem("jwt_token");

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...options.headers },
  });
  if (!res.ok) throw new Error("APIエラー");
  return res.json();
}

export default function Appointments() {
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const qc = useQueryClient();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiFetch("/api/appointments?sort=-appointment_date&limit=500"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => apiFetch("/api/patients"),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => apiFetch("/api/staff"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiFetch("/api/appointments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries(["appointments"]); setShowForm(false); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/api/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries(["appointments"]); setShowForm(false); setEditing(null); },
  });

  const handleSubmit = (data) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const dayApts = viewMode === "day"
    ? appointments.filter(a => a.appointment_date === format(currentDate, "yyyy-MM-dd"))
    : [];

  const weekApts = viewMode === "week"
    ? weekDays.map(d => ({
        date: d,
        apts: appointments.filter(a => a.appointment_date === format(d, "yyyy-MM-dd"))
      }))
    : [];

  const openNew = (date, time) => {
    setSelectedSlot({ appointment_date: format(date || currentDate, "yyyy-MM-dd"), appointment_time: time || "09:00" });
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">予約管理</h1>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">週表示</SelectItem>
              <SelectItem value="day">日表示</SelectItem>
              <SelectItem value="list">リスト</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => openNew()} className="gap-2">
            <Plus className="w-4 h-4" /> 新規予約
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() =>
          viewMode === "week" ? setCurrentDate(subWeeks(currentDate, 1)) : setCurrentDate(subDays(currentDate, 1))
        }>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>今日</Button>
        <span className="font-medium text-sm min-w-0 flex-1 text-center">
          {viewMode === "week"
            ? `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
            : format(currentDate, "EEEE, MMMM d, yyyy")}
        </span>
        <Button variant="outline" size="icon" onClick={() =>
          viewMode === "week" ? setCurrentDate(addWeeks(currentDate, 1)) : setCurrentDate(addDays(currentDate, 1))
        }>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {viewMode === "week" && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 text-xs text-muted-foreground text-center border-r">時刻</div>
              {weekDays.map((d, i) => (
                <div key={i} className={`p-2 text-center text-xs border-r last:border-0 ${isSameDay(d, new Date()) ? "bg-primary/5" : ""}`}>
                  <p className="font-medium">{format(d, "EEE")}</p>
                  <p className={`text-lg font-bold mt-0.5 ${isSameDay(d, new Date()) ? "text-primary" : ""}`}>{format(d, "d")}</p>
                </div>
              ))}
            </div>
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-0" style={{ minHeight: 60 }}>
                <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r pt-1">{hour}:00</div>
                {weekDays.map((d, di) => {
                  const slotApts = appointments.filter(a =>
                    a.appointment_date === format(d, "yyyy-MM-dd") &&
                    a.appointment_time && parseInt(a.appointment_time.split(":")[0]) === hour
                  );
                  return (
                    <div
                      key={di}
                      className="border-r last:border-0 p-0.5 cursor-pointer hover:bg-muted/50 relative"
                      onClick={() => openNew(d, `${String(hour).padStart(2, "0")}:00`)}
                    >
                      {slotApts.map(a => (
                        <div
                          key={a.id}
                          className={`text-xs rounded px-1 py-0.5 mb-0.5 border cursor-pointer truncate ${STATUS_COLORS[a.status] || ""}`}
                          onClick={e => { e.stopPropagation(); setEditing(a); setShowForm(true); }}
                        >
                          <span className="font-medium">{a.appointment_time}</span> {a.patient_name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "day" && (
        <div className="space-y-2 rounded-lg border bg-card p-4">
          {HOURS.map(hour => {
            const slotApts = dayApts.filter(a => a.appointment_time && parseInt(a.appointment_time.split(":")[0]) === hour);
            return (
              <div
                key={hour}
                className="flex gap-4 items-start py-2 border-b last:border-0 cursor-pointer hover:bg-muted/30 rounded px-2"
                onClick={() => openNew(currentDate, `${String(hour).padStart(2, "0")}:00`)}
              >
                <span className="text-xs text-muted-foreground w-12 pt-0.5">{hour}:00</span>
                <div className="flex-1 space-y-1">
                  {slotApts.map(a => (
                    <div
                      key={a.id}
                      className={`text-sm rounded-lg px-3 py-2 border flex items-center justify-between cursor-pointer ${STATUS_COLORS[a.status] || ""}`}
                      onClick={e => { e.stopPropagation(); setEditing(a); setShowForm(true); }}
                    >
                      <div>
                        <span className="font-medium">{a.patient_name}</span>
                        <span className="text-xs ml-2">{a.treatment_type}</span>
                        {a.staff_name && <span className="text-xs ml-2">· {a.staff_name}</span>}
                      </div>
                      <Badge variant="outline" className="text-xs">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-2">
          {appointments.slice(0, 50).map(a => (
            <div
              key={a.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer hover:border-primary/30"
              onClick={() => { setEditing(a); setShowForm(true); }}
            >
              <div className="text-center min-w-[70px]">
                <p className="text-sm font-bold">{a.appointment_date}</p>
                <p className="text-xs text-muted-foreground">{a.appointment_time}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.patient_name}</p>
                <p className="text-xs text-muted-foreground">{a.treatment_type}{a.staff_name ? ` · ${a.staff_name}` : ""}</p>
              </div>
              <Badge className={`text-xs ${STATUS_COLORS[a.status] || ""}`} variant="outline">{a.status}</Badge>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) { setEditing(null); setSelectedSlot(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "予約を編集" : "新規予約"}</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            initial={editing || selectedSlot}
            patients={patients}
            staff={staff}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setShowForm(false); setEditing(null); setSelectedSlot(null); }}
            isEditing={!!editing}
            onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

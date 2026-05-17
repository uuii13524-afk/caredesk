import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

const statusColors = {
  confirmed: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-muted text-muted-foreground border-border",
};

export default function TodayAppointments({ appointments }) {
  const sorted = [...appointments].sort((a, b) => (a.appointment_time || "").localeCompare(b.appointment_time || ""));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">本日のスケジュール</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">本日の予約はありません</p>
        )}
        {sorted.map(apt => (
          <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div className="text-center min-w-[50px]">
              <p className="text-sm font-semibold">{apt.appointment_time}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{apt.patient_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{apt.treatment_type}</span>
                {apt.staff_name && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />{apt.staff_name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className={statusColors[apt.status] || ""}>
              {apt.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
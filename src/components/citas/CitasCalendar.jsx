import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

export default function CitasCalendar({ citas, mascotas, clientes, onEdit }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const estadoColors = {
    "Pendiente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Confirmada": "bg-blue-100 text-blue-800 border-blue-300",
    "Completada": "bg-green-100 text-green-800 border-green-300",
    "Cancelada": "bg-red-100 text-red-800 border-red-300",
  };

  const getCitasForDay = (day) => {
    return citas.filter(c => 
      c.fecha && isSameDay(new Date(c.fecha), day)
    ).sort((a, b) => a.hora.localeCompare(b.hora));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date())}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, idx) => {
            const citasDay = getCitasForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            
            return (
              <div
                key={idx}
                className={`min-h-[100px] p-2 border rounded-lg ${
                  isToday ? 'bg-primary/5 border-primary/30' : 'bg-white'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isToday ? 'text-primary' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {citasDay.slice(0, 3).map((cita) => {
                    const mascota = mascotas.find(m => m.id === cita.mascota_id);
                    return (
                      <div
                        key={cita.id}
                        onClick={() => onEdit(cita)}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                          estadoColors[cita.estado]
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-semibold">{cita.hora}</span>
                        </div>
                        <div className="truncate">{mascota?.nombre}</div>
                      </div>
                    );
                  })}
                  {citasDay.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{citasDay.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

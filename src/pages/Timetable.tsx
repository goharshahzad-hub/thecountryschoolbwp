import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const timetable: Record<string, { time: string; mon: string; tue: string; wed: string; thu: string; fri: string }[]> = {
  "10-A": [
    { time: "8:00 - 8:40", mon: "Mathematics", tue: "English", wed: "Physics", thu: "Urdu", fri: "Chemistry" },
    { time: "8:40 - 9:20", mon: "English", tue: "Mathematics", wed: "Chemistry", thu: "Physics", fri: "Mathematics" },
    { time: "9:20 - 10:00", mon: "Physics", tue: "Computer", wed: "Mathematics", thu: "English", fri: "Urdu" },
    { time: "10:00 - 10:20", mon: "Break", tue: "Break", wed: "Break", thu: "Break", fri: "Break" },
    { time: "10:20 - 11:00", mon: "Urdu", tue: "Physics", wed: "English", thu: "Computer", fri: "Islamiat" },
    { time: "11:00 - 11:40", mon: "Chemistry", tue: "Urdu", wed: "Islamiat", thu: "Mathematics", fri: "English" },
    { time: "11:40 - 12:20", mon: "Computer", tue: "Islamiat", wed: "Urdu", thu: "Chemistry", fri: "Physics" },
    { time: "12:20 - 1:00", mon: "Islamiat", tue: "Chemistry", wed: "Computer", thu: "Islamiat", fri: "Computer" },
  ],
};

const Timetable = () => {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const data = timetable[selectedClass] || timetable["10-A"];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Timetable</h1>
          <p className="mt-1 text-sm text-muted-foreground">Weekly class schedule</p>
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["10-A", "10-B", "9-A", "9-B", "8-A"].map(c => (
              <SelectItem key={c} value={c}>Class {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left font-semibold text-foreground">Time</th>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => (
                  <th key={d} className="p-3 text-left font-semibold text-foreground">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className={`border-b border-border ${row.mon === "Break" ? "bg-accent/5" : ""}`}>
                  <td className="p-3 font-medium text-muted-foreground whitespace-nowrap">{row.time}</td>
                  {[row.mon, row.tue, row.wed, row.thu, row.fri].map((subj, j) => (
                    <td key={j} className={`p-3 ${subj === "Break" ? "text-center font-medium text-accent-foreground italic" : "text-foreground"}`}>
                      {subj}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Timetable;

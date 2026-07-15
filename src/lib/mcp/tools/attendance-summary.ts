import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "attendance_summary",
  title: "Attendance summary",
  description: "Summarise attendance for a student over a date range (defaults to the last 30 days).",
  inputSchema: {
    student_id: z.string().uuid(),
    from_date: z.string().optional().describe("YYYY-MM-DD"),
    to_date: z.string().optional().describe("YYYY-MM-DD"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ student_id, from_date, to_date }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const to = to_date ?? new Date().toISOString().slice(0, 10);
    const fromDefault = new Date(); fromDefault.setDate(fromDefault.getDate() - 30);
    const from = from_date ?? fromDefault.toISOString().slice(0, 10);

    const { data, error } = await supabaseForUser(ctx)
      .from("attendance")
      .select("date,status")
      .eq("student_id", student_id)
      .gte("date", from)
      .lte("date", to);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = data ?? [];
    const counts = { Present: 0, Absent: 0, Leave: 0, Late: 0 } as Record<string, number>;
    for (const r of rows) counts[r.status as string] = (counts[r.status as string] || 0) + 1;
    const total = rows.length;
    const percent = total ? Math.round(((counts.Present + counts.Late) / total) * 1000) / 10 : 0;
    const summary = { student_id, from, to, total_days: total, ...counts, attendance_percent: percent };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_fee_vouchers",
  title: "List fee vouchers",
  description: "List fee vouchers visible to the signed-in user. Filter by student, status, month or year.",
  inputSchema: {
    student_id: z.string().uuid().optional(),
    status: z.enum(["Pending", "Paid", "Partial"]).optional(),
    month: z.string().optional().describe("Full month name e.g. 'January'"),
    year: z.number().int().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ student_id, status, month, year, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx).from("fee_vouchers").select("*").limit(limit ?? 50);
    if (student_id) q = q.eq("student_id", student_id);
    if (status) q = q.eq("status", status);
    if (month) q = q.eq("month", month);
    if (year) q = q.eq("year", year);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { vouchers: data ?? [], count: data?.length ?? 0 },
    };
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_students",
  title: "List students",
  description: "List students visible to the signed-in user. Optionally filter by class and search by name.",
  inputSchema: {
    class_name: z.string().optional().describe("Filter by class name, e.g. 'Class-3'"),
    search: z.string().optional().describe("Search by student name (case-insensitive)"),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ class_name, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx).from("students").select("*").limit(limit ?? 50);
    if (class_name) q = q.eq("class_name", class_name);
    if (search) q = q.ilike("full_name", `%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { students: data ?? [], count: data?.length ?? 0 },
    };
  },
});

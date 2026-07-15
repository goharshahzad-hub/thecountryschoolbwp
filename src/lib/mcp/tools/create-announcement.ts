import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_announcement",
  title: "Create announcement",
  description: "Create a new school announcement. Requires admin role (enforced by database policies).",
  inputSchema: {
    title: z.string().trim().min(1),
    content: z.string().trim().min(1),
    audience: z.string().optional().describe("Target audience e.g. 'all', 'parents', 'teachers'"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ title, content, audience }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const payload: Record<string, unknown> = { title, content, created_by: ctx.getUserId() };
    if (audience) payload.audience = audience;
    const { data, error } = await supabaseForUser(ctx)
      .from("announcements")
      .insert(payload)
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Announcement created: ${data.id}` }],
      structuredContent: { announcement: data },
    };
  },
});

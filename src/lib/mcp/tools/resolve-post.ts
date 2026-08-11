import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "resolve_post",
  title: "Mark a post resolved",
  description:
    "Mark one of the signed-in neighbour's own posts as resolved (or reopen it by setting resolved to false).",
  inputSchema: {
    post_id: z.string().uuid(),
    resolved: z.boolean().optional().describe("Defaults to true."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_id, resolved }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("posts")
      .update({ resolved: resolved ?? true })
      .eq("id", post_id)
      .eq("owner_id", ctx.getUserId())
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "No post updated — it does not exist or you do not own it." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { post: data },
    };
  },
});

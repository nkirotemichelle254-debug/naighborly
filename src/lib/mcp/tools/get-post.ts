import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_post",
  title: "Get a post",
  description: "Fetch a single Naighborly post by id, with its owner's public profile details.",
  inputSchema: { post_id: z.string().uuid().describe("The post id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!post) return { content: [{ type: "text", text: "Post not found" }], isError: true };

    const { data: owner } = await supabase
      .from("profiles")
      .select("id,display_name,neighborhood,bio,trust_tier,asanti_received,avatar_url")
      .eq("id", post.owner_id)
      .maybeSingle();

    return {
      content: [{ type: "text", text: JSON.stringify({ post, owner }) }],
      structuredContent: { post, owner: owner ?? null },
    };
  },
});

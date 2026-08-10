import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_profile",
  title: "My neighbor profile",
  description:
    "Get the signed-in neighbor's Naighborly profile: name, neighborhood, trust tier, asanti received, and their own posts.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,display_name,neighborhood,bio,trust_tier,asanti_received,avatar_url,created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const { data: posts } = await supabase
      .from("posts")
      .select("id,title,category,intent,resolved,urgent,created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);

    return {
      content: [{ type: "text", text: JSON.stringify({ profile, posts: posts ?? [] }) }],
      structuredContent: { profile: profile ?? null, posts: posts ?? [] },
    };
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_posts",
  title: "Search neighborhood posts",
  description:
    "Search Naighborly posts (offers and requests) by text, category, intent, neighborhood, urgency or resolved state.",
  inputSchema: {
    query: z.string().trim().optional().describe("Text to match in the title or description."),
    category: z.enum(["Item", "Service", "Swap"]).optional(),
    intent: z.enum(["Offer", "Request"]).optional(),
    neighborhood: z.string().trim().optional().describe("Partial location/neighborhood name."),
    urgent_only: z.boolean().optional(),
    include_resolved: z.boolean().optional().describe("Defaults to false."),
    limit: z.number().int().min(1).max(50).optional().describe("Defaults to 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("posts")
      .select("id,title,description,category,intent,location,urgent,resolved,created_at,image_url")
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 20);

    if (input.query) q = q.or(`title.ilike.%${input.query}%,description.ilike.%${input.query}%`);
    if (input.category) q = q.eq("category", input.category);
    if (input.intent) q = q.eq("intent", input.intent);
    if (input.neighborhood) q = q.ilike("location", `%${input.neighborhood}%`);
    if (input.urgent_only) q = q.eq("urgent", true);
    if (!input.include_resolved) q = q.eq("resolved", false);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});

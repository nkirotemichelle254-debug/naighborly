import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_post",
  title: "Create a post",
  description:
    "Create a new Naighborly post (an offer or a request) on behalf of the signed-in neighbor.",
  inputSchema: {
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(3).max(2000),
    category: z.enum(["Item", "Service", "Swap"]),
    intent: z.enum(["Offer", "Request"]),
    location: z.string().trim().min(1).max(120).optional().describe("Neighborhood label. Defaults to the user's saved neighborhood."),
    urgent: z.boolean().optional(),
    note: z.string().trim().max(500).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    let location = input.location;
    let latitude: number | null = null;
    let longitude: number | null = null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("neighborhood,latitude,longitude")
      .eq("id", userId)
      .maybeSingle();
    if (!location) location = profile?.neighborhood ?? "Nairobi";
    if (profile && location === profile.neighborhood) {
      latitude = profile.latitude ?? null;
      longitude = profile.longitude ?? null;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        owner_id: userId,
        title: input.title,
        description: input.description,
        category: input.category,
        intent: input.intent,
        location,
        latitude,
        longitude,
        urgent: input.urgent ?? false,
        note: input.note ?? null,
      })
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { post: data },
    };
  },
});

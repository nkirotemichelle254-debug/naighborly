import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPostsTool from "./tools/search-posts";
import getPostTool from "./tools/get-post";
import createPostTool from "./tools/create-post";
import resolvePostTool from "./tools/resolve-post";
import myProfileTool from "./tools/my-profile";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nairobi-neighborly-hub",
  title: "Nairobi Neighborly Hub",
  version: "0.1.0",
  instructions:
    "Tools for Naighborly, a Nairobi neighborhood help-and-share app. Use `search_posts` to find neighbor offers and requests, `get_post` for full detail plus the owner's trust standing, `create_post` to post on the signed-in neighbor's behalf, `resolve_post` to close their own post, and `my_profile` for their standing and posts. All tools act as the signed-in neighbor.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPostsTool, getPostTool, createPostTool, resolvePostTool, myProfileTool],
});

// Cloudflare Pages Advanced Worker entrypoint
import worker from "./api/_worker.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // If request is an API call or health check, route to Hono worker
    if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
      return worker.fetch(request, env, ctx);
    }
    // Otherwise serve static assets from Cloudflare Pages
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }
      // SPA Fallback: serve index.html for unknown client-side routes
      const indexReq = new Request(new URL("/", request.url), request);
      return env.ASSETS.fetch(indexReq);
    }
    return worker.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    return worker.scheduled(event, env, ctx);
  }
};

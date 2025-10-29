// Cloudflare Pages Node.js compatibility
export default {
  async fetch(request, env, ctx) {
    return new Response('Node.js compatibility enabled', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

// Same-origin GET /api/screenshots/<id>.jpg for the portfolio grid.
// Forwards to the lunar-ds-screenshots Worker through the SCREENSHOTS service binding
// (Pages project > Settings > Bindings > Service binding "SCREENSHOTS").
export async function onRequestGet({ request, env }) {
  if (!env.SCREENSHOTS) {
    return new Response("Screenshots service is not configured.", { status: 503 });
  }
  return env.SCREENSHOTS.fetch(request);
}

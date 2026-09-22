// Same-origin POST /api/enquiries for the static site.
// Pages Functions can't use the send_email binding, so this forwards the request
// to the lunar-ds-enquiry Worker through the ENQUIRY service binding
// (Pages project > Settings > Bindings > Service binding "ENQUIRY").
export async function onRequestPost({ request, env }) {
  if (!env.ENQUIRY) {
    return Response.json({ detail: "Enquiry service is not configured." }, { status: 503 });
  }
  return env.ENQUIRY.fetch(request);
}

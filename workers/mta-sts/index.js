// MTA-STS policy for lunar-ds.com, served at https://mta-sts.lunar-ds.com/.well-known/mta-sts.txt
// - If the email provider changes, update the mx lines here first (they must match the MX records).
// - To enforce (after about two weeks of clean TLS reports): mode: enforce and max_age: 604800,
//   then change the id in the _mta-sts TXT record.
const POLICY =
  [
    "version: STSv1",
    "mode: testing",
    "mx: route1.mx.cloudflare.net",
    "mx: route2.mx.cloudflare.net",
    "mx: route3.mx.cloudflare.net",
    "max_age: 86400",
  ].join("\r\n") + "\r\n";

const TEXT = { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" };

export default {
  fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === "/.well-known/mta-sts.txt") {
      return new Response(request.method === "HEAD" ? null : POLICY, {
        headers: { ...TEXT, "cache-control": "public, max-age=3600" },
      });
    }
    return new Response("Not found\n", { status: 404, headers: TEXT });
  },
};

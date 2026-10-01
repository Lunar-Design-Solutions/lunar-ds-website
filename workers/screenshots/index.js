// Lunar Design portfolio screenshots Worker.
// Replaces the old FastAPI headless-Chrome job: keeps an up-to-date screenshot of each
// portfolio site in KV so the Work section always shows the current version of the site.

const SITES = {
  nolasoul: "https://nolasoul.co.uk",
  "lunar-ns": "https://lunar-ns.com",
  subrosa: "https://subrosapizza.com",
};
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // refresh stale shots in the background after a day

async function capture(env, id) {
  const options = {
    url: SITES[id],
    viewport: { width: 1568, height: 880 },
    screenshotOptions: { type: "jpeg", quality: 82 },
    gotoOptions: { waitUntil: "networkidle0", timeout: 45000 },
    waitForTimeout: 2500, // let entrance animations finish
  };
  let res = await env.BROWSER.quickAction("screenshot", options);
  if (res.status === 400) {
    delete options.waitForTimeout;
    res = await env.BROWSER.quickAction("screenshot", options);
  }
  if (!res.ok) throw new Error(`screenshot ${id} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const image = await res.arrayBuffer();
  await env.SHOTS.put(id, image, { metadata: { takenAt: Date.now() } });
  console.log("Screenshot saved", { id, bytes: image.byteLength });
  return image;
}

const imageResponse = (body, takenAt) =>
  new Response(body, {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=3600",
      ...(takenAt ? { "last-modified": new Date(takenAt).toUTCString() } : {}),
    },
  });

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });

    const match = new URL(request.url).pathname.match(/\/screenshots\/([a-z0-9-]+)(?:\.(?:jpg|png))?$/);
    const id = match?.[1];
    if (!id || !SITES[id]) return new Response("Not found", { status: 404 });

    const { value, metadata } = await env.SHOTS.getWithMetadata(id, "arrayBuffer");
    if (value) {
      if (!metadata?.takenAt || Date.now() - metadata.takenAt > MAX_AGE_MS) {
        ctx.waitUntil(capture(env, id).catch((err) => console.error(err.message)));
      }
      return imageResponse(value, metadata?.takenAt);
    }

    try {
      return imageResponse(await capture(env, id), Date.now());
    } catch (err) {
      console.error(err.message);
      // The site falls back to its bundled image when this fails.
      return new Response("Screenshot unavailable", { status: 503, headers: { "cache-control": "no-store" } });
    }
  },

  async scheduled(event, env, ctx) {
    for (const id of Object.keys(SITES)) {
      try {
        await capture(env, id);
      } catch (err) {
        console.error(err.message);
      }
    }
  },
};

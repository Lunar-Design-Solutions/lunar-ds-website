// Runs after `craco build`. Gives /work, /about and /enquiry their own HTML file, each with its
// own <title>. Cloudflare Pages serves work.html at /work (and so on) with a 200; rewriting those
// addresses to /index.html in _redirects does not work because Pages redirects /index.html to /.
const fs = require("fs");
const path = require("path");
const titles = require("../src/data/pageTitles.json");

const build = path.join(__dirname, "..", "build");
const html = fs.readFileSync(path.join(build, "index.html"), "utf8");
const titleTag = /<title>[^<]*<\/title>/;
if (!titleTag.test(html)) throw new Error("page-copies: no <title> found in build/index.html");

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

for (const [route, title] of Object.entries(titles)) {
  if (route === "/") continue;
  const file = path.join(build, `${route.slice(1)}.html`);
  fs.writeFileSync(file, html.replace(titleTag, `<title>${escapeHtml(title)}</title>`));
  console.log(`page-copies: ${route} -> ${path.basename(file)} ("${title}")`);
}

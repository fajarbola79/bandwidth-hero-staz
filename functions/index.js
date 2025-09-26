const pick = require("../util/pick"),
  fetch = require("node-fetch"),
  shouldCompress = require("../util/shouldCompress"),
  compress = require("../util/compress"),
  DEFAULT_QUALITY = 40;

exports.handler = async (e) => {
  let { url: r, w: wParam, q: qParam } = e.queryStringParameters || {};

  if (!r) return { statusCode: 200, body: "Bandwidth Hero Data Compression Service" };

  try { r = JSON.parse(r); } catch {}
  Array.isArray(r) && (r = r.join("&url="));
  r = r.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, "http://");

  const width = wParam ? parseInt(wParam, 10) : null;
  const quality = parseInt(qParam, 10) || DEFAULT_QUALITY;

  try {
    let h = {};
    const fetchRes = await fetch(r, {
      headers: {
        ...pick(e.headers || {}, ["cookie", "dnt", "referer"]),
        "user-agent": "Bandwidth-Hero Compressor",
        "x-forwarded-for": e.headers && (e.headers["x-forwarded-for"] || e.ip),
        via: "1.1 bandwidth-hero",
      },
      redirect: "follow",
    });

    if (!fetchRes.ok) return { statusCode: fetchRes.status || 502, body: `Upstream ${fetchRes.status}` };

    h = fetchRes.headers;
    const c = await fetchRes.buffer();
    const p = c.length;

    if (!shouldCompress(h.get ? h.get("content-type") || "" : "", p, false)) {
      return {
        statusCode: 200,
        body: c.toString("base64"),
        isBase64Encoded: true,
        headers: { "content-encoding": "identity", ...(h.get ? { "content-type": h.get("content-type") } : {}) },
      };
    }

    // compress, hanya pakai width & quality
    const { err, output, headers: g } = await compress(c, width, quality, p);

    if (err) throw err;

    return {
      statusCode: 200,
      body: output.toString("base64"),
      isBase64Encoded: true,
      headers: { "content-encoding": "identity", ...g },
    };
  } catch (f) {
    console.error(f);
    return { statusCode: 500, body: f.message || String(f) };
  }
};
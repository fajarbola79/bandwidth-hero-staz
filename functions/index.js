const fetch = require("node-fetch");
const compress = require("../util/compress");

exports.handler = async (e, t) => {
  let { url: r, w, q } = e.queryStringParameters;
  if (!r) {
    return { statusCode: 200, body: "Image resize/compress service" };
  }

  const width = parseInt(w, 10) || null;
  const quality = parseInt(q, 10) || 70;

  try {
    let h = {};
    const { data: c, type: l } = await fetch(r, {
      headers: {
        "user-agent": "Netlify Image Proxy",
      },
    }).then(async (res) =>
      res.ok
        ? ({
            data: await res.buffer(),
            type: res.headers.get("content-type") || "",
          })
        : { statusCode: res.status || 302 }
    );

    if (!c) {
      return { statusCode: 500, body: "Failed to fetch image" };
    }

    let { err, output, headers } = await compress(c, width, quality, c.length);
    if (err) throw err;

    return {
      statusCode: 200,
      body: output.toString("base64"),
      isBase64Encoded: true,
      headers: {
        "content-encoding": "identity",
        ...headers,
      },
    };
  } catch (f) {
    console.error(f);
    return { statusCode: 500, body: f.message || "Internal Error" };
  }
};
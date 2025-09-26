const sharp = require("sharp");

/**
 * compress(imageBuffer, width, quality, originalSize)
 * default: kernel=mitchell, noUpscale, mild sharpen, WebP output
 */
function compress(imageBuffer, width = null, quality = 80, originalSize = null) {
  const format = "webp"; // default modern format
  const kernel = "mitchell";
  const sharpenAmount = 0.3;

  let pipeline = sharp(imageBuffer, { animated: false });

  return pipeline.metadata().then((meta) => {
    if (width && meta.width && width < meta.width) {
      pipeline = pipeline.resize(width, null, { fit: "inside", kernel, withoutEnlargement: true });
      // mild sharpen after downscale
      pipeline = pipeline.sharpen(Math.max(0.3, 1.0 - sharpenAmount));
    }

    pipeline = pipeline.toFormat(format, { quality: Math.max(1, Math.min(100, quality)) });

    return pipeline
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => ({
        err: null,
        headers: {
          "content-type": `image/${info.format}`,
          "content-length": info.size,
          "x-original-size": originalSize,
          "x-bytes-saved": originalSize - info.size,
        },
        output: data,
      }))
      .catch((err) => ({ err }));
  });
}

module.exports = compress;
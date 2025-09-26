const sharp = require("sharp");

/**
 * compress(imageBuffer, useWebp, grayscale, quality, originalSize, width, height, opts)
 * opts: { kernel, noEnlarge, sharpenAmount }
 */
function compress(
  imageBuffer,
  useWebp,
  grayscale,
  quality,
  originalSize,
  width = null,
  height = null,
  opts = {}
) {
  const format = useWebp ? "webp" : "jpeg";
  const kernel = opts.kernel || "mitchell";
  const noEnlarge = opts.noEnlarge !== undefined ? !!opts.noEnlarge : true;
  const sharpenAmount = typeof opts.sharpenAmount === "number" ? opts.sharpenAmount : 0.3;

  let pipeline = sharp(imageBuffer, { animated: false });

  return pipeline.metadata().then((meta) => {
    if (width || height) {
      pipeline = pipeline.resize(width || null, height || null, {
        fit: "inside",
        kernel,
        withoutEnlargement: noEnlarge,
      });
    }

    if (grayscale) pipeline = pipeline.grayscale();

    const didDownscale =
      (width && meta.width && width < meta.width) ||
      (height && meta.height && height < meta.height);

    if (didDownscale && sharpenAmount > 0) {
      const sigma = Math.max(0.3, 1.0 - sharpenAmount);
      pipeline = pipeline.sharpen(sigma);
    }

    if (!useWebp) {
      pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
    }

    const q = Math.max(1, Math.min(100, parseInt(quality, 10) || 80));

    if (useWebp) {
      pipeline = pipeline.toFormat("webp", { quality: q, nearLossless: false });
    } else {
      pipeline = pipeline.toFormat("jpeg", { quality: q, progressive: true, mozjpeg: true, chromaSubsampling: "4:4:4" });
    }

    return pipeline
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => ({
        err: null,
        headers: {
          "content-type": info.format === "jpeg" ? "image/jpeg" : `image/${info.format}`,
          "content-length": info.size,
          "x-original-size": originalSize,
          "x-bytes-saved": originalSize - info.size,
          "x-used-kernel": kernel,
          "x-did-downscale": didDownscale ? "1" : "0",
        },
        output: data,
      }))
      .catch((err) => ({ err }));
  });
}

module.exports = compress;
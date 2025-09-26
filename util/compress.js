const sharp = require("sharp");

function compress(imageBuffer, width = null, quality = 80, originalSize = null) {
  const format = "webp"; // modern default
  const kernel = "lanczos3"; // sharper downscale
  const sharpenAmount = 0.6; // mild sharpen

  let pipeline = sharp(imageBuffer, { animated: false });

  return pipeline.metadata().then((meta) => {
    if (width && meta.width && width < meta.width) {
      pipeline = pipeline.resize(width, null, {
        fit: "inside",
        kernel, // sharper resize
      });

      // apply mild sharpening after downscale
      pipeline = pipeline.sharpen(sharpenAmount);
    }

    pipeline = pipeline.toFormat(format, {
      quality: Math.max(1, Math.min(100, quality)),
      chromaSubsampling: '4:4:4',
    });

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
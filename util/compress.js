const sharp = require("sharp");

function compress(imageBuffer, width = null, quality = 80, originalSize = null) {
  const format = "jpeg"; // default jadi JPEG
  const kernel = "mitchell"; // smooth & stabil
  const sharpenAmount = 0.4; // mild sharpen

  let pipeline = sharp(imageBuffer, { animated: false });

  return pipeline.metadata().then((meta) => {
    if (width && meta.width && width < meta.width) {
      pipeline = pipeline.resize(width, null, {
        fit: "inside",
        kernel,
        withoutEnlargement: true, // jangan besarkan gambar
      });

      // mild sharpening
      pipeline = pipeline.sharpen(sharpenAmount);
    }

    pipeline = pipeline.toFormat(format, {
      quality: Math.max(1, Math.min(100, quality)),
      progressive: true,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
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
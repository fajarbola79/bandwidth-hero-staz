const sharp = require("sharp");

function compress(imageBuffer, useWebp, grayscale, quality, originalSize, width = null, height = null) {
  // tentukan format akhir
  const format = useWebp ? "webp" : "jpeg";

  let pipeline = sharp(imageBuffer);

  // resize jika diminta
  if (width || height) {
    pipeline = pipeline.resize(width || null, height || null, { fit: 'inside' }); // atau 'cover' jika mau crop
  }

  // apply grayscale only if explicitly requested
  if (grayscale) pipeline = pipeline.grayscale();

  // jika output jpeg dan gambar semula ada alpha channel, flatten agar tidak jadi background hitam
  if (!useWebp) {
    pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } }); // putih background
  }

  return pipeline
    .toFormat(format, { quality: Math.max(1, Math.min(100, parseInt(quality, 10) || 80)), progressive: true, optimiseScans: true })
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => ({
      err: null,
      headers: {
        "content-type": info.format === 'jpeg' ? 'image/jpeg' : `image/${info.format}`,
        "content-length": info.size,
        "x-original-size": originalSize,
        "x-bytes-saved": originalSize - info.size,
      },
      output: data,
    }))
    .catch((err) => ({ err }));
}

module.exports = compress;
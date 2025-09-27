// compress.js (dilengkapi denoise ringan + tuned jpeg options)
const sharp = require("sharp");

/**
 * compress(imageBuffer, width, quality, originalSize)
 * - width: target width (px) atau null
 * - quality: 1..100
 */
async function compress(imageBuffer, width = null, quality = 75, originalSize = null) {
  // Tuned params
  const kernel = sharp.kernel.lanczos3; // tetap pakai lanczos3 untuk ketajaman
  const doMildBlur = true; // blur kecil utk kurangi grain warna
  const blurSigma = 0.25; // sangat mild
  const sharpenParams = { sigma: 0.5, flat: 1, jagged: 2 }; // konservatif (unsharp-like)
  const q = Math.max(1, Math.min(100, parseInt(quality, 10) || 75));

  let pipeline = sharp(imageBuffer, { animated: false });

  // Ambil metadata dulu
  const meta = await pipeline.metadata();

  // optional: apply very mild blur to suppress high-frequency noise (color/noise)
  if (doMildBlur) {
    // only blur if source larger than target (downscale) to avoid soften small images
    if (width && meta.width && width < meta.width) {
      pipeline = pipeline.blur(blurSigma);
    }
  }

  // Resize jika perlu
  if (width && meta.width && width < meta.width) {
    pipeline = pipeline.resize(width, null, {
      fit: "inside",
      kernel,
      withoutEnlargement: true,
    });
  }

  // Apply conservative sharpen (unsharp-like) AFTER resize
  // sharp.sharpen accepts (sigma, flat, jagged)
  pipeline = pipeline.sharpen(sharpenParams.sigma, sharpenParams.flat, sharpenParams.jagged);

  // Convert to JPEG with tuned encoder options to reduce artefacts
  pipeline = pipeline.toFormat("jpeg", {
    quality: q,
    progressive: true,
    mozjpeg: true,
    chromaSubsampling: "4:2:0", // cobalah 4:2:0 untuk warna lebih halus; kalau perlu ubah jadi 4:4:4
    trellisQuantisation: true,
    overshootDeringing: true,
    optimizeScans: true,
  });

  try {
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return {
      err: null,
      output: data,
      headers: {
        "content-type": `image/${info.format}`,
        "content-length": info.size,
        "x-original-size": originalSize,
        "x-bytes-saved": originalSize ? originalSize - info.size : undefined,
      },
    };
  } catch (err) {
    return { err };
  }
}

module.exports = compress;
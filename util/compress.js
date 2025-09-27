const sharp = require("sharp");

async function compress(imageBuffer, width = null, quality = 75, originalSize = null) {
  const kernel = sharp.kernel.lanczos3;
  const blurSigma = 0.3;
  const sharpenParams = { sigma: 0.5, flat: 1, jagged: 2 };
  const q = Math.max(1, Math.min(100, parseInt(quality, 10) || 75));

  let pipeline = sharp(imageBuffer, { animated: false });
  const meta = await pipeline.metadata();

  if (width && meta.width && width < meta.width) {
    pipeline = pipeline.blur(blurSigma);
  }

  if (width && meta.width && width < meta.width) {
    pipeline = pipeline.resize(width, null, {
      fit: "inside",
      kernel,
      withoutEnlargement: true,
    });
  }

  pipeline = pipeline.sharpen(
    sharpenParams.sigma,
    sharpenParams.flat,
    sharpenParams.jagged
  );

  pipeline = pipeline.toFormat("jpeg", {
    quality: q,
    progressive: true,
    mozjpeg: true,
    chromaSubsampling: "4:2:0",
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
        "content-length": info.size.toString(),
        ...(originalSize
          ? {
              "x-original-size": originalSize.toString(),
              "x-bytes-saved": (originalSize - info.size).toString(),
            }
          : {}),
      },
    };
  } catch (err) {
    return { err };
  }
}

module.exports = compress;
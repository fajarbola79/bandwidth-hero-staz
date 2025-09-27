const sharp = require("sharp");

function compress(imageBuffer, width, quality) {
  return sharp(imageBuffer)
    .resize({
      width: width || null,
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen(1.5, 1, 1)
    .jpeg({
      quality: quality || 70,
      progressive: true,
      chromaSubsampling: "4:4:4",
    })
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => ({
      err: null,
      headers: {
        "content-type": "image/jpeg",
        "content-length": info.size,
      },
      output: data,
    }))
    .catch((err) => ({ err }));
}

module.exports = compress;
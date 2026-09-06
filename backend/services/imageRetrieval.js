import fs from "fs";
import path from "path";
import crypto from "crypto";

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getImageValue(product) {
  return (
    product?.image ||
    product?.imageUrl ||
    product?.image_url ||
    product?.thumbnail ||
    ""
  );
}

function hasImage(product) {
  const image =
    getImageValue(product);

  return Boolean(
    normalize(image)
  );
}

function imageFingerprint(image) {
  return crypto
    .createHash("sha256")
    .update(String(image))
    .digest("hex");
}

function buildImageManifest(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map(product => {
    const image =
      getImageValue(product);

    return {
      id: product?.id ?? "",
      image,
      hasImage: hasImage(product),
      fingerprint:
        image
          ? imageFingerprint(image)
          : null
    };
  });
}

function validateImageManifest(
  manifest
) {
  if (!Array.isArray(manifest)) {
    return {
      valid: false,
      total: 0,
      withImages: 0,
      missingImages: 0
    };
  }

  const withImages =
    manifest.filter(
      item => item.hasImage
    ).length;

  return {
    valid: true,
    total: manifest.length,
    withImages,
    missingImages:
      manifest.length - withImages
  };
}

function createImageEmbeddingRequest(
  product
) {
  const image =
    getImageValue(product);

  if (!image) {
    return null;
  }

  return {
    id: product?.id ?? "",
    image
  };
}

function createImageEmbeddingManifest(
  products
) {
  return products
    .map(createImageEmbeddingRequest)
    .filter(Boolean);
}

function saveImageManifest(
  manifest,
  outputPath
) {
  const directory =
    path.dirname(outputPath);

  fs.mkdirSync(
    directory,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      manifest,
      null,
      2
    )
  );
}

export {
  normalize,
  getImageValue,
  hasImage,
  imageFingerprint,
  buildImageManifest,
  validateImageManifest,
  createImageEmbeddingRequest,
  createImageEmbeddingManifest,
  saveImageManifest
};

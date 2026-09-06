import assert from "assert";
import {
  getImageValue,
  hasImage,
  buildImageManifest,
  validateImageManifest,
  createImageEmbeddingManifest
} from "../services/imageRetrieval.js";

const products = [
  {
    id: 1,
    name: "Black Shirt",
    image:
      "https://example.com/shirt.jpg"
  },
  {
    id: 2,
    name: "Blue Shoes"
  }
];

assert.strictEqual(
  getImageValue(products[0]),
  "https://example.com/shirt.jpg"
);

assert.strictEqual(
  hasImage(products[0]),
  true
);

assert.strictEqual(
  hasImage(products[1]),
  false
);

const manifest =
  buildImageManifest(products);

const validation =
  validateImageManifest(
    manifest
  );

assert.strictEqual(
  validation.total,
  2
);

assert.strictEqual(
  validation.withImages,
  1
);

const requests =
  createImageEmbeddingManifest(
    products
  );

assert.strictEqual(
  requests.length,
  1
);

console.log(
  "Image retrieval tests passed"
);

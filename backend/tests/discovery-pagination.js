import assert from "node:assert/strict";

import {
  paginate
} from "../services/catalogDiscovery.js";

const products = Array.from(
  { length: 25 },
  (_, index) => ({
    id: index + 1
  })
);

const first = paginate(
  products,
  1,
  10
);

assert.equal(
  first.items.length,
  10
);

assert.equal(
  first.pagination.totalPages,
  3
);

assert.equal(
  first.pagination.hasNext,
  true
);

assert.equal(
  first.pagination.hasPrevious,
  false
);

const second = paginate(
  products,
  2,
  10
);

assert.equal(
  second.items[0].id,
  11
);

assert.equal(
  second.items[9].id,
  20
);

const last = paginate(
  products,
  3,
  10
);

assert.equal(
  last.items.length,
  5
);

assert.equal(
  last.pagination.hasNext,
  false
);

assert.equal(
  last.pagination.hasPrevious,
  true
);

console.log("Discovery pagination tests passed");

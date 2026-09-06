import crypto from "crypto";

function hashValue(value) {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
}

function seededRandom(seed) {
  let state =
    parseInt(
      hashValue(seed).slice(0, 8),
      16
    );

  return () => {
    state =
      (state * 1664525 + 1013904223) %
      4294967296;

    return state / 4294967296;
  };
}

function shuffle(items, seed = "fashion-ai") {
  const result = [...items];
  const random = seededRandom(seed);

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const target =
      Math.floor(
        random() * (index + 1)
      );

    [
      result[index],
      result[target]
    ] = [
      result[target],
      result[index]
    ];
  }

  return result;
}

function splitDataset(
  items,
  ratios = {
    train: 0.7,
    validation: 0.15,
    test: 0.15
  },
  seed = "fashion-ai"
) {
  if (!Array.isArray(items)) {
    return {
      train: [],
      validation: [],
      test: []
    };
  }

  const shuffled =
    shuffle(items, seed);

  const trainEnd =
    Math.floor(
      shuffled.length *
        ratios.train
    );

  const validationEnd =
    trainEnd +
    Math.floor(
      shuffled.length *
        ratios.validation
    );

  return {
    train:
      shuffled.slice(
        0,
        trainEnd
      ),
    validation:
      shuffled.slice(
        trainEnd,
        validationEnd
      ),
    test:
      shuffled.slice(
        validationEnd
      )
  };
}

function createSplitManifest(
  items,
  split,
  seed
) {
  return {
    seed,
    total:
      Array.isArray(items)
        ? items.length
        : 0,
    train: split.train.length,
    validation:
      split.validation.length,
    test: split.test.length,
    datasetHash:
      hashValue(
        JSON.stringify(items)
      ),
    trainIds:
      split.train.map(
        item => item.id
      ),
    validationIds:
      split.validation.map(
        item => item.id
      ),
    testIds:
      split.test.map(
        item => item.id
      )
  };
}

export {
  hashValue,
  seededRandom,
  shuffle,
  splitDataset,
  createSplitManifest
};

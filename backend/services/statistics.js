function numericValues(values) {
  return values
    .map(Number)
    .filter(Number.isFinite);
}

function mean(values) {
  const valid = numericValues(values);

  if (!valid.length) {
    return 0;
  }

  return valid.reduce(
    (sum, value) => sum + value,
    0
  ) / valid.length;
}

function variance(values) {
  const valid = numericValues(values);

  if (valid.length < 2) {
    return 0;
  }

  const average = mean(valid);

  return valid.reduce(
    (sum, value) =>
      sum + Math.pow(value - average, 2),
    0
  ) / (valid.length - 1);
}

function standardDeviation(values) {
  return Math.sqrt(variance(values));
}

function standardError(values) {
  const valid = numericValues(values);

  if (!valid.length) {
    return 0;
  }

  return (
    standardDeviation(valid) /
    Math.sqrt(valid.length)
  );
}

function createRandom(seed = 42) {
  let state = seed >>> 0;

  return function random() {
    state =
      (state * 1664525 + 1013904223) >>>
      0;

    return state / 4294967296;
  };
}

function bootstrapMean(
  values,
  iterations = 2000,
  seed = 42
) {
  const valid = numericValues(values);

  if (!valid.length) {
    return {
      mean: 0,
      lower: 0,
      upper: 0
    };
  }

  const random = createRandom(seed);
  const samples = [];

  for (
    let iteration = 0;
    iteration < iterations;
    iteration += 1
  ) {
    const sample = [];

    for (
      let index = 0;
      index < valid.length;
      index += 1
    ) {
      const target = Math.floor(
        random() * valid.length
      );

      sample.push(valid[target]);
    }

    samples.push(mean(sample));
  }

  samples.sort((a, b) => a - b);

  const lowerIndex = Math.floor(
    samples.length * 0.025
  );

  const upperIndex = Math.floor(
    samples.length * 0.975
  );

  return {
    mean: mean(valid),
    lower: samples[lowerIndex],
    upper:
      samples[
        Math.min(
          upperIndex,
          samples.length - 1
        )
      ]
  };
}

function bootstrapDifference(
  systemA,
  systemB,
  iterations = 2000,
  seed = 42
) {
  const length = Math.min(
    systemA.length,
    systemB.length
  );

  const differences = [];

  for (
    let index = 0;
    index < length;
    index += 1
  ) {
    const a = Number(systemA[index]);
    const b = Number(systemB[index]);

    if (
      Number.isFinite(a) &&
      Number.isFinite(b)
    ) {
      differences.push(a - b);
    }
  }

  if (!differences.length) {
    return {
      mean: 0,
      lower: 0,
      upper: 0,
      samples: []
    };
  }

  const random = createRandom(seed);
  const samples = [];

  for (
    let iteration = 0;
    iteration < iterations;
    iteration += 1
  ) {
    const sample = [];

    for (
      let index = 0;
      index < differences.length;
      index += 1
    ) {
      const target = Math.floor(
        random() * differences.length
      );

      sample.push(differences[target]);
    }

    samples.push(mean(sample));
  }

  samples.sort((a, b) => a - b);

  const lowerIndex = Math.floor(
    samples.length * 0.025
  );

  const upperIndex = Math.floor(
    samples.length * 0.975
  );

  return {
    mean: mean(differences),
    lower: samples[lowerIndex],
    upper:
      samples[
        Math.min(
          upperIndex,
          samples.length - 1
        )
      ],
    samples: differences
  };
}

function compareMetricSamples(
  systemA,
  systemB
) {
  const comparison =
    bootstrapDifference(
      systemA,
      systemB
    );

  const differences =
    comparison.samples;

  const meanDifference =
    comparison.mean;

  const baselineMean =
    mean(systemB);

  const relativeImprovement =
    baselineMean === 0
      ? 0
      : meanDifference /
        Math.abs(baselineMean);

  const differenceStd =
    standardDeviation(differences);

  const effectSize =
    differenceStd === 0
      ? 0
      : meanDifference /
        differenceStd;

  return {
    meanDifference,
    standardDeviation: differenceStd,
    standardError:
      standardError(differences),
    relativeImprovement,
    effectSize,
    confidenceInterval95: {
      lower: comparison.lower,
      upper: comparison.upper
    },
    samples: differences
  };
}

function summarizeMetric(values) {
  const valid = numericValues(values);
  const confidence =
    bootstrapMean(valid);

  return {
    mean: confidence.mean,
    standardDeviation:
      standardDeviation(valid),
    standardError:
      standardError(valid),
    confidenceInterval95: {
      lower: confidence.lower,
      upper: confidence.upper
    },
    samples: valid.length
  };
}

export {
  mean,
  variance,
  standardDeviation,
  standardError,
  bootstrapMean,
  bootstrapDifference,
  compareMetricSamples,
  summarizeMetric
};

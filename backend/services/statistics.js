function mean(values) {
  const valid =
    values
      .map(Number)
      .filter(Number.isFinite);

  if (!valid.length) {
    return 0;
  }

  return (
    valid.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / valid.length
  );
}

function variance(values) {
  const valid =
    values
      .map(Number)
      .filter(Number.isFinite);

  if (valid.length < 2) {
    return 0;
  }

  const average =
    mean(valid);

  return (
    valid.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - average,
          2
        ),
      0
    ) /
    (valid.length - 1)
  );
}

function standardDeviation(
  values
) {
  return Math.sqrt(
    variance(values)
  );
}

function standardError(
  values
) {
  if (!values.length) {
    return 0;
  }

  return (
    standardDeviation(
      values
    ) /
    Math.sqrt(values.length)
  );
}

function bootstrapMean(
  values,
  iterations = 1000,
  seed = 42
) {
  const valid =
    values
      .map(Number)
      .filter(Number.isFinite);

  if (!valid.length) {
    return {
      mean: 0,
      lower: 0,
      upper: 0
    };
  }

  let state = seed >>> 0;

  function random() {
    state =
      (state * 1664525 +
        1013904223) >>>
      0;

    return (
      state / 4294967296
    );
  }

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
      const target =
        Math.floor(
          random() *
            valid.length
        );

      sample.push(
        valid[target]
      );
    }

    samples.push(
      mean(sample)
    );
  }

  samples.sort(
    (a, b) => a - b
  );

  const lowerIndex =
    Math.floor(
      samples.length * 0.025
    );

  const upperIndex =
    Math.floor(
      samples.length * 0.975
    );

  return {
    mean: mean(valid),
    lower:
      samples[lowerIndex],
    upper:
      samples[
        Math.min(
          upperIndex,
          samples.length - 1
        )
      ]
  };
}

function compareMetricSamples(
  systemA,
  systemB
) {
  const length =
    Math.min(
      systemA.length,
      systemB.length
    );

  const differences = [];

  for (
    let index = 0;
    index < length;
    index += 1
  ) {
    differences.push(
      Number(systemA[index]) -
      Number(systemB[index])
    );
  }

  return {
    meanDifference:
      mean(differences),
    standardDeviation:
      standardDeviation(
        differences
      ),
    standardError:
      standardError(
        differences
      ),
    samples: differences
  };
}

function summarizeMetric(
  values
) {
  const confidence =
    bootstrapMean(values);

  return {
    mean: confidence.mean,
    standardDeviation:
      standardDeviation(values),
    standardError:
      standardError(values),
    confidenceInterval95: {
      lower: confidence.lower,
      upper: confidence.upper
    }
  };
}

export {
  mean,
  variance,
  standardDeviation,
  standardError,
  bootstrapMean,
  compareMetricSamples,
  summarizeMetric
};

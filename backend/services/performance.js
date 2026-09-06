import { performance } from "node:perf_hooks";

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);

  if (!sorted.length) {
    return 0;
  }

  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function summarizeLatency(samples) {
  const values = samples
    .map(Number)
    .filter(Number.isFinite);

  if (!values.length) {
    return {
      count: 0,
      mean: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    count: values.length,
    mean: total / values.length,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

async function benchmark(name, fn, iterations = 20) {
  const samples = [];

  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();

    await fn();

    samples.push(performance.now() - start);
  }

  return {
    name,
    iterations,
    latency: summarizeLatency(samples)
  };
}

async function runPerformanceBenchmark(tasks, iterations = 20) {
  const results = [];

  for (const task of tasks) {
    results.push(
      await benchmark(task.name, task.fn, iterations)
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    iterations,
    results
  };
}

function compareLatency(before, after) {
  const baseline = Number(before);
  const current = Number(after);

  if (!Number.isFinite(baseline) || !Number.isFinite(current) || baseline === 0) {
    return {
      improvement: 0,
      regression: 0
    };
  }

  const change = ((current - baseline) / baseline) * 100;

  return {
    improvement: change < 0 ? Math.abs(change) : 0,
    regression: change > 0 ? change : 0
  };
}

function memorySnapshot() {
  const memory = process.memoryUsage();

  return {
    rss: memory.rss,
    heapTotal: memory.heapTotal,
    heapUsed: memory.heapUsed,
    external: memory.external,
    arrayBuffers: memory.arrayBuffers
  };
}

export {
  percentile,
  summarizeLatency,
  benchmark,
  runPerformanceBenchmark,
  compareLatency,
  memorySnapshot
};

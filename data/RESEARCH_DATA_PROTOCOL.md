# Research data protocol

## Human relevance

The committed human-label file intentionally contains no fabricated labels.

1. Annotator A selects A in annotation.html, labels the frozen tasks, and exports JSON.
2. Annotator B repeats independently with B.
3. Run: node research-validation.js annotatorA.json annotatorB.json
4. Record Cohen's kappa before adjudication.
5. Freeze a held-out test split.
6. Train and evaluate AGMR only on the resulting human-labelled split.

## DeepFashion2

DeepFashion2 is not bundled in this repository. The official project requires completing its download process and obtaining an unzip password. Do not commit restricted dataset files.

After lawful local acquisition:
python data/deepfashion2_adapter.py /path/to/DeepFashion2 --output deepfashion2_manifest.json

Do not report DeepFashion2 metrics until the benchmark has actually been indexed and evaluated.

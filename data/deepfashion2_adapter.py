"""DeepFashion2 ingestion manifest helper.

This script never downloads the dataset and never fabricates catalogue rows.
Point it at a legitimately obtained DeepFashion2 directory, then use the
generated manifest for a reproducible image/retrieval experiment.
"""
from pathlib import Path
import json, argparse, hashlib

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def build_manifest(root):
    root = Path(root)
    images = sorted([p for p in root.rglob("*") if p.suffix.lower() in {".jpg",".jpeg",".png"}])
    return {
        "dataset": "DeepFashion2",
        "root": str(root),
        "image_count": len(images),
        "images": [{"path": str(p.relative_to(root)), "sha256": sha256_file(p)} for p in images],
        "status": "indexed_locally",
        "note": "Metadata only; run task-specific parsing/evaluation separately."
    }

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("root")
    ap.add_argument("--output", default="deepfashion2_manifest.json")
    args = ap.parse_args()
    manifest = build_manifest(args.root)
    Path(args.output).write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Indexed {manifest['image_count']} images -> {args.output}")

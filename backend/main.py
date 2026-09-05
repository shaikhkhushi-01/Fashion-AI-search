from pathlib import Path
import json
import hashlib
import os

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
PRODUCTS_FILE = PROJECT_DIR / "data" / "products.json"
CACHE_DIR = BASE_DIR / ".cache"
EMBEDDINGS_FILE = CACHE_DIR / "product_embeddings.npy"
METADATA_FILE = CACHE_DIR / "embedding_metadata.json"

MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2"
)

app = FastAPI(
    title="Fashion AI Semantic Retrieval API",
    version="1.0.0"
)

model = None
products = []
embeddings = None
catalog_hash = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=10, ge=1, le=100)


class SearchResult(BaseModel):
    product: dict
    score: float
    rank: int


class SearchResponse(BaseModel):
    query: str
    model: str
    top_k: int
    results: list[SearchResult]


def normalize_value(value):
    if value is None:
        return ""

    if isinstance(value, list):
        return " ".join(
            str(item).strip()
            for item in value
            if str(item).strip()
        )

    return str(value).strip()


def normalize_product(product):
    normalized = dict(product)

    for key in [
        "brand",
        "name",
        "category",
        "gender",
        "color",
        "material",
        "style",
        "occasion",
        "description"
    ]:
        normalized[key] = normalize_value(
            normalized.get(key)
        )

    tags = normalized.get("tags", [])

    if isinstance(tags, list):
        normalized["tags"] = [
            str(tag).strip()
            for tag in tags
            if str(tag).strip()
        ]
    elif tags:
        normalized["tags"] = [
            str(tags).strip()
        ]
    else:
        normalized["tags"] = []

    return normalized


def build_product_text(product):
    fields = [
        ("brand", product.get("brand")),
        ("product", product.get("name")),
        ("category", product.get("category")),
        ("gender", product.get("gender")),
        ("color", product.get("color")),
        ("material", product.get("material")),
        ("style", product.get("style")),
        ("occasion", product.get("occasion")),
        ("tags", product.get("tags")),
        ("description", product.get("description"))
    ]

    parts = []

    for label, value in fields:
        normalized = normalize_value(value)

        if normalized:
            parts.append(
                f"{label}: {normalized}"
            )

    return " | ".join(parts)


def load_products():
    global products

    if not PRODUCTS_FILE.exists():
        raise FileNotFoundError(
            f"Products file not found: {PRODUCTS_FILE}"
        )

    with PRODUCTS_FILE.open(
        "r",
        encoding="utf-8"
    ) as file:
        raw_products = json.load(file)

    if not isinstance(raw_products, list):
        raise ValueError(
            "products.json must contain a JSON array"
        )

    products = [
        normalize_product(product)
        for product in raw_products
        if isinstance(product, dict)
    ]

    if not products:
        raise ValueError(
            "products.json contains no valid products"
        )


def calculate_catalog_hash():
    payload = json.dumps(
        [
            {
                "id": product.get("id"),
                "text": build_product_text(product)
            }
            for product in products
        ],
        sort_keys=True,
        ensure_ascii=False
    )

    return hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()


def load_model():
    global model

    model = SentenceTransformer(
        MODEL_NAME
    )


def save_embeddings():
    CACHE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    np.save(
        EMBEDDINGS_FILE,
        embeddings
    )

    metadata = {
        "model": MODEL_NAME,
        "catalog_hash": catalog_hash,
        "product_count": len(products),
        "embedding_dimension": int(
            embeddings.shape[1]
        ),
        "product_ids": [
            str(product.get("id"))
            for product in products
        ]
    }

    with METADATA_FILE.open(
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            metadata,
            file,
            indent=2
        )


def load_cached_embeddings():
    if not EMBEDDINGS_FILE.exists():
        return None

    if not METADATA_FILE.exists():
        return None

    try:
        with METADATA_FILE.open(
            "r",
            encoding="utf-8"
        ) as file:
            metadata = json.load(file)

        if metadata.get("model") != MODEL_NAME:
            return None

        if metadata.get(
            "catalog_hash"
        ) != catalog_hash:
            return None

        cached = np.load(
            EMBEDDINGS_FILE
        )

        if cached.ndim != 2:
            return None

        if cached.shape[0] != len(products):
            return None

        return cached.astype(
            np.float32
        )

    except Exception:
        return None


def build_embeddings():
    global embeddings

    cached = load_cached_embeddings()

    if cached is not None:
        embeddings = cached
        return

    texts = [
        build_product_text(product)
        for product in products
    ]

    embeddings = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=False,
        normalize_embeddings=True,
        convert_to_numpy=True
    ).astype(np.float32)

    save_embeddings()


def initialize():
    global catalog_hash

    load_products()
    catalog_hash = calculate_catalog_hash()
    load_model()
    build_embeddings()


def semantic_search(
    query,
    top_k=10
):
    if not query.strip():
        raise ValueError(
            "Query cannot be empty"
        )

    if embeddings is None:
        raise RuntimeError(
            "Semantic index is not initialized"
        )

    query_embedding = model.encode(
        [query],
        normalize_embeddings=True,
        convert_to_numpy=True
    ).astype(np.float32)[0]

    scores = np.dot(
        embeddings,
        query_embedding
    )

    ranked_indices = np.argsort(
        -scores
    )[:top_k]

    results = []

    for rank, index in enumerate(
        ranked_indices,
        start=1
    ):
        results.append(
            {
                "product": products[int(index)],
                "score": round(
                    float(scores[index]),
                    6
                ),
                "rank": rank
            }
        )

    return results


@app.on_event("startup")
def startup_event():
    initialize()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "products": len(products),
        "embedding_dimension": (
            int(embeddings.shape[1])
            if embeddings is not None
            else 0
        ),
        "index_ready": embeddings is not None
    }


@app.get("/api/products")
def product_info():
    return {
        "count": len(products),
        "model": MODEL_NAME,
        "embedding_dimension": (
            int(embeddings.shape[1])
            if embeddings is not None
            else 0
        )
    }


@app.post(
    "/api/semantic-search",
    response_model=SearchResponse
)
def semantic_search_endpoint(
    request: SearchRequest
):
    try:
        results = semantic_search(
            request.query,
            request.top_k
        )

        return {
            "query": request.query,
            "model": MODEL_NAME,
            "top_k": request.top_k,
            "results": results
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.post(
    "/api/search",
    response_model=SearchResponse
)
def search_endpoint(
    request: SearchRequest
):
    return semantic_search_endpoint(
        request
    )

from pathlib import Path
from typing import Optional
import hashlib
import json
import re

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
PRODUCTS_FILE = PROJECT_DIR / "data" / "products.json"
CACHE_DIR = BASE_DIR / ".cache"
EMBEDDINGS_FILE = CACHE_DIR / "product_embeddings.npy"
EMBEDDINGS_META_FILE = CACHE_DIR / "product_embeddings.meta.json"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

app = FastAPI(
    title="Fashion AI Discovery AI Service",
    description="Semantic retrieval service for Fashion AI Discovery.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def load_products():
    if not PRODUCTS_FILE.exists():
        raise RuntimeError(
            f"Product dataset was not found at {PRODUCTS_FILE}"
        )

    with open(PRODUCTS_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise RuntimeError("products.json must contain an array.")

    return data


products = load_products()


def normalize(value) -> str:
    if value is None:
        return ""

    return re.sub(
        r"\s+",
        " ",
        str(value).lower().strip()
    )


def array_to_text(value) -> str:
    if isinstance(value, list):
        return ", ".join(
            normalize(item)
            for item in value
            if str(item).strip()
        )

    return normalize(value)


def product_to_ai_text(product):
    return " ".join(
        [
            f"brand {normalize(product.get('brand'))}",
            f"product {normalize(product.get('name'))}",
            f"category {normalize(product.get('category'))}",
            f"gender {normalize(product.get('gender'))}",
            f"colour {normalize(product.get('color'))}",
            f"material {array_to_text(product.get('material'))}",
            f"style {array_to_text(product.get('style'))}",
            f"occasion {array_to_text(product.get('occasion'))}",
            f"tags {array_to_text(product.get('tags'))}",
            f"description {normalize(product.get('description'))}"
        ]
    )


def dataset_signature(items):
    payload = json.dumps(
        [
            {
                "id": product.get("id"),
                "brand": product.get("brand"),
                "name": product.get("name"),
                "category": product.get("category"),
                "gender": product.get("gender"),
                "color": product.get("color"),
                "material": product.get("material"),
                "style": product.get("style"),
                "occasion": product.get("occasion"),
                "tags": product.get("tags"),
                "description": product.get("description")
            }
            for product in items
        ],
        sort_keys=True,
        ensure_ascii=False
    )

    return hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()


model = SentenceTransformer(MODEL_NAME)

product_texts = [
    product_to_ai_text(product)
    for product in products
]

current_signature = dataset_signature(products)


def build_embeddings():
    CACHE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    embeddings = model.encode(
        product_texts,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True
    )

    embeddings = np.asarray(
        embeddings,
        dtype=np.float32
    )

    np.save(
        EMBEDDINGS_FILE,
        embeddings
    )

    with open(
        EMBEDDINGS_META_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            {
                "model": MODEL_NAME,
                "dataset_signature": current_signature,
                "product_count": len(products),
                "embedding_dimension": int(embeddings.shape[1])
            },
            file,
            indent=2
        )

    return embeddings


def load_or_build_embeddings():
    if (
        EMBEDDINGS_FILE.exists()
        and EMBEDDINGS_META_FILE.exists()
    ):
        try:
            with open(
                EMBEDDINGS_META_FILE,
                "r",
                encoding="utf-8"
            ) as file:
                metadata = json.load(file)

            if (
                metadata.get("model") == MODEL_NAME
                and metadata.get("dataset_signature") == current_signature
                and metadata.get("product_count") == len(products)
            ):
                embeddings = np.load(
                    EMBEDDINGS_FILE
                )

                if (
                    embeddings.ndim == 2
                    and embeddings.shape[0] == len(products)
                ):
                    return np.asarray(
                        embeddings,
                        dtype=np.float32
                    )
        except Exception:
            pass

    return build_embeddings()


product_embeddings = load_or_build_embeddings()


class SearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=500
    )

    limit: int = Field(
        default=10,
        ge=1,
        le=50
    )


class StylistRequest(BaseModel):
    occasion: Optional[str] = ""
    style: Optional[str] = ""
    comfort: Optional[str] = ""
    color: Optional[str] = ""
    budget: Optional[float] = None
    description: Optional[str] = ""


def semantic_search(
    query: str,
    limit: int = 10
):
    query = query.strip()

    if not query:
        return []

    query_embedding = model.encode(
        [query],
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True
    )[0]

    query_embedding = np.asarray(
        query_embedding,
        dtype=np.float32
    )

    similarities = product_embeddings @ query_embedding

    ranking = np.argsort(
        similarities
    )[::-1]

    results = []

    for position, index in enumerate(
        ranking[:limit],
        start=1
    ):
        product = dict(
            products[int(index)]
        )

        score = float(
            similarities[int(index)]
        )

        score = max(
            -1.0,
            min(
                score,
                1.0
            )
        )

        normalized_score = (
            score + 1.0
        ) / 2.0

        product["semantic_score"] = round(
            normalized_score,
            4
        )

        product["ai_match_score"] = round(
            normalized_score * 100,
            2
        )

        product["semantic_rank"] = position

        product["retrieval_model"] = MODEL_NAME

        results.append(product)

    return results


def stylist_search(request: StylistRequest):
    parts = [
        request.occasion,
        request.style,
        request.comfort,
        request.color,
        request.description
    ]

    if request.budget is not None:
        parts.append(
            f"under {request.budget} INR"
        )

    query = " ".join(
        str(part).strip()
        for part in parts
        if part and str(part).strip()
    )

    if not query:
        raise HTTPException(
            status_code=400,
            detail="At least one styling preference is required."
        )

    results = semantic_search(
        query,
        10
    )

    if request.budget is not None:
        budget = float(
            request.budget
        )

        for product in results:
            price = float(
                product.get("price", 0)
            )

            if price <= budget:
                product["budget_fit"] = 1.0
            else:
                difference = (
                    price - budget
                ) / max(
                    budget,
                    1.0
                )

                product["budget_fit"] = round(
                    max(
                        0.0,
                        1.0 - difference
                    ),
                    4
                )

        results.sort(
            key=lambda item: (
                0.7 * float(
                    item.get(
                        "semantic_score",
                        0
                    )
                )
                +
                0.3 * float(
                    item.get(
                        "budget_fit",
                        0
                    )
                )
            ),
            reverse=True
        )

    return query, results


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Fashion AI Discovery AI Service",
        "model": MODEL_NAME,
        "retrieval": "semantic_embedding",
        "products": len(products),
        "embedding_dimension": int(
            product_embeddings.shape[1]
        )
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "dataset_loaded": len(products) > 0,
        "product_count": len(products),
        "embedding_count": int(
            product_embeddings.shape[0]
        ),
        "embedding_dimension": int(
            product_embeddings.shape[1]
        )
    }


@app.get("/api/products")
def get_products():
    return {
        "success": True,
        "count": len(products),
        "products": products
    }


@app.post("/api/semantic-search")
def semantic_search_endpoint(
    request: SearchRequest
):
    query = request.query.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query is required."
        )

    results = semantic_search(
        query,
        request.limit
    )

    return {
        "success": True,
        "query": query,
        "search_type": "semantic_embedding",
        "model": MODEL_NAME,
        "count": len(results),
        "results": results
    }


@app.post("/api/search")
def search(
    request: SearchRequest
):
    return semantic_search_endpoint(
        request
    )


@app.post("/api/stylist")
def stylist(
    request: StylistRequest
):
    query, results = stylist_search(
        request
    )

    return {
        "success": True,
        "mode": "ai_stylist",
        "query": query,
        "preferences": {
            "occasion": request.occasion,
            "style": request.style,
            "comfort": request.comfort,
            "color": request.color,
            "budget": request.budget,
            "description": request.description
        },
        "count": len(results),
        "recommendations": results
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )

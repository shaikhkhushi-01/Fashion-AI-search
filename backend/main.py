from pathlib import Path
from typing import Optional

import json
import re

import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from sentence_transformers import SentenceTransformer


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

PRODUCTS_FILE = (
    BASE_DIR
    / "data"
    / "products.json"
)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Fashion AI Discovery API",
    description=(
        "AI-powered semantic fashion discovery "
        "and recommendation backend."
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# LOAD PRODUCTS
# =========================================================

def load_products():

    if not PRODUCTS_FILE.exists():

        raise RuntimeError(
            "products.json was not found."
        )

    with open(
        PRODUCTS_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        data = json.load(file)

    if not isinstance(data, list):

        raise RuntimeError(
            "products.json must contain an array."
        )

    return data


products = load_products()


# =========================================================
# AI MODEL
# =========================================================

print(
    f"Loading AI embedding model: {MODEL_NAME}"
)

model = SentenceTransformer(
    MODEL_NAME
)

print(
    "AI embedding model loaded successfully."
)


# =========================================================
# TEXT HELPERS
# =========================================================

def normalize(value) -> str:

    if value is None:
        return ""

    return re.sub(
        r"\s+",
        " ",
        str(value)
        .lower()
        .strip()
    )


def array_to_text(value):

    if isinstance(value, list):

        return ", ".join(
            str(item)
            for item in value
        )

    return str(value or "")


# =========================================================
# PRODUCT REPRESENTATION
# =========================================================

def product_to_ai_text(product):

    return (
        f"Brand {product.get('brand', '')}. "
        f"Product {product.get('name', '')}. "
        f"Category {product.get('category', '')}. "
        f"Gender {product.get('gender', '')}. "
        f"Colour {product.get('color', '')}. "
        f"Material "
        f"{array_to_text(product.get('material'))}. "
        f"Style "
        f"{array_to_text(product.get('style'))}. "
        f"Occasion "
        f"{array_to_text(product.get('occasion'))}. "
        f"Tags "
        f"{array_to_text(product.get('tags'))}. "
        f"Description "
        f"{product.get('description', '')}."
    )


# =========================================================
# BUILD PRODUCT EMBEDDINGS
# =========================================================

product_texts = [
    product_to_ai_text(product)
    for product in products
]


print(
    f"Creating embeddings for "
    f"{len(product_texts)} products..."
)


product_embeddings = model.encode(
    product_texts,
    normalize_embeddings=True,
    show_progress_bar=False
)


product_embeddings = np.asarray(
    product_embeddings,
    dtype=np.float32
)


print(
    "Product embeddings created."
)


# =========================================================
# REQUEST MODELS
# =========================================================

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


# =========================================================
# SEMANTIC SEARCH
# =========================================================

def semantic_search(
    query: str,
    limit: int = 10
):

    query_embedding = model.encode(
        [query],
        normalize_embeddings=True,
        show_progress_bar=False
    )[0]

    query_embedding = np.asarray(
        query_embedding,
        dtype=np.float32
    )

    similarities = (
        product_embeddings
        @ query_embedding
    )

    ranking = np.argsort(
        similarities
    )[::-1]

    results = []

    for index in ranking[:limit]:

        product = dict(
            products[int(index)]
        )

        score = float(
            similarities[int(index)]
        )

        score = max(
            0.0,
            min(
                score,
                1.0
            )
        )

        product["ai_match_score"] = round(
            score * 100,
            2
        )

        product["semantic_score"] = round(
            score,
            4
        )

        product["ai_reason"] = (
            "This product was retrieved "
            "because its fashion attributes "
            "are semantically related to "
            "your request."
        )

        results.append(product)

    return results


# =========================================================
# HEALTH
# =========================================================

@app.get("/")
def health():

    return {

        "status": "online",

        "service":
            "Fashion AI Discovery",

        "ai":
            "semantic-search",

        "model":
            MODEL_NAME,

        "products":
            len(products),

        "endpoints": [

            "GET /",

            "GET /api/products",

            "POST /api/search",

            "POST /api/stylist"

        ]

    }


# =========================================================
# PRODUCTS
# =========================================================

@app.get("/api/products")
def get_products():

    return {

        "success": True,

        "count":
            len(products),

        "products":
            products

    }


# =========================================================
# AI SEARCH
# =========================================================

@app.post("/api/search")
def search(request: SearchRequest):

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

        "query":
            query,

        "search_type":
            "semantic_ai",

        "model":
            MODEL_NAME,

        "count":
            len(results),

        "results":
            results

    }


# =========================================================
# AI STYLIST
# =========================================================

@app.post("/api/stylist")
def stylist(request: StylistRequest):

    preference_parts = [

        request.occasion,

        request.style,

        request.comfort,

        request.color,

        request.description

    ]

    if request.budget is not None:

        preference_parts.append(
            f"under {request.budget} INR"
        )


    query = " ".join(
        part.strip()
        for part in preference_parts
        if part and part.strip()
    )


    if not query:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least one styling "
                "preference is required."
            )
        )


    results = semantic_search(
        query,
        10
    )


    # -----------------------------------------
    # BUDGET RE-RANKING
    # -----------------------------------------

    if request.budget is not None:

        budget = float(
            request.budget
        )

        for product in results:

            price = float(
                product.get(
                    "price",
                    0
                )
            )

            if price <= budget:

                product[
                    "ai_match_score"
                ] = min(
                    100,
                    product[
                        "ai_match_score"
                    ] + 8
                )

            else:

                product[
                    "ai_match_score"
                ] = max(
                    0,
                    product[
                        "ai_match_score"
                    ] - 8
                )


        results.sort(
            key=lambda item:
                item["ai_match_score"],
            reverse=True
        )


    return {

        "success": True,

        "mode":
            "ai_stylist",

        "query":
            query,

        "preferences": {

            "occasion":
                request.occasion,

            "style":
                request.style,

            "comfort":
                request.comfort,

            "color":
                request.color,

            "budget":
                request.budget,

            "description":
                request.description

        },

        "count":
            len(results),

        "recommendations":
            results

    }


# =========================================================
# SERVER
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )

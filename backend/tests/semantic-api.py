import json
import sys
import urllib.request
from pathlib import Path


BASE_URL = "http://127.0.0.1:8000"


def request(
    method,
    path,
    payload=None
):
    data = None

    if payload is not None:
        data = json.dumps(
            payload
        ).encode("utf-8")

    request_object = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        method=method,
        headers={
            "Content-Type":
                "application/json"
        }
    )

    with urllib.request.urlopen(
        request_object,
        timeout=30
    ) as response:
        return json.loads(
            response.read().decode(
                "utf-8"
            )
        )


def run():
    health = request(
        "GET",
        "/health"
    )

    assert health["status"] == "ok"
    assert health["index_ready"] is True
    assert health["products"] > 0
    assert (
        health["embedding_dimension"] == 384
    )

    result = request(
        "POST",
        "/api/semantic-search",
        {
            "query":
                "black formal shirt",
            "top_k": 5
        }
    )

    assert result["query"] == (
        "black formal shirt"
    )

    assert result["model"] == (
        "sentence-transformers/"
        "all-MiniLM-L6-v2"
    )

    assert len(
        result["results"]
    ) == 5

    scores = [
        item["score"]
        for item in result["results"]
    ]

    assert scores == sorted(
        scores,
        reverse=True
    )

    print(
        "Semantic API tests passed."
    )


if __name__ == "__main__":
    run()

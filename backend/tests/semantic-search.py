import sys
from pathlib import Path

import numpy as np

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1])
)

import main


def run():
    main.initialize()

    assert main.products
    assert main.embeddings is not None

    assert len(main.products) == (
        main.embeddings.shape[0]
    )

    assert (
        main.embeddings.shape[1] == 384
    )

    test_queries = [
        "black formal shirt",
        "comfortable shoes for college",
        "casual outfit",
        "party dress"
    ]

    for query in test_queries:
        results = main.semantic_search(
            query,
            top_k=5
        )

        assert results

        scores = [
            item["score"]
            for item in results
        ]

        assert scores == sorted(
            scores,
            reverse=True
        )

        assert all(
            np.isfinite(score)
            for score in scores
        )

        assert all(
            -1.0 <= score <= 1.0
            for score in scores
        )

        print(
            f"\nQuery: {query}"
        )

        for result in results:
            product = result["product"]

            print(
                f"{result['rank']}. "
                f"{product.get('name', 'Unknown')} "
                f"| score={result['score']}"
            )

    print(
        "\nSemantic retrieval tests passed."
    )


if __name__ == "__main__":
    run()

import json
import os
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

RESULTS_DIR = os.path.join(
    BASE_DIR,
    "evaluation-results"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "research-results",
    "figures"
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


def load_json(filename):
    path = os.path.join(
        RESULTS_DIR,
        filename
    )

    with open(
        path,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def save_figure(filename):
    path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    plt.tight_layout()
    plt.savefig(
        path,
        dpi=220,
        bbox_inches="tight"
    )
    plt.close()


def generate_baseline_figure():
    report = load_json(
        "baseline-comparison-report.json"
    )

    systems = [
        "keyword",
        "category",
        "price",
        "popularity",
        "lexical",
        "attribute",
        "semantic",
        "hybrid"
    ]

    labels = [
        "Keyword",
        "Category",
        "Price",
        "Popularity",
        "Lexical",
        "Attribute",
        "Semantic",
        "Hybrid"
    ]

    mrr = [
        report["systems"][system]["mrr"]
        for system in systems
    ]

    ndcg = [
        report["systems"][system]["ndcgAtK"]
        for system in systems
    ]

    x = range(len(labels))
    width = 0.38

    plt.figure(figsize=(11, 6))

    plt.bar(
        [value - width / 2 for value in x],
        mrr,
        width=width,
        label="MRR"
    )

    plt.bar(
        [value + width / 2 for value in x],
        ndcg,
        width=width,
        label="NDCG@5"
    )

    plt.xticks(
        list(x),
        labels,
        rotation=30,
        ha="right"
    )

    plt.ylabel("Score")
    plt.xlabel("Retrieval System")
    plt.title(
        "Fashion Retrieval Baseline Comparison"
    )

    plt.legend()
    plt.ylim(0, 1.05)

    save_figure(
        "baseline-comparison.png"
    )


def generate_ablation_figure():
    report = load_json(
        "ablation-report.json"
    )

    configurations = [
        "lexical-only",
        "lexical-budget",
        "semantic-attributes",
        "lexical-attributes",
        "full-hybrid",
        "semantic-only"
    ]

    labels = [
        "Lexical",
        "Lexical + Budget",
        "Semantic + Attributes",
        "Lexical + Attributes",
        "Full Hybrid",
        "Semantic"
    ]

    results = report["results"]

    mrr = [
        results[name]["metrics"]["mrr"]
        for name in configurations
    ]

    ndcg = [
        results[name]["metrics"]["ndcgAtK"]
        for name in configurations
    ]

    x = range(len(labels))
    width = 0.38

    plt.figure(figsize=(11, 6))

    plt.bar(
        [value - width / 2 for value in x],
        mrr,
        width=width,
        label="MRR"
    )

    plt.bar(
        [value + width / 2 for value in x],
        ndcg,
        width=width,
        label="NDCG@5"
    )

    plt.xticks(
        list(x),
        labels,
        rotation=30,
        ha="right"
    )

    plt.ylabel("Score")
    plt.xlabel("Ablation Configuration")
    plt.title(
        "Controlled Ablation Study"
    )

    plt.legend()
    plt.ylim(0, 1.05)

    save_figure(
        "ablation-study.png"
    )


def generate_statistical_figure():
    report = load_json(
        "statistical-analysis-report.json"
    )

    comparisons = [
        "hybrid_vs_lexical",
        "hybrid_vs_semantic",
        "hybrid_vs_keyword"
    ]

    labels = [
        "Hybrid vs Lexical",
        "Hybrid vs Semantic",
        "Hybrid vs Keyword"
    ]

    differences = []
    lower = []
    upper = []

    comparison_data = report[
        "methodology"
    ]["comparisons"]

    for comparison in comparisons:
        metric = comparison_data[
            comparison
        ]["metrics"]["ndcgAtK"]

        differences.append(
            metric["meanDifference"]
        )

        lower.append(
            metric[
                "confidenceInterval95"
            ]["lower"]
        )

        upper.append(
            metric[
                "confidenceInterval95"
            ]["upper"]
        )

    x = list(range(len(labels)))

    lower_errors = [
        differences[i] - lower[i]
        for i in range(len(differences))
    ]

    upper_errors = [
        upper[i] - differences[i]
        for i in range(len(differences))
    ]

    plt.figure(figsize=(10, 6))

    plt.errorbar(
        x,
        differences,
        yerr=[
            lower_errors,
            upper_errors
        ],
        fmt="o",
        capsize=6
    )

    plt.axhline(
        0,
        linestyle="--"
    )

    plt.xticks(
        x,
        labels,
        rotation=20,
        ha="right"
    )

    plt.ylabel(
        "NDCG@5 Mean Difference"
    )

    plt.xlabel(
        "Comparison"
    )

    plt.title(
        "Hybrid Retrieval Statistical Comparison"
    )

    save_figure(
        "statistical-comparison.png"
    )


def main():
    generate_baseline_figure()
    generate_ablation_figure()
    generate_statistical_figure()

    print(
        "Research figures generated successfully."
    )


if __name__ == "__main__":
    main()

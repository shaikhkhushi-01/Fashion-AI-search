/*
=========================================================
FASHION AI DISCOVERY
DAY 10 — EVALUATION BENCHMARK
=========================================================

Relevance scale:

3 = Highly relevant
2 = Relevant
1 = Weakly relevant
0 = Irrelevant
=========================================================
*/

const evaluationCases = [

  {
    id: "q01",
    query: "black oversized shirt",

    relevance: [
      { productId: 2, relevance: 3 },
      { productId: 4, relevance: 1 },
      { productId: 6, relevance: 1 },
      { productId: 12, relevance: 2 },
      { productId: 14, relevance: 1 }
    ]
  },

  {
    id: "q02",
    query: "white casual shirt",

    relevance: [
      { productId: 1, relevance: 3 },
      { productId: 2, relevance: 3 },
      { productId: 14, relevance: 1 },
      { productId: 16, relevance: 1 }
    ]
  },

  {
    id: "q03",
    query: "summer dress",

    relevance: [
      { productId: 3, relevance: 3 },
      { productId: 7, relevance: 1 },
      { productId: 16, relevance: 2 },
      { productId: 20, relevance: 1 }
    ]
  },

  {
    id: "q04",
    query: "black trousers",

    relevance: [
      { productId: 4, relevance: 3 },
      { productId: 6, relevance: 1 },
      { productId: 17, relevance: 1 }
    ]
  },

  {
    id: "q05",
    query: "comfortable sneakers",

    relevance: [
      { productId: 5, relevance: 3 },
      { productId: 14, relevance: 1 },
      { productId: 19, relevance: 1 }
    ]
  },

  {
    id: "q06",
    query: "black blazer for office",

    relevance: [
      { productId: 6, relevance: 3 },
      { productId: 4, relevance: 1 },
      { productId: 15, relevance: 1 }
    ]
  },

  {
    id: "q07",
    query: "elegant evening dress",

    relevance: [
      { productId: 7, relevance: 3 },
      { productId: 20, relevance: 3 },
      { productId: 17, relevance: 2 },
      { productId: 6, relevance: 1 }
    ]
  },

  {
    id: "q08",
    query: "blue denim jeans",

    relevance: [
      { productId: 8, relevance: 3 },
      { productId: 4, relevance: 1 }
    ]
  },

  {
    id: "q09",
    query: "modest black abaya",

    relevance: [
      { productId: 9, relevance: 3 },
      { productId: 6, relevance: 1 }
    ]
  },

  {
    id: "q10",
    query: "red silk saree",

    relevance: [
      { productId: 10, relevance: 3 },
      { productId: 7, relevance: 1 },
      { productId: 20, relevance: 1 }
    ]
  },

  {
    id: "q11",
    query: "winter coat",

    relevance: [
      { productId: 11, relevance: 3 },
      { productId: 19, relevance: 1 }
    ]
  },

  {
    id: "q12",
    query: "white oversized hoodie",

    relevance: [
      { productId: 12, relevance: 3 },
      { productId: 2, relevance: 2 },
      { productId: 14, relevance: 1 }
    ]
  },

  {
    id: "q13",
    query: "traditional kurta",

    relevance: [
      { productId: 18, relevance: 3 },
      { productId: 13, relevance: 2 },
      { productId: 9, relevance: 1 }
    ]
  },

  {
    id: "q14",
    query: "formal navy suit",

    relevance: [
      { productId: 15, relevance: 3 },
      { productId: 6, relevance: 1 },
      { productId: 11, relevance: 1 }
    ]
  },

  {
    id: "q15",
    query: "party skirt",

    relevance: [
      { productId: 17, relevance: 3 },
      { productId: 7, relevance: 1 },
      { productId: 13, relevance: 1 }
    ]
  }

];

export default evaluationCases;

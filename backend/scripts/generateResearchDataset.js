import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, "..");
const dataDir = path.join(backendDir, "data");
const productsPath = path.join(dataDir, "products.json");
const evaluationPath = path.join(
  backendDir,
  "tests",
  "evaluation-cases.js"
);

const categories = [
  ["T-Shirts", "Apparel", "top", 1499],
  ["Shirts", "Apparel", "top", 2499],
  ["Trousers", "Apparel", "bottom", 2799],
  ["Jeans", "Apparel", "bottom", 2299],
  ["Dresses", "Apparel", "dress", 3299],
  ["Hoodies", "Apparel", "top", 1899],
  ["Sweaters", "Apparel", "top", 2499],
  ["Jackets", "Apparel", "outerwear", 3999],
  ["Blazers", "Apparel", "outerwear", 4999],
  ["Skirts", "Apparel", "bottom", 2299],
  ["Kurtas", "Apparel", "ethnic", 1999],
  ["Kurtis", "Apparel", "ethnic", 2199],
  ["Sarees", "Apparel", "ethnic", 3499],
  ["Sneakers", "Footwear", "footwear", 3999],
  ["Flats", "Footwear", "footwear", 2499],
  ["Boots", "Footwear", "footwear", 4499],
  ["Sandals", "Footwear", "footwear", 1999],
  ["Bags", "Accessories", "accessory", 2999],
  ["Caps", "Accessories", "accessory", 999],
  ["Scarves", "Accessories", "accessory", 1299]
];

const colors = [
  "Black",
  "White",
  "Blue",
  "Grey",
  "Beige",
  "Brown",
  "Navy",
  "Green",
  "Pink",
  "Cream"
];

const styles = [
  "Minimal",
  "Classic",
  "Casual",
  "Relaxed",
  "Oversized",
  "Modern",
  "Elegant",
  "Streetwear",
  "Sporty",
  "Formal"
];

const occasions = [
  "College",
  "Casual",
  "Everyday",
  "Travel",
  "Office",
  "Formal",
  "Party",
  "Date",
  "Wedding",
  "Summer"
];

const materials = [
  "Cotton",
  "Linen",
  "Denim",
  "Polyester",
  "Wool Blend",
  "Satin",
  "Leather",
  "Mesh",
  "Rayon",
  "Canvas"
];

const genders = [
  "Women",
  "Men",
  "Unisex"
];

const brands = [
  "ATELIER",
  "NOVA",
  "FORM",
  "MOTION",
  "STUDIO 09",
  "URBAN FORM",
  "THREAD",
  "MODE",
  "EVERYDAY",
  "EDIT"
];

const sizeSets = {
  top: ["S", "M", "L", "XL"],
  bottom: ["28", "30", "32", "34", "36"],
  dress: ["XS", "S", "M", "L"],
  outerwear: ["S", "M", "L", "XL"],
  ethnic: ["S", "M", "L", "XL"],
  footwear: ["6", "7", "8", "9", "10", "11"],
  accessory: ["One Size"]
};

const styleWords = {
  Minimal: "clean",
  Classic: "timeless",
  Casual: "easygoing",
  Relaxed: "comfortable",
  Oversized: "roomy",
  Modern: "contemporary",
  Elegant: "polished",
  Streetwear: "urban",
  Sporty: "active",
  Formal: "structured"
};

const categoryWords = {
  "T-Shirts": "t-shirt",
  Shirts: "shirt",
  Trousers: "trousers",
  Jeans: "jeans",
  Dresses: "dress",
  Hoodies: "hoodie",
  Sweaters: "sweater",
  Jackets: "jacket",
  Blazers: "blazer",
  Skirts: "skirt",
  Kurtas: "kurta",
  Kurtis: "kurti",
  Sarees: "saree",
  Sneakers: "sneakers",
  Flats: "flats",
  Boots: "boots",
  Sandals: "sandals",
  Bags: "bag",
  Caps: "cap",
  Scarves: "scarf"
};

const priceSteps = [0, 300, 600, 900, 1200];

function choose(list, index) {
  return list[index % list.length];
}

function unique(values) {
  return [...new Set(values)];
}

function buildProduct(index) {
  const categoryIndex = Math.floor(index / 50);
  const variantIndex = index % 50;
  const categoryData = categories[categoryIndex];
  const category = categoryData[0];
  const type = categoryData[2];
  const basePrice = categoryData[3];

  const color = choose(colors, variantIndex);
  const style = choose(styles, variantIndex * 3);
  const occasion = choose(occasions, variantIndex * 5);
  const material = choose(materials, variantIndex * 7);
  const gender = choose(genders, variantIndex * 2);
  const brand = choose(brands, variantIndex * 4);
  const secondaryStyle = choose(
    styles,
    variantIndex * 3 + 2
  );
  const secondaryOccasion = choose(
    occasions,
    variantIndex * 5 + 3
  );

  const price =
    basePrice +
    priceSteps[
      (variantIndex + categoryIndex) %
        priceSteps.length
    ];

  const word = styleWords[style];
  const itemWord = categoryWords[category];

  const name =
    `${word.charAt(0).toUpperCase()}${word.slice(1)} ${color} ${itemWord}`;

  const tags = unique([
    color.toLowerCase(),
    style.toLowerCase(),
    secondaryStyle.toLowerCase(),
    category.toLowerCase(),
    occasion.toLowerCase(),
    secondaryOccasion.toLowerCase(),
    material.toLowerCase()
  ]);

  const description =
    `${word.charAt(0).toUpperCase()}${word.slice(1)} ${color.toLowerCase()} ${itemWord} in ${material.toLowerCase()} designed for ${occasion.toLowerCase()}, ${secondaryOccasion.toLowerCase()} and everyday styling.`;

  return {
    id: index + 1,
    brand,
    name,
    category,
    gender,
    color,
    material: unique([material]),
    style: unique([style, secondaryStyle]),
    occasion: unique([occasion, secondaryOccasion]),
    sizes: sizeSets[type],
    price,
    currency: "INR",
    availability: "In Stock",
    tags,
    description
  };
}

function buildProducts() {
  return Array.from(
    { length: 1000 },
    (_, index) => buildProduct(index)
  );
}

function scoreRelevance(product, constraints) {
  let score = 0;

  if (
    constraints.category &&
    product.category === constraints.category
  ) {
    score += 3;
  }

  if (
    constraints.color &&
    product.color === constraints.color
  ) {
    score += 2;
  }

  if (
    constraints.style &&
    product.style.includes(constraints.style)
  ) {
    score += 2;
  }

  if (
    constraints.occasion &&
    product.occasion.includes(constraints.occasion)
  ) {
    score += 2;
  }

  if (
    constraints.material &&
    product.material.includes(constraints.material)
  ) {
    score += 1;
  }

  if (
    constraints.gender &&
    (
      product.gender === constraints.gender ||
      product.gender === "Unisex"
    )
  ) {
    score += 1;
  }

  if (
    constraints.maxPrice &&
    product.price <= constraints.maxPrice
  ) {
    score += 1;
  }

  return score;
}

function buildEvaluationCase(
  products,
  index
) {
  const product = products[
    (index * 37) % products.length
  ];

  const style =
    product.style[0];

  const occasion =
    product.occasion[0];

  const material =
    product.material[0];

  const queryTypes = [
    "category",
    "color-category",
    "style-category",
    "occasion-category",
    "material-category",
    "budget-category",
    "multi-attribute",
    "semantic"
  ];

  const type =
    queryTypes[index % queryTypes.length];

  let query;
  let constraints;

  if (type === "category") {
    query =
      `${product.category.toLowerCase()} for ${occasion.toLowerCase()}`;

    constraints = {
      category: product.category,
      occasion
    };
  }

  if (type === "color-category") {
    query =
      `${product.color.toLowerCase()} ${product.category.toLowerCase()}`;

    constraints = {
      category: product.category,
      color: product.color
    };
  }

  if (type === "style-category") {
    query =
      `${style.toLowerCase()} ${product.category.toLowerCase()} outfit`;

    constraints = {
      category: product.category,
      style
    };
  }

  if (type === "occasion-category") {
    query =
      `${occasion.toLowerCase()} ${product.category.toLowerCase()}`;

    constraints = {
      category: product.category,
      occasion
    };
  }

  if (type === "material-category") {
    query =
      `${material.toLowerCase()} ${product.category.toLowerCase()}`;

    constraints = {
      category: product.category,
      material
    };
  }

  if (type === "budget-category") {
    const budget =
      Math.max(
        1499,
        Math.round(product.price / 500) * 500
      );

    query =
      `${style.toLowerCase()} ${product.category.toLowerCase()} under ₹${budget}`;

    constraints = {
      category: product.category,
      style,
      maxPrice: budget
    };
  }

  if (type === "multi-attribute") {
    const budget =
      Math.max(
        1999,
        Math.round(product.price / 500) * 500
      );

    query =
      `${product.color.toLowerCase()} ${style.toLowerCase()} ${product.category.toLowerCase()} for ${occasion.toLowerCase()} under ₹${budget}`;

    constraints = {
      category: product.category,
      color: product.color,
      style,
      occasion,
      maxPrice: budget
    };
  }

  if (type === "semantic") {
    const semanticTemplates = [
      `comfortable ${product.category.toLowerCase()} for ${occasion.toLowerCase()}`,
      `clean everyday ${product.category.toLowerCase()} in ${product.color.toLowerCase()}`,
      `smart ${product.category.toLowerCase()} for ${occasion.toLowerCase()}`,
      `easy ${style.toLowerCase()} ${product.category.toLowerCase()}`
    ];

    query =
      semanticTemplates[
        index % semanticTemplates.length
      ];

    constraints = {
      category: product.category,
      occasion
    };
  }

  const scored = products
    .map(item => ({
      id: item.id,
      score: scoreRelevance(
        item,
        constraints
      )
    }))
    .filter(item => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.id - b.id
    );

  const topRelevant =
    scored
      .slice(0, 12)
      .map(item => item.id);

  const relevance = {};

  scored
    .slice(0, 20)
    .forEach(item => {
      relevance[item.id] =
        item.score >= 7
          ? 3
          : item.score >= 5
            ? 2
            : 1;
    });

  return {
    query,
    relevant: topRelevant,
    relevance
  };
}

function buildEvaluationCases(
  products
) {
  return Array.from(
    { length: 250 },
    (_, index) =>
      buildEvaluationCase(
        products,
        index
      )
  );
}

function writeFiles(
  products,
  evaluationCases
) {
  fs.mkdirSync(
    dataDir,
    { recursive: true }
  );

  fs.writeFileSync(
    productsPath,
    `${JSON.stringify(products, null, 2)}\n`,
    "utf8"
  );

  fs.writeFileSync(
    evaluationPath,
    `const evaluationCases = ${JSON.stringify(
      evaluationCases,
      null,
      2
    )};

export {
  evaluationCases
};
`,
    "utf8"
  );
}

function validate(
  products,
  evaluationCases
) {
  const ids =
    new Set(
      products.map(
        product =>
          String(product.id)
      )
    );

  if (
    products.length !== 1000
  ) {
    throw new Error(
      `Expected 1000 products, found ${products.length}`
    );
  }

  if (
    ids.size !== products.length
  ) {
    throw new Error(
      "Duplicate product IDs detected."
    );
  }

  if (
    evaluationCases.length !== 250
  ) {
    throw new Error(
      `Expected 250 evaluation cases, found ${evaluationCases.length}`
    );
  }

  for (const item of products) {
    if (
      !item.name ||
      !item.category ||
      !item.gender ||
      !item.color ||
      !item.description ||
      !Array.isArray(item.material) ||
      !Array.isArray(item.style) ||
      !Array.isArray(item.occasion) ||
      !Array.isArray(item.sizes) ||
      !Array.isArray(item.tags)
    ) {
      throw new Error(
        `Invalid product schema for product ${item.id}`
      );
    }
  }

  for (const item of evaluationCases) {
    if (
      !item.query ||
      !Array.isArray(item.relevant) ||
      !item.relevance
    ) {
      throw new Error(
        "Invalid evaluation case."
      );
    }

    for (const id of item.relevant) {
      if (!ids.has(String(id))) {
        throw new Error(
          `Evaluation case references missing product ${id}`
        );
      }
    }
  }
}

function main() {
  const products =
    buildProducts();

  const evaluationCases =
    buildEvaluationCases(
      products
    );

  validate(
    products,
    evaluationCases
  );

  writeFiles(
    products,
    evaluationCases
  );

  console.log(
    JSON.stringify(
      {
        products:
          products.length,
        evaluationCases:
          evaluationCases.length,
        deterministic: true
      },
      null,
      2
    )
  );
}

main();

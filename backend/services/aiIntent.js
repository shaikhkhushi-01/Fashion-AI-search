const VOCAB = {
  colors: ["black", "white", "blue", "red", "green", "grey", "gray", "cream", "beige", "pink", "purple", "maroon", "brown"],
  styles: ["minimal", "minimalist", "casual", "classic", "streetwear", "elegant", "sporty", "modern", "comfortable", "traditional", "formal", "oversized", "slim"],
  occasions: ["college", "office", "casual", "travel", "party", "wedding", "evening", "festive", "work", "daily"],
  materials: ["cotton", "linen", "denim", "silk", "wool", "polyester", "leather"],
  categories: [
    ["t-shirts", ["t-shirt", "tshirt", "tee"]],
    ["shirts", ["shirt", "blouse"]],
    ["dresses", ["dress", "gown"]],
    ["jeans", ["jeans", "denim"]],
    ["trousers", ["trousers", "pants"]],
    ["sneakers", ["sneakers", "trainers", "shoes", "footwear"]],
    ["hoodies", ["hoodie", "sweatshirt"]],
    ["blazers", ["blazer", "jacket"]],
    ["tops", ["top"]],
    ["skirts", ["skirt"]],
    ["kurta", ["kurta", "kurti"]],
    ["abaya", ["abaya"]]
  ]
};

const SYNONYMS = {
  dress: ["dress", "gown", "frock"],
  shirt: ["shirt", "top", "blouse"],
  pants: ["pants", "trousers", "bottoms"],
  shoes: ["shoes", "sneakers", "footwear", "trainers", "heels", "flats"],
  black: ["black", "dark"],
  white: ["white", "ivory", "cream"],
  blue: ["blue", "navy"],
  grey: ["grey", "gray", "charcoal"],
  casual: ["casual", "everyday", "daily"],
  formal: ["formal", "office", "workwear", "professional"],
  minimal: ["minimal", "minimalist", "clean", "simple"],
  elegant: ["elegant", "refined", "sophisticated"],
  comfortable: ["comfortable", "comfy", "relaxed"],
  oversized: ["oversized", "loose", "baggy"]
};

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(text, value) {
  return text.includes(normalizeText(value));
}

function parseBudget(query) {
  const text = normalizeText(query);
  const patterns = [
    /under\s+(\d+(?:\.\d+)?)/,
    /below\s+(\d+(?:\.\d+)?)/,
    /less\s+than\s+(\d+(?:\.\d+)?)/,
    /up\s+to\s+(\d+(?:\.\d+)?)/,
    /upto\s+(\d+(?:\.\d+)?)/,
    /within\s+(\d+(?:\.\d+)?)/,
    /budget\s+(?:of\s+)?(\d+(?:\.\d+)?)/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function extractIntent(query) {
  const text = normalizeText(query);
  const intent = {
    query: String(query ?? "").trim(),
    normalizedQuery: text,
    budget: parseBudget(text),
    category: null,
    color: null,
    style: [],
    occasion: [],
    material: null,
    gender: null,
    outfit: false,
    styleRequest: false
  };

  for (const [category, aliases] of VOCAB.categories) {
    if (aliases.some(alias => has(text, alias))) {
      intent.category = category;
      break;
    }
  }

  for (const color of VOCAB.colors) {
    if (has(text, color)) {
      intent.color = color === "gray" ? "grey" : color;
      break;
    }
  }

  intent.style = VOCAB.styles.filter(style => has(text, style));
  intent.occasion = VOCAB.occasions.filter(occasion => has(text, occasion));

  for (const material of VOCAB.materials) {
    if (has(text, material)) {
      intent.material = material;
      break;
    }
  }

  for (const gender of ["women", "woman", "men", "man", "unisex"]) {
    if (has(text, gender)) {
      intent.gender = gender === "woman" ? "women" : gender === "man" ? "men" : gender;
      break;
    }
  }

  intent.outfit = ["outfit", "complete look", "full look", "head to toe", "what to wear", "style me", "look for"].some(value => has(text, value));
  intent.styleRequest = ["style", "wear with", "pair with", "goes with", "how to wear", "how can i wear"].some(value => has(text, value));
  return intent;
}

function expandQueryTerms(query) {
  const base = [...new Set(normalizeText(query).split(/\s+/).filter(Boolean))];
  const expanded = new Set(base);
  base.forEach(token => (SYNONYMS[token] || []).forEach(item => expanded.add(item)));
  return [...expanded];
}

export { normalizeText, extractIntent, expandQueryTerms };

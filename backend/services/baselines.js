function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function productText(product) {
  return [
    product?.name,
    product?.brand,
    product?.category,
    product?.gender,
    product?.color,
    product?.style,
    product?.occasion,
    product?.material,
    product?.fit,
    product?.pattern,
    product?.description,
    Array.isArray(product?.tags)
      ? product.tags.join(" ")
      : product?.tags
  ]
    .map(normalize)
    .join(" ");
}

function keywordBaseline(
  products,
  query
) {
  const tokens =
    tokenize(query);

  return products
    .map((product, index) => {
      const text =
        productText(product);

      const matches =
        tokens.filter(
          token =>
            text.includes(token)
        );

      const score =
        tokens.length
          ? matches.length /
            tokens.length
          : 0;

      return {
        ...product,
        score,
        _index: index
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a._index - b._index
    )
    .map(product => {
      const result = {
        ...product
      };

      delete result._index;

      return result;
    });
}

function categoryBaseline(
  products,
  query
) {
  const tokens =
    tokenize(query);

  return products
    .map((product, index) => {
      const fields = [
        product?.category,
        product?.gender,
        product?.color,
        product?.style,
        product?.occasion,
        product?.material
      ]
        .flatMap(tokenize);

      const matches =
        tokens.filter(
          token =>
            fields.includes(token)
        );

      const score =
        tokens.length
          ? matches.length /
            tokens.length
          : 0;

      return {
        ...product,
        score,
        _index: index
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a._index - b._index
    )
    .map(product => {
      const result = {
        ...product
      };

      delete result._index;

      return result;
    });
}

function priceBaseline(
  products,
  query
) {
  const match =
    normalize(query).match(
      /(?:under|below|less than)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i
    );

  if (!match) {
    return [...products];
  }

  const budget =
    Number(match[1]);

  return [...products].sort(
    (a, b) => {
      const aPrice =
        Number(a?.price) || 0;

      const bPrice =
        Number(b?.price) || 0;

      const aDistance =
        Math.abs(
          budget - aPrice
        );

      const bDistance =
        Math.abs(
          budget - bPrice
        );

      return (
        aDistance - bDistance
      );
    }
  );
}

function popularityBaseline(
  products
) {
  return [...products].sort(
    (a, b) =>
      (Number(b?.rating) || 0) -
      (Number(a?.rating) || 0)
  );
}

export {
  normalize,
  tokenize,
  productText,
  keywordBaseline,
  categoryBaseline,
  priceBaseline,
  popularityBaseline
};

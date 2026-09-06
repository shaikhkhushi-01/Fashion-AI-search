function clamp(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number)
  );
}

function multimodalScore(
  product,
  weights = {}
) {
  const text =
    clamp(
      product?.semanticScore
    );

  const visual =
    clamp(
      product?.visualScore
    );

  const lexical =
    clamp(
      product?.lexicalScore
    );

  const attribute =
    clamp(
      product?.attributeScore
    );

  const textWeight =
    Number(weights.text ?? 0.4);

  const visualWeight =
    Number(weights.visual ?? 0.4);

  const lexicalWeight =
    Number(weights.lexical ?? 0.1);

  const attributeWeight =
    Number(weights.attribute ?? 0.1);

  const totalWeight =
    textWeight +
    visualWeight +
    lexicalWeight +
    attributeWeight;

  if (totalWeight <= 0) {
    return 0;
  }

  return (
    text * textWeight +
    visual * visualWeight +
    lexical * lexicalWeight +
    attribute * attributeWeight
  ) / totalWeight;
}

function rankMultimodal(
  products,
  weights = {}
) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products
    .map((product, index) => ({
      ...product,
      multimodalScore:
        multimodalScore(
          product,
          weights
        ),
      _index: index
    }))
    .sort((a, b) => {
      if (
        b.multimodalScore !==
        a.multimodalScore
      ) {
        return (
          b.multimodalScore -
          a.multimodalScore
        );
      }

      return a._index - b._index;
    })
    .map(product => {
      const result = {
        ...product
      };

      delete result._index;

      return result;
    });
}

function fuseTextAndVisual(
  products,
  options = {}
) {
  const weights = {
    text:
      Number(options.textWeight ?? 0.4),
    visual:
      Number(
        options.visualWeight ?? 0.4
      ),
    lexical:
      Number(
        options.lexicalWeight ?? 0.1
      ),
    attribute:
      Number(
        options.attributeWeight ?? 0.1
      )
  };

  return rankMultimodal(
    products,
    weights
  );
}

function explainMultimodalScore(
  product
) {
  const text =
    clamp(
      product?.semanticScore
    );

  const visual =
    clamp(
      product?.visualScore
    );

  const lexical =
    clamp(
      product?.lexicalScore
    );

  const attribute =
    clamp(
      product?.attributeScore
    );

  const signals = [];

  if (text >= 0.7) {
    signals.push(
      "strong semantic match"
    );
  }

  if (visual >= 0.7) {
    signals.push(
      "strong visual similarity"
    );
  }

  if (lexical >= 0.7) {
    signals.push(
      "strong keyword match"
    );
  }

  if (attribute >= 0.7) {
    signals.push(
      "strong attribute match"
    );
  }

  return signals;
}

export {
  clamp,
  multimodalScore,
  rankMultimodal,
  fuseTextAndVisual,
  explainMultimodalScore
};

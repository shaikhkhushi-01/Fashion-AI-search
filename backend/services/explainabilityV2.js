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

function formatPercent(value) {
  return `${Math.round(
    clamp(value) * 100
  )}%`;
}

function buildSignalExplanation(
  product,
  query = ""
) {
  const signals = [];

  const semantic =
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

  const personalization =
    clamp(
      product?.personalizationScore
    );

  const ranking =
    clamp(
      product?.rankingScore
    );

  if (semantic >= 0.7) {
    signals.push({
      type: "semantic",
      label: "Semantic match",
      strength: semantic,
      text:
        `The product closely matches the meaning of your search (${formatPercent(semantic)}).`
    });
  }

  if (visual >= 0.7) {
    signals.push({
      type: "visual",
      label: "Visual similarity",
      strength: visual,
      text:
        `The visual appearance is highly similar to the reference (${formatPercent(visual)}).`
    });
  }

  if (lexical >= 0.7) {
    signals.push({
      type: "lexical",
      label: "Keyword match",
      strength: lexical,
      text:
        `Important search terms matched the product information (${formatPercent(lexical)}).`
    });
  }

  if (attribute >= 0.7) {
    signals.push({
      type: "attribute",
      label: "Attribute match",
      strength: attribute,
      text:
        "Category, colour, style or other product attributes match the request."
    });
  }

  if (personalization >= 0.7) {
    signals.push({
      type: "personalization",
      label: "Personalized",
      strength: personalization,
      text:
        "This recommendation aligns strongly with your saved preferences."
    });
  }

  if (ranking >= 0.7) {
    signals.push({
      type: "ranking",
      label: "Ranking confidence",
      strength: ranking,
      text:
        "The ranking model assigned this product a strong relevance score."
    });
  }

  if (!signals.length) {
    signals.push({
      type: "general",
      label: "General relevance",
      strength: 0.5,
      text:
        "This product was selected as a relevant candidate for your request."
    });
  }

  return signals.sort(
    (a, b) =>
      b.strength -
      a.strength
  );
}

function buildWhySelected(
  product,
  query = ""
) {
  const signals =
    buildSignalExplanation(
      product,
      query
    );

  const strongest =
    signals.slice(0, 3);

  return {
    query,
    productId:
      product?.id ?? null,
    score:
      clamp(
        product?.finalScore ??
        product?.multimodalScore ??
        product?.hybridScore ??
        product?.rankingScore
      ),
    signals: strongest,
    summary:
      strongest
        .map(signal => signal.text)
        .join(" ")
  };
}

function explainRankedResults(
  products,
  query = ""
) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map(
    product =>
      buildWhySelected(
        product,
        query
      )
  );
}

function explanationForUser(
  product,
  query = ""
) {
  const explanation =
    buildWhySelected(
      product,
      query
    );

  return explanation.summary;
}

export {
  clamp,
  formatPercent,
  buildSignalExplanation,
  buildWhySelected,
  explainRankedResults,
  explanationForUser
};

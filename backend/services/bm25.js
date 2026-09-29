function tokenize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}
function buildDocument(product) {
  return [product?.name,product?.brand,product?.category,product?.gender,product?.color,product?.style,product?.occasion,product?.material,...(Array.isArray(product?.tags)?product.tags:[])].filter(Boolean).join(" ");
}
function termFrequency(tokens) {
  const frequencies=new Map();
  for(const token of tokens) frequencies.set(token,(frequencies.get(token)||0)+1);
  return frequencies;
}
function buildBm25Index(products=[],options={}) {
  const k1=Number(options.k1??1.2), b=Number(options.b??0.75);
  const documents=products.map(buildDocument).map(tokenize);
  const docLengths=documents.map(doc=>doc.length);
  const averageDocumentLength=docLengths.length?docLengths.reduce((s,n)=>s+n,0)/docLengths.length:0;
  const documentFrequency=new Map();
  for(const tokens of documents) for(const term of new Set(tokens)) documentFrequency.set(term,(documentFrequency.get(term)||0)+1);
  return {products,documents,docLengths,averageDocumentLength,documentFrequency,documentCount:documents.length,k1,b};
}
function bm25Score(query,index,documentId) {
  const queryTerms=tokenize(query), tokens=index.documents[documentId]||[];
  if(!queryTerms.length||!tokens.length) return 0;
  const tf=termFrequency(tokens), length=tokens.length, avg=index.averageDocumentLength||1;
  let score=0;
  for(const term of queryTerms) {
    const frequency=tf.get(term)||0; if(!frequency) continue;
    const df=index.documentFrequency.get(term)||0;
    const idf=Math.log(1+(index.documentCount-df+0.5)/(df+0.5));
    const denominator=frequency+index.k1*(1-index.b+index.b*(length/avg));
    score+=idf*((frequency*(index.k1+1))/denominator);
  }
  return score;
}
function rankBm25(products,query,options={}) {
  const index=buildBm25Index(products,options);
  return products.map((product,indexId)=>({...product,bm25Score:bm25Score(query,index,indexId),_index:indexId}))
    .sort((a,b)=>b.bm25Score-a.bm25Score||a._index-b._index)
    .map(({_index,...product})=>product);
}
export {tokenize,buildDocument,buildBm25Index,bm25Score,rankBm25};

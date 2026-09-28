import { pipeline } from "@huggingface/transformers";

const DEFAULT_MODEL="Xenova/clip-vit-base-patch32";
let imageEncoderPromise;
let textEncoderPromise;

async function getImageEncoder(model=DEFAULT_MODEL){
  if(!imageEncoderPromise) imageEncoderPromise=pipeline("image-feature-extraction",model);
  return imageEncoderPromise;
}
async function getTextEncoder(model=DEFAULT_MODEL){
  if(!textEncoderPromise) textEncoderPromise=pipeline("feature-extraction",model);
  return textEncoderPromise;
}
function flatten(output){
  if(Array.isArray(output)) return output.flat(Infinity);
  if(output?.data) return Array.from(output.data);
  return Array.from(output??[]);
}
function normalize(vector){
  const norm=Math.sqrt(vector.reduce((s,v)=>s+v*v,0));
  return norm?vector.map(v=>v/norm):vector;
}
function cosineSimilarity(a,b){
  const n=Math.min(a.length,b.length);
  if(!n) return 0;
  let dot=0,aa=0,bb=0;
  for(let i=0;i<n;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
  return aa&&bb?dot/(Math.sqrt(aa)*Math.sqrt(bb)):0;
}
async function encodeImage(image,model=DEFAULT_MODEL){
  const output=await (await getImageEncoder(model))(image,{pooling:"mean",normalize:true});
  return normalize(flatten(output));
}
async function encodeText(text,model=DEFAULT_MODEL){
  const output=await (await getTextEncoder(model))(text,{pooling:"mean",normalize:true});
  return normalize(flatten(output));
}
async function rankImagesByText(query,products,options={}){
  const model=options.model||DEFAULT_MODEL, queryVector=await encodeText(query,model), ranked=[];
  for(const [index,product] of products.entries()){
    if(!product?.image) continue;
    try{
      const imageVector=await encodeImage(product.image,model);
      ranked.push({...product,visualScore:cosineSimilarity(queryVector,imageVector),_index:index});
    }catch(error){
      if(options.skipErrors!==false) continue;
      throw error;
    }
  }
  return ranked.sort((a,b)=>b.visualScore-a.visualScore||a._index-b._index).map(({_index,...p})=>p);
}
export {DEFAULT_MODEL,getImageEncoder,getTextEncoder,encodeImage,encodeText,cosineSimilarity,rankImagesByText};

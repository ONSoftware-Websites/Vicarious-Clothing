import {listProducts,getProductBySku} from "@/lib/server/store";
import {getOrCreateCheckoutHoldToken} from "@/lib/server/checkout-hold";
import {claimCheckoutStock} from "@/lib/server/checkout-stock";
import {getSupabase} from "@/lib/server/supabase";
import type {Product} from "@/lib/types";

export const dynamic="force-dynamic";
function groupKey(product:Product) {
 return product.tags.find(tag=>tag.startsWith("mystery-unit:"))?.slice("mystery-unit:".length)??"";
}
export async function GET() {
 const all=await listProducts();
 const groups=new Map<string,Product[]>();
 for(const product of all){
  const key=groupKey(product);
  if(!key||product.status!=="AVAILABLE"||!product.marketplace.some(m=>m.channel==="website"&&m.status==="LISTED"))continue;
  groups.set(key,[...(groups.get(key)??[]),product]);
 }
 const offers=[...groups.entries()].map(([template,units])=>({template,count:units.length,sku:units[0].sku,name:units[0].name,description:units[0].description,price:units[0].price,image:units[0].images[0]?.src??""}));
 return Response.json({offers},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 if(!getSupabase())return Response.json({error:"Stock service unavailable"},{status:503});
 try{
  const body=await request.json();
  const template=String(body.template??"").trim().toUpperCase();
  if(!/^[A-Z0-9_-]{1,80}$/.test(template))return Response.json({error:"Invalid mystery bag"},{status:400});
  const products=await listProducts();
  const units=products.filter(p=>p.status==="AVAILABLE"&&groupKey(p)===template&&p.marketplace.some(m=>m.channel==="website"&&m.status==="LISTED"));
  if(!units.length)return Response.json({error:"This mystery bag is sold out"},{status:409});
  const token=await getOrCreateCheckoutHoldToken();
  for(const product of units.slice(0,50)){
   const claim=await claimCheckoutStock([product.sku],{holdToken:token});
   if(claim.ok.includes(product.sku))return Response.json({ok:true,sku:product.sku});
  }
  return Response.json({error:"Every available mystery bag is currently reserved. Please try again later."},{status:409});
 }catch(e){
  console.error("Mystery bag claim error",e);
  return Response.json({error:"Could not reserve a mystery bag"},{status:503});
 }
}

import type { Metadata } from "next";
import { ShopView, type ShopParams } from "@/components/shop-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
 title:"Men's Clothing | Vicarious Clothing",
 description:"Discover the dedicated men's clothing selection at Vicarious Clothing.",
 alternates:{canonical:"/mens"}
};

export default async function MensPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const raw=await searchParams;
 const params:ShopParams={
  brand:typeof raw.brand==="string"?raw.brand:undefined,
  size:typeof raw.size==="string"?raw.size:undefined,
  condition:typeof raw.condition==="string"?raw.condition:undefined,
  colour:typeof raw.colour==="string"?raw.colour:undefined,
  min:typeof raw.min==="string"?raw.min:undefined,
  max:typeof raw.max==="string"?raw.max:undefined,
  sort:typeof raw.sort==="string"?raw.sort:undefined,
  q:typeof raw.q==="string"?raw.q:undefined,
  collection:typeof raw.collection==="string"?raw.collection:undefined,
  page:typeof raw.page==="string"?raw.page:undefined
 };
 return <ShopView mens params={params}/>;
}

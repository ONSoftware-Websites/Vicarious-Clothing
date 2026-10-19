import type {Metadata} from "next";
import {MysteryBagShop} from "@/components/mystery-bag-shop";
export const metadata:Metadata={title:"Mystery Bags | Vicarious Clothing",description:"Discover Vicarious Clothing mystery bags, with multiple individually tracked bags available for purchase.",alternates:{canonical:"/mystery-bags"}};
export default function MysteryBagsPage(){return <MysteryBagShop/>;}

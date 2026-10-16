import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";
import { getProductBySku,listPurchases } from "@/lib/server/store";

export async function POST(request:Request){
 const denied=await requireAdminApi("ADMIN");if(denied)return denied;
 let body:Record<string,unknown>;
 try{body=await request.json()}catch{return Response.json({error:"Invalid request"},{status:400})}
 const purchaseId=String(body.purchaseId??"").trim();
 const sku=String(body.sku??"").trim().toUpperCase();
 const cost=Number(body.cost);
 if(!purchaseId||purchaseId.length>150||!sku||sku.length>100||!Number.isFinite(cost)||cost<0||cost>100000)
  return Response.json({error:"Enter a valid purchase, SKU and allocation amount"},{status:400});
 const purchase=(await listPurchases()).find(p=>p.id===purchaseId);
 if(!purchase)return Response.json({error:"Purchase not found"},{status:404});
 if(purchase.items.some(item=>item.sku.toUpperCase()===sku))
  return Response.json({error:"That item is already linked"},{status:409});
 const allocated=purchase.items.reduce((sum,item)=>sum+item.cost,0);
 if(allocated+cost>purchase.amount+0.01)
  return Response.json({error:"Allocated item costs cannot exceed the recorded purchase amount"},{status:409});
 const product=await getProductBySku(sku);
 if(!product)return Response.json({error:"Create the inventory item before linking it"},{status:404});
 if(product.status==="SOLD"||product.status==="ARCHIVED")
  return Response.json({error:"A sold or archived garment cannot be linked as newly acquired stock"},{status:409});
 const db=getSupabase();
 if(!db)return Response.json({error:"Stock database unavailable"},{status:503});
 const {error}=await db.from("stock_purchase_items").insert({
  purchase_id:purchase.id,sku,name:product.name,brand:product.brand,cost
 });
 if(error){if(error.code==="23505")return Response.json({error:"This SKU is already linked"},{status:409});
  return Response.json({error:"Could not link the item"},{status:503});}
 return Response.json({ok:true,sku,purchaseId:purchase.id},{status:201});
}

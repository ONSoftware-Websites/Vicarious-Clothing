import {requireAdminApi} from "@/lib/server/admin-auth";
import {duplicateProduct,getProductBySku,upsertProduct} from "@/lib/server/store";
import {getSupabase} from "@/lib/server/supabase";
export async function POST(request:Request){
 const denied=await requireAdminApi("ADMIN");if(denied)return denied;
 if(!getSupabase())return Response.json({error:"Database unavailable"},{status:503});
 try{
  const body=await request.json();
  const sku=String(body.sku??"").trim().toUpperCase();
  const quantity=Number(body.quantity);
  if(!sku||!Number.isSafeInteger(quantity)||quantity<1||quantity>100)
   return Response.json({error:"Choose a template SKU and between 1 and 100 units"},{status:400});
  const source=await getProductBySku(sku);
  if(!source||source.status!=="DRAFT")return Response.json({error:"Mystery-bag source must be an existing DRAFT product"},{status:409});
  if(source.tags.some(tag=>tag.startsWith("mystery-unit:")))
   return Response.json({error:"A mystery-bag unit cannot be used as a template"},{status:409});
  const created:string[]=[];
  for(let i=0;i<quantity;i++){
   const unit=await duplicateProduct(sku,"Admin — mystery bag");
   if(!unit)throw new Error("Could not generate a unit");
   await upsertProduct({...unit,tags:[...source.tags.filter(t=>!t.startsWith("mystery-unit:")),`mystery-unit:${sku}`],status:"AVAILABLE",isPick:false,featured:false},"Admin — mystery bag","Mystery bag saleable unit");
   created.push(unit.sku);
  }
  return Response.json({ok:true,template:sku,units:created,count:created.length});
 }catch(e){
  console.error("Mystery bag generation failed",e);
  return Response.json({error:"Could not create all requested units. Check inventory for any units already created before retrying."},{status:500});
 }
}

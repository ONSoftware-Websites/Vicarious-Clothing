import {getSupabase} from "@/lib/server/supabase";
export type OperationalSubsystem="cron"|"sellerhq"|"email"|"health";
export type OperationalSeverity="info"|"warning"|"error";
export async function recordOperationalEvent(subsystem:OperationalSubsystem,severity:OperationalSeverity,event:string,details:Record<string,string|number|boolean|null>={}){
 const db=getSupabase();
 if(!db){console.error("Cannot record operational event: database unavailable",subsystem,event);return false;}
 const {error}=await db.from("operational_events").insert({subsystem,severity,event,details});
 if(error){console.error("Could not record operational event",subsystem,event,error);return false;}
 return true;
}

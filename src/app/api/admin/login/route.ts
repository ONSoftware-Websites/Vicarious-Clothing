// Legacy shared-password login is permanently disabled.
export async function POST() { return Response.json({error:"Use individual administrator login with MFA"}, {status:410}); }

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SecureAdminLogin() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [code,setCode] = useState("");
  const [factorId,setFactorId] = useState("");
  const [qr,setQr] = useState("");
  const [secret,setSecret] = useState("");
  const [stage,setStage] = useState<"login"|"enrol"|"verify">("login");
  const [error,setError] = useState("");
  const client = () => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const beginMfa = async () => {
    const membership = await fetch("/api/admin/enrolment-check", {cache:"no-store"});
    if (!membership.ok) throw new Error("This account is not authorised for Vicarious administration.");
    const auth = client();
    const {data:level} = await auth.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level?.currentLevel === "aal2") {
      const res = await fetch("/api/admin/whoami");
      if (!res.ok) { setError("This account is not authorised for administration."); return; }
      router.replace("/admin"); router.refresh(); return;
    }
    const {data:factors,error:factorError} = await auth.auth.mfa.listFactors();
    if (factorError) throw factorError;
    const existing = factors?.totp?.find(f => f.status === "verified");
    if (existing) { setFactorId(existing.id); setStage("verify"); return; }
    const {data,error:enrolError} = await auth.auth.mfa.enroll({factorType:"totp",friendlyName:"Vicarious Admin"});
    if (enrolError) throw enrolError;
    setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret); setStage("enrol");
  };
  const login = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const {error} = await client().auth.signInWithPassword({email,password});
      if (error) throw error;
      await beginMfa();
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
  };
  const verify = async (event:FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const auth = client();
      const {data:challenge,error:challengeError} = await auth.auth.mfa.challenge({factorId});
      if (challengeError) throw challengeError;
      const {error:verifyError} = await auth.auth.mfa.verify({factorId,challengeId:challenge.id,code});
      if (verifyError) throw verifyError;
      const response = await fetch("/api/admin/whoami");
      if (!response.ok) {setError("Your account is not an authorised administrator.");return;}
      router.replace("/admin");router.refresh();
    } catch (err) {setError(err instanceof Error ? err.message : "Verification failed");}
  };
  return <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-deep">Vicarious Clothing / Staff access</p>
    <h1 className="mb-8 font-display text-4xl font-bold uppercase">Secure admin login</h1>
    {stage === "login" ? <form onSubmit={login} className="space-y-4">
      <label className="block text-sm">Email<input className="mt-2 w-full border border-line p-3" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></label>
      <label className="block text-sm">Password<input className="mt-2 w-full border border-line p-3" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
      <button className="w-full bg-ink p-4 font-bold uppercase text-paper" type="submit">Continue</button>
    </form> : <form onSubmit={verify} className="space-y-4">
      {stage === "enrol" && <><p>Scan this authenticator QR code, then enter the six-digit code.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Authenticator enrolment QR code" className="h-48 w-48" />
        <p className="break-all font-mono text-xs">Manual setup key: {secret}</p>
      </>}
      <label className="block text-sm">Authenticator code<input className="mt-2 w-full border border-line p-3" inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value)} required /></label>
      <button className="w-full bg-ink p-4 font-bold uppercase text-paper" type="submit">Verify and continue</button>
    </form>}
    {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
  </div>;
}

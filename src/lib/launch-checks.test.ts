import {describe,it,expect} from "vitest";
import {launchConfigurationChecks} from "./launch-checks";
describe("release 13 production configuration",()=>{
 it("reports missing configuration without printing secret values",()=>{
  const checks=launchConfigurationChecks({});
  expect(checks.every(c=>!c.ok)).toBe(true);
  expect(JSON.stringify(checks)).not.toContain("sk_live");
 });
 it("rejects an insecure or malformed site address",()=>{
  expect(launchConfigurationChecks({NEXT_PUBLIC_SITE_URL:"http://example.com"})[0].ok).toBe(false);
  expect(launchConfigurationChecks({NEXT_PUBLIC_SITE_URL:"https://vicarious.example"})[0].ok).toBe(true);
 });
});

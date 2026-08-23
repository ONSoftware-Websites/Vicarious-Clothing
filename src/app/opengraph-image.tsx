import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Vicarious Clothing — curated clothing, ready to go again";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(
    join(process.cwd(), "public", "android-chrome-192x192.png")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#101014",
          color: "#f7f6f2",
          padding: 72,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 22,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#0097af",
            fontWeight: 700,
          }}
        >
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            width={72}
            height={72}
            alt=""
            style={{ borderRadius: 999 }}
          />
          Vicarious Clothing
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, textTransform: "uppercase", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            New lives.
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, textTransform: "uppercase", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#0097af" }}>
            Same clothes.
          </div>
          <div style={{ marginTop: 32, fontSize: 28, color: "#c9c7be", letterSpacing: "0.04em" }}>
            Curated pre-owned clothing, ready to go again.
          </div>
        </div>
      </div>
    ),
    size
  );
}

import { ImageResponse } from "next/og";

export const alt = "The Darkest Advance — Dark Tactical Elegance";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "78px 88px",
          color: "#f5eee7",
          background:
            "radial-gradient(circle at 72% 34%, #5b0707 0%, #190303 32%, #050505 66%, #010101 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "34px",
            fontSize: 24,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#d65b52",
          }}
        >
          <span style={{ width: 62, height: 2, background: "#b51d18" }} />
          Dark Tactical Elegance
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 900,
            fontSize: 82,
            lineHeight: 0.98,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            textTransform: "uppercase",
          }}
        >
          The Darkest Advance
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 760,
            marginTop: "34px",
            fontSize: 29,
            lineHeight: 1.35,
            color: "#cfc4ba",
          }}
        >
          Worlds forged in instinct, ruin and precision.
        </div>

        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 62,
            width: 126,
            height: 126,
            border: "2px solid rgba(213, 42, 32, 0.55)",
            transform: "rotate(45deg)",
            boxShadow: "0 0 70px rgba(160, 0, 0, 0.35)",
          }}
        />
      </div>
    ),
    size
  );
}

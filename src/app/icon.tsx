import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fefdfb 0%, #f5f3ee 100%)",
          borderRadius: "8px",
          border: "1px solid rgba(125, 141, 110, 0.3)",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#9a8554",
            fontFamily: "Georgia, serif",
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size }
  );
}

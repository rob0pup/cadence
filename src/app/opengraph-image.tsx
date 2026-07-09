import { ImageResponse } from "next/og";

export const alt = "cadence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 424 384"><path fill="#fafafa" d="M0 0h256v64H0zM0 64h64v64H0zM256 64h64v64h-64zM0 128h256v64H0zM0 192h64v64H0zM128 192h64v64h-64zM0 256h64v64H0zM192 256h64v64h-64zM0 320h64v64H0zM256 320h64v64h-64zM344 0h80v40h-80zM384 40h40v40h-40zM344 80h80v40h-80zM344 120h40v40h-40zM344 160h80v40h-80z"/></svg>`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          width: "100%",
          height: "100%",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={132}
          height={120}
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`}
        />
        <div style={{ display: "flex", fontSize: 76, fontWeight: 600 }}>
          cadence
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
          a music player for your own library
        </div>
      </div>
    ),
    size,
  );
}

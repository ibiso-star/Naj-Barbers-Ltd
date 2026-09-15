import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
  <rect width="240" height="240" fill="#0b1220"/>
  <path d="M64,176 L64,64 L176,176" fill="none" stroke="#c9a227" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <g stroke="#c9a227" stroke-linecap="round">
    <line x1="163" y1="64" x2="189" y2="64" stroke-width="10"/>
    <line x1="165" y1="92" x2="187" y2="92" stroke-width="8.5"/>
    <line x1="167" y1="120" x2="185" y2="120" stroke-width="7.5"/>
    <line x1="169.5" y1="148" x2="182.5" y2="148" stroke-width="6"/>
    <line x1="172.5" y1="176" x2="179.5" y2="176" stroke-width="5"/>
  </g>
</svg>`;

const DATA_URI = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <img src={DATA_URI} width={size.width} height={size.height} alt="" />
    ),
    { ...size }
  );
}

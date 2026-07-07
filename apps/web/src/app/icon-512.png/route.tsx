import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/BrandMark";

export const runtime = "edge";

export async function GET() {
  const size = 512;
  return new ImageResponse(<BrandMark size={size} />, { width: size, height: size });
}

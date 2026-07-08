import { NextResponse } from "next/server";
import { mockProducts } from "@/lib/products";

export async function GET() {
  return NextResponse.json(mockProducts);
}

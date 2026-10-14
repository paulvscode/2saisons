import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Sert une image stockée en base (images des quiz). Identifiant unique : cache immuable. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new NextResponse("Introuvable", { status: 404 });

  const image = await prisma.storedImage.findUnique({ where: { id }, select: { data: true, mime: true } });
  if (!image) return new NextResponse("Introuvable", { status: 404 });

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

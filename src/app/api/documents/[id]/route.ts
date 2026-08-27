import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/uploads";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

/**
 * Consultation d'un justificatif — accès restreint au propriétaire ou à un admin.
 * Redirige vers le stockage objet (Vercel Blob) ou sert le fichier local (dev).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Non autorisé", { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new NextResponse("Introuvable", { status: 404 });
  if (user.role !== "admin" && doc.userId !== user.id) {
    return new NextResponse("Non autorisé", { status: 403 });
  }

  // Driver "blob" : doc.url est une URL complète.
  if (/^https?:\/\//.test(doc.url)) {
    return NextResponse.redirect(doc.url);
  }

  // Driver "local" : doc.url est un nom de fichier dans ./uploads.
  try {
    const name = basename(doc.url);
    const file = await readFile(join(UPLOAD_DIR, name));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": MIME[extname(name).toLowerCase()] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Fichier introuvable", { status: 404 });
  }
}

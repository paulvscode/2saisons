import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { NextResponse } from "next/server";
import { MEDIA_DIR, MEDIA_MIME, isMediaName } from "@/lib/content";

/** Sert les images du site téléversées depuis /admin/medias (content/media). */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!isMediaName(name)) return new NextResponse("Introuvable", { status: 404 });

  try {
    const file = await readFile(join(MEDIA_DIR, name));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": MEDIA_MIME[extname(name).slice(1)],
        // Les noms téléversés sont uniques (suffixe aléatoire) : le contenu ne change jamais.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Introuvable", { status: 404 });
  }
}

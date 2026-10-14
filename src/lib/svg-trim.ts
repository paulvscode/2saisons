import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Recadre un logo SVG sur son dessin : les plans de travail Illustrator laissent souvent de
 * grandes marges vides (ex. 1920 × 1080 pour un petit logo), qui rendent le logo minuscule.
 * Le SVG est rendu une fois pour mesurer la zone dessinée, puis son viewBox est resserré
 * (marge de 2 %). Écrit aussi le favicon PNG 512 × 512, logo centré sur fond transparent.
 */
export async function trimSvgLogo(svgPath: string, pngPath: string) {
  const svg = await readFile(svgPath, "utf8");
  const viewBox = svg.match(/<svg[^>]*\sviewBox="([^"]+)"/)?.[1];
  const [vx, vy, vw, vh] = (viewBox ?? "").trim().split(/[\s,]+/).map(Number);
  if (![vx, vy, vw, vh].every(Number.isFinite) || vw <= 0 || vh <= 0) {
    await writeFavicon(svg, Math.max(vw || 512, vh || 512), pngPath);
    return;
  }

  // Rendu de mesure : ~2000 px sur le plus grand côté.
  const density = Math.min(2400, (72 * 2000) / Math.max(vw, vh));
  const { data, info } = await sharp(Buffer.from(svg), { density })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    await writeFavicon(svg, Math.max(vw, vh), pngPath); // dessin vide : rien à recadrer
    return;
  }

  const scale = info.width / vw; // pixels par unité du viewBox
  let bw = (maxX - minX + 1) / scale;
  let bh = (maxY - minY + 1) / scale;
  const pad = Math.max(bw, bh) * 0.02;
  const bx = round(vx + minX / scale - pad);
  const by = round(vy + minY / scale - pad);
  bw = round(bw + 2 * pad);
  bh = round(bh + 2 * pad);

  const trimmed = svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag
      .replace(/\swidth="[^"]*"/, ` width="${bw}pt"`)
      .replace(/\sheight="[^"]*"/, ` height="${bh}pt"`)
      .replace(/\sviewBox="[^"]*"/, ` viewBox="${bx} ${by} ${bw} ${bh}"`),
  );
  await writeFile(svgPath, trimmed);
  await writeFavicon(trimmed, Math.max(bw, bh), pngPath);
}

async function writeFavicon(svg: string, size: number, pngPath: string) {
  await sharp(Buffer.from(svg), { density: Math.min(2400, (72 * 512) / size) })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateLong, formatEuros } from "@/lib/format";

/**
 * Reçu d'adhésion — page HTML imprimable (Cmd/Ctrl + P → PDF).
 * En production, générer un vrai PDF (ex: @react-pdf/renderer) et l'archiver.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Non autorisé", { status: 401 });

  const { id } = await params;
  const m = await prisma.membership.findUnique({ where: { id }, include: { user: true } });
  if (!m) return new NextResponse("Introuvable", { status: 404 });
  if (user.role !== "admin" && m.userId !== user.id) {
    return new NextResponse("Non autorisé", { status: 403 });
  }

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Reçu d'adhésion ${m.id}</title>
<style>
  body{font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1.5rem;color:#000}
  h1{text-transform:uppercase;letter-spacing:-.03em;font-size:1.8rem;margin:0 0 2rem}
  .row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:.6rem 0}
  .total{font-weight:800;font-size:1.2rem;border-bottom:2px solid #000}
  .muted{color:#666;font-size:.85rem;margin-top:2rem}
  @media print{body{margin:1rem auto}}
</style></head><body>
<h1>Reçu d'adhésion</h1>
<p><strong>Deux saisons de planche</strong><br>Association loi 1901 — RNA W000000000<br>00 rue de l'Exemple, 00000 Ville</p>
<div class="row"><span>Reçu n°</span><span>${m.id}</span></div>
<div class="row"><span>Membre</span><span>${m.user.firstname} ${m.user.lastname}</span></div>
<div class="row"><span>E-mail</span><span>${m.user.email}</span></div>
<div class="row"><span>Période</span><span>${formatDateLong(m.startDate)} → ${formatDateLong(m.endDate)}</span></div>
<div class="row"><span>Statut</span><span>${m.status}</span></div>
<div class="row"><span>Référence paiement</span><span>${m.paymentId ?? "—"}</span></div>
<div class="row total"><span>Montant réglé</span><span>${formatEuros(m.amountCents)}</span></div>
<p class="muted">Reçu émis le ${formatDateLong(new Date())}. Ce document ne constitue pas un reçu fiscal de don ouvrant droit à réduction d'impôt, sauf si l'association est habilitée et le mentionne expressément.</p>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}
